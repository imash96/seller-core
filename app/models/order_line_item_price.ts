/**
 * OrderLineItemPrice — maps to "order_line_item_prices".
 * Stores per-field monetary amounts ({ currency_code, amount }) attached to an OrderLineItem.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Order from './order.js'
import OrderLineItem from './order_line_item.js'
import AppBaseModel from './base_model.js'
import type { PriceMoney } from '../types/price.js'

export default class OrderLineItemPrice extends AppBaseModel {
  static readonly table = 'order_line_item_prices'
  static readonly idPrefix = 'oliprc'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'order_id' })
  declare public orderId: string

  @column({ columnName: 'order_line_item_id' })
  declare public orderLineItemId: string

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

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare public order: BelongsTo<typeof Order>

  @belongsTo(() => OrderLineItem, { foreignKey: 'orderLineItemId' })
  declare public orderLineItem: BelongsTo<typeof OrderLineItem>

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
