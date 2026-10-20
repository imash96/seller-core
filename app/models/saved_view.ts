/**
 * SavedView — maps to "saved_views".
 * User-defined saved filters, table layouts and dashboard preferences per module.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import User from './user.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class SavedView extends AppBaseModel {
  static readonly table = 'saved_views'
  static readonly idPrefix = 'sview'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'module_key' })
  declare public moduleKey: string

  @column({ columnName: 'name' })
  declare public name: string

  @column({ columnName: 'filters', prepare: prepareJson })
  declare public filters: any

  @column({ columnName: 'sort_config', prepare: prepareJson })
  declare public sortConfig: any

  @column({ columnName: 'columns_config', prepare: prepareJson })
  declare public columnsConfig: any

  @column({ columnName: 'is_default' })
  declare public isDefault: boolean

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare public user: BelongsTo<typeof User>
}
