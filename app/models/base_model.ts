import { BaseModel, beforeCreate, beforeSave, column } from '@adonisjs/lucid/orm'
import type { CherryPick } from '@adonisjs/lucid/types/model'
import { generateEntityId } from '../utils/generate_entity_id.js'
import { type PriceMoney, currencyOf } from '../types/price.js'

/**
 * Application base model.
 *
 * Every table uses string ULID primary keys generated application-side with
 * `generateEntityId()` (see app/utils/generate_entity_id.ts). Subclasses set
 * `static readonly idPrefix` (e.g. 'usr') so ids are self-describing in URLs,
 * logs and error messages.
 *
 * Monetary columns are declared per column with the `@moneyColumn()`,
 * `@nullableMoneyColumn()` and `@priceArrayColumn()` helpers from
 * `app/models/json_helpers.ts`. Those helpers carry the prepare/consume/serialize
 * hooks, so every model gets typed `PriceMoney` / `MedusaVariantPrice[]` values on
 * read, on write and in serialized output without a parallel list of column names.
 *
 * Columns that PostgreSQL computes (`GENERATED ALWAYS AS … STORED`) are declared
 * with `@generatedColumn()` and listed in `generatedColumns`; they are dropped from
 * INSERT/UPDATE payloads so the database stays their only writer.
 */
export default class AppBaseModel extends BaseModel {
  /** Entity prefix used when generating the ULID primary key (e.g. 'usr'). */
  static readonly idPrefix: string = ''

  /** Attribute names of database-generated columns — never written. */
  static readonly generatedColumns: readonly string[] = []

  /**
   * Money attribute that identifies the row's currency.
   *
   * Money columns are self-contained `{ currency_code, amount }` values, but a UI
   * that renders "1,240.50" next to a column header still needs to know which
   * currency that is. Declaring the attribute here appends a read-only
   * `currencyCode` field to `serialize()` output, derived from the money object —
   * so no consumer has to guess or default to USD, and no standalone
   * `currency_code` column is reintroduced.
   */
  static readonly currencyAttribute: string | null = null

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

  /**
   * Keeps database-computed columns out of INSERT/UPDATE statements.
   *
   * On a new row the attribute is removed entirely; on a persisted row the
   * original value is restored so the column is never considered dirty.
   */
  @beforeSave()
  static discardGeneratedColumnWrites(model: AppBaseModel) {
    const ctor = model.constructor as typeof AppBaseModel
    for (const key of ctor.generatedColumns) {
      if (!(key in model.$attributes)) continue
      if (key in model.$original) {
        model.$setAttribute(key, model.$original[key])
      } else {
        delete model.$attributes[key]
      }
    }
  }

  override serialize(cherryPick?: CherryPick): Record<string, any> {
    const raw = super.serialize(cherryPick)
    const attribute = (this.constructor as typeof AppBaseModel).currencyAttribute
    if (!attribute) return raw
    const value = raw[attribute] as PriceMoney | null | undefined
    const code = value && typeof value === 'object' ? currencyOf(value) : null
    return code ? { ...raw, currencyCode: code } : raw
  }
}
