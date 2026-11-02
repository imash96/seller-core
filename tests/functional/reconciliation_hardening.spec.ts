import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import FinancialTransaction from '#models/financial_transaction'
import ManualReconciliation from '#models/manual_reconciliation'
import AuditLog from '#models/audit_log'
import ShippingInvoiceLine from '#models/shipping_invoice_line'
import { ManualReconciliationService } from '#services/manual_reconciliation_service'
import { FulfillmentAndReturnsService } from '#services/fulfillment_and_returns_service'
import { CatalogService } from '#services/catalog_service'
import ProductCategory from '#models/product_category'
import { money } from '../../app/types/price.js'

async function makeUser(email: string, isSuperAdmin = true) {
  return User.create({
    email,
    fullName: 'Test',
    password: 'Password123!',
    status: 'active',
    isSuperAdmin,
    defaultCurrency: 'USD',
    timezone: 'UTC',
  })
}
async function makeTx(user: User, referenceNumber: string, dataClassification = 'business') {
  return FinancialTransaction.create({
    userId: user.id,
    referenceNumber,
    transactionType: 'expense',
    dataClassification,
    description: 'Expense',
    originalAmount: money(10, 'USD'),
    reportingAmount: money(10, 'USD'),
    status: 'posted',
    transactionDate: DateTime.fromISO('2026-01-01'),
  })
}

