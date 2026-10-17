import { OrderLineItemSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Order from '#models/order'
import ProductVariant from '#models/product_variant'
import ChannelListing from '#models/channel_listing'
import ShipmentItem from '#models/shipment_item'
import Shipment from '#models/shipment'
import ReturnRequest from '#models/return_request'

export default class OrderLineItem extends OrderLineItemSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(item: OrderLineItem) {
    if (!item.id) {
      item.id = uuidv7()
    }
  }

  /**
   * Remaining returnable quantity invariant:
   * quantityOrdered - quantityCancelled - quantityReturned
   */
  get remainingReturnableQuantity(): number {
    return Math.max(
      0,
      (this.quantityOrdered || 0) - (this.quantityCancelled || 0) - (this.quantityReturned || 0)
    )
  }

  /**
   * Remaining fulfillable quantity invariant:
   * quantityOrdered - quantityCancelled - quantityFulfilled
   */
  get remainingFulfillableQuantity(): number {
    return Math.max(
      0,
      (this.quantityOrdered || 0) - (this.quantityCancelled || 0) - (this.quantityFulfilled || 0)
    )
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare productVariant: BelongsTo<typeof ProductVariant>

  @belongsTo(() => ChannelListing, { foreignKey: 'channelListingId' })
  declare channelListing: BelongsTo<typeof ChannelListing>

  @hasMany(() => ShipmentItem, { foreignKey: 'orderLineItemId' })
  declare shipmentItems: HasMany<typeof ShipmentItem>

  @manyToMany(() => Shipment, {
    pivotTable: 'shipment_items',
    localKey: 'id',
    pivotForeignKey: 'order_line_item_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'shipment_id',
    pivotColumns: ['quantity_shipped', 'serial_numbers'],
  })
  declare shipments: ManyToMany<typeof Shipment>

  @hasMany(() => ReturnRequest, { foreignKey: 'orderLineItemId' })
  declare returnRequests: HasMany<typeof ReturnRequest>
}
