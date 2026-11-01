import type Order from '#models/order'
import type OrderLineItem from '#models/order_line_item'
import ProductPrice from '#models/product_price'
import ProductVariantPrice from '#models/product_variant_price'
import ChannelListingPrice from '#models/channel_listing_price'
import OrderPrice from '#models/order_price'
import OrderLineItemPrice from '#models/order_line_item_price'
import {
  type PriceMoney,
  normalizePriceMoneyArray,
  DEFAULT_CURRENCY_RATES,
} from '../types/price.js'

export class PriceService {
  /**
   * Upserts `ProductPrice` rows for a `Product` from a multi-currency `prices` array.
   */
  static async syncProductPrices(params: {
    userId: string
    productId: string
    prices: PriceMoney[]
    priceType?: string
    trx?: any
  }): Promise<ProductPrice[]> {
    const { userId, productId, prices, priceType = 'retail', trx } = params
    const normalized = normalizePriceMoneyArray(prices, 239.99)

    const delQ = ProductPrice.query().where('productId', productId).andWhere('priceType', priceType)
    if (trx) delQ.useTransaction(trx)
    await delQ.delete()

    const saved: ProductPrice[] = []
    for (const p of normalized) {
      const row = new ProductPrice()
      if (trx) row.useTransaction(trx)
      row.userId = userId
      row.productId = productId
      row.priceType = priceType
      row.sizeValue = null
      row.currencyCode = p.currency_code.toUpperCase()
      row.amount = p.amount
      await row.save()
      saved.push(row)
    }
    return saved
  }

  /**
   * Upserts `ProductVariantPrice` rows for a `ProductVariant` from a multi-currency `prices` array
   * plus cost/manufacturing/packaging amounts.
   */
  static async syncVariantPrices(params: {
    userId: string
    productId: string
    productVariantId: string
    prices: PriceMoney[]
    baseCostUsd?: number
    manufacturingCostUsd?: number
    packagingCostUsd?: number
    trx?: any
  }): Promise<ProductVariantPrice[]> {
    const {
      userId,
      productId,
      productVariantId,
      prices,
      baseCostUsd = 0,
      manufacturingCostUsd = 0,
      packagingCostUsd = 0,
      trx,
    } = params

    const normalized = normalizePriceMoneyArray(prices, 239.99)

    const delQ = ProductVariantPrice.query().where('productVariantId', productVariantId)
    if (trx) delQ.useTransaction(trx)
    await delQ.delete()

    const saved: ProductVariantPrice[] = []
    for (const p of normalized) {
      const code = p.currency_code.toUpperCase()
      const rate = DEFAULT_CURRENCY_RATES[code] ?? 1.0
      const row = new ProductVariantPrice()
      if (trx) row.useTransaction(trx)
      row.userId = userId
      row.productId = productId
      row.productVariantId = productVariantId
      row.priceType = 'retail'
      row.currencyCode = code
      row.amount = p.amount
      row.compareAtAmount = Number((p.amount * 1.18).toFixed(2))
      row.costAmount = Number((baseCostUsd * rate).toFixed(2))
      row.manufacturingCostAmount = Number((manufacturingCostUsd * rate).toFixed(2))
      row.packagingCostAmount = Number((packagingCostUsd * rate).toFixed(2))
      await row.save()
      saved.push(row)
    }
    return saved
  }

  /**
   * Upserts `ChannelListingPrice` rows for a `ChannelListing`.
   */
  static async syncChannelListingPrices(params: {
    userId: string
    channelListingId: string
    productVariantId?: string | null
    prices: PriceMoney[]
    priceType?: string
    trx?: any
  }): Promise<ChannelListingPrice[]> {
    const {
      userId,
      channelListingId,
      productVariantId = null,
      prices,
      priceType = 'listed',
      trx,
    } = params

    const normalized = normalizePriceMoneyArray(prices, 239.99)

    const delQ = ChannelListingPrice.query()
      .where('channelListingId', channelListingId)
      .andWhere('priceType', priceType)
    if (trx) delQ.useTransaction(trx)
    await delQ.delete()

    const saved: ChannelListingPrice[] = []
    for (const p of normalized) {
      const row = new ChannelListingPrice()
      if (trx) row.useTransaction(trx)
      row.userId = userId
      row.channelListingId = channelListingId
      row.productVariantId = productVariantId
      row.priceType = priceType
      row.currencyCode = p.currency_code.toUpperCase()
      row.amount = p.amount
      await row.save()
      saved.push(row)
    }
    return saved
  }

