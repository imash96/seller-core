import { OrderSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import SellerAccount from '#models/seller_account'
import Customer from '#models/customer'
import CustomerAddress from '#models/customer_address'
import SyncJob from '#models/sync_job'
import OrderLineItem from '#models/order_line_item'
import OrderImportPayload from '#models/order_import_payload'
import Shipment from '#models/shipment'
import ReturnRequest from '#models/return_request'
import RefundTransaction from '#models/refund_transaction'
import MarketplaceClaim from '#models/marketplace_claim'
import FinancialTransaction from '#models/financial_transaction'

export default class Order extends OrderSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(order: Order) {
    if (!order.id) {
      order.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare sellerAccount: BelongsTo<typeof SellerAccount>

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => CustomerAddress, { foreignKey: 'shippingAddressId' })
  declare shippingAddress: BelongsTo<typeof CustomerAddress>

  @belongsTo(() => CustomerAddress, { foreignKey: 'billingAddressId' })
  declare billingAddress: BelongsTo<typeof CustomerAddress>

  @belongsTo(() => SyncJob, { foreignKey: 'syncJobId' })
  declare syncJob: BelongsTo<typeof SyncJob>

  @hasMany(() => OrderLineItem, { foreignKey: 'orderId' })
  declare lineItems: HasMany<typeof OrderLineItem>

  @hasMany(() => OrderImportPayload, { foreignKey: 'orderId' })
  declare importPayloads: HasMany<typeof OrderImportPayload>

  @hasMany(() => Shipment, { foreignKey: 'orderId' })
  declare shipments: HasMany<typeof Shipment>

  @hasMany(() => ReturnRequest, { foreignKey: 'orderId' })
  declare returnRequests: HasMany<typeof ReturnRequest>

  @hasMany(() => RefundTransaction, { foreignKey: 'orderId' })
  declare refundTransactions: HasMany<typeof RefundTransaction>

  @hasMany(() => MarketplaceClaim, { foreignKey: 'orderId' })
  declare claims: HasMany<typeof MarketplaceClaim>

  @hasMany(() => FinancialTransaction, { foreignKey: 'orderId' })
  declare financialTransactions: HasMany<typeof FinancialTransaction>
}
