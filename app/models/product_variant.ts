/**
 * ProductVariant — maps to "product_variants".
 * Sellable SKU entity referenced by order lines, channel listings and inventory. Prices are explicit numeric columns (no float).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import ChannelListing from './channel_listing.js'
import OrderLineItem from './order_line_item.js'
import Product from './product.js'
import ProductVariantAttribute from './product_variant_attribute.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class ProductVariant extends AppBaseModel {
  static readonly table = 'product_variants'
  static readonly idPrefix = 'pvar'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'product_id' })
  declare public productId: string

  @column({ columnName: 'sku' })
  declare public sku: string

  @column({ columnName: 'title' })
  declare public title: string

  @column({ columnName: 'is_default' })
  declare public isDefault: boolean

  @column({ columnName: 'barcode_upc_ean' })
  declare public barcodeUpcEan: string | null

  @column({ columnName: 'mpn' })
  declare public mpn: string | null

  @column({ columnName: 'asin' })
  declare public asin: string | null

  @column({ columnName: 'attributes', prepare: prepareJson })
  declare public attributes: any

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({ columnName: 'retail_price' })
  declare public retailPrice: string

  @column({ columnName: 'compare_at_price' })
  declare public compareAtPrice: string | null

  @column({ columnName: 'cost_price' })
  declare public costPrice: string

  @column({ columnName: 'manufacturing_cost' })
  declare public manufacturingCost: string

  @column({ columnName: 'packaging_cost' })
  declare public packagingCost: string

  @column({ columnName: 'stock_on_hand' })
  declare public stockOnHand: number

  @column({ columnName: 'stock_reserved' })
  declare public stockReserved: number

  @column({ columnName: 'reorder_point' })
  declare public reorderPoint: number

  @column({ columnName: 'weight_grams' })
  declare public weightGrams: string | null

  @column({ columnName: 'dimensions_cm', prepare: prepareJson })
  declare public dimensionsCm: any

  @column({ columnName: 'images', prepare: prepareJson })
  declare public images: any

  @column({ columnName: 'status' })
  declare public status: string

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  /** Generated: stock_on_hand - stock_reserved — read-only stored generated column (never assign). */
  @column({ columnName: 'stock_available' })
  declare public stockAvailable: number

  @belongsTo(() => Product, { foreignKey: 'productId' })
  declare public product: BelongsTo<typeof Product>

  @hasMany(() => ProductVariantAttribute, { foreignKey: 'productVariantId' })
  declare public variantAttributes: HasMany<typeof ProductVariantAttribute>

  @hasMany(() => ChannelListing, { foreignKey: 'productVariantId' })
  declare public listings: HasMany<typeof ChannelListing>

  @hasMany(() => OrderLineItem, { foreignKey: 'productVariantId' })
  declare public orderLineItems: HasMany<typeof OrderLineItem>
}
