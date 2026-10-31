import db from '@adonisjs/lucid/services/db'
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

let priceTablesEnsured = false

export class PriceService {
  /**
   * Idempotently ensures the 5 multi-currency price tables exist in PostgreSQL
   * even if `node ace migration:run` has not been re-run yet.
   */
  static async ensurePriceTables(): Promise<void> {
    if (priceTablesEnsured) return
    try {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS product_prices (
          id varchar(64) NOT NULL PRIMARY KEY,
          user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id varchar(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          price_type varchar(50) NOT NULL DEFAULT 'retail',
          size_value varchar(32) NULL,
          currency_code varchar(10) NOT NULL DEFAULT 'USD',
          amount numeric(14, 2) NOT NULL DEFAULT 0.00,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_product_prices_product ON product_prices (product_id, currency_code);

        CREATE TABLE IF NOT EXISTS product_variant_prices (
          id varchar(64) NOT NULL PRIMARY KEY,
          user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id varchar(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          product_variant_id varchar(64) NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
          price_type varchar(50) NOT NULL DEFAULT 'retail',
          currency_code varchar(10) NOT NULL DEFAULT 'USD',
          amount numeric(14, 2) NOT NULL DEFAULT 0.00,
          compare_at_amount numeric(14, 2) NULL,
          cost_amount numeric(14, 2) NULL,
          manufacturing_cost_amount numeric(14, 2) NULL,
          packaging_cost_amount numeric(14, 2) NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_variant_prices_var_type_curr ON product_variant_prices (product_variant_id, price_type, currency_code);

        CREATE TABLE IF NOT EXISTS channel_listing_prices (
          id varchar(64) NOT NULL PRIMARY KEY,
          user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          channel_listing_id varchar(64) NOT NULL REFERENCES channel_listings(id) ON DELETE CASCADE,
          product_variant_id varchar(64) NULL REFERENCES product_variants(id) ON DELETE SET NULL,
          price_type varchar(50) NOT NULL DEFAULT 'listed',
          currency_code varchar(10) NOT NULL DEFAULT 'USD',
          amount numeric(14, 2) NOT NULL DEFAULT 0.00,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_listing_prices_lst_type_curr ON channel_listing_prices (channel_listing_id, price_type, currency_code);

        CREATE TABLE IF NOT EXISTS order_prices (
          id varchar(64) NOT NULL PRIMARY KEY,
          user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          order_id varchar(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          field_key varchar(64) NOT NULL,
          currency_code varchar(10) NOT NULL DEFAULT 'USD',
          amount numeric(14, 2) NOT NULL DEFAULT 0.00,
          reporting_currency_code varchar(10) NULL DEFAULT 'USD',
          reporting_amount numeric(14, 2) NULL,
          exchange_rate numeric(18, 8) NOT NULL DEFAULT 1.00000000,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_order_prices_ord_field_curr ON order_prices (order_id, field_key, currency_code);

        CREATE TABLE IF NOT EXISTS order_line_item_prices (
          id varchar(64) NOT NULL PRIMARY KEY,
          user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          order_id varchar(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          order_line_item_id varchar(64) NOT NULL REFERENCES order_line_items(id) ON DELETE CASCADE,
          field_key varchar(64) NOT NULL,
          currency_code varchar(10) NOT NULL DEFAULT 'USD',
          amount numeric(14, 2) NOT NULL DEFAULT 0.00,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_order_line_prices_line_field_curr ON order_line_item_prices (order_line_item_id, field_key, currency_code);
      `)
      priceTablesEnsured = true
    } catch {
      // Ignore if running in read-only or concurrent transaction
    }
  }

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
    await this.ensurePriceTables()
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
    await this.ensurePriceTables()
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
    await this.ensurePriceTables()
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
    await this.ensurePriceTables()
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
    await this.ensurePriceTables()
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
