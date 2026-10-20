/**
 * UserRole — maps to "user_roles".
 * Many-to-many user/role assignment. Multiple roles per user; optional expiry for temporary elevation (privilege escalation protection).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Role from './role.js'
import User from './user.js'
import AppBaseModel from './base_model.js'

export default class UserRole extends AppBaseModel {
  static readonly table = 'user_roles'
  static readonly idPrefix = 'urol'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'role_id' })
  declare public roleId: string

  @column({ columnName: 'assigned_by_user_id' })
  declare public assignedByUserId: string | null

  @column.dateTime({ columnName: 'expires_at' })
  declare public expiresAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare public user: BelongsTo<typeof User>

  @belongsTo(() => Role, { foreignKey: 'roleId' })
  declare public role: BelongsTo<typeof Role>
}
