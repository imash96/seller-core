import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import User from '#models/user'
import Order from '#models/order'
import Customer from '#models/customer'
import FinancialAccount from '#models/financial_account'
import CreditCard from '#models/credit_card'
import FinancialTransaction from '#models/financial_transaction'
import MarketplaceClaim from '#models/marketplace_claim'
import Shipment from '#models/shipment'
import ShippingInvoiceLine from '#models/shipping_invoice_line'
import OrderLineItem from '#models/order_line_item'
import { OrderService } from '#services/order_service'
import { FulfillmentAndReturnsService } from '#services/fulfillment_and_returns_service'
import { money } from '../../app/types/price.js'
import {
  MONEY_TABLES,
  NO_CURRENCY_COLUMN_TABLES,
  columnsOf,
  isMoneyColumn,
} from '../utils/money_schema.js'

/**
 * The money contract of every business table.
 *
 * Two invariants are asserted structurally, not by spot-checking a few columns:
 *
 *  1. every monetary column is `jsonb` and holds a self-contained
 *     `{ currency_code, amount }` — never a bare number, never a relabelled scalar;
 *  2. no business table carries a standalone `currency_code` / `reporting_currency_code`
 *     column, so it is impossible for a row's amount and its currency to disagree.
 *
 * `catalog_items` is the one deliberate exception: it stores USD-only pricing
 * (`base_price_usd numeric`) because the multi-currency array is derived per product,
 * variant and channel listing.
 */

function toCamel(column: string) {
  return column.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase())
}

/** Every money attribute of a hydrated row, as `{ currency_code, amount }`. */
function assertMoneyShape(
  assert: any,
  label: string,
  source: Record<string, any>,
  moneyColumns: string[]
) {
  assert.isAbove(moneyColumns.length, 0, `${label} must expose at least one monetary column`)
  for (const column of moneyColumns) {
    const key = toCamel(column)
    const value = source[key]
    if (value === null || value === undefined) continue
    assert.isObject(value, `${label}.${key} must be an object, got ${JSON.stringify(value)}`)
    assert.match(
      String(value.currency_code ?? ''),
      /^[A-Z]{3}$/,
      `${label}.${key} must carry an ISO currency_code (got ${JSON.stringify(value)})`
    )
    assert.isNumber(value.amount, `${label}.${key}.amount must be numeric`)
    assert.isFalse(
      Array.isArray(value),
      `${label}.${key} must be a single PriceMoney, not an array`
    )
  }
}

