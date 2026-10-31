/**
 * OrderLineItem — maps to "order_line_items".
 * Order lines snapshot SKU/title/prices at sale time.
 * Attaches OrderLineItemPrice records and per-field { currency_code, amount } objects.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import ChannelListing from './channel_listing.js'
import Order from './order.js'
import OrderLineItemPrice from './order_line_item_price.js'
import ProductVariant from './product_variant.js'
import ReturnRequest from './return_request.js'
import ShipmentItem from './shipment_item.js'
import AppBaseModel from './base_model.js'
import { type PriceMoney, normalizePriceMoney } from '../types/price.js'

export default class OrderLineItem extends AppBaseModel {
  static readonly table = 'order_line_items'
  static readonly idPrefix = 'oline'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'order_id' })
  declare public orderId: string

  @column({ columnName: 'product_variant_id' })
  declare public productVariantId: string | null

  @column({ columnName: 'channel_listing_id' })
  declare public channelListingId: string | null

  @column({ columnName: 'external_order_line_id' })
  declare public externalOrderLineId: string | null

  @column({ columnName: 'sku' })
  declare public sku: string

  @column({ columnName: 'title' })
  declare public title: string

  @column({ columnName: 'variant_title' })
  declare public variantTitle: string | null

  @column({ columnName: 'asin' })
  declare public asin: string | null

  @column({ columnName: 'quantity_ordered' })
  declare public quantityOrdered: number

  @column({ columnName: 'quantity_fulfilled' })
  declare public quantityFulfilled: number

  @column({ columnName: 'quantity_returned' })
  declare public quantityReturned: number

  @column({ columnName: 'quantity_cancelled' })
  declare public quantityCancelled: number

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({ columnName: 'unit_price' })
  declare public unitPrice: string

  @column({ columnName: 'discount_amount' })
  declare public discountAmount: string

  @column({ columnName: 'tax_amount' })
  declare public taxAmount: string

  @column({ columnName: 'shipping_amount' })
  declare public shippingAmount: string

  @column({ columnName: 'line_total_amount' })
  declare public lineTotalAmount: string

  @column({ columnName: 'unit_cost_amount' })
  declare public unitCostAmount: string

  @column({ columnName: 'marketplace_fee_amount' })
  declare public marketplaceFeeAmount: string

  @column({ columnName: 'refunded_amount' })
  declare public refundedAmount: string

  @column({ columnName: 'fulfillment_status' })
  declare public fulfillmentStatus: string

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare public order: BelongsTo<typeof Order>

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare public productVariant: BelongsTo<typeof ProductVariant>

  @belongsTo(() => ChannelListing, { foreignKey: 'channelListingId' })
  declare public channelListing: BelongsTo<typeof ChannelListing>

  @hasMany(() => OrderLineItemPrice, { foreignKey: 'orderLineItemId' })
  declare public linePrices: HasMany<typeof OrderLineItemPrice>

  @hasMany(() => ShipmentItem, { foreignKey: 'orderLineItemId' })
  declare public shipmentItems: HasMany<typeof ShipmentItem>

  @hasMany(() => ReturnRequest, { foreignKey: 'orderLineItemId' })
  declare public returnRequests: HasMany<typeof ReturnRequest>

  override serialize(): Record<string, any> {
    const raw = super.serialize()
    const baseCur = (this.currencyCode || 'USD').toUpperCase()

    const byField = new Map<string, PriceMoney>()
    if (Array.isArray(this.linePrices)) {
      for (const lp of this.linePrices) {
        byField.set(lp.fieldKey, {
          currency_code: (lp.currencyCode || baseCur).toUpperCase(),
          amount: Number(Number(lp.amount ?? 0).toFixed(2)),
        })
      }
    }

    const resolveField = (fieldKey: string, rawVal: unknown): PriceMoney => {
      return byField.get(fieldKey) ?? normalizePriceMoney(rawVal, baseCur)
    }

    const unitPriceMoney = resolveField('unit_price', this.unitPrice)
    const discountMoney = resolveField('discount_amount', this.discountAmount)
    const taxMoney = resolveField('tax_amount', this.taxAmount)
    const shippingMoney = resolveField('shipping_amount', this.shippingAmount)
    const lineTotalMoney = resolveField('line_total_amount', this.lineTotalAmount)
    const unitCostMoney = resolveField('unit_cost_amount', this.unitCostAmount)
    const marketplaceFeeMoney = resolveField('marketplace_fee_amount', this.marketplaceFeeAmount)
    const refundedMoney = resolveField('refunded_amount', this.refundedAmount)

    return {
      ...raw,
      unitPriceMoney,
      discountMoney,
      taxMoney,
      shippingMoney,
      lineTotalMoney,
      unitCostMoney,
      marketplaceFeeMoney,
      refundedMoney,
    }
  }
}
