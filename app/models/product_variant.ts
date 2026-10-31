/**
 * ProductVariant — maps to "product_variants".
 * Sellable SKU entity referenced by order lines, channel listings and inventory.
 * Exposes multi-currency `prices: Array<{ currency_code: string, amount: number }>`
 * and `{ currency_code, amount }` objects for every price/cost field.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import ChannelListing from './channel_listing.js'
import OrderLineItem from './order_line_item.js'
import Product from './product.js'
import ProductVariantAttribute from './product_variant_attribute.js'
import ProductVariantPrice from './product_variant_price.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import {
  type PriceMoney,
  buildMultiCurrencyPriceArray,
  normalizePriceMoney,
  normalizePriceMoneyArray,
} from '../types/price.js'

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

  @hasMany(() => ProductVariantPrice, { foreignKey: 'productVariantId' })
  declare public priceRecords: HasMany<typeof ProductVariantPrice>

  @hasMany(() => ChannelListing, { foreignKey: 'productVariantId' })
  declare public listings: HasMany<typeof ChannelListing>

  @hasMany(() => OrderLineItem, { foreignKey: 'productVariantId' })
  declare public orderLineItems: HasMany<typeof OrderLineItem>

  override serialize(): Record<string, any> {
    const raw = super.serialize()
    const baseCur = (this.currencyCode || 'USD').toUpperCase()
    const retailNum = Number(this.retailPrice ?? 0)
    const attrs = (this.attributes ?? {}) as Record<string, any>

    let prices: PriceMoney[] = []
    if (Array.isArray(this.priceRecords) && this.priceRecords.length > 0) {
      prices = this.priceRecords.map((pr) => ({
        currency_code: (pr.currencyCode || baseCur).toUpperCase(),
        amount: Number(Number(pr.amount ?? 0).toFixed(2)),
      }))
    } else if (Array.isArray(attrs.prices) && attrs.prices.length > 0) {
      prices = normalizePriceMoneyArray(attrs.prices, retailNum, baseCur)
    } else {
      prices = buildMultiCurrencyPriceArray(retailNum || 239.99)
    }

    const costNum = Number(this.costPrice ?? 0)
    const mfgNum = Number(this.manufacturingCost ?? 0)
    const pkgNum = Number(this.packagingCost ?? 0)
    const compareNum =
      this.compareAtPrice !== null
        ? Number(this.compareAtPrice)
        : Number((retailNum * 1.18).toFixed(2))
    const stockValNum = Number((costNum * Number(this.stockOnHand ?? 0)).toFixed(2))

    return {
      ...raw,
      price: prices,
      prices,
      retailPriceMoney: normalizePriceMoney(retailNum, baseCur),
      compareAtPriceMoney: normalizePriceMoney(compareNum, baseCur),
      costPriceMoney: normalizePriceMoney(costNum, baseCur),
      manufacturingCostMoney: normalizePriceMoney(mfgNum, baseCur),
      packagingCostMoney: normalizePriceMoney(pkgNum, baseCur),
      inventoryValueMoney: normalizePriceMoney(stockValNum, baseCur),
    }
  }
}
