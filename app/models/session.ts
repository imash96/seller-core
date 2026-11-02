/**
 * Session — maps to "sessions".
 *
 * The single session store of the platform: the row `@adonisjs/session`'s database
 * driver writes (id + encrypted payload + expiry) is also the registry that supports
 * immediate revocation on logout, password change, suspension or lockout, and the
 * table `CleanupExpiredSessions` prunes.
 *
 * `user_id` is maintained by `session.tag()` (see `SessionRegistryService`), so
 * active-session auditing can list every live session of a user without a second
 * `user_sessions` table.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'
import AppBaseModel from './base_model.js'

export default class Session extends AppBaseModel {
  static readonly table = 'sessions'
  static readonly idPrefix = 'sess'

  @column({ columnName: 'data' })
  declare public data: string

  @column({ columnName: 'user_id' })
  declare public userId: string | null

  @column.dateTime({ columnName: 'expires_at' })
  declare public expiresAt: DateTime

  @column({ columnName: 'ip_address' })
  declare public ipAddress: string | null

  @column({ columnName: 'user_agent' })
  declare public userAgent: string | null

  @column({ columnName: 'is_revoked' })
  declare public isRevoked: boolean

  @column.dateTime({ columnName: 'revoked_at' })
  declare public revokedAt: DateTime | null

  @column.dateTime({ columnName: 'last_active_at' })
  declare public lastActiveAt: DateTime

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare public user: BelongsTo<typeof User>

  /** True while the session may still be used (not revoked and not expired). */
  isActive(now: DateTime = DateTime.now()): boolean {
    return !this.isRevoked && this.expiresAt.toMillis() > now.toMillis()
  }
}
