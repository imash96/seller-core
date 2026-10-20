/**
 * MarketplaceClaim — maps to "marketplace_claims".
 * Marketplace disputes, A-to-Z guarantee claims and payment chargebacks with evidence and respond-by deadlines.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Customer from './customer.js'
import Order from './order.js'
import SellerAccount from './seller_account.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class MarketplaceClaim extends AppBaseModel {
  static readonly table = 'marketplace_claims'
  static readonly idPrefix = 'mcl'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'order_id' })
  declare public orderId: string

  @column({ columnName: 'seller_account_id' })
  declare public sellerAccountId: string | null

  @column({ columnName: 'customer_id' })
  declare public customerId: string | null

  @column({ columnName: 'claim_number' })
  declare public claimNumber: string

  @column({ columnName: 'external_claim_id' })
  declare public externalClaimId: string | null

  @column({ columnName: 'claim_type' })
  declare public claimType: string

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({ columnName: 'disputed_amount' })
  declare public disputedAmount: string

  @column({ columnName: 'seller_liability_amount' })
  declare public sellerLiabilityAmount: string

  @column({ columnName: 'reason' })
  declare public reason: string | null

  @column({ columnName: 'evidence_submitted', prepare: prepareJson })
  declare public evidenceSubmitted: any

  @column.dateTime({ columnName: 'respond_by_at' })
  declare public respondByAt: DateTime | null

  @column.dateTime({ columnName: 'resolved_at' })
  declare public resolvedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare public order: BelongsTo<typeof Order>

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare public sellerAccount: BelongsTo<typeof SellerAccount>

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare public customer: BelongsTo<typeof Customer>
}
