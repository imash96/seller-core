/**
 * SyncJobError — maps to "sync_job_errors".
 * Per-record import/sync validation failures; batches continue past bad records (partial-success semantics).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import SyncJob from './sync_job.js'
import User from './user.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class SyncJobError extends AppBaseModel {
  static readonly table = 'sync_job_errors'
  static readonly idPrefix = 'syncerr'

  @column({ columnName: 'sync_job_id' })
  declare public syncJobId: string

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'record_index' })
  declare public recordIndex: number

  @column({ columnName: 'external_record_id' })
  declare public externalRecordId: string | null

  @column({ columnName: 'error_code' })
  declare public errorCode: string

  @column({ columnName: 'error_message' })
  declare public errorMessage: string

  @column({ columnName: 'field_errors', prepare: prepareJson })
  declare public fieldErrors: any

  @column({ columnName: 'raw_excerpt', prepare: prepareJson })
  declare public rawExcerpt: any | null

  @column({ columnName: 'is_resolved' })
  declare public isResolved: boolean

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @belongsTo(() => SyncJob, { foreignKey: 'syncJobId' })
  declare public syncJob: BelongsTo<typeof SyncJob>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare public user: BelongsTo<typeof User>
}