test.group('Reconciliation hardening', () => {
  test('manual matches enforce amount, tenant, classification, uniqueness, concurrency and reversible audited history', async ({
    assert,
  }) => {
    const user = await makeUser(`reconcile-${Date.now()}@example.com`)
    const outsider = await makeUser(`reconcile-out-${Date.now()}@example.com`, false)
    const tx = await makeTx(user, 'A')
    const other = await makeTx(user, 'B')
    const household = await makeTx(outsider, 'C', 'household_personal')
    const base = {
      user,
      transactionId: tx.id,
      reference: 'Statement-1',
      amount: '10.00',
      currency: 'USD',
    }
    await assert.rejects(
      () => ManualReconciliationService.reconcile({ ...base, amount: '9.99' }),
      /exactly match/
    )
    await assert.rejects(
      () => ManualReconciliationService.reconcile({ ...base, currency: 'EUR' }),
      /exactly match/
    )
    await assert.rejects(
      () => ManualReconciliationService.reconcile({ ...base, user: outsider }),
      /not found/
    )
    await assert.rejects(
      () =>
        ManualReconciliationService.reconcile({
          ...base,
          user: outsider,
          transactionId: household.id,
        }),
      /Household/
    )
    const results = await Promise.allSettled([
      ManualReconciliationService.reconcile(base),
      ManualReconciliationService.reconcile(base),
    ])
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1)
    await tx.refresh()
    assert.equal(tx.status, 'reconciled')
    assert.lengthOf(await ManualReconciliation.query().where('financialTransactionId', tx.id), 1)
    await assert.rejects(
      () =>
        ManualReconciliationService.reconcile({
          ...base,
          transactionId: other.id,
          reference: 'statement-1',
        }),
      /active match/
    )
    await other.refresh()
    assert.equal(other.status, 'posted')
    await ManualReconciliationService.reverse({
      user,
      transactionId: tx.id,
      reason: 'Incorrect statement',
    })
    await tx.refresh()
    assert.equal(tx.status, 'posted')
    const history = await ManualReconciliation.query()
      .where('financialTransactionId', tx.id)
      .firstOrFail()
    assert.isNotNull(history.reversedAt)
    assert.equal(history.reversalReason, 'Incorrect statement')
    // The audit trigger records the transaction UPDATEs; the semantic intent lives in
    // `metadata.reason`, so no second (manual) audit row is written per operation.
    const txAudits = await AuditLog.query()
      .where('entityType', 'financial_transactions')
      .where('entityId', tx.id)
      .whereRaw(`metadata ->> 'reason' IN (?, ?)`, [
        'finance.manual_reconciliation_created',
        'finance.manual_reconciliation_reversed',
      ])
      .orderBy('createdAt', 'asc')
    assert.lengthOf(txAudits, 2)
    assert.equal((txAudits[0].metadata as any)?.reason, 'finance.manual_reconciliation_created')
    assert.equal((txAudits[0].beforeState as any)?.status, 'posted')
    assert.equal((txAudits[0].afterState as any)?.status, 'reconciled')
    assert.equal((txAudits[1].metadata as any)?.reason, 'finance.manual_reconciliation_reversed')
    assert.equal((txAudits[1].beforeState as any)?.status, 'reconciled')
    assert.equal((txAudits[1].afterState as any)?.status, 'posted')
    assert.deepEqual(Array.from(new Set(txAudits.map((entry) => entry.actorUserId))), [user.id])
    await ManualReconciliationService.reconcile({ ...base, transactionId: other.id })
  })

  test('audit failure rolls the match and ledger change back', async ({ assert }) => {
    const user = await makeUser(`rollback-${Date.now()}@example.com`)
    const tx = await makeTx(user, 'ROLLBACK')
    await db.rawQuery(
      `CREATE FUNCTION test_reconcile_audit_failure() RETURNS trigger AS $$ BEGIN IF NEW.entity_type = 'financial_transactions' AND NEW.metadata ->> 'reason' = 'finance.manual_reconciliation_created' THEN RAISE EXCEPTION 'injected audit failure'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql`
    )
    await db.rawQuery(
      'CREATE TRIGGER test_reconcile_audit_failure BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION test_reconcile_audit_failure()'
    )
    try {
      await assert.rejects(
        () =>
          ManualReconciliationService.reconcile({
            user,
            transactionId: tx.id,
            reference: 'rollback-test',
            amount: '10',
            currency: 'USD',
          }),
        /injected audit failure/
      )
      await tx.refresh()
      assert.equal(tx.status, 'posted')
      assert.lengthOf(await ManualReconciliation.query().where('financialTransactionId', tx.id), 0)
    } finally {
      await db.rawQuery('DROP TRIGGER test_reconcile_audit_failure ON audit_logs')
      await db.rawQuery('DROP FUNCTION test_reconcile_audit_failure()')
    }
  })

  test('carrier invoices do not equate missing estimates or offsetting line discrepancies with a match', async ({
    assert,
  }) => {
    const user = await makeUser(`invoice-${Date.now()}@example.com`)
    const base = {
      userId: user.id,
      carrierCode: 'ups',
      carrierName: 'UPS',
      invoiceDate: '2026-01-01',
    }
    const unknown = await FulfillmentAndReturnsService.createShippingInvoice({
      ...base,
      invoiceNumber: 'UNKNOWN',
      lines: [{ chargeType: 'base_freight', billedAmount: 10 }],
    })
    assert.equal(unknown.reconciliationStatus, 'unreconciled')
    const line = await ShippingInvoiceLine.query()
      .where('shippingInvoiceId', unknown.id)
      .firstOrFail()
    assert.isNull(line.expectedAmount)
    assert.isNull(line.varianceAmount)
    const offset = await FulfillmentAndReturnsService.createShippingInvoice({
      ...base,
      invoiceNumber: 'OFFSET',
      lines: [
        { chargeType: 'base_freight', billedAmount: 15, expectedAmount: 10 },
        { chargeType: 'fuel_surcharge', billedAmount: 5, expectedAmount: 10 },
      ],
    })
    assert.equal(offset.varianceTotal.amount, 0)
    assert.equal(offset.varianceTotal.currency_code, 'USD')
    assert.equal(offset.reconciliationStatus, 'variance_detected')
    await assert.rejects(
      () =>
        FulfillmentAndReturnsService.createShippingInvoice({
          ...base,
          invoiceNumber: 'BAD',
          lines: [{ chargeType: 'base_freight', billedAmount: -1 }],
        }),
      /non-negative/
    )
  })

  test('listing an empty catalog does not insert example products or categories', async ({
    assert,
  }) => {
    const user = await makeUser(`empty-catalog-${Date.now()}@example.com`)
    assert.deepEqual(await CatalogService.listCatalogItems(user.id), [])
    assert.lengthOf(await ProductCategory.query().where('userId', user.id), 0)
  })
})
