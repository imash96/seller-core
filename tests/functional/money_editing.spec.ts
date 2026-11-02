/* eslint-disable @unicorn/no-await-expression-member -- Response status assertions */
import { test } from '@japa/runner'
import User from '#models/user'
import Product from '#models/product'
import Order from '#models/order'
import ReturnRequest from '#models/return_request'
import ShippingInvoice from '#models/shipping_invoice'
import ShippingInvoiceLine from '#models/shipping_invoice_line'
import MarketplaceClaim from '#models/marketplace_claim'
import { amountOf, currencyOf } from '../../app/types/price.js'

/**
 * End-to-end proof that the per-amount currency editors in `inertia/pages/*` submit a
 * payload the API actually stores: a USD anchor plus a full MedusaJS v2 price array for
 * catalogs/products/listings, and a self-contained `{ currency_code, amount }` for every
 * order/return amount. These cover the exact shapes `withMoneyPairs` produces.
 */
function makeJar() {
  const jar = new Map<string, string>()
  const base = 'http://localhost:3333'
  const send = async (path: string, body?: Record<string, unknown>) => {
    const xsrf = jar.get('XSRF-TOKEN')
    const response = await fetch(base + path, {
      method: body ? 'POST' : 'GET',
      redirect: 'manual',
      headers: {
        cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
        ...(body
          ? { 'content-type': 'application/json', 'x-xsrf-token': decodeURIComponent(xsrf ?? '') }
          : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0]
      const index = pair.indexOf('=')
      jar.set(pair.slice(0, index), pair.slice(index + 1))
    }
    return response
  }
  return { send }
}

test.group('Per-amount currency editing', () => {
  test('product creation stores the USD anchor and every currency override', async ({ assert }) => {
    const nonce = Date.now().toString()
    const user = await User.create({
      email: `money-editor-${nonce}@example.com`,
      fullName: 'Money editor',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const { send } = makeJar()
    await send('/store/product-categories')
    assert.equal((await send('/', { email: user.email, password: 'Password123!' })).status, 302)

    const sku = `MONEY-${nonce}`
    const create = await send('/products', {
      title: 'Currency anchor coat',
      sku,
      priceUsd: 149.99,
      costPrice: { amount: 95, currencyCode: 'USD' },
      pricesJson: JSON.stringify([
        { currency_code: 'USD', amount: 149.99 },
        { currency_code: 'INR', amount: 12999 },
        { currency_code: 'EUR', amount: 138.99 },
        { currency_code: 'GBP', amount: 118.99 },
        { currency_code: 'CAD', amount: 203.99 },
        { currency_code: 'MXN', amount: 2699.99 },
      ]),
    })
    assert.equal(create.status, 302)

    const product = await Product.query()
      .where('userId', user.id)
      .whereHas('variants', (query) => query.where('sku', sku))
      .preload('variants')
      .firstOrFail()
    const variant = product.variants[0]
    assert.equal(currencyOf(variant.costPrice), 'USD')
    assert.equal(amountOf(variant.costPrice), 95)
    assert.sameMembers(
      variant.prices.map((price) => price.currency_code),
      ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'MXN']
    )
    // The overrides are stored verbatim — never re-derived from the USD anchor.
    assert.equal(variant.prices.find((price) => price.currency_code === 'INR')?.amount, 12999)
  })

  test('order amounts keep one currency each instead of inheriting the order currency', async ({
    assert,
  }) => {
    const nonce = Date.now().toString()
    const user = await User.create({
      email: `money-order-${nonce}@example.com`,
      fullName: 'Money editor',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const { send } = makeJar()
    await send('/store/product-categories')
    assert.equal((await send('/', { email: user.email, password: 'Password123!' })).status, 302)

    const orderNumber = `ORD-MONEY-${nonce}`
    const create = await send('/orders', {
      orderNumber,
      currencyCode: 'USD',
      customerFullName: 'Ada Buyer',
      sku: `SKU-${nonce}`,
      itemTitle: 'Anchor Coat',
      quantityOrdered: 1,
      unitPrice: { amount: 149.99, currencyCode: 'USD' },
      taxTotal: { amount: 13.5, currencyCode: 'USD' },
      discountTotal: { amount: 5, currencyCode: 'USD' },
      shippingTotal: { amount: 12, currencyCode: 'USD' },
      // Booked in another currency on purpose: shipping is paid to a Mexican carrier.
      shippingCostTotal: { amount: 240, currencyCode: 'MXN' },
    })
    assert.equal(create.status, 302)

    const order = await Order.query()
      .where('userId', user.id)
      .where('orderNumber', orderNumber)
      .preload('lineItems')
      .firstOrFail()
    const line = order.lineItems[0]
    assert.equal(currencyOf(line.unitPrice), 'USD')
    assert.equal(amountOf(line.unitPrice), 149.99)
    assert.equal(currencyOf(order.shippingCostTotal), 'MXN')
    assert.equal(amountOf(order.shippingCostTotal), 240)
  })

  test('a return refund can be booked in the return currency', async ({ assert }) => {
    const nonce = Date.now().toString()
    const user = await User.create({
      email: `money-return-${nonce}@example.com`,
      fullName: 'Money editor',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const { send } = makeJar()
    await send('/store/product-categories')
    assert.equal((await send('/', { email: user.email, password: 'Password123!' })).status, 302)

    const orderNumber = `ORD-RET-${nonce}`
    await send('/orders', {
      orderNumber,
      currencyCode: 'CAD',
      customerFullName: 'Maple Buyer',
      sku: `SKU-RET-${nonce}`,
      itemTitle: 'Anchor Coat',
      quantityOrdered: 1,
      unitPrice: { amount: 200, currencyCode: 'CAD' },
    })
    const order = await Order.query()
      .where('userId', user.id)
      .where('orderNumber', orderNumber)
      .preload('lineItems')
      .firstOrFail()

    const rma = await send('/returns', {
      orderId: order.id,
      orderLineItemId: order.lineItems[0].id,
      rmaNumber: `RMA-${nonce}`,
      returnReason: 'damaged_in_transit',
      resolutionType: 'refund',
      itemCondition: 'unopened',
      quantityRequested: 1,
      restockingFeeTotal: { amount: 15, currencyCode: 'CAD' },
      returnShippingCost: { amount: 11.5, currencyCode: 'CAD' },
      customerComments: 'Box arrived crushed.',
    })
    assert.equal(rma.status, 302)

    const request = await ReturnRequest.query()
      .where('userId', user.id)
      .where('rmaNumber', `RMA-${nonce}`)
      .firstOrFail()
    assert.equal(request.returnReason, 'damaged_in_transit')
    assert.equal(currencyOf(request.restockingFeeTotal), 'CAD')
    assert.equal(amountOf(request.restockingFeeTotal), 15)
    assert.equal(currencyOf(request.returnShippingCost), 'CAD')
    assert.equal(amountOf(request.returnShippingCost), 11.5)
  })

  test('carrier invoice and claim amounts each keep their own currency', async ({ assert }) => {
    const nonce = Date.now().toString()
    const user = await User.create({
      email: `money-invoice-${nonce}@example.com`,
      fullName: 'Money editor',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const { send } = makeJar()
    await send('/store/product-categories')
    assert.equal((await send('/', { email: user.email, password: 'Password123!' })).status, 302)

    const invoiceResponse = await send('/shipping-invoices', {
      carrierCode: 'dhl',
      carrierName: 'DHL',
      invoiceNumber: `INV-MONEY-${nonce}`,
      invoiceDate: '2026-02-01',
      chargeType: 'base_freight',
      expectedAmount: { amount: 1200, currencyCode: 'MXN' },
      billedAmount: { amount: 1380.5, currencyCode: 'MXN' },
    })
    assert.equal(invoiceResponse.status, 302)
    const invoice = await ShippingInvoice.query()
      .where('userId', user.id)
      .where('invoiceNumber', `INV-MONEY-${nonce}`)
      .preload('lines')
      .firstOrFail()
    const invoiceLine = await ShippingInvoiceLine.findOrFail(invoice.lines[0].id)
    assert.equal(currencyOf(invoiceLine.billedAmount), 'MXN')
    assert.equal(amountOf(invoiceLine.billedAmount), 1380.5)
    assert.equal(invoice.reconciliationStatus, 'variance_detected')
    // The variance is booked in the same currency as the invoice amount.
    assert.equal(currencyOf(invoiceLine.varianceAmount), 'MXN')
    assert.equal(amountOf(invoiceLine.varianceAmount), 180.5)

    const orderNumber = `ORD-CLAIM-${nonce}`
    await send('/orders', {
      orderNumber,
      currencyCode: 'USD',
      customerFullName: 'Erika Buyer',
      sku: `SKU-CLAIM-${nonce}`,
      itemTitle: 'Anchor Coat',
      quantityOrdered: 1,
      unitPrice: { amount: 250, currencyCode: 'USD' },
    })
    const order = await Order.query()
      .where('userId', user.id)
      .where('orderNumber', orderNumber)
      .firstOrFail()

    const claimResponse = await send('/claims', {
      orderId: order.id,
      claimNumber: `CLM-${nonce}`,
      claimType: 'chargeback',
      disputedAmount: { amount: 230, currencyCode: 'EUR' },
      sellerLiabilityAmount: { amount: 100, currencyCode: 'EUR' },
    })
    assert.equal(claimResponse.status, 302)
    const claim = await MarketplaceClaim.query()
      .where('userId', user.id)
      .where('claimNumber', `CLM-${nonce}`)
      .firstOrFail()
    assert.equal(currencyOf(claim.disputedTotal), 'EUR')
    assert.equal(amountOf(claim.disputedTotal), 230)
    assert.equal(currencyOf(claim.sellerLiabilityTotal), 'EUR')
    assert.equal(amountOf(claim.sellerLiabilityTotal), 100)
  })
})
