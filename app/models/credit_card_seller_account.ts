/**
 * CreditCardSellerAccount — maps to "credit_card_seller_accounts".
 * Links cards to seller accounts / sales channels with an explicit usage purpose (multiple cards per user and per channel).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import CreditCard from './credit_card.js'
import SellerAccount from './seller_account.js'
import AppBaseModel from './base_model.js'

export default class CreditCardSellerAccount extends AppBaseModel {
  static readonly table = 'credit_card_seller_accounts'
  static readonly idPrefix = 'ccsa'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'credit_card_id' })
  declare public creditCardId: string

  @column({ columnName: 'seller_account_id' })
  declare public sellerAccountId: string

  @column({ columnName: 'usage_purpose' })
  declare public usagePurpose: string

  @column({ columnName: 'is_primary' })
  declare public isPrimary: boolean

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @belongsTo(() => CreditCard, { foreignKey: 'creditCardId' })
  declare public creditCard: BelongsTo<typeof CreditCard>

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare public sellerAccount: BelongsTo<typeof SellerAccount>
}
