import { test } from '@japa/runner'
import User from '#models/user'
import Order from '#models/order'
import SyncJob from '#models/sync_job'
import { OrderService } from '#services/order_service'
import {
  OrderSyncNormalizationError,
  detectPayloadPlatform,
  normalizeAmazonOrder,
  normalizeEbayOrder,
  normalizeEtsyReceipt,
  normalizeMedusaOrder,
  normalizeOrderPayload,
  toCreateOrderInput,
} from '../../app/services/order_sync_normalizer_service.js'
import { FulfillmentChannel, TaxCollectionModel } from '../../app/enums/index.js'
import { generateEntityId } from '../../app/utils/generate_entity_id.js'

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                    */
/* -------------------------------------------------------------------------- */

const AMAZON_ORDER = {
  payload: {
    Orders: [
      {
        AmazonOrderId: '902-8324761-1234567',
        SellerOrderId: 'SELLER-AMZ-77',
        MarketplaceId: 'ATVPDKIKX0DER',
        PurchaseDate: '2026-02-11T14:22:31Z',
        LastUpdateDate: '2026-02-11T15:00:00Z',
        OrderStatus: 'Unshipped',
        FulfillmentChannel: 'AFN',
        SalesChannel: 'Amazon.com',
        IsPrime: true,
        OrderTotal: { Amount: '857.83', CurrencyCode: 'USD' },
        TaxCollection: { Model: 'MarketplaceFacilitator', ResponsibleParty: 'Marketplace' },
        EarliestShipDate: '2026-02-12T00:00:00Z',
        LatestShipDate: '2026-02-14T23:59:59Z',
        EarliestDeliveryDate: '2026-02-15T00:00:00Z',
        LatestDeliveryDate: '2026-02-18T23:59:59Z',
        ShippingAddress: {
          Name: 'Priya Nair',
          AddressLine1: '221B Marine Drive',
          AddressLine2: 'Apt 4',
          City: 'Mumbai',
          StateOrRegion: 'MH',
          PostalCode: '400020',
          CountryCode: 'IN',
          Phone: '+91-9000000000',
        },
        BuyerInfo: { BuyerEmail: 'buyer@marketplace.amazon.com', BuyerName: 'Priya Nair' },
        BuyerNotes: 'Please gift wrap.',
      },
    ],
  },
}

const AMAZON_ORDER_ITEMS = {
  payload: {
    OrderItems: [
      {
        ASIN: 'B09ASTRYX1',
        SellerSKU: 'MJKBK01-BLK-M',
        OrderItemId: 'OI-1',
        Title: "Men's Vintage Leather Biker Jacket",
        QuantityOrdered: 2,
        QuantityShipped: 0,
        ItemPrice: { Amount: '700.00', CurrencyCode: 'USD' },
        ItemTax: { Amount: '56.00', CurrencyCode: 'USD' },
        ShippingPrice: { Amount: '88.00', CurrencyCode: 'USD' },
        ShippingTax: { Amount: '7.04', CurrencyCode: 'USD' },
        PromotionDiscount: { Amount: '0.00', CurrencyCode: 'USD' },
        ShippingDiscount: { Amount: '0.00', CurrencyCode: 'USD' },
        ConditionId: 'New',
        IsGift: true,
      },
      {
        ASIN: 'B09ASTRYX2',
        SellerSKU: 'MJKBK01-BLK-L',
        OrderItemId: 'OI-2',
        Title: "Men's Vintage Leather Biker Jacket (Large)",
        QuantityOrdered: 1,
        ItemPrice: { Amount: '6.79', CurrencyCode: 'USD' },
        ItemTax: { Amount: '0.00', CurrencyCode: 'USD' },
        ShippingPrice: { Amount: '0.00', CurrencyCode: 'USD' },
        ShippingTax: { Amount: '0.00', CurrencyCode: 'USD' },
        PromotionDiscount: { Amount: '0.00', CurrencyCode: 'USD' },
        ShippingDiscount: { Amount: '0.00', CurrencyCode: 'USD' },
      },
    ],
  },
}

