/**
 * Customer — maps to "customers".
 * Normalized customer profiles scoped to one owning user. Duplicate profiles may exist pending human review and non-destructive merge.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import CustomerAddress from './customer_address.js'
import CustomerRiskSignal from './customer_risk_signal.js'
import Order from './order.js'
import { generatedColumn, moneyColumn, prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import type { PriceMoney } from '../types/price.js'

export default class Customer extends AppBaseModel {
  static readonly table = 'customers'
  static readonly idPrefix = 'cust'

  /** Money attribute that carries this row's currency (serialized as `currencyCode`). */
  static readonly currencyAttribute = 'totalSpent'

  /** `is_repeat_customer` is GENERATED ALWAYS AS (orders_count > 1) STORED. */
  static override readonly generatedColumns = ['isRepeatCustomer'] as const

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'external_customer_id' })
  declare public externalCustomerId: string | null

  @column({ columnName: 'full_name' })
  declare public fullName: string

  @column({ columnName: 'company_name' })
  declare public companyName: string | null

  @column({ columnName: 'email' })
  declare public email: string | null

  @column({ columnName: 'normalized_email' })
  declare public normalizedEmail: string | null

  @column({ columnName: 'proxy_email' })
  declare public proxyEmail: string | null

  @column({ columnName: 'phone' })
  declare public phone: string | null

  @column({ columnName: 'normalized_phone' })
  declare public normalizedPhone: string | null

  @column({ columnName: 'orders_count' })
  declare public ordersCount: number

  @moneyColumn({ columnName: 'total_spent' })
  declare public totalSpent: PriceMoney

  /** Generated: orders_count > 1 — read-only, never written. */
  @generatedColumn({ columnName: 'is_repeat_customer' })
  declare public readonly isRepeatCustomer: boolean

  @column({ columnName: 'risk_level' })
  declare public riskLevel: string

  @column({ columnName: 'risk_score' })
  declare public riskScore: number

  @column({ columnName: 'merged_into_customer_id' })
  declare public mergedIntoCustomerId: string | null

  @column({ columnName: 'notes' })
  declare public notes: string | null

  @column({ columnName: 'metadata', prepare: prepareJson })
  declare public metadata: any

  @column.dateTime({ columnName: 'first_order_at' })
  declare public firstOrderAt: DateTime | null

  @column.dateTime({ columnName: 'last_order_at' })
  declare public lastOrderAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Customer, { foreignKey: 'mergedIntoCustomerId' })
  declare public mergedInto: BelongsTo<typeof Customer>

  @hasMany(() => CustomerAddress, { foreignKey: 'customerId' })
  declare public addresses: HasMany<typeof CustomerAddress>

  @hasMany(() => CustomerRiskSignal, { foreignKey: 'customerId' })
  declare public riskSignals: HasMany<typeof CustomerRiskSignal>

  @hasMany(() => Order, { foreignKey: 'customerId' })
  declare public orders: HasMany<typeof Order>
}
