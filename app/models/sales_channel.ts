import { SalesChannelSchema } from '#database/schema'
import { beforeCreate, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import SellerAccount from '#models/seller_account'

export default class SalesChannel extends SalesChannelSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(channel: SalesChannel) {
    if (!channel.id) {
      channel.id = uuidv7()
    }
  }

  @hasMany(() => SellerAccount, { foreignKey: 'salesChannelId' })
  declare sellerAccounts: HasMany<typeof SellerAccount>
}