const EBAY_ORDER = {
  orders: [
    {
      orderId: '12-12345-67890',
      legacyOrderId: '1122334455',
      creationDate: '2026-03-01T10:00:00.000Z',
      orderPaymentStatus: 'PAID',
      orderFulfillmentStatus: 'FULFILLED',
      creationMarketplaceId: 'EBAY_US',
      ebayCollectAndRemitTax: true,
      pricingSummary: {
        priceSubtotal: { value: '240.00', currency: 'USD' },
        priceDiscount: { value: '15.00', currency: 'USD' },
        deliveryCost: { value: '12.00', currency: 'USD' },
        deliveryDiscount: { value: '2.00', currency: 'USD' },
        tax: { value: '20.00', currency: 'USD' },
        total: { value: '255.00', currency: 'USD' },
      },
      fulfillmentStartInstructions: [
        {
          shipByDate: '2026-03-03T00:00:00.000Z',
          minEstimatedDeliveryDate: '2026-03-05T00:00:00.000Z',
          maxEstimatedDeliveryDate: '2026-03-09T00:00:00.000Z',
          shippingStep: {
            shipTo: {
              fullName: 'Dana Whitfield',
              email: 'dana@example.com',
              primaryPhone: { phoneNumber: '555-0100' },
              contactAddress: {
                addressLine1: '77 Sunset Blvd',
                city: 'Los Angeles',
                stateOrProvince: 'CA',
                postalCode: '90028',
                countryCode: 'US',
              },
            },
          },
        },
      ],
      buyer: { username: 'dana_w' },
      buyerCheckoutNotes: 'Leave at the door',
      lineItems: [
        {
          lineItemId: 'LI-1',
          legacyItemId: '285619320678',
          sku: 'MJKBK01-BLK-M',
          title: 'Leather Biker Jacket',
          quantity: 1,
          lineItemCost: { value: '240.00', currency: 'USD' },
          discountedLineItemCost: { value: '225.00', currency: 'USD' },
          deliveryCost: { value: '0.00', currency: 'USD' },
          taxes: [{ amount: { value: '18.00', currency: 'USD' }, taxType: 'STATE_SALES_TAX' }],
          ebayCollectAndRemitTaxes: [
            { amount: { value: '2.00', currency: 'USD' }, collectionMethod: 'NET' },
          ],
          appliedPromotions: [
            {
              promotionId: 'P-9',
              promotionType: 'SellerHubPromotion',
              amount: { value: '15.00', currency: 'USD' },
            },
          ],
          lineItemFulfillmentStatus: 'FULFILLED',
          purchaseMarketplaceId: 'EBAY_US',
        },
      ],
    },
  ],
}

const ETSY_RECEIPT = {
  receipt_id: 3210987654,
  shop_id: 55667788,
  name: 'Ada Okafor',
  buyer_email: 'ada@example.com',
  buyer_user_id: 99887766,
  created_timestamp: 1772000000,
  is_paid: true,
  is_shipped: false,
  is_gift: true,
  gift_message: 'Happy birthday!',
  gift_wrap_price: { amount: 500, divisor: 100, currency_code: 'USD' },
  message_from_buyer: 'Rush order please',
  grandtotal: { amount: 26099, divisor: 100, currency_code: 'USD' },
  subtotal: { amount: 24000, divisor: 100, currency_code: 'USD' },
  total_price: { amount: 23000, divisor: 100, currency_code: 'USD' },
  total_shipping_cost: { amount: 1500, divisor: 100, currency_code: 'USD' },
  total_tax_cost: { amount: 609, divisor: 100, currency_code: 'USD' },
  total_vat_cost: { amount: 990, divisor: 100, currency_code: 'USD' },
  discount_amt: { amount: 1000, divisor: 100, currency_code: 'USD' },
  estimated_delivery_on: 1772500000,
  first_line: '9 Akin Adesola',
  city: 'Lagos',
  state: 'LA',
  zip: '101241',
  country_iso: 'NG',
  transactions: [
    {
      transaction_id: 777001,
      listing_id: 445566,
      product_id: 889900,
      sku: 'MJKBK01-BLK-M',
      title: 'Leather Biker Jacket',
      quantity: 2,
      price: { amount: 12000, divisor: 100, currency_code: 'USD' },
      shipping_cost: { amount: 1500, divisor: 100, currency_code: 'USD' },
      variations: [
        { formatted_name: 'Color', formatted_value: 'Black' },
        { formatted_name: 'Size', formatted_value: 'M' },
      ],
    },
  ],
}

