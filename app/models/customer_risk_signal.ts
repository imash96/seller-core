/**
 * CustomerRiskSignal — maps to "customer_risk_signals".
 * Explainable fraud/risk signals requiring authorized manual review — never automatic customer bans.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Customer from './customer.js'
import Order from './order.js'
import User from './user.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class CustomerRiskSignal extends AppBaseModel {
  static readonly table = 'customer_risk_signals'
  static readonly idPrefix = 'rsig'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'customer_id' })
  declare public customerId: string

  @column({ columnName: 'order_id' })
  declare public orderId: string | null

  @column({ columnName: 'signal_type' })
  declare public signalType: string

  @column({ columnName: 'severity' })
  declare public severity: string

  @column({ columnName: 'review_status' })
  declare public reviewStatus: string

  @column({ columnName: 'reason' })
  declare public reason: string

  @column({ columnName: 'evidence', prepare: prepareJson })
  declare public evidence: any

  @column({ columnName: 'reviewed_by_user_id' })
  declare public reviewedByUserId: string | null

  @column.dateTime({ columnName: 'reviewed_at' })
  declare public reviewedAt: DateTime | null

  @column({ columnName: 'review_notes' })
  declare public reviewNotes: string | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare public customer: BelongsTo<typeof Customer>

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare public order: BelongsTo<typeof Order>

  @belongsTo(() => User, { foreignKey: 'reviewedByUserId' })
  declare public reviewedBy: BelongsTo<typeof User>
}
