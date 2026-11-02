/**
 * OrderLineItem — maps to "order_line_items".
 *
 * Order lines snapshot SKU/title/prices at sale time and stay compatible with
 * Amazon SP-API, eBay Fulfillment API, Etsy Open API v3 and MedusaJS v2 order
 * payloads: item tax and shipping tax are separate, discounts are distinct from
 * promotions, and every amount is a self-contained `PriceMoney`.
 *
 * External identity per line:
 *  - `external_order_line_id` — Amazon OrderItemId, eBay lineItemId,
 *    Etsy transaction_id, Medusa LineItem.id
 *  - `external_listing_id`   — Amazon ASIN, eBay legacyItemId, Etsy listing_id,
 *    Medusa product_id
 *  - `external_variant_id`   — Etsy product_id / offering_id, Medusa variant_id
 *
 * `tax_lines` and `adjustments` keep the jurisdiction tax and promotion
 * breakdowns from the platform, with PriceMoney money values. `custom_attributes`
 * holds personalization, gift wrap and metadata passthrough.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import ChannelListing from './channel_listing.js'
import Order from './order.js'
import ProductVariant from './product_variant.js'
import ReturnRequest from './return_request.js'
import ShipmentItem from './shipment_item.js'
import { moneyColumn, moneyEntryArrayColumn, prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import { FulfillmentChannel, type FulfillmentChannelValue } from '../enums/index.js'
import {
  type AdjustmentEntry,
  type PriceMoney,
  type TaxLineEntry,
  currencyOf,
  sumMoneyEntries,
} from '../types/price.js'

export default class OrderLineItem extends AppBaseModel {
  static readonly table = 'order_line_items'
  static readonly idPrefix = 'oline'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'order_id' })
  declare public orderId: string

  @column({ columnName: 'product_variant_id' })
  declare public productVariantId: string | null

  @column({ columnName: 'channel_listing_id' })
  declare public channelListingId: string | null

  @column({ columnName: 'external_order_line_id' })
  declare public externalOrderLineId: string | null

  /** Amazon ASIN / eBay legacyItemId / Etsy listing_id / Medusa product_id. */
  @column({ columnName: 'external_listing_id' })
  declare public externalListingId: string | null

  /** Etsy product_id or offering_id / Medusa variant_id / eBay SKU. */
  @column({ columnName: 'external_variant_id' })
  declare public externalVariantId: string | null

  @column({ columnName: 'sku' })
  declare public sku: string

  @column({ columnName: 'title' })
  declare public title: string

  @column({ columnName: 'variant_title' })
  declare public variantTitle: string | null

  @column({ columnName: 'quantity_ordered' })
  declare public quantityOrdered: number

  @column({ columnName: 'quantity_fulfilled' })
  declare public quantityFulfilled: number

  @column({ columnName: 'quantity_returned' })
  declare public quantityReturned: number

  @column({ columnName: 'quantity_cancelled' })
  declare public quantityCancelled: number

  /** MFN | AFN | FBA | FBM | 3PL | direct (an order can mix channels per line). */
  @column({ columnName: 'fulfillment_channel' })
  declare public fulfillmentChannel: FulfillmentChannelValue

  /** Jurisdiction tax breakdown: [{ code, rate, description, total: PriceMoney }]. */
  @moneyEntryArrayColumn({ columnName: 'tax_lines', amountKey: 'total' })
  declare public taxLines: TaxLineEntry[]

  /** Promotion / coupon breakdown: [{ code, promotion_id, description, amount }]. */
  @moneyEntryArrayColumn({ columnName: 'adjustments', amountKey: 'amount' })
  declare public adjustments: AdjustmentEntry[]

  /** Etsy personalization, Amazon GiftWrapLevel, Medusa metadata, … */
  @column({ columnName: 'custom_attributes', prepare: prepareJson })
  declare public customAttributes: Record<string, any>

  @moneyColumn({ columnName: 'unit_price' })
  declare public unitPrice: PriceMoney

  @moneyColumn({ columnName: 'subtotal' })
  declare public subtotal: PriceMoney

  @moneyColumn({ columnName: 'discount_total' })
  declare public discountTotal: PriceMoney

  @moneyColumn({ columnName: 'promotion_total' })
  declare public promotionTotal: PriceMoney

  @moneyColumn({ columnName: 'tax_total' })
  declare public taxTotal: PriceMoney

  @moneyColumn({ columnName: 'shipping_total' })
  declare public shippingTotal: PriceMoney

  @moneyColumn({ columnName: 'shipping_discount_total' })
  declare public shippingDiscountTotal: PriceMoney

  @moneyColumn({ columnName: 'shipping_tax_total' })
  declare public shippingTaxTotal: PriceMoney

  @moneyColumn({ columnName: 'grand_total' })
  declare public grandTotal: PriceMoney

  @moneyColumn({ columnName: 'unit_cost' })
  declare public unitCost: PriceMoney

  @moneyColumn({ columnName: 'marketplace_fee' })
  declare public marketplaceFee: PriceMoney

  @moneyColumn({ columnName: 'refunded_total' })
  declare public refundedTotal: PriceMoney

  @column({ columnName: 'fulfillment_status' })
  declare public fulfillmentStatus: string

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare public order: BelongsTo<typeof Order>

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare public productVariant: BelongsTo<typeof ProductVariant>

  @belongsTo(() => ChannelListing, { foreignKey: 'channelListingId' })
  declare public channelListing: BelongsTo<typeof ChannelListing>

  @hasMany(() => ShipmentItem, { foreignKey: 'orderLineItemId' })
  declare public shipmentItems: HasMany<typeof ShipmentItem>

  @hasMany(() => ReturnRequest, { foreignKey: 'orderLineItemId' })
  declare public returnRequests: HasMany<typeof ReturnRequest>

  /** Currency carried by the line's own amounts. */
  get currencyCode(): string {
    return currencyOf(this.unitPrice)
  }

  /** True when this specific line is shipped by Amazon (AFN/FBA). */
  get isPlatformFulfilled(): boolean {
    return (
      this.fulfillmentChannel === FulfillmentChannel.AFN ||
      this.fulfillmentChannel === FulfillmentChannel.FBA ||
      this.fulfillmentChannel === FulfillmentChannel.THIRD_PARTY_LOGISTICS
    )
  }

  /** Sum of the line's jurisdiction tax lines, in the line currency. */
  get taxLinesTotal(): PriceMoney {
    return sumMoneyEntries(this.taxLines, 'total', this.currencyCode)
  }

  /** Sum of the line's promotion / coupon adjustments, in the line currency. */
  get adjustmentsTotal(): PriceMoney {
    return sumMoneyEntries(this.adjustments, 'amount', this.currencyCode)
  }

  override serialize(cherryPick?: any): Record<string, any> {
    const raw = super.serialize(cherryPick)
    return {
      ...raw,
      currencyCode: currencyOf(raw.unitPrice),
      taxLines: raw.taxLines ?? [],
      adjustments: raw.adjustments ?? [],
      customAttributes: raw.customAttributes ?? {},
    }
  }
}
