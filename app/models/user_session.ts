/**
 * UserSession — maps to "user_sessions".
 * Session registry supporting immediate revocation on logout, password change, suspension, or lockout.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import User from './user.js'
import AppBaseModel from './base_model.js'

export default class UserSession extends AppBaseModel {
  static readonly table = 'user_sessions'
  static readonly idPrefix = 'uses'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'session_token_hash' })
  declare public sessionTokenHash: string

  @column({ columnName: 'ip_address' })
  declare public ipAddress: string | null

  @column({ columnName: 'user_agent' })
  declare public userAgent: string | null

  @column({ columnName: 'is_revoked' })
  declare public isRevoked: boolean

  @column.dateTime({ columnName: 'revoked_at' })
  declare public revokedAt: DateTime | null

  @column.dateTime({ columnName: 'expires_at' })
  declare public expiresAt: DateTime

  @column.dateTime({ columnName: 'last_active_at' })
  declare public lastActiveAt: DateTime

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare public user: BelongsTo<typeof User>
}
