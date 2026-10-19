/**
 * Role — maps to "roles".
 * RBAC role definitions. Users may hold multiple roles simultaneously.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { column, hasMany, hasManyThrough } from '@adonisjs/lucid/orm'
import type { HasMany, HasManyThrough } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Permission from './permission.js'
import RolePermission from './role_permission.js'
import UserRole from './user_role.js'
import AppBaseModel from './base_model.js'

export default class Role extends AppBaseModel {
  static readonly table = 'roles'
  static readonly idPrefix = 'rol'

  @column({ columnName: 'slug' })
  declare public slug: string

  @column({ columnName: 'name' })
  declare public name: string

  @column({ columnName: 'description' })
  declare public description: string | null

  @column({ columnName: 'is_system' })
  declare public isSystem: boolean

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @hasManyThrough([() => Permission, () => RolePermission], {
    throughLocalKey: 'permissionId',
    throughForeignKey: 'id',
    localKey: 'id',
    foreignKey: 'roleId',
  })
  declare public permissions: HasManyThrough<typeof Permission>

  @hasMany(() => UserRole, { foreignKey: 'roleId' })
  declare public userRoles: HasMany<typeof UserRole>

  @hasMany(() => RolePermission, { foreignKey: 'roleId' })
  declare public rolePermissions: HasMany<typeof RolePermission>
}