const MEDUSA_ORDER = {
  order: {
    id: 'order_01HXYZ',
    display_id: 1042,
    region_id: 'reg_us',
    sales_channel_id: 'sc_default',
    customer_id: 'cus_01',
    currency_code: 'usd',
    email: 'sam@example.com',
    status: 'pending',
    payment_status: 'awaiting',
    fulfillment_status: 'not_fulfilled',
    created_at: '2026-04-02T08:30:00.000Z',
    subtotal: 300,
    discount_total: 25,
    shipping_total: 15,
    tax_total: 26.1,
    total: 316.1,
    gift_card_total: 0,
    metadata: { notes: 'Gift receipt only' },
    shipping_address: {
      full_name: 'Sam Rivera',
      address_1: '501 Congress Ave',
      city: 'Austin',
      province: 'TX',
      postal_code: '78701',
      country_code: 'us',
      phone: '5550111',
    },
    items: [
      {
        id: 'item_1',
        product_id: 'prod_1',
        variant_id: 'var_1',
        variant_sku: 'MJKBK01-BLK-M',
        title: 'Leather Biker Jacket',
        variant_title: 'Black / M',
        quantity: 2,
        unit_price: 150,
        subtotal: 300,
        discount_total: 25,
        tax_total: 26.1,
        total: 301.1,
        adjustments: [
          { code: 'promo_10', promotion_id: 'promo_10', description: 'Spring sale', amount: 25 },
        ],
        tax_lines: [{ code: 'txcd_1', rate: 8.7, description: 'TX sales tax', total: 26.1 }],
      },
    ],
  },
}

/* -------------------------------------------------------------------------- */
/* Normalizers                                                                 */
/* -------------------------------------------------------------------------- */

test.group('Order sync normalizers | Amazon', () => {
  test('maps SP-API order and order items into canonical totals', ({ assert }) => {
    const normalized = normalizeAmazonOrder(AMAZON_ORDER, AMAZON_ORDER_ITEMS, {})

    assert.equal(normalized.platform, 'amazon')
    assert.equal(normalized.externalOrderId, '902-8324761-1234567')
    assert.equal(normalized.externalDisplayId, 'SELLER-AMZ-77')
    assert.equal(normalized.marketplaceSiteId, 'ATVPDKIKX0DER')
    assert.equal(normalized.currencyCode, 'USD')
    assert.equal(normalized.fulfillmentChannel, FulfillmentChannel.AFN)
    assert.equal(normalized.taxCollectionModel, TaxCollectionModel.MARKETPLACE_FACILITATOR)
    assert.equal(normalized.status, 'processing')
    assert.equal(normalized.paymentStatus, 'paid')
    assert.equal(normalized.orderedAt, '2026-02-11T14:22:31.000Z')
    assert.equal(normalized.latestShipAt, '2026-02-14T23:59:59.000Z')
    assert.equal(normalized.latestDeliveryAt, '2026-02-18T23:59:59.000Z')

    // Platform grand total is authoritative.
    assert.deepEqual(normalized.grandTotal, { currency_code: 'USD', amount: 857.83 })
    assert.deepEqual(normalized.taxTotal, { currency_code: 'USD', amount: 56 })
    assert.deepEqual(normalized.shippingTaxTotal, { currency_code: 'USD', amount: 7.04 })
    assert.deepEqual(normalized.shippingTotal, { currency_code: 'USD', amount: 88 })
    // Marketplace facilitator tax is withheld from the payout.
    assert.deepEqual(normalized.marketplaceWithheldTaxTotal, {
      currency_code: 'USD',
      amount: 63.04,
    })

    assert.lengthOf(normalized.lines, 2)
    const [jacket, small] = normalized.lines
    assert.equal(jacket.externalListingId, 'B09ASTRYX1')
    assert.equal(jacket.externalVariantId, 'MJKBK01-BLK-M')
    assert.deepEqual(jacket.unitPrice, { currency_code: 'USD', amount: 350 })
    assert.lengthOf(jacket.taxLines ?? [], 2)
    assert.equal(jacket.fulfillmentChannel, FulfillmentChannel.AFN)
    assert.equal((jacket.customAttributes as any).asin, 'B09ASTRYX1')
    assert.equal(small.quantityOrdered, 1)
    // Shipping tax is folded into the line tax total.
    assert.deepEqual(jacket.taxTotal, { currency_code: 'USD', amount: 63.04 })
  })

  test('accepts bare SP-API responses without the payload wrapper', ({ assert }) => {
    const normalized = normalizeAmazonOrder(AMAZON_ORDER.payload, AMAZON_ORDER_ITEMS.payload, {})
    assert.equal(normalized.externalOrderId, '902-8324761-1234567')
    assert.deepEqual(normalized.grandTotal, { currency_code: 'USD', amount: 857.83 })
    assert.lengthOf(normalized.lines, 2)
  })

  test('falls back to the formula when OrderTotal is missing', ({ assert }) => {
    const order = structuredClone(AMAZON_ORDER)
    delete (order.payload.Orders[0] as any).OrderTotal
    const normalized = normalizeAmazonOrder(order, AMAZON_ORDER_ITEMS, {})
    // 706.79 items + 88 shipping + 56 item tax + 7.04 shipping tax
    assert.deepEqual(normalized.grandTotal, { currency_code: 'USD', amount: 857.83 })
  })

  test('rejects payloads without an AmazonOrderId or items', ({ assert }) => {
    assert.throws(
      () => normalizeAmazonOrder({ payload: { Orders: [{}] } }, AMAZON_ORDER_ITEMS),
      OrderSyncNormalizationError
    )
    assert.throws(
      () => normalizeAmazonOrder(AMAZON_ORDER, { payload: { OrderItems: [] } }),
      /has no OrderItems/
    )
  })

  test('honours an explicit merchant-fulfilled channel and seller tax model', ({ assert }) => {
    const order = structuredClone(AMAZON_ORDER)
    const header = order.payload.Orders[0] as any
    header.FulfillmentChannel = 'MFN'
    header.TaxCollection = undefined
    const normalized = normalizeAmazonOrder(order, AMAZON_ORDER_ITEMS, {})
    assert.equal(normalized.fulfillmentChannel, FulfillmentChannel.MFN)
    assert.equal(normalized.taxCollectionModel, TaxCollectionModel.SELLER)
    assert.deepEqual(normalized.marketplaceWithheldTaxTotal, {
      currency_code: 'USD',
      amount: 0,
    })
  })
})

