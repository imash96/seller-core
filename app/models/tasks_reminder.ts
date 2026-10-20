/**
 * TasksReminder — maps to "tasks_reminders".
 * Actionable tasks/reminders: credit-card dues, invoice dues, returns/claims review, restock alerts.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import CreditCard from './credit_card.js'
import AppBaseModel from './base_model.js'

export default class TasksReminder extends AppBaseModel {
  static readonly table = 'tasks_reminders'
  static readonly idPrefix = 'task'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'related_entity_type' })
  declare public relatedEntityType: string | null

  @column({ columnName: 'related_entity_id' })
  declare public relatedEntityId: string | null

  @column({ columnName: 'credit_card_id' })
  declare public creditCardId: string | null

  @column({ columnName: 'title' })
  declare public title: string

  @column({ columnName: 'description' })
  declare public description: string | null

  @column({ columnName: 'task_type' })
  declare public taskType: string

  @column({ columnName: 'priority' })
  declare public priority: string

  @column({ columnName: 'status' })
  declare public status: string

  @column.dateTime({ columnName: 'due_at' })
  declare public dueAt: DateTime

  @column.dateTime({ columnName: 'remind_at' })
  declare public remindAt: DateTime | null

  @column.dateTime({ columnName: 'completed_at' })
  declare public completedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => CreditCard, { foreignKey: 'creditCardId' })
  declare public creditCard: BelongsTo<typeof CreditCard>
}
