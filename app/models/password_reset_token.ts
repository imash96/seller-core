import { PasswordResetTokenSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'

export default class PasswordResetToken extends PasswordResetTokenSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(token: PasswordResetToken) {
    if (!token.id) {
      token.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
}
