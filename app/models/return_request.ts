import { ReturnRequestSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Order from '#models/order'
import OrderLineItem from '#models/order_line_item'
import Customer from '#models/customer'
import RefundTransaction from '#models/refund_transaction'

export default class ReturnRequest extends ReturnRequestSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(req: ReturnRequest) {
    if (!req.id) {
      req.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => OrderLineItem, { foreignKey: 'orderLineItemId' })
  declare orderLineItem: BelongsTo<typeof OrderLineItem>

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => Order, { foreignKey: 'replacementOrderId' })
  declare replacementOrder: BelongsTo<typeof Order>

  @belongsTo(() => User, { foreignKey: 'reviewedByUserId' })
  declare reviewedBy: BelongsTo<typeof User>

  @hasMany(() => RefundTransaction, { foreignKey: 'returnRequestId' })
  declare refunds: HasMany<typeof RefundTransaction>
}
