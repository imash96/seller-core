/**
 * OrderPrice — maps to "order_prices".
 * Stores per-field monetary amounts ({ currency_code, amount }) attached to an Order
 * so every order financial field has its own currency_code and amount.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Order from './order.js'
import AppBaseModel from './base_model.js'
import type { PriceMoney } from '../types/price.js'

export default class OrderPrice extends AppBaseModel {
  static readonly table = 'order_prices'
  static readonly idPrefix = 'oprc'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'order_id' })
  declare public orderId: string

  @column({ columnName: 'field_key' })
  declare public fieldKey: string

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({
    columnName: 'amount',
    consume: (v: unknown) => Number(v ?? 0),
    prepare: (v: unknown) => Number(v ?? 0).toFixed(2),
  })
  declare public amount: number

  @column({ columnName: 'reporting_currency_code' })
  declare public reportingCurrencyCode: string | null

  @column({
    columnName: 'reporting_amount',
    consume: (v: unknown) => (v !== null && v !== undefined ? Number(v) : null),
    prepare: (v: unknown) => (v !== null && v !== undefined ? Number(v).toFixed(2) : null),
  })
  declare public reportingAmount: number | null

  @column({
    columnName: 'exchange_rate',
    consume: (v: unknown) => Number(v ?? 1),
    prepare: (v: unknown) => Number(v ?? 1).toFixed(8),
  })
  declare public exchangeRate: number

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare public order: BelongsTo<typeof Order>

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
      field_key: this.fieldKey,
      currency_code: (this.currencyCode || 'USD').toUpperCase(),
      amount: Number(Number(this.amount ?? 0).toFixed(2)),
    }
  }
}
