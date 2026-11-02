import { DateTime } from 'luxon'
import FinancialTransaction from '#models/financial_transaction'
import ManualReconciliation from '#models/manual_reconciliation'
import { AuditContext } from './audit_context.js'
import PaymentReconciled from '#events/payment_reconciled'
import type User from '#models/user'
import { FinanceAccessService } from '#services/finance_access_service'
import {
  type PriceMoney,
  amountOf,
  currencyOf,
  money,
  normalizeCurrencyCode,
} from '../types/price.js'

export class ReconciliationError extends Error {
  constructor(
    message: string,
    public status = 422
  ) {
    super(message)
  }
}

// Amounts are compared as decimal strings, not floating point. The database stores two decimals.
function normalizeAmount(value: unknown): string {
  const str = String(value ?? '').trim()
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(str))
    throw new ReconciliationError('Enter a non-negative amount with at most two decimal places.')
  const [whole, fraction = ''] = str.split('.')
  return `${BigInt(whole)}.${fraction.padEnd(2, '0')}`
}

export class ManualReconciliationService {
  static async reconcile(input: {
    user: User
    transactionId: string
    reference: unknown
    amount: unknown
    currency: unknown
    notes?: unknown
    requestId?: string
  }) {
    const reference = String(input.reference ?? '').trim()
    const currency = normalizeCurrencyCode(input.currency, 'XXX')
    const notes = String(input.notes ?? '').trim()
    if (
      reference.length < 2 ||
      reference.length > 150 ||
      !/^[A-Z]{3}$/.test(currency) ||
      notes.length > 2000
    )
      throw new ReconciliationError(
        'Provide a valid statement reference, currency and notes (up to 2000 characters).'
      )
    // The observed statement amount is its own self-contained PriceMoney object.
    const observedAmount: PriceMoney = money(normalizeAmount(input.amount), currency)
    const household = await FinanceAccessService.permissions(input.user)
    // Captured inside the transaction and published only once it commits. The
    // holder keeps the assignment visible across the callback boundary.
    const committed: {
      value: { transactionId: string; userId: string; amount: PriceMoney } | null
    } = { value: null }
    try {
      return await AuditContext.transaction(async (trx) => {
        await AuditContext.apply(trx, {
          actorUserId: input.user.id,
          requestId: input.requestId ?? null,
          reason: 'finance.manual_reconciliation_created',
        })
        const tx = await FinancialTransaction.query({ client: trx })
          .where('userId', input.user.id)
          .where('id', input.transactionId)
          .forUpdate()
          .first()
        if (!tx) throw new ReconciliationError('Transaction not found.', 404)
        if (!FinanceAccessService.canUse(tx.dataClassification, 'update', household))
          throw new ReconciliationError('Household finance permission is required.', 403)
        if (!['posted', 'settled'].includes(tx.status))
          throw new ReconciliationError('Only posted or settled transactions can be matched.', 409)
        if (
          normalizeAmount(amountOf(tx.originalAmount)) !== normalizeAmount(observedAmount.amount) ||
          currencyOf(tx.originalAmount).toUpperCase() !== observedAmount.currency_code
        )
          throw new ReconciliationError(
            'Statement amount and currency must exactly match the original ledger entry.',
            422
          )
        const match = await ManualReconciliation.create(
          {
            userId: input.user.id,
            financialTransactionId: tx.id,
            sourceReference: reference,
            observedAmount,
            notes: notes || null,
            previousStatus: tx.status,
            reconciledByUserId: input.user.id,
            reconciledAt: DateTime.now(),
          },
          { client: trx }
        )
        tx.status = 'reconciled'
        tx.reconciledAt = DateTime.now()
        await tx.save()
        committed.value = {
          transactionId: tx.id,
          userId: tx.userId,
          amount: tx.originalAmount,
        }
        return match
      })
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ReconciliationError(
          'This transaction or statement reference already has an active match.',
          409
        )
      throw error
    } finally {
      // Publishing happens after the transaction settles, so a listener can never
      // observe a half-written reconciliation. Only a committed match is announced.
      const published = committed.value
      if (published) {
        try {
          await PaymentReconciled.dispatch({
            financialTransactionId: published.transactionId,
            userId: published.userId,
            status: 'reconciled',
            amount: published.amount,
            requestId: input.requestId,
          })
        } catch {
          // The event bus is best-effort: the ledger change already committed and
          // must not be undone by a listener problem.
        }
      }
    }
  }

  static async reverse(input: {
    user: User
    transactionId: string
    reason: unknown
    requestId?: string
  }) {
    const reason = String(input.reason ?? '').trim()
    if (reason.length < 3 || reason.length > 2000)
      throw new ReconciliationError('Provide a reversal reason (3–2000 characters).')
    const household = await FinanceAccessService.permissions(input.user)
    return AuditContext.transaction(async (trx) => {
      await AuditContext.apply(trx, {
        actorUserId: input.user.id,
        requestId: input.requestId ?? null,
        reason: 'finance.manual_reconciliation_reversed',
      })
      const tx = await FinancialTransaction.query({ client: trx })
        .where('userId', input.user.id)
        .where('id', input.transactionId)
        .forUpdate()
        .first()
      if (!tx) throw new ReconciliationError('Transaction not found.', 404)
      if (!FinanceAccessService.canUse(tx.dataClassification, 'update', household))
        throw new ReconciliationError('Household finance permission is required.', 403)
      const match = await ManualReconciliation.query({ client: trx })
        .where('userId', input.user.id)
        .where('financialTransactionId', tx.id)
        .whereNull('reversedAt')
        .forUpdate()
        .first()
      if (!match || tx.status !== 'reconciled')
        throw new ReconciliationError('No active manual match is available to reverse.', 409)
      match.reversedAt = DateTime.now()
      match.reversedByUserId = input.user.id
      match.reversalReason = reason
      await match.save()
      tx.status = match.previousStatus
      tx.reconciledAt = null
      await tx.save()
      return match
    })
  }
}
