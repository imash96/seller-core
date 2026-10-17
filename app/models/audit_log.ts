import { AuditLogSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { uuidv7, computeAuditChecksum } from '../utils/uuid.js'
import User from '#models/user'

export default class AuditLog extends AuditLogSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static prepareAuditRecord(log: AuditLog) {
    if (!log.id) {
      log.id = uuidv7()
    }
    const now = log.createdAt ?? DateTime.now()
    log.createdAt = now
    if (!log.checksum) {
      log.checksum = computeAuditChecksum({
        actorUserId: log.actorUserId ?? null,
        userId: log.userId ?? null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId ?? null,
        beforeState: log.beforeState ?? null,
        afterState: log.afterState ?? null,
        timestampIso: now.toUTC().toISO() ?? '',
      })
    }
  }

  @belongsTo(() => User, { foreignKey: 'actorUserId' })
  declare actor: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
}
