import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { generateEntityId } from '../utils/generate_entity_id.js'
import {
  normalizeNullablePriceMoney,
  normalizePriceMoney,
  normalizePriceMoneyArray,
} from '../types/price.js'

/**
 * Application base model.
 *
 * Every table uses string ULID primary keys generated application-side with
 * `generateEntityId()` (see app/utils/generate_entity_id.ts). Subclasses set
 * `static readonly idPrefix` (e.g. 'usr') so ids are self-describing in URLs,
 * logs and error messages.
 *
 * Monetary columns are self-contained `PriceMoney` JSONB objects
 * (`{ currency_code, amount }`). Subclasses declare them via `moneyColumns`,
 * `nullableMoneyColumns` and `priceArrayColumns` so `serialize()` always emits
 * canonical money objects — no scalar amounts and no standalone currency codes.
 */
export default class AppBaseModel extends BaseModel {
  /** Entity prefix used when generating the ULID primary key (e.g. 'usr'). */
  static readonly idPrefix: string = ''

  /** Camel-cased PriceMoney columns that are always present (non-nullable). */
  static readonly moneyColumns: readonly string[] = []

  /** Camel-cased PriceMoney columns that may be `null`. */
  static readonly nullableMoneyColumns: readonly string[] = []

  /** Camel-cased MedusaJS v2 multi-currency price array columns. */
  static readonly priceArrayColumns: readonly string[] = []

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

  override serialize(cherryPick?: any): Record<string, any> {
    const raw = super.serialize(cherryPick) as Record<string, any>
    const ctor = this.constructor as typeof AppBaseModel

    for (const key of ctor.moneyColumns) {
      if (key in raw && raw[key] !== null && raw[key] !== undefined) {
        raw[key] = normalizePriceMoney(raw[key])
      }
    }
    for (const key of ctor.nullableMoneyColumns) {
      if (key in raw) raw[key] = normalizeNullablePriceMoney(raw[key])
    }
    for (const key of ctor.priceArrayColumns) {
      if (!(key in raw)) continue
      const value = raw[key]
      raw[key] = Array.isArray(value) && value.length === 0 ? [] : normalizePriceMoneyArray(value)
    }

    return raw
  }
}
