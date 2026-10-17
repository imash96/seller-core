import { CreditCardSellerAccountSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import CreditCard from '#models/credit_card'
import SellerAccount from '#models/seller_account'

export default class CreditCardSellerAccount extends CreditCardSellerAccountSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(link: CreditCardSellerAccount) {
    if (!link.id) {
      link.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => CreditCard, { foreignKey: 'creditCardId' })
  declare creditCard: BelongsTo<typeof CreditCard>

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare sellerAccount: BelongsTo<typeof SellerAccount>
}
