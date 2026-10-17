import { PermissionSchema } from '#database/schema'
import { beforeCreate, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import RolePermission from '#models/role_permission'

export default class Permission extends PermissionSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(permission: Permission) {
    if (!permission.id) {
      permission.id = uuidv7()
    }
  }

  @hasMany(() => RolePermission, { foreignKey: 'permissionId' })
  declare rolePermissions: HasMany<typeof RolePermission>
}
