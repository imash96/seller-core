/**
 * Permission — maps to "permissions".
 * Granular resource.action permission catalog (e.g. orders.read, orders.create, orders.export).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { column, hasManyThrough } from '@adonisjs/lucid/orm'
import type { HasManyThrough } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Role from './role.js'
import RolePermission from './role_permission.js'
import AppBaseModel from './base_model.js'

export default class Permission extends AppBaseModel {
  static readonly table = 'permissions'
  static readonly idPrefix = 'perm'

  @column({ columnName: 'name' })
  declare public name: string

  @column({ columnName: 'slug' })
  declare public slug: string

  @column({ columnName: 'resource' })
  declare public resource: string

  @column({ columnName: 'action' })
  declare public action: string

  @column({ columnName: 'description' })
  declare public description: string | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @hasManyThrough([() => Role, () => RolePermission], {
    throughLocalKey: 'roleId',
    throughForeignKey: 'id',
    localKey: 'id',
    foreignKey: 'permissionId',
  })
  declare public roles: HasManyThrough<typeof Role>
}
