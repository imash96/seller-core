/**
 * ChannelListing — maps to "channel_listings".
 * Per-seller-account listing mapping for one product variant (Amazon ASIN/listing, eBay item id, Etsy listing, storefront URL).
 * Exposes multi-currency `prices: Array<{ currency_code: string, amount: number }>` via `ChannelListingPrice` and `channelAttributes.prices`.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Product from './product.js'
import ProductVariant from './product_variant.js'
import SellerAccount from './seller_account.js'
import ChannelListingPrice from './channel_listing_price.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import {
  type PriceMoney,
  buildMultiCurrencyPriceArray,
  normalizePriceMoney,
  normalizePriceMoneyArray,
} from '../types/price.js'

export default class ChannelListing extends AppBaseModel {
  static readonly table = 'channel_listings'
  static readonly idPrefix = 'clst'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'seller_account_id' })
  declare public sellerAccountId: string

  @column({ columnName: 'product_id' })
  declare public productId: string

  @column({ columnName: 'product_variant_id' })
  declare public productVariantId: string

  @column({ columnName: 'external_listing_id' })
  declare public externalListingId: string

  @column({ columnName: 'external_variant_id' })
  declare public externalVariantId: string | null

  @column({ columnName: 'external_sku' })
  declare public externalSku: string | null

  @column({ columnName: 'asin' })
  declare public asin: string | null

  @column({ columnName: 'channel_title' })
  declare public channelTitle: string | null

  @column({ columnName: 'channel_description' })
  declare public channelDescription: string | null

  @column({ columnName: 'channel_category_id' })
  declare public channelCategoryId: string | null

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({ columnName: 'listed_price' })
  declare public listedPrice: string

  @column({ columnName: 'allocated_quantity' })
  declare public allocatedQuantity: number

  @column({ columnName: 'listing_status' })
  declare public listingStatus: string

  @column({ columnName: 'publication_status' })
  declare public publicationStatus: string

  @column({ columnName: 'sync_status' })
  declare public syncStatus: string

  @column({ columnName: 'last_sync_error' })
  declare public lastSyncError: string | null

  @column({ columnName: 'channel_attributes', prepare: prepareJson })
  declare public channelAttributes: any

  @column.dateTime({ columnName: 'last_synced_at' })
  declare public lastSyncedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare public sellerAccount: BelongsTo<typeof SellerAccount>

  @belongsTo(() => Product, { foreignKey: 'productId' })
  declare public product: BelongsTo<typeof Product>

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare public productVariant: BelongsTo<typeof ProductVariant>

  @hasMany(() => ChannelListingPrice, { foreignKey: 'channelListingId' })
  declare public priceRecords: HasMany<typeof ChannelListingPrice>

  override serialize(): Record<string, any> {
    const raw = super.serialize()
    const baseCur = (this.currencyCode || 'USD').toUpperCase()
    const listedNum = Number(this.listedPrice ?? 0)
    const attrs = (this.channelAttributes ?? {}) as Record<string, any>

    let prices: PriceMoney[] = []
    if (Array.isArray(this.priceRecords) && this.priceRecords.length > 0) {
      prices = this.priceRecords.map((pr) => ({
        currency_code: (pr.currencyCode || baseCur).toUpperCase(),
        amount: Number(Number(pr.amount ?? 0).toFixed(2)),
      }))
    } else if (Array.isArray(attrs.prices) && attrs.prices.length > 0) {
      prices = normalizePriceMoneyArray(attrs.prices, listedNum, baseCur)
    } else {
      prices = buildMultiCurrencyPriceArray(listedNum || 239.99)
    }

    return {
      ...raw,
      price: prices,
      prices,
      listedPriceMoney: normalizePriceMoney(listedNum, baseCur),
    }
  }
}
