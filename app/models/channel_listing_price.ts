/**
 * ChannelListingPrice — maps to "channel_listing_prices".
 * Multi-currency price entries ({ currency_code, amount }) attached to a ChannelListing.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import ChannelListing from './channel_listing.js'
import ProductVariant from './product_variant.js'
import AppBaseModel from './base_model.js'
import type { PriceMoney } from '../types/price.js'

export default class ChannelListingPrice extends AppBaseModel {
  static readonly table = 'channel_listing_prices'
  static readonly idPrefix = 'lprc'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'channel_listing_id' })
  declare public channelListingId: string

  @column({ columnName: 'product_variant_id' })
  declare public productVariantId: string | null

  @column({ columnName: 'price_type' })
  declare public priceType: string

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

  @belongsTo(() => ChannelListing, { foreignKey: 'channelListingId' })
  declare public channelListing: BelongsTo<typeof ChannelListing>

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare public productVariant: BelongsTo<typeof ProductVariant>

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
      currency_code: (this.currencyCode || 'USD').toUpperCase(),
      amount: Number(Number(this.amount ?? 0).toFixed(2)),
      price_type: this.priceType || 'listed',
    }
  }
}
