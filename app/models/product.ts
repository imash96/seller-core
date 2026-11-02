/**
 * Product — maps to "products".
 *
 * Parent catalog record. Standalone products (has_variants = false) still own
 * exactly one default product_variants SKU so order lines, inventory and
 * listings reference a uniform sellable entity.
 *
 * Pricing is a MedusaJS v2 multi-currency price array:
 * `[{ currency_code, amount, compare_at_amount?, min_quantity?, max_quantity?, rules? }]`
 * derived from the USD-only catalog price on creation.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Brand from './brand.js'
import ProductCategory from './product_category.js'
import ProductVariant from './product_variant.js'
import { prepareJson, priceArrayColumn } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import type { MedusaVariantPrice } from '../types/price.js'

export default class Product extends AppBaseModel {
  static readonly table = 'products'
  static readonly idPrefix = 'prod'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'brand_id' })
  declare public brandId: string | null

  @column({ columnName: 'category_id' })
  declare public categoryId: string | null

  @column({ columnName: 'title' })
  declare public title: string

  @column({ columnName: 'sub_title' })
  declare public subTitle: string | null

  @column({ columnName: 'slug' })
  declare public slug: string

  @column({ columnName: 'sku_prefix' })
  declare public skuPrefix: string | null

  /** MedusaJS v2 multi-currency price array. */
  @priceArrayColumn({ columnName: 'prices' })
  declare public prices: MedusaVariantPrice[]

  @column({ columnName: 'collection_name' })
  declare public collectionName: string | null

  @column({ columnName: 'description' })
  declare public description: string | null

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'has_variants' })
  declare public hasVariants: boolean

  @column({ columnName: 'variation_dimensions', prepare: prepareJson })
  declare public variationDimensions: any

  @column({ columnName: 'weight_grams' })
  declare public weightGrams: string | null

  @column({ columnName: 'dimensions_cm', prepare: prepareJson })
  declare public dimensionsCm: any

  @column({ columnName: 'images', prepare: prepareJson })
  declare public images: any

  @column({ columnName: 'type' })
  declare public type: string | null

  @column({ columnName: 'tags', prepare: prepareJson })
  declare public tags: any

  @column({ columnName: 'metadata', prepare: prepareJson })
  declare public metadata: any

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Brand, { foreignKey: 'brandId' })
  declare public brand: BelongsTo<typeof Brand>

  @belongsTo(() => ProductCategory, { foreignKey: 'categoryId' })
  declare public category: BelongsTo<typeof ProductCategory>

  @hasMany(() => ProductVariant, { foreignKey: 'productId' })
  declare public variants: HasMany<typeof ProductVariant>

  override serialize(cherryPick?: any): Record<string, any> {
    const raw = super.serialize(cherryPick)
    const prices = Array.isArray(raw.prices) ? raw.prices : []
    return { ...raw, prices, price: prices }
  }
}
