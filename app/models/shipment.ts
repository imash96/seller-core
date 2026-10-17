import { ShipmentSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Order from '#models/order'
import ShipmentItem from '#models/shipment_item'
import OrderLineItem from '#models/order_line_item'
import ShippingInvoiceLine from '#models/shipping_invoice_line'

export default class Shipment extends ShipmentSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(shipment: Shipment) {
    if (!shipment.id) {
      shipment.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare order: BelongsTo<typeof Order>

  @hasMany(() => ShipmentItem, { foreignKey: 'shipmentId' })
  declare shipmentItems: HasMany<typeof ShipmentItem>

  @manyToMany(() => OrderLineItem, {
    pivotTable: 'shipment_items',
    localKey: 'id',
    pivotForeignKey: 'shipment_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'order_line_item_id',
    pivotColumns: ['quantity_shipped', 'serial_numbers'],
  })
  declare orderLineItems: ManyToMany<typeof OrderLineItem>

  @hasMany(() => ShippingInvoiceLine, { foreignKey: 'shipmentId' })
  declare invoiceLines: HasMany<typeof ShippingInvoiceLine>
}
