import { OrderImportPayloadSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Order from '#models/order'
import SyncJob from '#models/sync_job'
import SellerAccount from '#models/seller_account'

export default class OrderImportPayload extends OrderImportPayloadSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(payload: OrderImportPayload) {
    if (!payload.id) {
      payload.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => SyncJob, { foreignKey: 'syncJobId' })
  declare syncJob: BelongsTo<typeof SyncJob>

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare sellerAccount: BelongsTo<typeof SellerAccount>
}
