import db from '@adonisjs/lucid/services/db'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import ProductVariantAttribute from '#models/product_variant_attribute'
import ChannelListing from '#models/channel_listing'
import {
  ProductStatus,
  VariantStatus,
  ListingStatus,
  PublicationStatus,
  EntitySyncStatus,
} from '../enums/index.js'
import { uuidv7 } from '../utils/uuid.js'

export interface VariantInput {
  sku: string
  title?: string
  barcodeUpcEan?: string | null
  mpn?: string | null
  asin?: string | null
  currencyCode?: string
  retailPrice: number
  compareAtPrice?: number | null
  costPrice?: number
  manufacturingCost?: number
  packagingCost?: number
  stockOnHand?: number
  reorderPoint?: number
  weightGrams?: number | null
  attributes?: Record<string, string>
  listings?: Array<{
    sellerAccountId: string
    externalListingId: string
    asin?: string | null
    channelTitle?: string | null
    listedPrice?: number
    allocatedQuantity?: number
  }>
}

export class CatalogService {
  /**
   * Creates a product with zero (standalone) or multiple variations.
   * Even when hasVariants = false, creates 1 default sellable ProductVariant (SKU)
   * so order lines, inventory, and channel listings always reference a uniform ProductVariant!
   */
  static async createProduct(input: {
    userId: string
    brandId?: string | null
    categoryId?: string | null
    title: string
    slug?: string
    skuPrefix?: string | null
    description?: string | null
    status?: string
    hasVariants: boolean
    variationDimensions?: string[]
    weightGrams?: number | null
    variants: VariantInput[]
  }): Promise<Product> {
    if (!input.variants || input.variants.length === 0) {
      throw new Error(
        'VALIDATION_ERROR: Product must provide at least one sellable SKU definition.'
      )
    }

    return await db.transaction(async (trx) => {
      const baseSlug =
        (input.slug || input.title)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || `prod-${Date.now()}`

      const product = new Product()
      product.useTransaction(trx)
      product.id = uuidv7()
      product.userId = input.userId
      product.brandId = input.brandId ?? null
      product.categoryId = input.categoryId ?? null
      product.title = input.title.trim()
      product.slug = baseSlug
      product.skuPrefix = input.skuPrefix ?? null
      product.description = input.description ?? null
      product.status = input.status || ProductStatus.ACTIVE
      product.hasVariants = Boolean(input.hasVariants && input.variants.length > 0)
      product.variationDimensions = input.variationDimensions ?? []
      product.weightGrams =
        input.weightGrams !== undefined && input.weightGrams !== null
          ? Number(input.weightGrams).toFixed(2)
          : null
      product.dimensionsCm = {}
      product.images = []
      product.tags = []
      product.metadata = {}
      await product.save()

      for (let i = 0; i < input.variants.length; i++) {
        const vInput = input.variants[i]
        const variant = new ProductVariant()
        variant.useTransaction(trx)
        variant.id = uuidv7()
        variant.userId = input.userId
        variant.productId = product.id
        variant.sku = vInput.sku.trim()
        variant.title = (vInput.title || input.title).trim()
        variant.isDefault = !input.hasVariants || i === 0
        variant.barcodeUpcEan = vInput.barcodeUpcEan ?? null
        variant.mpn = vInput.mpn ?? null
        variant.asin = vInput.asin ?? null
        variant.attributes = vInput.attributes ?? {}
        variant.currencyCode = (vInput.currencyCode || 'USD').toUpperCase()
        variant.retailPrice = Number(vInput.retailPrice).toFixed(2)
        variant.compareAtPrice =
          vInput.compareAtPrice !== undefined && vInput.compareAtPrice !== null
            ? Number(vInput.compareAtPrice).toFixed(2)
            : null
        variant.costPrice = Number(vInput.costPrice ?? 0).toFixed(2)
        variant.manufacturingCost = Number(vInput.manufacturingCost ?? 0).toFixed(2)
        variant.packagingCost = Number(vInput.packagingCost ?? 0).toFixed(2)
        variant.stockOnHand = Number(vInput.stockOnHand ?? 0)
        variant.stockReserved = 0
        variant.reorderPoint = Number(vInput.reorderPoint ?? 5)
        variant.weightGrams =
          vInput.weightGrams !== undefined && vInput.weightGrams !== null
            ? Number(vInput.weightGrams).toFixed(2)
            : product.weightGrams
        variant.dimensionsCm = {}
        variant.images = []
        variant.status = VariantStatus.ACTIVE
        await variant.save()

        if (vInput.attributes) {
          for (const [attrName, attrValue] of Object.entries(vInput.attributes)) {
            if (attrName && attrValue) {
              const attrRow = new ProductVariantAttribute()
              attrRow.useTransaction(trx)
              attrRow.id = uuidv7()
              attrRow.userId = input.userId
              attrRow.productVariantId = variant.id
              attrRow.attributeName = attrName.trim().toLowerCase()
              attrRow.attributeValue = String(attrValue).trim()
              await attrRow.save()
            }
          }
        }

        if (vInput.listings && vInput.listings.length > 0) {
          for (const lInput of vInput.listings) {
            const listing = new ChannelListing()
            listing.useTransaction(trx)
            listing.id = uuidv7()
            listing.userId = input.userId
            listing.sellerAccountId = lInput.sellerAccountId
            listing.productId = product.id
            listing.productVariantId = variant.id
            listing.externalListingId = lInput.externalListingId
            listing.externalSku = variant.sku
            listing.asin = lInput.asin ?? variant.asin
            listing.channelTitle = lInput.channelTitle ?? variant.title
            listing.currencyCode = variant.currencyCode
            listing.listedPrice = Number(lInput.listedPrice ?? vInput.retailPrice).toFixed(2)
            listing.allocatedQuantity = Number(lInput.allocatedQuantity ?? variant.stockOnHand)
            listing.listingStatus = ListingStatus.ACTIVE
            listing.publicationStatus = PublicationStatus.PUBLISHED
            listing.syncStatus = EntitySyncStatus.SYNCED
            listing.channelAttributes = {}
            await listing.save()
          }
        }
      }

      return product
    })
  }
}
