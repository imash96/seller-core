/**
 * ModuleEntitlement — maps to "module_entitlements".
 * Feature-module entitlements, managed independently from RBAC role permissions.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import User from './user.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class ModuleEntitlement extends AppBaseModel {
  static readonly table = 'module_entitlements'
  static readonly idPrefix = 'ment'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'module_key' })
  declare public moduleKey: string

  @column({ columnName: 'is_enabled' })
  declare public isEnabled: boolean

  @column({ columnName: 'plan_tier' })
  declare public planTier: string

  @column({ columnName: 'limits', prepare: prepareJson })
  declare public limits: any

  @column.dateTime({ columnName: 'expires_at' })
  declare public expiresAt: DateTime | null

  @column({ columnName: 'updated_by_user_id' })
  declare public updatedByUserId: string | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare public user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'updatedByUserId' })
  declare public updatedBy: BelongsTo<typeof User>
}
