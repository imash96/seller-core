/**
 * ShipmentItem — maps to "shipment_items".
 * Junction: one parcel can contain many order lines; one order line can split across many parcels (partial fulfillment).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import OrderLineItem from './order_line_item.js'
import Shipment from './shipment.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class ShipmentItem extends AppBaseModel {
  static readonly table = 'shipment_items'
  static readonly idPrefix = 'sitem'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'shipment_id' })
  declare public shipmentId: string

  @column({ columnName: 'order_line_item_id' })
  declare public orderLineItemId: string

  @column({ columnName: 'quantity_shipped' })
  declare public quantityShipped: number

  @column({ columnName: 'serial_numbers', prepare: prepareJson })
  declare public serialNumbers: any

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Shipment, { foreignKey: 'shipmentId' })
  declare public shipment: BelongsTo<typeof Shipment>

  @belongsTo(() => OrderLineItem, { foreignKey: 'orderLineItemId' })
  declare public orderLineItem: BelongsTo<typeof OrderLineItem>
}
