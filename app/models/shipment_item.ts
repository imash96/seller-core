import { ShipmentItemSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Shipment from '#models/shipment'
import OrderLineItem from '#models/order_line_item'

export default class ShipmentItem extends ShipmentItemSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(item: ShipmentItem) {
    if (!item.id) {
      item.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Shipment, { foreignKey: 'shipmentId' })
  declare shipment: BelongsTo<typeof Shipment>

  @belongsTo(() => OrderLineItem, { foreignKey: 'orderLineItemId' })
  declare orderLineItem: BelongsTo<typeof OrderLineItem>
}
