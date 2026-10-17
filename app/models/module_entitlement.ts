import { ModuleEntitlementSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'

export default class ModuleEntitlement extends ModuleEntitlementSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(entitlement: ModuleEntitlement) {
    if (!entitlement.id) {
      entitlement.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'updatedByUserId' })
  declare updatedBy: BelongsTo<typeof User>
}
