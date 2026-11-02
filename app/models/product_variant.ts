/**
 * ProductVariant — maps to "product_variants".
 *
 * Sellable SKU entity referenced by order lines, channel listings and
 * inventory. Prices are a MedusaJS v2 multi-currency array; every cost field is
 * a self-contained `PriceMoney` object that may be booked in its own currency.
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
import {
  type MedusaVariantPrice,
  type PriceMoney,
  amountOf,
  multiplyMoney,
} from '../types/price.js'

export default class ProductVariant extends AppBaseModel {
  static readonly table = 'product_variants'
  static readonly idPrefix = 'pvar'

  static override readonly moneyColumns = [
    'costPrice',
    'manufacturingCost',
    'packagingCost',
  ] as const

  static override readonly priceArrayColumns = ['prices'] as const

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

  /** MedusaJS v2 multi-currency price array. */
  @column({ columnName: 'prices', prepare: prepareJson })
  declare public prices: MedusaVariantPrice[]

  @column({ columnName: 'cost_price', prepare: prepareJson })
  declare public costPrice: PriceMoney

  @column({ columnName: 'manufacturing_cost', prepare: prepareJson })
  declare public manufacturingCost: PriceMoney

  @column({ columnName: 'packaging_cost', prepare: prepareJson })
  declare public packagingCost: PriceMoney

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

  /** stock_on_hand × unit cost, in the cost currency. */
  get inventoryValue(): PriceMoney {
    return multiplyMoney(this.costPrice, Number(this.stockOnHand ?? 0))
  }

  /** Total landed unit cost = unit + manufacturing + packaging (USD basis). */
  get landedUnitCostAmount(): number {
    return (
      amountOf(this.costPrice) + amountOf(this.manufacturingCost) + amountOf(this.packagingCost)
    )
  }

  override serialize(cherryPick?: any): Record<string, any> {
    const raw = super.serialize(cherryPick)
    const prices = Array.isArray(raw.prices) ? raw.prices : []
    // `price` is a MedusaJS-compatible alias of the same price array — never a
    // bare number, so no amount can be read without its currency code.
    return {
      ...raw,
      prices,
      price: prices,
      inventoryValue: multiplyMoney(raw.costPrice, Number(this.stockOnHand ?? 0)),
    }
  }
}
