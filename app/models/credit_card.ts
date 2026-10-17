import { CreditCardSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import FinancialAccount from '#models/financial_account'
import SellerAccount from '#models/seller_account'
import CreditCardSellerAccount from '#models/credit_card_seller_account'
import FinancialTransaction from '#models/financial_transaction'

export default class CreditCard extends CreditCardSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(card: CreditCard) {
    if (!card.id) {
      card.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => FinancialAccount, { foreignKey: 'financialAccountId' })
  declare financialAccount: BelongsTo<typeof FinancialAccount>

  @hasMany(() => CreditCardSellerAccount, { foreignKey: 'creditCardId' })
  declare sellerAccountLinks: HasMany<typeof CreditCardSellerAccount>

  @manyToMany(() => SellerAccount, {
    pivotTable: 'credit_card_seller_accounts',
    localKey: 'id',
    pivotForeignKey: 'credit_card_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'seller_account_id',
    pivotColumns: ['usage_purpose', 'is_primary'],
  })
  declare sellerAccounts: ManyToMany<typeof SellerAccount>

  @hasMany(() => FinancialTransaction, { foreignKey: 'creditCardId' })
  declare transactions: HasMany<typeof FinancialTransaction>
}
