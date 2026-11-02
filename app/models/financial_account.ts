/**
 * FinancialAccount — maps to "financial_accounts".
 * Bank, cash, marketplace-clearing and payment-gateway accounts. data_classification separates business vs household/personal money.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import CreditCard from './credit_card.js'
import FinancialTransaction from './financial_transaction.js'
import ShippingInvoice from './shipping_invoice.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import type { PriceMoney } from '../types/price.js'

export default class FinancialAccount extends AppBaseModel {
  static readonly table = 'financial_accounts'
  static readonly idPrefix = 'facct'

  static override readonly moneyColumns = ['currentBalance'] as const

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'account_name' })
  declare public accountName: string

  @column({ columnName: 'account_type' })
  declare public accountType: string

  @column({ columnName: 'institution_name' })
  declare public institutionName: string | null

  @column({ columnName: 'account_number_last_4' })
  declare public accountNumberLast4: string | null

  @column({ columnName: 'current_balance', prepare: prepareJson })
  declare public currentBalance: PriceMoney

  @column({ columnName: 'data_classification' })
  declare public dataClassification: string

  @column({ columnName: 'is_active' })
  declare public isActive: boolean

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @hasMany(() => FinancialTransaction, { foreignKey: 'financialAccountId' })
  declare public transactions: HasMany<typeof FinancialTransaction>

  @hasMany(() => CreditCard, { foreignKey: 'financialAccountId' })
  declare public creditCards: HasMany<typeof CreditCard>

  @hasMany(() => ShippingInvoice, { foreignKey: 'financialAccountId' })
  declare public shippingInvoices: HasMany<typeof ShippingInvoice>
}
