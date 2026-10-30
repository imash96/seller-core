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

  @column({ columnName: 'title_75' })
  declare public title75: string | null

  @column({ columnName: 'title_80' })
  declare public title80: string | null

  @column({ columnName: 'sub_title' })
  declare public subTitle: string | null

  @column({ columnName: 'sub_title_125' })
  declare public subTitle125: string | null

  @column({ columnName: 'type' })
  declare public type: string | null

  @column({ columnName: 'gender' })
  declare public gender: string

  @column({ columnName: 'category_code' })
  declare public categoryCode: string

  @column({ columnName: 'category_name' })
  declare public categoryName: string

  @column({ columnName: 'product_code' })
  declare public productCode: string

  @column({ columnName: 'category_handle' })
  declare public categoryHandle: string | null

  @column({ columnName: 'resolved_category_id' })
  declare public resolvedCategoryId: string | null

  @column({ columnName: 'description' })
  declare public description: string | null

  @column({ columnName: 'short_description' })
  declare public shortDescription: string | null

  @column({ columnName: 'extended_description' })
  declare public extendedDescription: string | null

  @column({ columnName: 'pattern' })
  declare public pattern: string | null

  @column({ columnName: 'material_code' })
  declare public materialCode: string

  @column({ columnName: 'fit_code' })
  declare public fitCode: string

  @column({ columnName: 'price_tier' })
  declare public priceTier: string

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
}
