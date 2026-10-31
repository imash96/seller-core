/**
 * ProductVariantPrice — maps to "product_variant_prices".
 * Multi-currency price entries ({ currency_code, amount }) attached to a ProductVariant (Inventory SKU).
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Product from './product.js'
import ProductVariant from './product_variant.js'
import AppBaseModel from './base_model.js'
import type { PriceMoney } from '../types/price.js'

export default class ProductVariantPrice extends AppBaseModel {
  static readonly table = 'product_variant_prices'
  static readonly idPrefix = 'vpprc'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'product_id' })
  declare public productId: string

  @column({ columnName: 'product_variant_id' })
  declare public productVariantId: string

  @column({ columnName: 'price_type' })
  declare public priceType: string

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({
    columnName: 'amount',
    consume: (v: unknown) => Number(v ?? 0),
    prepare: (v: unknown) => Number(v ?? 0).toFixed(2),
  })
  declare public amount: number

  @column({
    columnName: 'compare_at_amount',
    consume: (v: unknown) => (v !== null && v !== undefined ? Number(v) : null),
    prepare: (v: unknown) => (v !== null && v !== undefined ? Number(v).toFixed(2) : null),
  })
  declare public compareAtAmount: number | null

  @column({
    columnName: 'cost_amount',
    consume: (v: unknown) => (v !== null && v !== undefined ? Number(v) : null),
    prepare: (v: unknown) => (v !== null && v !== undefined ? Number(v).toFixed(2) : null),
  })
  declare public costAmount: number | null

  @column({
    columnName: 'manufacturing_cost_amount',
    consume: (v: unknown) => (v !== null && v !== undefined ? Number(v) : null),
    prepare: (v: unknown) => (v !== null && v !== undefined ? Number(v).toFixed(2) : null),
  })
  declare public manufacturingCostAmount: number | null

  @column({
    columnName: 'packaging_cost_amount',
    consume: (v: unknown) => (v !== null && v !== undefined ? Number(v) : null),
    prepare: (v: unknown) => (v !== null && v !== undefined ? Number(v).toFixed(2) : null),
  })
  declare public packagingCostAmount: number | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Product, { foreignKey: 'productId' })
  declare public product: BelongsTo<typeof Product>

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare public productVariant: BelongsTo<typeof ProductVariant>

  toPriceMoney(): PriceMoney {
    return {
      currency_code: (this.currencyCode || 'USD').toUpperCase(),
      amount: Number(Number(this.amount ?? 0).toFixed(2)),
    }
  }

  override serialize(): Record<string, any> {
    const raw = super.serialize()
    return {
      ...raw,
      currency_code: (this.currencyCode || 'USD').toUpperCase(),
      amount: Number(Number(this.amount ?? 0).toFixed(2)),
      price_type: this.priceType || 'retail',
    }
  }
}
