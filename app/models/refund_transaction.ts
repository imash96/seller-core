import { RefundTransactionSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Order from '#models/order'
import OrderLineItem from '#models/order_line_item'
import ReturnRequest from '#models/return_request'
import FinancialAccount from '#models/financial_account'

export default class RefundTransaction extends RefundTransactionSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(refund: RefundTransaction) {
    if (!refund.id) {
      refund.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => OrderLineItem, { foreignKey: 'orderLineItemId' })
  declare orderLineItem: BelongsTo<typeof OrderLineItem>

  @belongsTo(() => ReturnRequest, { foreignKey: 'returnRequestId' })
  declare returnRequest: BelongsTo<typeof ReturnRequest>

  @belongsTo(() => FinancialAccount, { foreignKey: 'financialAccountId' })
  declare financialAccount: BelongsTo<typeof FinancialAccount>
}
