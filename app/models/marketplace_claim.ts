/**
 * MarketplaceClaim — maps to "marketplace_claims".
 * Marketplace disputes, A-to-Z guarantee claims and payment chargebacks with evidence and respond-by deadlines.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type Customer from './customer.js'
import type SellerAccount from './seller_account.js'
import type { DateTime } from 'luxon'
import Order from './order.js'
import { moneyColumn, prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import type { PriceMoney } from '../types/price.js'

export default class MarketplaceClaim extends AppBaseModel {
  static readonly table = 'marketplace_claims'
  static readonly idPrefix = 'mcl'

  /** Money attribute that carries this row's currency (serialized as `currencyCode`). */
  static readonly currencyAttribute = 'disputedAmount'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'order_id' })
  declare public orderId: string

  @column({ columnName: 'claim_number' })
  declare public claimNumber: string

  @column({ columnName: 'external_claim_id' })
  declare public externalClaimId: string | null

  @column({ columnName: 'claim_type' })
  declare public claimType: string

  @column({ columnName: 'status' })
  declare public status: string

  @moneyColumn({ columnName: 'disputed_total' })
  declare public disputedTotal: PriceMoney

  @moneyColumn({ columnName: 'seller_liability_total' })
  declare public sellerLiabilityTotal: PriceMoney

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

  /** Marketplace account and customer are derived from the order. */
  get sellerAccountId(): string | null {
    return this.order?.sellerAccountId ?? null
  }

  get customerId(): string | null {
    return this.order?.customerId ?? null
  }

  get customer(): Customer | undefined {
    return this.order?.customer ?? undefined
  }

  get sellerAccount(): SellerAccount | undefined {
    return this.order?.sellerAccount ?? undefined
  }
}
