/**
 * SyncJob — maps to "sync_jobs".
 * Import/export batch + marketplace synchronization runs with idempotency keys, progress counters and partial-failure reporting.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Order from './order.js'
import SellerAccount from './seller_account.js'
import SyncJobError from './sync_job_error.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class SyncJob extends AppBaseModel {
  static readonly table = 'sync_jobs'
  static readonly idPrefix = 'sync'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'seller_account_id' })
  declare public sellerAccountId: string | null

  @column({ columnName: 'job_type' })
  declare public jobType: string

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'idempotency_key' })
  declare public idempotencyKey: string

  @column({ columnName: 'correlation_id' })
  declare public correlationId: string | null

  @column({ columnName: 'total_records' })
  declare public totalRecords: number

  @column({ columnName: 'processed_records' })
  declare public processedRecords: number

  @column({ columnName: 'succeeded_records' })
  declare public succeededRecords: number

  @column({ columnName: 'failed_records' })
  declare public failedRecords: number

  @column({ columnName: 'skipped_duplicates' })
  declare public skippedDuplicates: number

  @column({ columnName: 'checkpoint_cursor' })
  declare public checkpointCursor: string | null

  @column({ columnName: 'error_summary', prepare: prepareJson })
  declare public errorSummary: any

  @column.dateTime({ columnName: 'started_at' })
  declare public startedAt: DateTime | null

  @column.dateTime({ columnName: 'completed_at' })
  declare public completedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare public sellerAccount: BelongsTo<typeof SellerAccount>

  @hasMany(() => SyncJobError, { foreignKey: 'syncJobId' })
  declare public errors: HasMany<typeof SyncJobError>

  @hasMany(() => Order, { foreignKey: 'syncJobId' })
  declare public orders: HasMany<typeof Order>
}
