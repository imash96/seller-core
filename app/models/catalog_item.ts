/**
 * CatalogItem — maps to "catalog_items".
 * Stores brand-agnostic catalog SKU definitions in PostgreSQL with full CRUD,
 * multi-facet filtering (gender, category, type, status), and conversion tracking to Product.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Product from './product.js'
import ProductCategory from './product_category.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import { type PriceMoney, money, normalizePriceMoneyArray } from '../types/price.js'

export default class CatalogItem extends AppBaseModel {
  static readonly table = 'catalog_items'
  static readonly idPrefix = 'cat'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'catalog_key' })
  declare public catalogKey: string

  @column({ columnName: 'structured_code' })
  declare public structuredCode: string | null

  @column({ columnName: 'file_name' })
  declare public fileName: string | null

  @column({ columnName: 'title' })
  declare public title: string

  @column({ columnName: 'sub_title' })
  declare public subTitle: string | null

  @column({ columnName: 'type' })
  declare public type: string | null

  @column({ columnName: 'gender' })
  declare public gender: string

  @column({ columnName: 'resolved_category_id' })
  declare public resolvedCategoryId: string | null

  @column({ columnName: 'description' })
  declare public description: string | null

  @column({ columnName: 'pattern' })
  declare public pattern: string | null

  @column({ columnName: 'price_tier' })
  declare public priceTier: string

  /** USD-only base price resolved from `priceTier` (no currency_code column). */
  @column({ columnName: 'base_price_usd' })
  declare public basePriceUsd: string

  @column({ columnName: 'attributes', prepare: prepareJson })
  declare public attributes: any

  @column({ columnName: 'images', prepare: prepareJson })
  declare public images: any

  @column({ columnName: 'tags', prepare: prepareJson })
  declare public tags: any

  @column({ columnName: 'variants_spec', prepare: prepareJson })
  declare public variantsSpec: any

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'converted_product_id' })
  declare public convertedProductId: string | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => ProductCategory, { foreignKey: 'resolvedCategoryId' })
  declare public resolvedCategory: BelongsTo<typeof ProductCategory>

  @belongsTo(() => Product, { foreignKey: 'convertedProductId' })
  declare public convertedProduct: BelongsTo<typeof Product>

  /**
   * `catalog_items` is USD-only by design: the source catalog carries a single USD
   * base price (`base_price_usd` + `price_tier`) and the multi-currency MedusaJS
   * price array is derived when the item becomes a product. This getter exposes the
   * amount as a self-contained PriceMoney so consumers never read a bare number.
   */
  get basePrice(): PriceMoney {
    return money(this.basePriceUsd, 'USD')
  }

  override serialize(cherryPick?: any): Record<string, any> {
    const raw = super.serialize(cherryPick)
    return { ...raw, basePrice: this.basePrice, prices: normalizePriceMoneyArray([this.basePrice]) }
  }
}
