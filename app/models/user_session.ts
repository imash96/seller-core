import { UserSessionSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'

export default class UserSession extends UserSessionSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(session: UserSession) {
    if (!session.id) {
      session.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
}
