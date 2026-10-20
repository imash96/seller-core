/**
 * ReturnRequest — maps to "return_requests".
 * RMA lifecycle per order line (requested -> authorized -> in_transit -> received -> inspected -> refunded/replacement_sent -> closed). Quantities validated against remaining returnable units.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Customer from './customer.js'
import Order from './order.js'
import OrderLineItem from './order_line_item.js'
import RefundTransaction from './refund_transaction.js'
import User from './user.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class ReturnRequest extends AppBaseModel {
  static readonly table = 'return_requests'
  static readonly idPrefix = 'rma'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'order_id' })
  declare public orderId: string

  @column({ columnName: 'order_line_item_id' })
  declare public orderLineItemId: string

  @column({ columnName: 'customer_id' })
  declare public customerId: string

  @column({ columnName: 'rma_number' })
  declare public rmaNumber: string

  @column({ columnName: 'external_return_id' })
  declare public externalReturnId: string | null

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'return_reason' })
  declare public returnReason: string

  @column({ columnName: 'resolution_type' })
  declare public resolutionType: string

  @column({ columnName: 'quantity_requested' })
  declare public quantityRequested: number

  @column({ columnName: 'quantity_approved' })
  declare public quantityApproved: number

  @column({ columnName: 'quantity_received' })
  declare public quantityReceived: number

  @column({ columnName: 'item_condition' })
  declare public itemCondition: string | null

  @column({ columnName: 'restock_inventory' })
  declare public restockInventory: boolean

  @column({ columnName: 'return_carrier' })
  declare public returnCarrier: string | null

  @column({ columnName: 'return_tracking_number' })
  declare public returnTrackingNumber: string | null

  @column({ columnName: 'return_label_url' })
  declare public returnLabelUrl: string | null

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({ columnName: 'return_shipping_cost' })
  declare public returnShippingCost: string

  @column({ columnName: 'restocking_fee_amount' })
  declare public restockingFeeAmount: string

  @column({ columnName: 'refund_amount' })
  declare public refundAmount: string

  @column({ columnName: 'replacement_order_id' })
  declare public replacementOrderId: string | null

  @column({ columnName: 'customer_comments' })
  declare public customerComments: string | null

  @column({ columnName: 'internal_notes' })
  declare public internalNotes: string | null

  @column({ columnName: 'evidence_images', prepare: prepareJson })
  declare public evidenceImages: any

  @column({ columnName: 'approval_history', prepare: prepareJson })
  declare public approvalHistory: any

  @column({ columnName: 'reviewed_by_user_id' })
  declare public reviewedByUserId: string | null

  @column.dateTime({ columnName: 'requested_at' })
  declare public requestedAt: DateTime

  @column.dateTime({ columnName: 'authorized_at' })
  declare public authorizedAt: DateTime | null

  @column.dateTime({ columnName: 'received_at' })
  declare public receivedAt: DateTime | null

  @column.dateTime({ columnName: 'closed_at' })
  declare public closedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare public order: BelongsTo<typeof Order>

  @belongsTo(() => OrderLineItem, { foreignKey: 'orderLineItemId' })
  declare public orderLineItem: BelongsTo<typeof OrderLineItem>

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare public customer: BelongsTo<typeof Customer>

  @belongsTo(() => Order, { foreignKey: 'replacementOrderId' })
  declare public replacementOrder: BelongsTo<typeof Order>

  @belongsTo(() => User, { foreignKey: 'reviewedByUserId' })
  declare public reviewedBy: BelongsTo<typeof User>

  @hasMany(() => RefundTransaction, { foreignKey: 'returnRequestId' })
  declare public refunds: HasMany<typeof RefundTransaction>
}
