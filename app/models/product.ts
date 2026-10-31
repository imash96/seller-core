/**
 * Product — maps to "products".
 * Parent catalog record. Standalone products (has_variants = false) still own exactly one default product_variants SKU so order lines, inventory and listings reference a uniform sellable entity.
 *
 * Includes multi-currency `prices: Array<{ currency_code: string, amount: number }>` via `ProductPrice` (`product_prices`) and `listPrice`.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Brand from './brand.js'
import ProductCategory from './product_category.js'
import ProductVariant from './product_variant.js'
import ProductPrice from './product_price.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import {
  type PriceMoney,
  buildMultiCurrencyPriceArray,
  normalizePriceMoneyArray,
} from '../types/price.js'

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

  @column({ columnName: 'title_75' })
  declare public title75: string | null

  @column({ columnName: 'title_80' })
  declare public title80: string | null

  @column({ columnName: 'sub_title' })
  declare public subTitle: string | null

  @column({ columnName: 'sub_title_125' })
  declare public subTitle125: string | null

  @column({ columnName: 'slug' })
  declare public slug: string

  @column({ columnName: 'sku_prefix' })
  declare public skuPrefix: string | null

  @column({ columnName: 'list_price', prepare: prepareJson })
  declare public listPrice: any

  @column({ columnName: 'sale_price', prepare: prepareJson })
  declare public salePrice: any

  @column({ columnName: 'collection_name' })
  declare public collectionName: string | null

  @column({ columnName: 'description' })
  declare public description: string | null

  @column({ columnName: 'extended_description' })
  declare public extendedDescription: string | null

  @column({ columnName: 'short_description' })
  declare public shortDescription: string | null

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

  @hasMany(() => ProductPrice, { foreignKey: 'productId' })
  declare public priceRecords: HasMany<typeof ProductPrice>

  override serialize(): Record<string, any> {
    const raw = super.serialize()
    const meta = (this.metadata ?? {}) as Record<string, any>
    const firstVariantPrice =
      Array.isArray(this.variants) && this.variants.length > 0
        ? Number(this.variants[0].retailPrice ?? 239.99)
        : 239.99

    let prices: PriceMoney[] = []
    if (Array.isArray(this.priceRecords) && this.priceRecords.length > 0) {
      prices = this.priceRecords.map((pr) => ({
        currency_code: (pr.currencyCode || 'USD').toUpperCase(),
        amount: Number(Number(pr.amount ?? 0).toFixed(2)),
      }))
    } else if (Array.isArray(meta.prices) && meta.prices.length > 0) {
      prices = normalizePriceMoneyArray(meta.prices, firstVariantPrice)
    } else if (
      Array.isArray(this.variants) &&
      this.variants.length > 0 &&
      Array.isArray((this.variants[0].attributes as any)?.prices)
    ) {
      prices = normalizePriceMoneyArray(
        (this.variants[0].attributes as any).prices,
        firstVariantPrice
      )
    } else {
      prices = buildMultiCurrencyPriceArray(firstVariantPrice)
    }

    return {
      ...raw,
      price: prices,
      prices,
    }
  }
}
