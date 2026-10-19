/**
 * ChannelListing — maps to "channel_listings".
 * Per-seller-account listing mapping for one product variant (Amazon ASIN/listing, eBay item id, Etsy listing, storefront URL).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Product from './product.js'
import ProductVariant from './product_variant.js'
import SellerAccount from './seller_account.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

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
}
