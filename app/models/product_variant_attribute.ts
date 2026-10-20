/**
 * ProductVariantAttribute — maps to "product_variant_attributes".
 * Normalized variation attributes (color/size/material/...) enabling relational filtering and indexing.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import ProductVariant from './product_variant.js'
import AppBaseModel from './base_model.js'

export default class ProductVariantAttribute extends AppBaseModel {
  static readonly table = 'product_variant_attributes'
  static readonly idPrefix = 'pattr'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'product_variant_id' })
  declare public productVariantId: string

  @column({ columnName: 'attribute_name' })
  declare public attributeName: string

  @column({ columnName: 'attribute_value' })
  declare public attributeValue: string

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare public productVariant: BelongsTo<typeof ProductVariant>
}
