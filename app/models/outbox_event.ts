/**
 * OutboxEvent — maps to "outbox_events".
 * Transactional outbox: events inserted in the same transaction as the aggregate change, then published with retries and dead-lettering.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import User from './user.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class OutboxEvent extends AppBaseModel {
  static readonly table = 'outbox_events'
  static readonly idPrefix = 'obx'

  @column({ columnName: 'user_id' })
  declare public userId: string | null

  @column({ columnName: 'aggregate_type' })
  declare public aggregateType: string

  @column({ columnName: 'aggregate_id' })
  declare public aggregateId: string

  @column({ columnName: 'event_type' })
  declare public eventType: string

  @column({ columnName: 'idempotency_key' })
  declare public idempotencyKey: string

  @column({ columnName: 'correlation_id' })
  declare public correlationId: string | null

  @column({ columnName: 'payload', prepare: prepareJson })
  declare public payload: any

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'retry_count' })
  declare public retryCount: number

  @column({ columnName: 'max_retries' })
  declare public maxRetries: number

  @column.dateTime({ columnName: 'next_retry_at' })
  declare public nextRetryAt: DateTime | null

  @column({ columnName: 'last_error' })
  declare public lastError: string | null

  @column.dateTime({ columnName: 'processed_at' })
  declare public processedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare public user: BelongsTo<typeof User>
}
