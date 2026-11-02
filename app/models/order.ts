/**
 * Order — maps to "orders".
 *
 * Order header for a multi-channel seller. Every monetary column is a
 * self-contained `PriceMoney` JSONB object with its own `currency_code`, so one
 * order can carry USD revenue, INR carrier cost and INR COGS side by side.
 *
 * Marketplace compatibility (Amazon SP-API, eBay Fulfillment API, Etsy Open API
 * v3, MedusaJS v2):
 *  - item taxes (`tax_total`) and shipping taxes (`shipping_tax_total`) are separate
 *  - `marketplace_withheld_tax_total` holds marketplace-facilitator tax withheld
 *  - discounts (`discount_total`) are distinct from promotions (`promotion_total`)
 *  - `fulfillment_channel` records MFN / AFN / FBA / FBM / 3PL / direct fulfilment
 *  - `tax_collection_model` records who is the deemed seller for sales tax
 *  - `earliest_ship_at` / `latest_ship_at` / `earliest_delivery_at` /
 *    `latest_delivery_at` hold the promised ship and delivery windows
 *  - `channel_metadata` keeps platform flags (isPrime, etsyIsGift, medusaRegionId…)
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
import {
  FulfillmentChannel,
  type FulfillmentChannelValue,
  TaxCollectionModel,
  type TaxCollectionModelValue,
} from '../enums/index.js'
import { type PriceMoney, amountOf, currencyOf, sumMoney } from '../types/price.js'

export default class Order extends AppBaseModel {
  static readonly table = 'orders'
  static readonly idPrefix = 'ord'

  static override readonly moneyColumns = [
    'subtotal',
    'discountTotal',
    'promotionTotal',
    'shippingTotal',
    'shippingDiscountTotal',
    'taxTotal',
    'shippingTaxTotal',
    'marketplaceWithheldTaxTotal',
    'grandTotal',
    'marketplaceFeesTotal',
    'paymentProcessingFeesTotal',
    'shippingCostTotal',
    'cogsTotal',
    'refundedTotal',
    'netProceeds',
    'grossProfit',
    'netProfit',
    'reportingTotal',
  ] as const

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

  /** Amazon AmazonOrderId / eBay orderId / Etsy receipt_id / Medusa order.id. */
  @column({ columnName: 'external_order_id' })
  declare public externalOrderId: string | null

  /** Human-facing platform number (Medusa display_id, eBay legacyOrderId…). */
  @column({ columnName: 'external_display_id' })
  declare public externalDisplayId: string | null

  /** Amazon MarketplaceId / eBay marketplace id / Etsy shop_id / Medusa region_id. */
  @column({ columnName: 'marketplace_site_id' })
  declare public marketplaceSiteId: string | null

  @column({ columnName: 'source_type' })
  declare public sourceType: string

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'payment_status' })
  declare public paymentStatus: string

  @column({ columnName: 'fulfillment_status' })
  declare public fulfillmentStatus: string

  @column({ columnName: 'sync_status' })
  declare public syncStatus: string

  /** MFN | AFN | FBA | FBM | 3PL | direct */
  @column({ columnName: 'fulfillment_channel' })
  declare public fulfillmentChannel: FulfillmentChannelValue

  /** marketplace_facilitator | seller | none */
  @column({ columnName: 'tax_collection_model' })
  declare public taxCollectionModel: TaxCollectionModelValue

  /** Platform-specific flags (isPrime, etsyIsGift, medusaRegionId, …). */
  @column({ columnName: 'channel_metadata', prepare: prepareJson })
  declare public channelMetadata: Record<string, any>

  @column({ columnName: 'exchange_rate' })
  declare public exchangeRate: string

  @column({ columnName: 'subtotal', prepare: prepareJson })
  declare public subtotal: PriceMoney

  @column({ columnName: 'discount_total', prepare: prepareJson })
  declare public discountTotal: PriceMoney

  @column({ columnName: 'promotion_total', prepare: prepareJson })
  declare public promotionTotal: PriceMoney

  @column({ columnName: 'shipping_total', prepare: prepareJson })
  declare public shippingTotal: PriceMoney

  @column({ columnName: 'shipping_discount_total', prepare: prepareJson })
  declare public shippingDiscountTotal: PriceMoney

  @column({ columnName: 'tax_total', prepare: prepareJson })
  declare public taxTotal: PriceMoney

  @column({ columnName: 'shipping_tax_total', prepare: prepareJson })
  declare public shippingTaxTotal: PriceMoney

  @column({ columnName: 'marketplace_withheld_tax_total', prepare: prepareJson })
  declare public marketplaceWithheldTaxTotal: PriceMoney

  @column({ columnName: 'grand_total', prepare: prepareJson })
  declare public grandTotal: PriceMoney

  @column({ columnName: 'marketplace_fees_total', prepare: prepareJson })
  declare public marketplaceFeesTotal: PriceMoney

  @column({ columnName: 'payment_processing_fees_total', prepare: prepareJson })
  declare public paymentProcessingFeesTotal: PriceMoney

  @column({ columnName: 'shipping_cost_total', prepare: prepareJson })
  declare public shippingCostTotal: PriceMoney

  @column({ columnName: 'cogs_total', prepare: prepareJson })
  declare public cogsTotal: PriceMoney

  @column({ columnName: 'refunded_total', prepare: prepareJson })
  declare public refundedTotal: PriceMoney

  @column({ columnName: 'net_proceeds', prepare: prepareJson })
  declare public netProceeds: PriceMoney

  @column({ columnName: 'gross_profit', prepare: prepareJson })
  declare public grossProfit: PriceMoney

  @column({ columnName: 'net_profit', prepare: prepareJson })
  declare public netProfit: PriceMoney

  @column({ columnName: 'reporting_total', prepare: prepareJson })
  declare public reportingTotal: PriceMoney

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

  @column.dateTime({ columnName: 'earliest_ship_at' })
  declare public earliestShipAt: DateTime | null

  @column.dateTime({ columnName: 'latest_ship_at' })
  declare public latestShipAt: DateTime | null

  @column.dateTime({ columnName: 'earliest_delivery_at' })
  declare public earliestDeliveryAt: DateTime | null

  @column.dateTime({ columnName: 'latest_delivery_at' })
  declare public latestDeliveryAt: DateTime | null

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

  /**
   * Channel code, derived through `sellerAccountId → sales_channels.code`.
   *
   * There is deliberately no `marketplace_code` column: re-pointing a seller
   * account at another channel must not leave stale platform strings behind.
   * Preload `sellerAccount.salesChannel` to read it; a direct (manual) sale has no
   * seller account and is reported as `direct`.
   */
  get channelCode(): string {
    const code = (this.sellerAccount as { salesChannel?: { code?: string } } | undefined)
      ?.salesChannel?.code
    return typeof code === 'string' && code.length > 0 ? code : 'direct'
  }

  /** Currency of the marketplace transaction (the grand total's currency). */
  get currencyCode(): string {
    return currencyOf(this.grandTotal)
  }

  /** Reporting currency of the P&L roll-up. */
  get reportingCurrencyCode(): string {
    return currencyOf(this.reportingTotal, this.currencyCode)
  }

  /** Net amount due from the buyer after discounts and promotions. */
  get netSalesAmount(): number {
    return (
      amountOf(this.subtotal) -
      amountOf(this.discountTotal) -
      amountOf(this.promotionTotal) +
      amountOf(this.shippingTotal) -
      amountOf(this.shippingDiscountTotal)
    )
  }

  /** Facilitator + seller-collected tax actually retained on the order. */
  get collectedTaxMoney(): PriceMoney {
    return sumMoney([this.taxTotal, this.shippingTaxTotal], currencyOf(this.grandTotal))
  }

  /** True when the marketplace is the deemed seller and remits tax on our behalf. */
  get isMarketplaceFacilitatedTax(): boolean {
    return this.taxCollectionModel === TaxCollectionModel.MARKETPLACE_FACILITATOR
  }

  /** True when Amazon (AFN/FBA) or a 3PL owns inventory and shipping. */
  get isPlatformFulfilled(): boolean {
    return (
      this.fulfillmentChannel === FulfillmentChannel.AFN ||
      this.fulfillmentChannel === FulfillmentChannel.FBA ||
      this.fulfillmentChannel === FulfillmentChannel.THIRD_PARTY_LOGISTICS
    )
  }

  /** Latest ship-by deadline: seller commitment or promised delivery window start. */
  get shipByDeadline(): DateTime | null {
    return this.latestShipAt ?? this.earliestDeliveryAt ?? null
  }

  override serialize(cherryPick?: any): Record<string, any> {
    const raw = super.serialize(cherryPick)
    return {
      ...raw,
      currencyCode: currencyOf(raw.grandTotal),
      reportingCurrencyCode: currencyOf(raw.reportingTotal, currencyOf(raw.grandTotal)),
      channelMetadata: raw.channelMetadata ?? {},
      channelCode: this.channelCode,
      shipByDeadline: this.shipByDeadline?.toISO() ?? null,
    }
  }
}