  /**
   * Upserts `OrderPrice` rows for every monetary field on an `Order`.
   * Each field can have its own `currency_code` (or defaults to `order.currencyCode` / `order.reportingCurrencyCode`).
   */
  static async syncOrderPrices(params: {
    order: Order
    fieldCurrencyOverrides?: Record<string, string>
    trx?: any
  }): Promise<OrderPrice[]> {
    const { order, fieldCurrencyOverrides = {}, trx } = params
    const baseCur = (order.currencyCode || 'USD').toUpperCase()
    const repCur = (order.reportingCurrencyCode || 'USD').toUpperCase()
    const rate = Number(order.exchangeRate || 1) || 1

    const fieldMap: Array<{ key: string; val: unknown; defaultCur: string }> = [
      { key: 'subtotal_amount', val: order.subtotalAmount, defaultCur: baseCur },
      { key: 'tax_amount', val: order.taxAmount, defaultCur: baseCur },
      { key: 'discount_amount', val: order.discountAmount, defaultCur: baseCur },
      { key: 'shipping_charged_amount', val: order.shippingChargedAmount, defaultCur: baseCur },
      { key: 'total_amount', val: order.totalAmount, defaultCur: baseCur },
      { key: 'marketplace_fees_amount', val: order.marketplaceFeesAmount, defaultCur: baseCur },
      {
        key: 'payment_processing_fees_amount',
        val: order.paymentProcessingFeesAmount,
        defaultCur: baseCur,
      },
      { key: 'shipping_cost_amount', val: order.shippingCostAmount, defaultCur: baseCur },
      { key: 'cogs_amount', val: order.cogsAmount, defaultCur: baseCur },
      { key: 'refunded_amount', val: order.refundedAmount, defaultCur: baseCur },
      { key: 'net_proceeds_amount', val: order.netProceedsAmount, defaultCur: baseCur },
      { key: 'gross_profit_amount', val: order.grossProfitAmount, defaultCur: baseCur },
      { key: 'net_profit_amount', val: order.netProfitAmount, defaultCur: baseCur },
      { key: 'reporting_total_amount', val: order.reportingTotalAmount, defaultCur: repCur },
    ]

    const delQ = OrderPrice.query().where('orderId', order.id)
    if (trx) delQ.useTransaction(trx)
    await delQ.delete()

    const saved: OrderPrice[] = []
    for (const f of fieldMap) {
      const curr = (fieldCurrencyOverrides[f.key] || f.defaultCur || 'USD').toUpperCase()
      const amt = Number(f.val ?? 0) || 0
      const row = new OrderPrice()
      if (trx) row.useTransaction(trx)
      row.userId = order.userId
      row.orderId = order.id
      row.fieldKey = f.key
      row.currencyCode = curr
      row.amount = amt
      row.reportingCurrencyCode = repCur
      row.reportingAmount = Number((amt * rate).toFixed(2))
      row.exchangeRate = rate
      await row.save()
      saved.push(row)
    }
    return saved
  }

  /**
   * Upserts `OrderLineItemPrice` rows for every monetary field on an `OrderLineItem`.
   */
  static async syncOrderLineItemPrices(params: {
    lineItem: OrderLineItem
    fieldCurrencyOverrides?: Record<string, string>
    trx?: any
  }): Promise<OrderLineItemPrice[]> {
    const { lineItem, fieldCurrencyOverrides = {}, trx } = params
    const baseCur = (lineItem.currencyCode || 'USD').toUpperCase()

    const fieldMap: Array<{ key: string; val: unknown }> = [
      { key: 'unit_price', val: lineItem.unitPrice },
      { key: 'discount_amount', val: lineItem.discountAmount },
      { key: 'tax_amount', val: lineItem.taxAmount },
      { key: 'shipping_amount', val: lineItem.shippingAmount },
      { key: 'line_total_amount', val: lineItem.lineTotalAmount },
      { key: 'unit_cost_amount', val: lineItem.unitCostAmount },
      { key: 'marketplace_fee_amount', val: lineItem.marketplaceFeeAmount },
      { key: 'refunded_amount', val: lineItem.refundedAmount },
    ]

    const delQ = OrderLineItemPrice.query().where('orderLineItemId', lineItem.id)
    if (trx) delQ.useTransaction(trx)
    await delQ.delete()

    const saved: OrderLineItemPrice[] = []
    for (const f of fieldMap) {
      const curr = (fieldCurrencyOverrides[f.key] || baseCur).toUpperCase()
      const amt = Number(f.val ?? 0) || 0
      const row = new OrderLineItemPrice()
      if (trx) row.useTransaction(trx)
      row.userId = lineItem.userId
      row.orderId = lineItem.orderId
      row.orderLineItemId = lineItem.id
      row.fieldKey = f.key
      row.currencyCode = curr
      row.amount = amt
      await row.save()
      saved.push(row)
    }
    return saved
  }
}
