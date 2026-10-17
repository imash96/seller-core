import { UserRoleSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Role from '#models/role'

export default class UserRole extends UserRoleSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(ur: UserRole) {
    if (!ur.id) {
      ur.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Role, { foreignKey: 'roleId' })
  declare role: BelongsTo<typeof Role>

  @belongsTo(() => User, { foreignKey: 'assignedByUserId' })
  declare assignedBy: BelongsTo<typeof User>
}
