/**
 * CreditCard — maps to "credit_cards".
 * Tokenized credit-card metadata only. Full PAN and CVV are strictly prohibited; vault_token_reference points at a PCI-compliant vault.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import CreditCardSellerAccount from './credit_card_seller_account.js'
import FinancialAccount from './financial_account.js'
import AppBaseModel from './base_model.js'

export default class CreditCard extends AppBaseModel {
  static readonly table = 'credit_cards'
  static readonly idPrefix = 'ccard'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'financial_account_id' })
  declare public financialAccountId: string | null

  @column({ columnName: 'card_label' })
  declare public cardLabel: string

  @column({ columnName: 'brand_name' })
  declare public brandName: string

  @column({ columnName: 'issuer_bank' })
  declare public issuerBank: string | null

  @column({ columnName: 'cardholder_name' })
  declare public cardholderName: string

  @column({ columnName: 'last_4_digits' })
  declare public last4Digits: string

  @column({ columnName: 'exp_month' })
  declare public expMonth: number

  @column({ columnName: 'exp_year' })
  declare public expYear: number

  @column({ columnName: 'vault_token_reference' })
  declare public vaultTokenReference: string | null

  @column({ columnName: 'logo_url' })
  declare public logoUrl: string | null

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({ columnName: 'credit_limit' })
  declare public creditLimit: string

  @column({ columnName: 'current_balance' })
  declare public currentBalance: string

  @column({ columnName: 'statement_balance' })
  declare public statementBalance: string

  @column({ columnName: 'minimum_payment_due' })
  declare public minimumPaymentDue: string

  @column({ columnName: 'billing_cycle_day' })
  declare public billingCycleDay: number | null

  @column({ columnName: 'payment_due_day' })
  declare public paymentDueDay: number | null

  @column.date({ columnName: 'next_payment_due_date' })
  declare public nextPaymentDueDate: DateTime | null

  @column({ columnName: 'reminder_days_before' })
  declare public reminderDaysBefore: number

  @column({ columnName: 'auto_pay_enabled' })
  declare public autoPayEnabled: boolean

  @column({ columnName: 'data_classification' })
  declare public dataClassification: string

  @column({ columnName: 'status' })
  declare public status: string

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => FinancialAccount, { foreignKey: 'financialAccountId' })
  declare public financialAccount: BelongsTo<typeof FinancialAccount>

  @hasMany(() => CreditCardSellerAccount, { foreignKey: 'creditCardId' })
  declare public sellerAccountLinks: HasMany<typeof CreditCardSellerAccount>
}
