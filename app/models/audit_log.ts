/**
 * AuditLog — maps to "audit_logs".
 * Append-only tamper-evident audit trail. UPDATE/DELETE blocked by trigger; SHA-256 checksum over actor/action/entity/states/timestamp.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import User from './user.js'
import { prepareJson } from './json_helpers.js'
import { computeAuditChecksum } from '../utils/identity.js'
import AppBaseModel from './base_model.js'

// Historical audit rows may contain snapshots made before database-level redaction.
function redactAuditState(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAuditState)
  if (!value || typeof value !== 'object') return value
  const sensitive = new Set([
    'password',
    'encryptedcredentials',
    'sessiontokenhash',
    'vaulttokenreference',
    'rawpayload',
    'accesstoken',
    'refreshtoken',
    'clientsecret',
    'apikey',
    'apisecret',
    'cardnumber',
    'cvv',
    'cvc',
    'authorization',
  ])
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitive.has(key.toLowerCase().replace(/[^a-z0-9]/g, ''))
        ? '[REDACTED]'
        : redactAuditState(item),
    ])
  )
}

export default class AuditLog extends AppBaseModel {
  static readonly table = 'audit_logs'
  static readonly idPrefix = 'aud'

  @column({ columnName: 'actor_user_id' })
  declare public actorUserId: string | null

  @column({ columnName: 'user_id' })
  declare public userId: string | null

  @column({ columnName: 'action' })
  declare public action: string

  @column({ columnName: 'entity_type' })
  declare public entityType: string

  @column({ columnName: 'entity_id' })
  declare public entityId: string | null

  @column({ columnName: 'request_id' })
  declare public requestId: string | null

  @column({ columnName: 'correlation_id' })
  declare public correlationId: string | null

  @column({ columnName: 'ip_address' })
  declare public ipAddress: string | null

  @column({ columnName: 'user_agent' })
  declare public userAgent: string | null

  @column({ columnName: 'before_state', prepare: prepareJson })
  declare public beforeState: any | null

  @column({ columnName: 'after_state', prepare: prepareJson })
  declare public afterState: any | null

  @column({ columnName: 'metadata', prepare: prepareJson })
  declare public metadata: any

  @column({ columnName: 'checksum' })
  declare public checksum: string

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'actorUserId' })
  declare public actor: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare public user: BelongsTo<typeof User>

  override serialize(cherryPick?: any): Record<string, any> {
    const raw = super.serialize(cherryPick)
    for (const key of ['beforeState', 'afterState', 'metadata']) {
      if (key in raw) raw[key] = redactAuditState(raw[key])
    }
    return raw
  }

  // Audit snapshots can contain information from domains the viewer cannot read.
  // Non-admin views receive an activity summary, never raw cross-domain payloads.
  serializeForViewer(isSuperAdmin: boolean): Record<string, any> {
    const raw = this.serialize()
    if (!isSuperAdmin) {
      delete raw.beforeState
      delete raw.afterState
      delete raw.metadata
    }
    return raw
  }

  /**
   * Computes the tamper-evident SHA-256 checksum over actor/action/entity/
   * states/timestamp. UPDATE and DELETE are additionally blocked by a database
   * trigger (audit_logs is append-only).
   */
  @beforeCreate()
  static computeChecksum(audit: AuditLog) {
    audit.checksum = computeAuditChecksum({
      actorUserId: audit.actorUserId ?? null,
      userId: audit.userId ?? null,
      action: audit.action,
      entityType: audit.entityType,
      entityId: audit.entityId ?? null,
      beforeState: audit.beforeState ?? null,
      afterState: audit.afterState ?? null,
      timestampIso: new Date().toISOString(),
    })
  }
}