test.group('Money contract: storage and serialization', () => {
  test('every monetary column is jsonb and catalog pricing stays USD-only', async ({ assert }) => {
    const catalogColumns = await columnsOf('catalog_items')
    const basePrice = catalogColumns.find((column) => column.column_name === 'base_price_usd')
    assert.equal(basePrice?.data_type, 'numeric')
    assert.isTrue(
      catalogColumns.some((column) => column.column_name === 'price_tier'),
      'catalog_items keeps its USD price tier'
    )
    assert.isFalse(
      catalogColumns.some((column) => column.column_name.includes('currency')),
      'catalog_items must not gain a currency column'
    )

    for (const table of MONEY_TABLES) {
      const columns = await columnsOf(table)
      const moneyColumns = columns.filter((column) => isMoneyColumn(column.column_name))
      assert.isAbove(moneyColumns.length, 0, `${table} must declare monetary columns`)
      for (const column of moneyColumns) {
        assert.equal(
          column.data_type,
          'jsonb',
          `${table}.${column.column_name} must be jsonb PriceMoney, got ${column.data_type}`
        )
      }
    }
  })

  test('no business table reintroduces a standalone currency column', async ({ assert }) => {
    for (const table of NO_CURRENCY_COLUMN_TABLES) {
      const columns = await columnsOf(table)
      const currencyColumns = columns.filter(
        (column) =>
          column.column_name === 'currency_code' ||
          column.column_name === 'reporting_currency_code' ||
          column.column_name.endsWith('_currency_code')
      )
      assert.deepEqual(
        currencyColumns.map((column) => column.column_name),
        [],
        `${table} must not store a standalone currency column`
      )
    }
  })

  test('order and line items round-trip every amount as PriceMoney', async ({ assert }) => {
    const user = await makeUser(`money-contract-order-${Date.now()}@example.com`)
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-MC-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Contract Buyer', email: 'contract@buyer.io' },
      lines: [
        {
          sku: `MC-${Date.now()}`,
          title: 'Contract Coat',
          quantityOrdered: 2,
          unitPrice: money(199.99, 'USD'),
          // COGS booked in a different currency must survive as its own PriceMoney.
          unitCost: money(4200, 'INR'),
          taxLines: [{ code: 'US-CA', rate: 8.25, total: money(16.5, 'USD') }],
        },
      ],
    })
    await order.load('lineItems')

    const orderTableColumns = await columnsOf('orders')
    const orderColumns = orderTableColumns
      .filter((column) => isMoneyColumn(column.column_name))
      .map((column) => column.column_name)
    assertMoneyShape(assert, 'orders', order.serialize(), orderColumns)

    const lineTableColumns = await columnsOf('order_line_items')
    const lineColumns = lineTableColumns
      .filter((column) => isMoneyColumn(column.column_name))
      .map((column) => column.column_name)
    assertMoneyShape(assert, 'order_line_items', order.lineItems[0].serialize(), lineColumns)

    // Persisted JSONB, not a driver-coerced scalar.
    const rawOrder = await db.rawQuery('select grand_total, cogs_total from orders where id = ?', [
      order.id,
    ])
    assert.isObject(rawOrder.rows[0].grand_total)
    assert.equal(rawOrder.rows[0].grand_total.currency_code, 'USD')
    // Order-level P&L totals live in the order currency (INR COGS is FX-converted),
    // while the line keeps the amount exactly as it was booked.
    assert.equal(rawOrder.rows[0].cogs_total.currency_code, 'USD')
    const rawLine = await db.rawQuery('select unit_cost from order_line_items where id = ?', [
      order.lineItems[0].id,
    ])
    assert.equal(rawLine.rows[0].unit_cost.currency_code, 'INR')
    assert.equal(rawLine.rows[0].unit_cost.amount, 4200)

    const customer = await Customer.findOrFail(order.customerId!)
    assertMoneyShape(assert, 'customers', customer.serialize(), ['total_spent'])
  })

  test('fulfillment, invoices, returns, refunds and claims keep per-amount currency', async ({
    assert,
  }) => {
    const user = await makeUser(`money-contract-flow-${Date.now()}@example.com`)
    const stamp = Date.now()
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-MCF-${stamp}`,
      currencyCode: 'USD',
      customer: { fullName: 'Flow Buyer', email: 'flow@buyer.io' },
      lines: [
        {
          sku: `MCF-${stamp}`,
          title: 'Flow Coat',
          quantityOrdered: 2,
          unitPrice: money(150, 'USD'),
          unitCost: money(60, 'USD'),
        },
      ],
    })
    await order.load('lineItems')
    const line = order.lineItems[0]

    const shipment = await FulfillmentAndReturnsService.createShipment({
      userId: user.id,
      orderId: order.id,
      shipmentNumber: `SHP-MCF-${stamp}`,
      carrierCode: 'dhl',
      carrierName: 'DHL',
      estimatedShippingCost: money(1800, 'MXN'),
      items: [{ orderLineItemId: line.id, quantityShipped: 1 }],
    })

    const invoice = await FulfillmentAndReturnsService.createShippingInvoice({
      userId: user.id,
      carrierCode: 'dhl',
      carrierName: 'DHL',
      invoiceNumber: `INV-MCF-${stamp}`,
      invoiceDate: '2026-03-01',
      lines: [
        {
          shipmentId: shipment.id,
          chargeType: 'base_freight',
          expectedAmount: money(1800, 'MXN'),
          billedAmount: money(1850, 'MXN'),
        },
      ],
    })
    const invoiceLine = await ShippingInvoiceLine.query()
      .where('shippingInvoiceId', invoice.id)
      .firstOrFail()

    const rma = await FulfillmentAndReturnsService.createReturnRequest({
      userId: user.id,
      orderId: order.id,
      orderLineItemId: line.id,
      rmaNumber: `RMA-MCF-${stamp}`,
      returnReason: 'damaged_in_transit',
      quantityRequested: 1,
      restockingFeeAmount: money(15, 'USD'),
      returnShippingCost: money(25, 'USD'),
    })

    const refund = await FulfillmentAndReturnsService.processRefund({
      userId: user.id,
      orderId: order.id,
      orderLineItemId: line.id,
      returnRequestId: rma.id,
      refundNumber: `REF-MCF-${stamp}`,
      itemsRefundTotal: money(120, 'USD'),
      shippingRefundTotal: money(10, 'USD'),
      taxRefundTotal: money(9.6, 'USD'),
      restockingFeeTotal: money(15, 'USD'),
    })

    const claim = await MarketplaceClaim.create({
      userId: user.id,
      orderId: order.id,
      claimNumber: `CLM-MCF-${stamp}`,
      externalClaimId: `CLM-MCF-${stamp}`,
      claimType: 'chargeback',
      status: 'under_review',
      disputedTotal: money(150, 'USD'),
      sellerLiabilityTotal: money(50, 'USD'),
      reason: 'Cardholder dispute',
      evidenceSubmitted: {},
    })

    const account = await FinancialAccount.create({
      userId: user.id,
      accountName: 'Contract Checking',
      accountType: 'bank_checking',
      currentBalance: money(1200.5, 'USD'),
      dataClassification: 'business',
      isActive: true,
    })
    const card = await CreditCard.create({
      userId: user.id,
      cardLabel: 'Contract Card',
      brandName: 'Visa',
      cardholderName: 'Contract Holder',
      last4Digits: '4242',
      expMonth: 12,
      expYear: 2030,
      creditLimit: money(5000, 'USD'),
      currentBalance: money(120.25, 'USD'),
      minimumPaymentDue: money(25, 'USD'),
      dataClassification: 'business',
      status: 'active',
    })
    const ledger = await FinancialTransaction.create({
      userId: user.id,
      financialAccountId: account.id,
      referenceNumber: `LEDGER-MCF-${stamp}`,
      transactionType: 'expense',
      dataClassification: 'business',
      status: 'posted',
      description: 'Contract expense',
      originalAmount: money(99.99, 'EUR'),
      exchangeRate: '1.085',
      reportingAmount: money(108.49, 'USD'),
      transactionDate: DateTime.fromISO('2026-03-01'),
    })

    const subject: Array<[string, Record<string, any>]> = [
      ['shipments', shipment.serialize()],
      ['shipping_invoices', invoice.serialize()],
      ['shipping_invoice_lines', invoiceLine.serialize()],
      ['return_requests', rma.serialize()],
      ['refund_transactions', refund.serialize()],
      ['marketplace_claims', claim.serialize()],
      ['financial_accounts', account.serialize()],
      ['credit_cards', card.serialize()],
      ['financial_transactions', ledger.serialize()],
    ]
    for (const [table, serialized] of subject) {
      const tableColumns = await columnsOf(table)
      const moneyColumns = tableColumns
        .filter((column) => isMoneyColumn(column.column_name))
        .map((column) => column.column_name)
      assertMoneyShape(assert, table, serialized, moneyColumns)
    }

    // A carrier invoice booked in MXN keeps MXN on its own rows.
    assert.equal(invoiceLine.serialize().billedAmount.currency_code, 'MXN')
    // The order's own currency is unaffected by the MXN carrier cost.
    await order.refresh()
    assert.equal(currencyOfOrder(order.shippingCostTotal), 'USD')
    await Shipment.findOrFail(shipment.id)
    assert.equal(currencyOfOrder(shipment.estimatedShippingCost), 'MXN')
  })
})

function currencyOfOrder(value: any): string {
  return String(value?.currency_code ?? '')
}

async function makeUser(email: string) {
  return User.create({
    email,
    fullName: 'Money contract',
    password: 'Password123!',
    status: 'active',
    isSuperAdmin: true,
    defaultCurrency: 'USD',
    timezone: 'UTC',
  })
}

/**
 * Guards the helper above: the money column detector must not accidentally treat
 * structural jsonb (tax lines, adjustments) as a monetary column.
 */
test.group('Money contract: column classification', () => {
  test('the money-column matcher ignores structural jsonb columns', ({ assert }) => {
    assert.isTrue(isMoneyColumn('grand_total'))
    assert.isTrue(isMoneyColumn('shipping_cost_total'))
    assert.isTrue(isMoneyColumn('net_proceeds'))
    assert.isTrue(isMoneyColumn('current_balance'))
    assert.isTrue(isMoneyColumn('marketplace_withheld_tax_total'))
    assert.isTrue(isMoneyColumn('cost_price'))
    assert.isTrue(isMoneyColumn('subtotal'))
    assert.isTrue(isMoneyColumn('credit_limit'))
    assert.isFalse(isMoneyColumn('base_price_usd'))
    assert.isFalse(isMoneyColumn('tax_lines'))
    assert.isFalse(isMoneyColumn('adjustments'))
    assert.isFalse(isMoneyColumn('prices'))
    assert.isFalse(isMoneyColumn('channel_metadata'))
    assert.isFalse(isMoneyColumn('refund_number'))
    assert.isFalse(isMoneyColumn('refunded_at'))
  })

  test('order and line models expose no standalone currency column', async ({ assert }) => {
    const orderColumns = await columnsOf('orders')
    assert.isFalse(orderColumns.some((column) => column.column_name.endsWith('currency_code')))
    const lineColumns = await columnsOf('order_line_items')
    assert.isFalse(lineColumns.some((column) => column.column_name.endsWith('currency_code')))
    // …but the line still knows its currency, derived from its money columns.
    const [line] = await OrderLineItem.query().limit(1)
    if (line) {
      assert.match(String(line.serialize().currencyCode ?? ''), /^[A-Z]{3}$/)
    }
    const [order] = await Order.query().limit(1)
    if (order) assert.match(String(order.serialize().currencyCode ?? ''), /^[A-Z]{3}$/)
  })
})
