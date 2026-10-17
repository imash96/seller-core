import { SellerAccountSchema } from '#database/schema'
import encryption from '@adonisjs/core/services/encryption'
import { beforeCreate, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import SalesChannel from '#models/sales_channel'
import SyncJob from '#models/sync_job'
import ChannelListing from '#models/channel_listing'
import Order from '#models/order'
import CreditCard from '#models/credit_card'

export default class SellerAccount extends SellerAccountSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(account: SellerAccount) {
    if (!account.id) {
      account.id = uuidv7()
    }
  }

  /**
   * Encrypts sensitive marketplace credentials using AES-256-GCM before persisting
   */
  setPlainCredentials(credentialsPayload: Record<string, unknown>) {
    this.encryptedCredentials = encryption.encrypt(credentialsPayload)
  }

  /**
   * Decrypts stored marketplace credentials when authorized
   */
  getDecryptedCredentials<T = Record<string, unknown>>(): T | null {
    if (!this.encryptedCredentials) return null
    return encryption.decrypt<T>(this.encryptedCredentials)
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => SalesChannel, { foreignKey: 'salesChannelId' })
  declare salesChannel: BelongsTo<typeof SalesChannel>

  @hasMany(() => SyncJob, { foreignKey: 'sellerAccountId' })
  declare syncJobs: HasMany<typeof SyncJob>

  @hasMany(() => ChannelListing, { foreignKey: 'sellerAccountId' })
  declare listings: HasMany<typeof ChannelListing>

  @hasMany(() => Order, { foreignKey: 'sellerAccountId' })
  declare orders: HasMany<typeof Order>

  @manyToMany(() => CreditCard, {
    pivotTable: 'credit_card_seller_accounts',
    localKey: 'id',
    pivotForeignKey: 'seller_account_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'credit_card_id',
    pivotColumns: ['usage_purpose', 'is_primary'],
  })
  declare creditCards: ManyToMany<typeof CreditCard>
}
