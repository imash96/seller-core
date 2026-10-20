/**
 * Order — maps to "orders".
 * Order header. Idempotent marketplace imports rely on (seller_account_id, external_order_id). P&L fields follow documented metric definitions (see docs/FINANCE_MODEL.md).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Customer from './customer.js'
import CustomerAddress from './customer_address.js'
import OrderLineItem from './order_line_item.js'
import SellerAccount from './seller_account.js'
import Shipment from './shipment.js'
import SyncJob from './sync_job.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class Order extends AppBaseModel {
  static readonly table = 'orders'
  static readonly idPrefix = 'ord'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'seller_account_id' })
  declare public sellerAccountId: string | null

  @column({ columnName: 'customer_id' })
  declare public customerId: string

  @column({ columnName: 'shipping_address_id' })
  declare public shippingAddressId: string | null

  @column({ columnName: 'billing_address_id' })
  declare public billingAddressId: string | null

  @column({ columnName: 'sync_job_id' })
  declare public syncJobId: string | null

  @column({ columnName: 'order_number' })
  declare public orderNumber: string

  @column({ columnName: 'external_order_id' })
  declare public externalOrderId: string | null

  @column({ columnName: 'source_type' })
  declare public sourceType: string

  @column({ columnName: 'marketplace_code' })
  declare public marketplaceCode: string

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'payment_status' })
  declare public paymentStatus: string

  @column({ columnName: 'fulfillment_status' })
  declare public fulfillmentStatus: string

  @column({ columnName: 'sync_status' })
  declare public syncStatus: string

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({ columnName: 'reporting_currency_code' })
  declare public reportingCurrencyCode: string

  @column({ columnName: 'exchange_rate' })
  declare public exchangeRate: string

  @column({ columnName: 'subtotal_amount' })
  declare public subtotalAmount: string

  @column({ columnName: 'tax_amount' })
  declare public taxAmount: string

  @column({ columnName: 'discount_amount' })
  declare public discountAmount: string

  @column({ columnName: 'shipping_charged_amount' })
  declare public shippingChargedAmount: string

  @column({ columnName: 'total_amount' })
  declare public totalAmount: string

  @column({ columnName: 'marketplace_fees_amount' })
  declare public marketplaceFeesAmount: string

  @column({ columnName: 'payment_processing_fees_amount' })
  declare public paymentProcessingFeesAmount: string

  @column({ columnName: 'shipping_cost_amount' })
  declare public shippingCostAmount: string

  @column({ columnName: 'cogs_amount' })
  declare public cogsAmount: string

  @column({ columnName: 'refunded_amount' })
  declare public refundedAmount: string

  @column({ columnName: 'net_proceeds_amount' })
  declare public netProceedsAmount: string

  @column({ columnName: 'gross_profit_amount' })
  declare public grossProfitAmount: string

  @column({ columnName: 'net_profit_amount' })
  declare public netProfitAmount: string

  @column({ columnName: 'reporting_total_amount' })
  declare public reportingTotalAmount: string

  @column({ columnName: 'shipping_address_snapshot', prepare: prepareJson })
  declare public shippingAddressSnapshot: any | null

  @column({ columnName: 'buyer_notes' })
  declare public buyerNotes: string | null

  @column({ columnName: 'internal_notes' })
  declare public internalNotes: string | null

  @column.dateTime({ columnName: 'ordered_at' })
  declare public orderedAt: DateTime

  @column.dateTime({ columnName: 'confirmed_at' })
  declare public confirmedAt: DateTime | null

  @column.dateTime({ columnName: 'shipped_at' })
  declare public shippedAt: DateTime | null

  @column.dateTime({ columnName: 'delivered_at' })
  declare public deliveredAt: DateTime | null

  @column.dateTime({ columnName: 'cancelled_at' })
  declare public cancelledAt: DateTime | null

  @column.dateTime({ columnName: 'delivery_notification_sent_at' })
  declare public deliveryNotificationSentAt: DateTime | null

  @column.dateTime({ columnName: 'source_created_at' })
  declare public sourceCreatedAt: DateTime | null

  @column.dateTime({ columnName: 'source_updated_at' })
  declare public sourceUpdatedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare public customer: BelongsTo<typeof Customer>

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare public sellerAccount: BelongsTo<typeof SellerAccount>

  @belongsTo(() => CustomerAddress, { foreignKey: 'shippingAddressId' })
  declare public shippingAddress: BelongsTo<typeof CustomerAddress>

  @belongsTo(() => CustomerAddress, { foreignKey: 'billingAddressId' })
  declare public billingAddress: BelongsTo<typeof CustomerAddress>

  @belongsTo(() => SyncJob, { foreignKey: 'syncJobId' })
  declare public syncJob: BelongsTo<typeof SyncJob>

  @hasMany(() => OrderLineItem, { foreignKey: 'orderId' })
  declare public lineItems: HasMany<typeof OrderLineItem>

  @hasMany(() => Shipment, { foreignKey: 'orderId' })
  declare public shipments: HasMany<typeof Shipment>
}
