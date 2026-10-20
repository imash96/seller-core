/**
 * RolePermission — maps to "role_permissions".
 * Role-permission grants with explicit allow/deny effect. Deny overrides allow across all assigned roles (least-privilege).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Permission from './permission.js'
import Role from './role.js'
import AppBaseModel from './base_model.js'

export default class RolePermission extends AppBaseModel {
  static readonly table = 'role_permissions'
  static readonly idPrefix = 'rperm'

  @column({ columnName: 'role_id' })
  declare public roleId: string

  @column({ columnName: 'permission_id' })
  declare public permissionId: string

  @column({ columnName: 'effect' })
  declare public effect: string

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @belongsTo(() => Role, { foreignKey: 'roleId' })
  declare public role: BelongsTo<typeof Role>

  @belongsTo(() => Permission, { foreignKey: 'permissionId' })
  declare public permission: BelongsTo<typeof Permission>
}
