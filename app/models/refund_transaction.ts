/**
 * RefundTransaction — maps to "refund_transactions".
 * Auditable refunds linked to orders/returns/financial accounts. Double-refund protection is enforced in OrderService within a transaction plus CHECKs on amounts.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import FinancialAccount from './financial_account.js'
import Order from './order.js'
import OrderLineItem from './order_line_item.js'
import ReturnRequest from './return_request.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import type { PriceMoney } from '../types/price.js'

export default class RefundTransaction extends AppBaseModel {
  static readonly table = 'refund_transactions'
  static readonly idPrefix = 'ref'

  static override readonly moneyColumns = [
    'itemsRefundTotal',
    'shippingRefundTotal',
    'taxRefundTotal',
    'restockingFeeTotal',
    'grandRefundTotal',
  ] as const

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'order_id' })
  declare public orderId: string

  @column({ columnName: 'order_line_item_id' })
  declare public orderLineItemId: string | null

  @column({ columnName: 'return_request_id' })
  declare public returnRequestId: string | null

  @column({ columnName: 'financial_account_id' })
  declare public financialAccountId: string | null

  @column({ columnName: 'refund_number' })
  declare public refundNumber: string

  @column({ columnName: 'external_refund_id' })
  declare public externalRefundId: string | null

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'items_refund_total', prepare: prepareJson })
  declare public itemsRefundTotal: PriceMoney

  @column({ columnName: 'shipping_refund_total', prepare: prepareJson })
  declare public shippingRefundTotal: PriceMoney

  @column({ columnName: 'tax_refund_total', prepare: prepareJson })
  declare public taxRefundTotal: PriceMoney

  @column({ columnName: 'restocking_fee_total', prepare: prepareJson })
  declare public restockingFeeTotal: PriceMoney

  @column({ columnName: 'grand_refund_total', prepare: prepareJson })
  declare public grandRefundTotal: PriceMoney

  @column({ columnName: 'reason' })
  declare public reason: string | null

  @column.dateTime({ columnName: 'processed_at' })
  declare public processedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare public order: BelongsTo<typeof Order>

  @belongsTo(() => OrderLineItem, { foreignKey: 'orderLineItemId' })
  declare public orderLineItem: BelongsTo<typeof OrderLineItem>

  @belongsTo(() => ReturnRequest, { foreignKey: 'returnRequestId' })
  declare public returnRequest: BelongsTo<typeof ReturnRequest>

  @belongsTo(() => FinancialAccount, { foreignKey: 'financialAccountId' })
  declare public financialAccount: BelongsTo<typeof FinancialAccount>
}
