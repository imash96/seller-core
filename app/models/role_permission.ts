import { RolePermissionSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import Role from '#models/role'
import Permission from '#models/permission'

export default class RolePermission extends RolePermissionSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(rp: RolePermission) {
    if (!rp.id) {
      rp.id = uuidv7()
    }
  }

  @belongsTo(() => Role, { foreignKey: 'roleId' })
  declare role: BelongsTo<typeof Role>

  @belongsTo(() => Permission, { foreignKey: 'permissionId' })
  declare permission: BelongsTo<typeof Permission>
}
