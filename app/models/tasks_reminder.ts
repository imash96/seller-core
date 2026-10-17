import { TasksReminderSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import CreditCard from '#models/credit_card'

export default class TasksReminder extends TasksReminderSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(task: TasksReminder) {
    if (!task.id) {
      task.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => CreditCard, { foreignKey: 'creditCardId' })
  declare creditCard: BelongsTo<typeof CreditCard>
}
