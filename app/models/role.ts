import { RoleSchema } from '#database/schema'
import { beforeCreate, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import Permission from '#models/permission'
import RolePermission from '#models/role_permission'
import User from '#models/user'

export default class Role extends RoleSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(role: Role) {
    if (!role.id) {
      role.id = uuidv7()
    }
  }

  @hasMany(() => RolePermission, { foreignKey: 'roleId' })
  declare rolePermissions: HasMany<typeof RolePermission>

  @manyToMany(() => Permission, {
    pivotTable: 'role_permissions',
    localKey: 'id',
    pivotForeignKey: 'role_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'permission_id',
    pivotColumns: ['effect', 'created_at'],
  })
  declare permissions: ManyToMany<typeof Permission>

  @manyToMany(() => User, {
    pivotTable: 'user_roles',
    localKey: 'id',
    pivotForeignKey: 'role_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare users: ManyToMany<typeof User>
}
