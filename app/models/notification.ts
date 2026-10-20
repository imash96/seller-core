/**
 * Notification — maps to "notifications".
 * In-app/email/SMS notification records (delivery messages, due reminders, review requests).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import User from './user.js'
import AppBaseModel from './base_model.js'

export default class Notification extends AppBaseModel {
  static readonly table = 'notifications'
  static readonly idPrefix = 'ntf'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'type' })
  declare public type: string

  @column({ columnName: 'title' })
  declare public title: string

  @column({ columnName: 'body' })
  declare public body: string | null

  @column({ columnName: 'entity_type' })
  declare public entityType: string | null

  @column({ columnName: 'entity_id' })
  declare public entityId: string | null

  @column({ columnName: 'channel' })
  declare public channel: string

  @column({ columnName: 'recipient_address' })
  declare public recipientAddress: string | null

  @column({ columnName: 'is_read' })
  declare public isRead: boolean

  @column.dateTime({ columnName: 'sent_at' })
  declare public sentAt: DateTime | null

  @column.dateTime({ columnName: 'read_at' })
  declare public readAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare public user: BelongsTo<typeof User>
}
