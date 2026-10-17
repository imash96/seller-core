import { SyncJobErrorSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import SyncJob from '#models/sync_job'

export default class SyncJobError extends SyncJobErrorSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(err: SyncJobError) {
    if (!err.id) {
      err.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => SyncJob, { foreignKey: 'syncJobId' })
  declare syncJob: BelongsTo<typeof SyncJob>
}