test.group('Order sync normalizers | eBay', () => {
  test('maps pricingSummary, remitted tax and promotions', ({ assert }) => {
    const normalized = normalizeEbayOrder(EBAY_ORDER, {})

    assert.equal(normalized.externalOrderId, '12-12345-67890')
    assert.equal(normalized.externalDisplayId, '1122334455')
    assert.equal(normalized.marketplaceSiteId, 'EBAY_US')
    assert.equal(normalized.taxCollectionModel, TaxCollectionModel.MARKETPLACE_FACILITATOR)
    assert.deepEqual(normalized.subtotal, { currency_code: 'USD', amount: 240 })
    assert.deepEqual(normalized.discountTotal, { currency_code: 'USD', amount: 15 })
    assert.deepEqual(normalized.shippingTotal, { currency_code: 'USD', amount: 12 })
    assert.deepEqual(normalized.shippingDiscountTotal, { currency_code: 'USD', amount: 2 })
    assert.deepEqual(normalized.taxTotal, { currency_code: 'USD', amount: 20 })
    assert.deepEqual(normalized.grandTotal, { currency_code: 'USD', amount: 255 })
    assert.equal(normalized.latestShipAt, '2026-03-03T00:00:00.000Z')
    assert.equal(normalized.latestDeliveryAt, '2026-03-09T00:00:00.000Z')
    assert.equal(normalized.shippingAddress?.countryCode, 'US')

    const [line] = normalized.lines
    assert.equal(line.externalListingId, '285619320678')
    // discount = lineItemCost - discountedLineItemCost
    assert.deepEqual(line.discountTotal, { currency_code: 'USD', amount: 15 })
    assert.equal(line.taxLines?.length, 2)
    assert.equal(line.taxLines?.[1].code, 'EBAY_COLLECT_AND_REMIT')
  })

  test('rejects payloads with no order id', ({ assert }) => {
    assert.throws(() => normalizeEbayOrder({ orders: [{}] }), /missing orders\[\].orderId/)
  })
})

