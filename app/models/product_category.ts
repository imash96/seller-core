/**
 * ProductCategory — maps to "product_categories".
 * Hierarchical catalog categories. taxonomy_path is the display/SEO category handle (e.g. men/outerwear/jacket).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Product from './product.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class ProductCategory extends AppBaseModel {
  static readonly table = 'product_categories'
  static readonly idPrefix = 'pcat'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'parent_category_id' })
  declare public parentCategoryId: string | null

  @column({ columnName: 'name' })
  declare public name: string

  @column({ columnName: 'slug' })
  declare public slug: string

  @column({ columnName: 'taxonomy_path' })
  declare public taxonomyPath: string | null

  @column({ columnName: 'attributes_schema', prepare: prepareJson })
  declare public attributesSchema: any

  @column({ columnName: 'description' })
  declare public description: string | null

  @column({ columnName: 'sort_order' })
  declare public sortOrder: number

  @column({ columnName: 'is_active' })
  declare public isActive: boolean

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => ProductCategory, { foreignKey: 'parentCategoryId' })
  declare public parentCategory: BelongsTo<typeof ProductCategory>

  @hasMany(() => Product, { foreignKey: 'categoryId' })
  declare public products: HasMany<typeof Product>
}
