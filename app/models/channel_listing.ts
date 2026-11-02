/**
 * ChannelListing — maps to "channel_listings".
 *
 * Per-seller-account listing mapping for one product variant (Amazon
 * ASIN/listing, eBay item id, Etsy listing, storefront URL). Prices are a
 * MedusaJS v2 multi-currency array plus the primary `listed_price` PriceMoney
 * object — there is no standalone `currency_code` column.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Product from './product.js'
import ProductVariant from './product_variant.js'
import SellerAccount from './seller_account.js'
import { moneyColumn, prepareJson, priceArrayColumn } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import type { MedusaVariantPrice, PriceMoney } from '../types/price.js'

export default class ChannelListing extends AppBaseModel {
  static readonly table = 'channel_listings'
  static readonly idPrefix = 'clst'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'seller_account_id' })
  declare public sellerAccountId: string

  @column({ columnName: 'product_variant_id' })
  declare public productVariantId: string

  @column({ columnName: 'external_listing_id' })
  declare public externalListingId: string

  @column({ columnName: 'external_variant_id' })
  declare public externalVariantId: string | null

  @column({ columnName: 'external_sku' })
  declare public externalSku: string | null

  @column({ columnName: 'channel_title' })
  declare public channelTitle: string | null

  @column({ columnName: 'channel_description' })
  declare public channelDescription: string | null

  @column({ columnName: 'channel_category_id' })
  declare public channelCategoryId: string | null

  /** MedusaJS v2 multi-currency price array for this listing. */
  @priceArrayColumn({ columnName: 'prices' })
  declare public prices: MedusaVariantPrice[]

  /** Primary listed amount, self-contained with its own currency code. */
  @moneyColumn({ columnName: 'listed_price' })
  declare public listedPrice: PriceMoney

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

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare public productVariant: BelongsTo<typeof ProductVariant>

  /**
   * The product is derived through the variant — `channel_listings` never stores a
   * second `product_id`. Preload `productVariant.product` to read it.
   */
  get productId(): string | null {
    return this.productVariant?.productId ?? null
  }

  /** Convenience accessor for the preloaded product (listing → variant → product). */
  get product(): Product | undefined {
    return this.productVariant?.product ?? undefined
  }

  /** Marketplace catalog identity of the sellable unit, owned by the variant. */
  get asin(): string | null {
    return this.productVariant?.asin ?? null
  }

  override serialize(cherryPick?: any): Record<string, any> {
    const raw = super.serialize(cherryPick)
    const prices = Array.isArray(raw.prices) ? raw.prices : []
    return { ...raw, prices, price: prices }
  }
}