test.group('Order sync normalizers | Etsy', () => {
  test('applies the divisor and folds VAT into tax', ({ assert }) => {
    const normalized = normalizeEtsyReceipt(ETSY_RECEIPT, {})

    assert.equal(normalized.externalOrderId, '3210987654')
    assert.equal(normalized.externalDisplayId, '#3210987654')
    assert.equal(normalized.marketplaceSiteId, '55667788')
    assert.deepEqual(normalized.grandTotal, { currency_code: 'USD', amount: 260.99 })
    assert.deepEqual(normalized.subtotal, { currency_code: 'USD', amount: 240 })
    // subtotal 240 vs total_price 230 => 10.00 shop coupon
    assert.deepEqual(normalized.promotionTotal, { currency_code: 'USD', amount: 10 })
    assert.deepEqual(normalized.shippingTotal, { currency_code: 'USD', amount: 15 })
    // tax 6.09 + vat 9.90
    assert.deepEqual(normalized.taxTotal, { currency_code: 'USD', amount: 15.99 })
    assert.equal(normalized.status, 'confirmed')
    assert.equal(normalized.paymentStatus, 'paid')
    assert.equal(normalized.orderedAt, '2026-02-25T06:13:20.000Z')

    const [line] = normalized.lines
    assert.deepEqual(line.unitPrice, { currency_code: 'USD', amount: 120 })
    assert.equal(line.externalListingId, '445566')
    assert.equal(line.variantTitle, 'Black / M')
    assert.deepEqual((line.customAttributes as any).variations, { Color: 'Black', Size: 'M' })
    assert.deepEqual((line.customAttributes as any).gift_wrap_price, {
      currency_code: 'USD',
      amount: 5,
    })
  })

  test('flags marketplace-collected tax when Etsy remits it', ({ assert }) => {
    const receipt = { ...ETSY_RECEIPT, is_tax_collected_by_marketplace: true }
    const normalized = normalizeEtsyReceipt(receipt, {})
    assert.equal(normalized.taxCollectionModel, TaxCollectionModel.MARKETPLACE_FACILITATOR)
    assert.deepEqual(normalized.marketplaceWithheldTaxTotal, {
      currency_code: 'USD',
      amount: 15.99,
    })
  })

  test('rejects receipts without transactions', ({ assert }) => {
    assert.throws(
      () => normalizeEtsyReceipt({ ...ETSY_RECEIPT, transactions: [] }),
      /has no transactions/
    )
  })
})

test.group('Order sync normalizers | MedusaJS', () => {
  test('maps items, adjustments and tax lines', ({ assert }) => {
    const normalized = normalizeMedusaOrder(MEDUSA_ORDER, {})

    assert.equal(normalized.externalOrderId, 'order_01HXYZ')
    assert.equal(normalized.externalDisplayId, '1042')
    assert.equal(normalized.orderNumber, 'MEDUSA-1042')
    assert.equal(normalized.currencyCode, 'USD')
    assert.equal(normalized.fulfillmentChannel, FulfillmentChannel.DIRECT)
    assert.equal(normalized.status, 'pending')
    assert.equal(normalized.paymentStatus, 'unpaid')
    assert.deepEqual(normalized.subtotal, { currency_code: 'USD', amount: 300 })
    assert.deepEqual(normalized.discountTotal, { currency_code: 'USD', amount: 25 })
    assert.deepEqual(normalized.taxTotal, { currency_code: 'USD', amount: 26.1 })
    assert.deepEqual(normalized.grandTotal, { currency_code: 'USD', amount: 316.1 })

    const [line] = normalized.lines
    assert.equal(line.externalVariantId, 'var_1')
    assert.equal(line.taxLines?.length, 1)
    assert.equal(line.taxLines?.[0].rate, 8.7)
    assert.equal(line.adjustments?.[0].promotion_id, 'promo_10')
    assert.deepEqual(line.promotionTotal, { currency_code: 'USD', amount: 25 })
    assert.equal(normalized.shippingAddress?.countryCode, 'US')
  })

  test('rejects orders without items', ({ assert }) => {
    assert.throws(() => normalizeMedusaOrder({ order: { id: 'o1', items: [] } }), /has no items/)
  })
})

