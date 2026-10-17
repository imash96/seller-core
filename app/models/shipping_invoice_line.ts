import { ShippingInvoiceLineSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import ShippingInvoice from '#models/shipping_invoice'
import Shipment from '#models/shipment'

export default class ShippingInvoiceLine extends ShippingInvoiceLineSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(line: ShippingInvoiceLine) {
    if (!line.id) {
      line.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => ShippingInvoice, { foreignKey: 'shippingInvoiceId' })
  declare shippingInvoice: BelongsTo<typeof ShippingInvoice>

  @belongsTo(() => Shipment, { foreignKey: 'shipmentId' })
  declare shipment: BelongsTo<typeof Shipment>
}
