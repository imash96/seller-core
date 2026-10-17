import { MarketplaceClaimSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Order from '#models/order'
import SellerAccount from '#models/seller_account'
import Customer from '#models/customer'

export default class MarketplaceClaim extends MarketplaceClaimSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(claim: MarketplaceClaim) {
    if (!claim.id) {
      claim.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare sellerAccount: BelongsTo<typeof SellerAccount>

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof Customer>
}
