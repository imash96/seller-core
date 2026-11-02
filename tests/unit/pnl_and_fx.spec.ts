import { test } from '@japa/runner'
import User from '#models/user'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import Order from '#models/order'
import RefundTransaction from '#models/refund_transaction'
import { OrderService } from '#services/order_service'
import { FulfillmentAndReturnsService } from '#services/fulfillment_and_returns_service'
import { ProfitabilityService } from '#services/profitability_service'
import { money } from '../../app/types/price.js'

/**
 * Phase 8: seller P&L under Marketplace Facilitator Tax, plus every place a mixed
 * currency amount is folded into an order (carrier cost, refund component).
 *
 * The facilitator rule under test: the buyer's tax is inside `grand_total`, the
 * marketplace withholds it, so it leaves the payout exactly once. It must never be
 * deducted a second time as a seller liability.
 */
test.group('Profitability and FX edge cases', () => {
  async function makeUser(label: string) {
    return User.create({
      email: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
      fullName: 'P&L Owner',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
  }

  async function makeVariant(userId: string, stock: number) {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const product = await Product.create({
      userId,
      title: `P&L Product ${nonce}`,
      slug: `pnl-product-${nonce}`,
      status: 'active',
      hasVariants: true,
      prices: [],
      images: [],
      tags: [],
      dimensionsCm: {},
      metadata: {},
    })
    return ProductVariant.create({
      userId,
      productId: product.id,
      sku: `PNL-${nonce}`,
      title: 'P&L Variant',
      prices: [],
      stockOnHand: stock,
      stockReserved: 0,
    })
  }

  // ---------------------------------------------------------------- pure formulas

  test('facilitator tax is withheld once and never deducted again', ({ assert }) => {
    const result = ProfitabilityService.compute({
      currency: 'USD',
      subtotal: 100,
      taxTotal: 10,
      shippingTaxTotal: 2,
      grandTotal: 112,
      taxCollectionModel: 'marketplace_facilitator',
      marketplaceWithheldTaxTotal: 12,
      marketplaceFeesTotal: 15,
      paymentProcessingFeesTotal: 0,
      cogsTotal: 40,
      shippingCostTotal: 5,
    })

    assert.equal(result.withheldTax.amount, 12)
    assert.equal(result.remittedTax.amount, 0, 'a facilitator order leaves no seller tax liability')
    // 112 − 12 withheld − 15 fees
    assert.equal(result.netProceeds.amount, 85)
    // 85 − 40 COGS − 5 shipping (tax is NOT subtracted again)
    assert.equal(result.netProfit.amount, 40)
    assert.equal(result.netSales.amount, 100)
  })

  test('facilitator orders without an explicit withheld total derive it from tax columns', ({
    assert,
  }) => {
    const result = ProfitabilityService.compute({
      currency: 'USD',
      subtotal: 100,
      taxTotal: 10,
      shippingTaxTotal: 2,
      grandTotal: 112,
      taxCollectionModel: 'marketplace_facilitator',
      marketplaceFeesTotal: 15,
      paymentProcessingFeesTotal: 0,
      cogsTotal: 40,
      shippingCostTotal: 5,
    })
    assert.equal(result.withheldTax.amount, 12)
    assert.equal(result.remittedTax.amount, 0)
    assert.equal(result.netProceeds.amount, 85)
    assert.equal(result.netProfit.amount, 40)
  })

  test('seller-collected tax is remitted once and stays inside net proceeds', ({ assert }) => {
    const result = ProfitabilityService.compute({
      currency: 'USD',
      subtotal: 100,
      taxTotal: 10,
      shippingTaxTotal: 2,
      grandTotal: 112,
      taxCollectionModel: 'seller',
      marketplaceFeesTotal: 15,
      paymentProcessingFeesTotal: 0,
      cogsTotal: 40,
      shippingCostTotal: 5,
    })
    assert.equal(result.withheldTax.amount, 0, 'nothing is withheld by the marketplace')
    assert.equal(result.remittedTax.amount, 12)
    // The seller did receive the tax, so proceeds keep it…
    assert.equal(result.netProceeds.amount, 97)
    // …but owes it, so profit removes it exactly once.
    assert.equal(result.netProfit.amount, 40)
  })

  test('the two tax models reconcile to the same profit for identical economics', ({ assert }) => {
    const common = {
      currency: 'USD',
      subtotal: 100,
      taxTotal: 10,
      shippingTaxTotal: 2,
      grandTotal: 112,
      marketplaceFeesTotal: 15,
      paymentProcessingFeesTotal: 0,
      cogsTotal: 40,
      shippingCostTotal: 5,
    } as const
    const facilitator = ProfitabilityService.compute({
      ...common,
      taxCollectionModel: 'marketplace_facilitator',
      marketplaceWithheldTaxTotal: 12,
    })
    const seller = ProfitabilityService.compute({ ...common, taxCollectionModel: 'seller' })
    assert.equal(facilitator.netProfit.amount, seller.netProfit.amount)
    assert.equal(
      facilitator.netProceeds.amount + facilitator.withheldTax.amount,
      seller.netProceeds.amount
    )
  })

  test('mixed-currency inputs are converted into the order currency and rates recorded', ({
    assert,
  }) => {
    const result = ProfitabilityService.compute({
      currency: 'USD',
      subtotal: 200,
      grandTotal: 200,
      marketplaceFeesTotal: 20,
      paymentProcessingFeesTotal: 0,
      taxCollectionModel: 'seller',
      // Booked in different currencies than the sale.
      cogsTotal: money(8400, 'INR'),
      shippingCostTotal: money(340, 'MXN'),
      refundedTotal: money(100, 'CAD'),
      exchangeRates: { INR: 83.5, MXN: 17.15, CAD: 1.36 },
    })
    // 200 − 0 withheld − 20 fees − 73.53 CAD refund
    assert.equal(result.netProceeds.amount, 106.47)
    // 200 − 100.6 COGS − 19.83 carrier
    assert.equal(result.grossProfit.amount, 79.57)
    assert.approximately(result.fxApplied['INR->USD'], 1 / 83.5, 1e-9)
    assert.isNumber(result.fxApplied['MXN->USD'])
    assert.isNumber(result.fxApplied['CAD->USD'])
    for (const value of Object.values(result.fxApplied)) assert.isAbove(value, 0)
  })

  test('ratesFromMetadata inverts X->USD entries and ignores everything else', ({ assert }) => {
    const rates = ProfitabilityService.ratesFromMetadata({
      fxConversions: {
        'INR->USD': 0.011976,
        'MXN->USD': 0.058309,
        'INR->EUR': 0.011,
        'reporting': 1,
        'bogus': 'x',
      },
    })
    assert.approximately(rates.INR, 1 / 0.011976, 1e-9)
    assert.approximately(rates.MXN, 1 / 0.058309, 1e-9)
    assert.notProperty(rates, 'INR->EUR')
    assert.isUndefined(rates.EUR)
    assert.isEmpty(ProfitabilityService.ratesFromMetadata(null))
    assert.isEmpty(ProfitabilityService.ratesFromMetadata({}))
  })

  // ------------------------------------------------------------ end-to-end orders

  test('an imported facilitator order books the tax once end to end', async ({ assert }) => {
    const user = await makeUser('pnl-facilitator')
    const variant = await makeVariant(user.id, 5)

    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-FAC-${Date.now()}`,
      marketplaceCode: 'amazon',
      currencyCode: 'USD',
      taxCollectionModel: 'marketplace_facilitator',
      customer: { fullName: 'Facilitator Buyer', email: 'fac@example.com' },
      lines: [
        {
          sku: variant.sku,
          productVariantId: variant.id,
          title: 'Facilitator item',
          quantityOrdered: 1,
          unitPrice: 100,
        },
      ],
      subtotal: money(100, 'USD'),
      taxTotal: money(10, 'USD'),
      shippingTaxTotal: money(2, 'USD'),
      grandTotal: money(112, 'USD'),
      marketplaceFeesTotal: money(15, 'USD'),
      paymentProcessingFeesTotal: money(0, 'USD'),
      cogsTotal: money(40, 'USD'),
    })

    assert.equal(order.taxCollectionModel, 'marketplace_facilitator')
    assert.equal(order.marketplaceWithheldTaxTotal.currency_code, 'USD')
    assert.equal(order.marketplaceWithheldTaxTotal.amount, 12)
    // 112 − 12 withheld − 15 fees, and the tax is not deducted a second time.
    assert.equal(order.netProceeds.amount, 85)
    assert.equal(order.netProfit.amount, 45)

    // Recomputing from persisted state (as a shipment or refund does) is idempotent
    // and never subtracts the withheld tax twice.
    const persisted = await Order.findOrFail(order.id)
    OrderService.recomputeProfitability(persisted)
    assert.equal(persisted.netProceeds.amount, 85)
    assert.equal(persisted.netProfit.amount, 45)
  })

  test('mixed-currency carrier costs convert into the order currency on shipment', async ({
    assert,
  }) => {
    const user = await makeUser('pnl-carrier')
    const variant = await makeVariant(user.id, 5)

    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-CARRIER-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Carrier Buyer' },
      lines: [
        {
          sku: variant.sku,
          productVariantId: variant.id,
          title: 'Carrier item',
          quantityOrdered: 1,
          unitPrice: 200,
        },
      ],
      subtotal: money(200, 'USD'),
      grandTotal: money(200, 'USD'),
      marketplaceFeesTotal: money(20, 'USD'),
      paymentProcessingFeesTotal: money(0, 'USD'),
      cogsTotal: money(50, 'USD'),
    })
    assert.equal(order.shippingCostTotal.amount, 0)
    await order.load('lineItems')

    await FulfillmentAndReturnsService.createShipment({
      userId: user.id,
      orderId: order.id,
      shipmentNumber: `SHP-CARRIER-${Date.now()}`,
      carrierCode: 'dhl',
      carrierName: 'DHL',
      // The carrier bills in MXN even though the order is in USD.
      estimatedShippingCost: money(171.5, 'MXN'),
      items: [{ orderLineItemId: order.lineItems[0].id, quantityShipped: 1 }],
    })

    const refreshed = await Order.findOrFail(order.id)
    assert.equal(refreshed.shippingCostTotal.currency_code, 'USD')
    assert.equal(refreshed.shippingCostTotal.amount, 10) // 171.5 / 17.15
    assert.isNumber(refreshed.channelMetadata?.fxConversions?.['MXN->USD'])
    // 200 − 20 fees − 50 COGS − 10 carrier
    assert.equal(refreshed.netProfit.amount, 120)
  })

  test('a foreign-currency refund component converts into the refund currency', async ({
    assert,
  }) => {
    const user = await makeUser('pnl-refund')
    const variant = await makeVariant(user.id, 5)

    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-REFUND-FX-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Refund FX Buyer' },
      lines: [
        {
          sku: variant.sku,
          productVariantId: variant.id,
          title: 'Refund FX item',
          quantityOrdered: 1,
          unitPrice: 100,
        },
      ],
      subtotal: money(100, 'USD'),
      grandTotal: money(100, 'USD'),
      marketplaceFeesTotal: money(0, 'USD'),
      paymentProcessingFeesTotal: money(0, 'USD'),
      cogsTotal: money(0, 'USD'),
    })

    const refund = await FulfillmentAndReturnsService.processRefund({
      userId: user.id,
      orderId: order.id,
      refundNumber: `REF-FX-${Date.now()}`,
      itemsRefundTotal: money(8350, 'INR'), // ₹8,350 = $100
      shippingRefundTotal: money(0, 'USD'),
      taxRefundTotal: money(0, 'USD'),
    })

    assert.equal(refund.grandRefundTotal.currency_code, 'USD')
    assert.equal(refund.grandRefundTotal.amount, 100)
    // The component keeps the currency it was booked in.
    assert.equal(refund.itemsRefundTotal.currency_code, 'INR')

    const refreshed = await Order.findOrFail(order.id)
    assert.equal(refreshed.refundedTotal.amount, 100)
    assert.equal(refreshed.paymentStatus, 'refunded')
  })

  test('a refund in a currency with no usable rate is refused, not silently summed', async ({
    assert,
  }) => {
    const user = await makeUser('pnl-refund-norate')
    const variant = await makeVariant(user.id, 5)
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-REFUND-NORATE-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'No Rate Refund Buyer' },
      lines: [
        {
          sku: variant.sku,
          productVariantId: variant.id,
          title: 'No rate item',
          quantityOrdered: 1,
          unitPrice: 100,
        },
      ],
      subtotal: money(100, 'USD'),
      grandTotal: money(100, 'USD'),
      marketplaceFeesTotal: money(0, 'USD'),
      paymentProcessingFeesTotal: money(0, 'USD'),
      cogsTotal: money(0, 'USD'),
    })

    await assert.rejects(
      () =>
        FulfillmentAndReturnsService.processRefund({
          userId: user.id,
          orderId: order.id,
          refundNumber: `REF-NORATE-${Date.now()}`,
          itemsRefundTotal: money(1000, 'CHF'),
        }),
      /FX_RATE_MISSING/
    )

    assert.equal(
      await RefundTransaction.query()
        .where('orderId', order.id)
        .count('* as total')
        .then((rows) => Number((rows[0] as any).$extras.total)),
      0
    )
    const refreshed = await Order.findOrFail(order.id)
    assert.equal(refreshed.refundedTotal.amount, 0)
  })

  test('a refunded order cannot be cancelled, and cancellation releases reserved units', async ({
    assert,
  }) => {
    const user = await makeUser('pnl-cancel')
    const variant = await makeVariant(user.id, 3)

    const cancelledOrder = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-CANCEL-OK-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Cancel Buyer' },
      lines: [
        {
          sku: variant.sku,
          productVariantId: variant.id,
          title: 'Cancel item',
          quantityOrdered: 1,
          unitPrice: 50,
        },
      ],
      subtotal: money(50, 'USD'),
      grandTotal: money(50, 'USD'),
      marketplaceFeesTotal: money(0, 'USD'),
      paymentProcessingFeesTotal: money(0, 'USD'),
      cogsTotal: money(0, 'USD'),
    })
    const afterCreate = await ProductVariant.findOrFail(variant.id)
    assert.equal(afterCreate.stockReserved, 1)

    const cancellation = await OrderService.cancelOrder({
      userId: user.id,
      orderId: cancelledOrder.id,
      reason: 'buyer changed mind',
    })
    assert.equal(cancellation.releasedUnits, 1)
    const afterCancel = await ProductVariant.findOrFail(variant.id)
    assert.equal(afterCancel.stockReserved, 0)
    assert.equal(afterCancel.stockOnHand, 3, 'cancelling never removes physical stock')

    const refundedOrder = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-CANCEL-REFUNDED-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Refunded Buyer' },
      lines: [
        {
          sku: variant.sku,
          productVariantId: variant.id,
          title: 'Refunded item',
          quantityOrdered: 1,
          unitPrice: 50,
        },
      ],
      subtotal: money(50, 'USD'),
      grandTotal: money(50, 'USD'),
      marketplaceFeesTotal: money(0, 'USD'),
      paymentProcessingFeesTotal: money(0, 'USD'),
      cogsTotal: money(0, 'USD'),
    })
    await FulfillmentAndReturnsService.processRefund({
      userId: user.id,
      orderId: refundedOrder.id,
      refundNumber: `REF-CANCEL-${Date.now()}`,
      itemsRefundTotal: money(50, 'USD'),
    })

    await assert.rejects(
      () => OrderService.cancelOrder({ userId: user.id, orderId: refundedOrder.id }),
      /ALREADY_REFUNDED/
    )
    const stillRefunded = await Order.findOrFail(refundedOrder.id)
    assert.notEqual(stillRefunded.status, 'cancelled')
    // The refused cancellation must not have touched the reservation either.
    const afterRefused = await ProductVariant.findOrFail(variant.id)
    assert.equal(afterRefused.stockReserved, 1)
  })

  // ------------------------------------------------------------- concurrency

  test('concurrent orders for the same variant never oversell or deadlock', async ({ assert }) => {
    const user = await makeUser('pnl-lock')
    const limited = await makeVariant(user.id, 1)
    const spare = await makeVariant(user.id, 50)

    const attempts = Array.from({ length: 6 }, (_, index) =>
      OrderService.createOrder({
        userId: user.id,
        orderNumber: `ORD-LOCK-${Date.now()}-${index}`,
        currencyCode: 'USD',
        customer: { fullName: `Concurrent ${index}` },
        // Different line order per attempt: the bulk id-sorted variant lock is what
        // keeps these from deadlocking against each other.
        lines:
          index % 2 === 0
            ? [
                {
                  sku: limited.sku,
                  productVariantId: limited.id,
                  title: 'Limited',
                  quantityOrdered: 1,
                  unitPrice: 10,
                },
                {
                  sku: spare.sku,
                  productVariantId: spare.id,
                  title: 'Spare',
                  quantityOrdered: 1,
                  unitPrice: 10,
                },
              ]
            : [
                {
                  sku: spare.sku,
                  productVariantId: spare.id,
                  title: 'Spare',
                  quantityOrdered: 1,
                  unitPrice: 10,
                },
                {
                  sku: limited.sku,
                  productVariantId: limited.id,
                  title: 'Limited',
                  quantityOrdered: 1,
                  unitPrice: 10,
                },
              ],
      })
    )

    const settled = await Promise.allSettled(attempts)
    const fulfilled = settled.filter((result) => result.status === 'fulfilled')
    const rejected = settled.filter(
      (result) => result.status === 'rejected'
    ) as PromiseRejectedResult[]

    assert.equal(fulfilled.length, 1, 'only one order can take the last unit')
    assert.equal(rejected.length, 5)
    for (const failure of rejected) {
      assert.notMatch(
        String(failure.reason?.message ?? failure.reason),
        /deadlock detected/i,
        'line-level locks must be taken in a deterministic order'
      )
      assert.match(String(failure.reason?.message ?? failure.reason), /stock|reserv|insufficient/i)
    }

    const limitedAfter = await ProductVariant.findOrFail(limited.id)
    // Reservation never touches `stock_on_hand`; only shipping does.
    assert.equal(limitedAfter.stockOnHand, 1)
    assert.equal(limitedAfter.stockReserved, 1)
    assert.equal(limitedAfter.stockAvailable, 0, 'nothing is left sellable')
    const spareAfter = await ProductVariant.findOrFail(spare.id)
    assert.equal(spareAfter.stockReserved, 1)
  })
})