test.group('Order sync normalizers | detection', () => {
  test('detects each supported payload shape', ({ assert }) => {
    assert.equal(detectPayloadPlatform(AMAZON_ORDER), 'amazon')
    // Bare SP-API responses (no `payload` wrapper) must be detected too.
    assert.equal(detectPayloadPlatform(AMAZON_ORDER.payload), 'amazon')
    assert.equal(detectPayloadPlatform({ Orders: [] }), 'unknown')
    assert.equal(detectPayloadPlatform(EBAY_ORDER), 'ebay')
    assert.equal(detectPayloadPlatform(ETSY_RECEIPT), 'etsy')
    assert.equal(detectPayloadPlatform(MEDUSA_ORDER), 'medusa')
    assert.equal(detectPayloadPlatform(ETSY_RECEIPT), 'etsy')
    assert.equal(
      detectPayloadPlatform({
        orderNumber: 'ORD-1',
        lines: [{ sku: 'A', title: 'A', quantityOrdered: 1, unitPrice: 1 }],
      }),
      'seller_core'
    )
    assert.equal(detectPayloadPlatform({ hello: 'world' }), 'unknown')
  })

  test('normalizeOrderPayload dispatches and rejects unknown shapes', ({ assert }) => {
    const normalized = normalizeOrderPayload(EBAY_ORDER)
    assert.equal(normalized.platform, 'ebay')
    assert.throws(
      () => normalizeOrderPayload({ hello: 'world' }),
      /Unrecognized marketplace order payload/
    )
  })

  test('toCreateOrderInput carries platform totals and enums through', ({ assert }) => {
    const normalized = normalizeAmazonOrder(AMAZON_ORDER, AMAZON_ORDER_ITEMS, {})
    const input = toCreateOrderInput(normalized, { userId: 'usr_1', sellerAccountId: 'acc_1' })

    assert.equal(input.userId, 'usr_1')
    assert.equal(input.sellerAccountId, 'acc_1')
    assert.equal(input.fulfillmentChannel, FulfillmentChannel.AFN)
    assert.equal(input.taxCollectionModel, TaxCollectionModel.MARKETPLACE_FACILITATOR)
    assert.equal(input.taxCollectedByMarketplace, true)
    assert.deepEqual(input.grandTotal, { currency_code: 'USD', amount: 857.83 })
    assert.equal(input.lines.length, 2)
    assert.equal(input.shippingAddress?.city, 'Mumbai')
  })
})

/* -------------------------------------------------------------------------- */
/* Bulk import integration                                                     */
/* -------------------------------------------------------------------------- */

