/**
 * OrderLineItem — maps to "order_line_items".
 * Order lines snapshot SKU/title/prices at sale time. Quantities track fulfillment, return and cancellation invariants.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import ChannelListing from './channel_listing.js'
import Order from './order.js'
import ProductVariant from './product_variant.js'
import ReturnRequest from './return_request.js'
import ShipmentItem from './shipment_item.js'
import AppBaseModel from './base_model.js'

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

  @hasMany(() => ShipmentItem, { foreignKey: 'orderLineItemId' })
  declare public shipmentItems: HasMany<typeof ShipmentItem>

  @hasMany(() => ReturnRequest, { foreignKey: 'orderLineItemId' })
  declare public returnRequests: HasMany<typeof ReturnRequest>
}
