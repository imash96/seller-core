/**
 * PasswordResetToken — maps to "password_reset_tokens".
 * Hashed single-use account recovery tokens.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import User from './user.js'
import AppBaseModel from './base_model.js'

export default class PasswordResetToken extends AppBaseModel {
  static readonly table = 'password_reset_tokens'
  static readonly idPrefix = 'pwrt'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'token_hash' })
  declare public tokenHash: string

  @column({ columnName: 'requested_ip' })
  declare public requestedIp: string | null

  @column.dateTime({ columnName: 'expires_at' })
  declare public expiresAt: DateTime

  @column.dateTime({ columnName: 'used_at' })
  declare public usedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare public user: BelongsTo<typeof User>
}
