/**
 * ProductPrice — maps to "product_prices".
 * Multi-currency price entries ({ currency_code, amount }) attached to a Product.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Product from './product.js'
import AppBaseModel from './base_model.js'
import type { PriceMoney } from '../types/price.js'

export default class ProductPrice extends AppBaseModel {
  static readonly table = 'product_prices'
  static readonly idPrefix = 'pprc'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'product_id' })
  declare public productId: string

  @column({ columnName: 'price_type' })
  declare public priceType: string

  @column({ columnName: 'size_value' })
  declare public sizeValue: string | null

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({
    columnName: 'amount',
    consume: (v: unknown) => Number(v ?? 0),
    prepare: (v: unknown) => Number(v ?? 0).toFixed(2),
  })
  declare public amount: number

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Product, { foreignKey: 'productId' })
  declare public product: BelongsTo<typeof Product>

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
      size_value: this.sizeValue ?? null,
    }
  }
}
