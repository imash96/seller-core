import { SavedViewSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'

export default class SavedView extends SavedViewSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(view: SavedView) {
    if (!view.id) {
      view.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
}
