/**
 * CustomerAddress — maps to "customer_addresses".
 * Multiple shipping/billing addresses per customer. address_fingerprint detects shared addresses (a reviewable risk signal, never an automatic ban).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Customer from './customer.js'
import AppBaseModel from './base_model.js'

export default class CustomerAddress extends AppBaseModel {
  static readonly table = 'customer_addresses'
  static readonly idPrefix = 'addr'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'customer_id' })
  declare public customerId: string

  @column({ columnName: 'address_type' })
  declare public addressType: string

  @column({ columnName: 'label' })
  declare public label: string | null

  @column({ columnName: 'recipient_name' })
  declare public recipientName: string

  @column({ columnName: 'company_name' })
  declare public companyName: string | null

  @column({ columnName: 'phone' })
  declare public phone: string | null

  @column({ columnName: 'line_1' })
  declare public line1: string

  @column({ columnName: 'line_2' })
  declare public line2: string | null

  @column({ columnName: 'line_3' })
  declare public line3: string | null

  @column({ columnName: 'city' })
  declare public city: string

  @column({ columnName: 'state_province' })
  declare public stateProvince: string | null

  @column({ columnName: 'postal_code' })
  declare public postalCode: string

  @column({ columnName: 'country_code' })
  declare public countryCode: string

  @column({ columnName: 'address_fingerprint' })
  declare public addressFingerprint: string | null

  @column({ columnName: 'is_default' })
  declare public isDefault: boolean

  @column({ columnName: 'is_verified' })
  declare public isVerified: boolean

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare public customer: BelongsTo<typeof Customer>
}
