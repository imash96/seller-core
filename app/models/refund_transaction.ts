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
import AppBaseModel from './base_model.js'

export default class RefundTransaction extends AppBaseModel {
  static readonly table = 'refund_transactions'
  static readonly idPrefix = 'ref'

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

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({ columnName: 'items_refund_amount' })
  declare public itemsRefundAmount: string

  @column({ columnName: 'shipping_refund_amount' })
  declare public shippingRefundAmount: string

  @column({ columnName: 'tax_refund_amount' })
  declare public taxRefundAmount: string

  @column({ columnName: 'restocking_fee_deducted' })
  declare public restockingFeeDeducted: string

  @column({ columnName: 'total_refund_amount' })
  declare public totalRefundAmount: string

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
