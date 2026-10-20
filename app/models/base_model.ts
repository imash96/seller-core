import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { generateEntityId } from '../utils/generate_entity_id.js'

/**
 * Application base model.
 *
 * Every table uses string ULID primary keys generated application-side with
 * `generateEntityId()` (see app/utils/generate_entity_id.ts). Subclasses set
 * `static readonly idPrefix` (e.g. 'usr') so ids are self-describing in URLs,
 * logs and error messages.
 */
export default class AppBaseModel extends BaseModel {
  /** Entity prefix used when generating the ULID primary key (e.g. 'usr'). */
  static readonly idPrefix: string = ''

  /** ULID primary key (varchar(64), may include an entity prefix). */
  @column({ isPrimary: true, columnName: 'id' })
  declare public id: string

  @beforeCreate()
  static generateId(model: AppBaseModel) {
    if (!model.id) {
      const prefix = (model.constructor as typeof AppBaseModel).idPrefix
      model.id = generateEntityId(prefix || undefined)
    }
  }
}
