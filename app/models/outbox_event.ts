import { OutboxEventSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'

export default class OutboxEvent extends OutboxEventSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(evt: OutboxEvent) {
    if (!evt.id) {
      evt.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
}