test.group('OrderService.importBulkOrders | payload auto-detection', (group) => {
  let user: User

  group.setup(async () => {
    user = await User.create({
      email: `sync-${generateEntityId()}@example.com`,
      fullName: 'Sync Tester',
      password: 'ValidPassword123!',
      status: 'active',
      isSuperAdmin: false,
      defaultCurrency: 'USD',
      timezone: 'UTC',
      failedLoginAttempts: 0,
    })
  })

  test('imports an Amazon payload with AFN channel and facilitator tax', async ({
    assert,
    cleanup,
  }) => {
    cleanup(async () => {
      await Order.query().where('userId', user.id).delete()
      await SyncJob.query().where('userId', user.id).delete()
    })

    const result = await OrderService.importBulkOrders({
      userId: user.id,
      idempotencyKey: `amazon-${generateEntityId()}`,
      payloads: [{ payload: AMAZON_ORDER, orderItemsPayload: AMAZON_ORDER_ITEMS }],
    })

    assert.lengthOf(result.createdOrderIds, 1)
    assert.lengthOf(result.errors, 0)

    const order = await Order.findOrFail(result.createdOrderIds[0])
    assert.equal(order.externalOrderId, '902-8324761-1234567')
    assert.equal(order.marketplaceSiteId, 'ATVPDKIKX0DER')
    assert.equal(order.fulfillmentChannel, FulfillmentChannel.AFN)
    assert.equal(order.taxCollectionModel, TaxCollectionModel.MARKETPLACE_FACILITATOR)
    assert.equal(order.grandTotal.amount, 857.83)
    assert.equal(order.latestShipAt?.toMillis(), Date.parse('2026-02-14T23:59:59Z'))

    await order.load('lineItems')
    assert.lengthOf(order.lineItems, 2)
    assert.equal(order.lineItems[0].externalListingId, 'B09ASTRYX1')
    assert.equal(order.lineItems[0].taxLines.length, 2)
    assert.equal(order.lineItems[0].fulfillmentChannel, 'AFN')
  })

  test('is idempotent per idempotency key', async ({ assert, cleanup }) => {
    cleanup(async () => {
      await Order.query().where('userId', user.id).delete()
      await SyncJob.query().where('userId', user.id).delete()
    })

    const idempotencyKey = `ebay-${generateEntityId()}`
    const first = await OrderService.importBulkOrders({
      userId: user.id,
      idempotencyKey,
      payloads: [{ payload: EBAY_ORDER }],
    })
    const second = await OrderService.importBulkOrders({
      userId: user.id,
      idempotencyKey,
      payloads: [{ payload: EBAY_ORDER }],
    })

    assert.equal(first.job.id, second.job.id)
    assert.lengthOf(second.createdOrderIds, 1)
    const persisted = await Order.query().where('userId', user.id)
    assert.lengthOf(persisted, 1)
  })

  test('records per-record failures without aborting the batch', async ({ assert, cleanup }) => {
    cleanup(async () => {
      await Order.query().where('userId', user.id).delete()
      await SyncJob.query().where('userId', user.id).delete()
    })

    const result = await OrderService.importBulkOrders({
      userId: user.id,
      idempotencyKey: `mixed-${generateEntityId()}`,
      payloads: [{ payload: { hello: 'world' } }, { payload: MEDUSA_ORDER }],
    })

    assert.lengthOf(result.createdOrderIds, 1)
    assert.lengthOf(result.errors, 1)
    assert.equal(result.errors[0].errorCode, 'UNSUPPORTED_PLATFORM')
    assert.equal(result.job.failedRecords, 1)
    assert.equal(result.job.succeededRecords, 1)
    assert.equal(result.job.status, 'completed_with_errors')

    const medusaOrder = await Order.findOrFail(result.createdOrderIds[0])
    assert.equal(medusaOrder.fulfillmentChannel, FulfillmentChannel.DIRECT)
    assert.equal(medusaOrder.externalDisplayId, '1042')
  })

  test('still imports canonical Seller Core payloads', async ({ assert, cleanup }) => {
    cleanup(async () => {
      await Order.query().where('userId', user.id).delete()
      await SyncJob.query().where('userId', user.id).delete()
    })

    const result = await OrderService.importBulkOrders({
      userId: user.id,
      idempotencyKey: `canonical-${generateEntityId()}`,
      orders: [
        {
          orderNumber: `ORD-CANON-${generateEntityId().slice(-6)}`,
          marketplaceCode: 'etsy',
          customer: { fullName: 'Canonical Buyer', email: 'canonical@example.com' },
          lines: [{ sku: 'CANON-1', title: 'Canonical item', quantityOrdered: 1, unitPrice: 42.5 }],
        },
      ],
    })

    assert.lengthOf(result.createdOrderIds, 1)
    const order = await Order.findOrFail(result.createdOrderIds[0])
    assert.equal(order.fulfillmentChannel, FulfillmentChannel.MFN)
    assert.equal(order.taxCollectionModel, TaxCollectionModel.SELLER)
    assert.equal(order.grandTotal.amount, 42.5)
  })

  test('auto-detects canonical Seller Core JSON inside payloads', async ({ assert, cleanup }) => {
    cleanup(async () => {
      await Order.query().where('userId', user.id).delete()
      await SyncJob.query().where('userId', user.id).delete()
    })

    const result = await OrderService.importBulkOrders({
      userId: user.id,
      idempotencyKey: `canonical-payload-${generateEntityId()}`,
      payloads: [
        {
          payload: {
            orderNumber: `ORD-PAYLOAD-${generateEntityId().slice(-6)}`,
            marketplaceCode: 'etsy',
            currencyCode: 'USD',
            customer: { fullName: 'Payload Buyer', email: 'payload@example.com' },
            lines: [
              {
                sku: 'PAYLOAD-1',
                title: 'Payload item',
                quantityOrdered: 2,
                unitPrice: { currency_code: 'USD', amount: 19.5 },
              },
            ],
          },
        },
      ],
    })

    assert.lengthOf(result.createdOrderIds, 1)
    assert.lengthOf(result.errors, 0)
    const order = await Order.findOrFail(result.createdOrderIds[0])
    assert.equal(order.grandTotal.amount, 39)
  })

  test('requires at least one order or payload', async ({ assert }) => {
    await assert.rejects(
      () => OrderService.importBulkOrders({ userId: user.id, idempotencyKey: generateEntityId() }),
      /Bulk import requires at least one order or payload/
    )
  })
})
