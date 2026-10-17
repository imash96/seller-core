import { SyncJobSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import SellerAccount from '#models/seller_account'
import SyncJobError from '#models/sync_job_error'

export default class SyncJob extends SyncJobSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(job: SyncJob) {
    if (!job.id) {
      job.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare sellerAccount: BelongsTo<typeof SellerAccount>

  @hasMany(() => SyncJobError, { foreignKey: 'syncJobId' })
  declare errors: HasMany<typeof SyncJobError>
}
