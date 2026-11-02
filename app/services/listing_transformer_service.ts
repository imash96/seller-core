import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Brand from '#models/brand'
import Product from '#models/product'
import type ProductVariant from '#models/product_variant'
import ChannelListing from '#models/channel_listing'
import SellerAccount from '#models/seller_account'
import SalesChannel from '#models/sales_channel'
import { CategorySyncService } from './category_sync_service.js'
import type { ListingPlatform } from '../types/catalog_pipeline.js'
import {
  type MedusaVariantPrice,
  buildMultiCurrencyPriceArray,
  money,
  normalizePriceMoneyArray,
} from '../types/price.js'
import { resolveColorInfoFromValue, resolveSizeInfo } from '../data/catalog_config/index.js'

/**
 * Marketplace character caps applied at publish time.
 *
 * The product row stores one canonical `title` / `description`; every channel cap
 * (Amazon 200, eBay 80, Etsy 140…) is applied to the generated payload instead of
 * being persisted as a truncated duplicate column.
 */
const CHANNEL_TITLE_LIMITS: Partial<Record<ListingPlatform, number>> = {
  amazon: 200,
  ebay: 80,
  etsy: 140,
  medusa: 255,
}

const CHANNEL_DESCRIPTION_LIMITS: Partial<Record<ListingPlatform, number>> = {
  amazon: 2000,
  ebay: 3000,
  etsy: 5000,
  medusa: 10000,
}

/** Channel-ready title: brand-prefixed for Amazon, canonical otherwise. */
function channelTitle(product: Product, platform: ListingPlatform, brand?: Brand): string {
  const base =
    platform === 'amazon' && brand ? `${brand.name} ${product.title}` : String(product.title ?? '')
  return base.slice(0, CHANNEL_TITLE_LIMITS[platform] ?? 255)
}

/** Channel-ready description: the product's canonical description, capped. */
function channelDescription(product: Product, platform: ListingPlatform): string {
  return String(product.description ?? '').slice(0, CHANNEL_DESCRIPTION_LIMITS[platform] ?? 10000)
}

/** Colour name/map/code resolved from the variant's clean `color` attribute. */
function variantColor(variant: ProductVariant) {
  const attributes = (variant.attributes ?? {}) as Record<string, any>
  return resolveColorInfoFromValue(String(attributes.color ?? 'Black'))
}

/** Size key/value resolved from the variant's clean `size` attribute. */
function variantSize(variant: ProductVariant) {
  const attributes = (variant.attributes ?? {}) as Record<string, any>
  return resolveSizeInfo(String(attributes.size ?? 'Medium'))
}

export interface GenerateListingsParams {
  userId: string
  productIds?: string[]
  variantIds?: string[]
  brandId: string
  platform: ListingPlatform
  platforms?: ListingPlatform[]
  sellerAccountId?: string | null
  assignBrandToProduct?: boolean
  persistChannelListings?: boolean
  publicationStatus?: 'unpublished' | 'queued' | 'published'
}

/** MedusaJS v2 price array of a variant, derived from its USD price when empty. */
function resolveVariantMultiCurrencyPrices(variant: ProductVariant): MedusaVariantPrice[] {
  if (Array.isArray(variant.prices) && variant.prices.length > 0) {
    return normalizePriceMoneyArray(variant.prices)
  }
  const fallbackUsd = Number(
    (variant.product?.prices as MedusaVariantPrice[] | undefined)?.find(
      (price) => price.currency_code === 'USD'
    )?.amount ?? 239.99
  )
  return buildMultiCurrencyPriceArray(fallbackUsd)
}

/** USD amount of a variant price array (0 when absent). */
function usdVariantAmount(variant: ProductVariant, prices: MedusaVariantPrice[]): number {
  return (
    prices.find((price) => price.currency_code === 'USD')?.amount ??
    Number(variant.product?.prices?.[0]?.amount ?? 0)
  )
}

export class ListingTransformerService {
  static async resolveOrCreateSellerAccount(
    userId: string,
    platform: ListingPlatform,
    explicitSellerAccountId?: string | null,
    trx?: TransactionClientContract
  ): Promise<SellerAccount> {
    if (explicitSellerAccountId) {
      const found = await SellerAccount.query({ client: trx })
        .where('userId', userId)
        .andWhere('id', explicitSellerAccountId)
        .preload('salesChannel')
        .firstOrFail()
      const code = (found.salesChannel?.code || '').toLowerCase()
      const valid =
        platform === 'medusa'
          ? ['direct', 'medusa', 'website'].some((s) => code.includes(s))
          : code.includes(platform)
      if (!valid) throw new Error('Seller account does not match the selected platform.')
      return found
    }

    const platformCodeMap: Record<ListingPlatform, string> = {
      medusa: 'direct',
      amazon: 'amazon',
      ebay: 'ebay',
      etsy: 'etsy',
    }
    const targetCode = platformCodeMap[platform] || 'direct'

    const existingAccounts = await SellerAccount.query({ client: trx })
      .where('userId', userId)
      .preload('salesChannel')
    const matched = existingAccounts.find(
      (sa) =>
        sa.accountName.toLowerCase().includes(platform) ||
        sa.salesChannel?.code?.toLowerCase().includes(targetCode)
    )
    if (matched) return matched

    let channel = await SalesChannel.query({ client: trx }).where('code', targetCode).first()
    if (!channel) {
      channel = await SalesChannel.create(
        {
          code: targetCode,
          name: platform.toUpperCase(),
          channelType: platform === 'medusa' ? 'webstore' : 'marketplace',
          isActive: true,
        } as any,
        trx ? { client: trx } : undefined
      )
    }

    const labelMap: Record<ListingPlatform, string> = {
      medusa: 'Medusa Website Storefront',
      amazon: 'Amazon North America (SP-API)',
      ebay: 'eBay US Store (Inventory API)',
      etsy: 'Etsy Global Shop (Open API v3)',
    }

    return await SellerAccount.create(
      {
        userId,
        salesChannelId: channel.id,
        accountName: labelMap[platform] || `${platform.toUpperCase()} Store`,
        externalSellerId: `${platform.toUpperCase()}-STORE`,
        marketplaceRegion: 'US',
        defaultCurrency: 'USD',
        status: 'pending_setup',
        healthStatus: 'unknown',
      } as any,
      trx ? { client: trx } : undefined
    )
  }

  /**
   * Stage 4: Links one or more `Product` + `ProductVariant[]` records with a selected `Brand`,
   * transforms them into the target e-commerce platform schema(s) (`medusa`, `amazon`, `ebay`, `etsy`),
   * and persists `ChannelListing` + `ChannelListingPrice` records in PostgreSQL.
   */
  static async generateListings(params: GenerateListingsParams): Promise<{
    platform: ListingPlatform
    platformsGenerated: ListingPlatform[]
    filename: string
    brand: { id: string; name: string; slug: string; regNo: string | null; serialNo: string | null }
    productCount: number
    variantCount: number
    listingsPersisted: number
    payload: Record<string, unknown>
  }> {
    const {
      userId,
      productIds,
      variantIds,
      brandId,
      platform,
      platforms,
      sellerAccountId,
      assignBrandToProduct = false,
      persistChannelListings = false,
      publicationStatus = 'unpublished',
    } = params

    if (publicationStatus !== 'unpublished') {
      throw new Error(
        'Marketplace publishing is not configured. Listings can only be saved as drafts.'
      )
    }

    const brand = await Brand.query().where('userId', userId).andWhere('id', brandId).firstOrFail()

    const prodQuery = Product.query()
      .where('userId', userId)
      .preload('category')
      .preload('variants', (q) => {
        q.preload('variantAttributes').orderBy('createdAt', 'asc')
        if (Array.isArray(variantIds) && variantIds.length > 0) {
          q.whereIn('id', variantIds)
        }
      })
      .orderBy('createdAt', 'desc')

    if (Array.isArray(productIds) && productIds.length > 0) {
      prodQuery.whereIn('id', productIds)
    }

    const rawProducts = await prodQuery
    const products = rawProducts.filter((p) => (p.variants ?? []).length > 0)
    if (products.length === 0) {
      throw new Error('No products with variants found to transform into platform listings.')
    }

    const targetPlatforms: ListingPlatform[] =
      Array.isArray(platforms) && platforms.length > 0 ? [...new Set(platforms)] : [platform]
    if (targetPlatforms.some((p) => !['medusa', 'amazon', 'ebay', 'etsy'].includes(p))) {
      throw new Error('Unsupported listing platform.')
    }
    if (sellerAccountId && targetPlatforms.length > 1) {
      throw new Error('Select one platform when using a specific seller account.')
    }
    if (productIds?.length && products.length !== new Set(productIds).size) {
      throw new Error('One or more selected products are unavailable or have no variants.')
    }

    let listingsPersisted = 0
    let totalVariants = 0
    const payloadsByPlatform: Record<string, Record<string, unknown>> = {}

    await db.transaction(async (trx) => {
      if (assignBrandToProduct) {
        for (const product of products) {
          product.useTransaction(trx)
          product.brandId = brand.id
          await product.save()
        }
      }
      for (const plat of targetPlatforms) {
        const platPayload = this.transformForPlatform(plat, products, brand)
        payloadsByPlatform[plat] = platPayload

        if (persistChannelListings) {
          const sellerAccount = await this.resolveOrCreateSellerAccount(
            userId,
            plat,
            targetPlatforms.length === 1 ? sellerAccountId : null,
            trx
          )

          for (const product of products) {
            const catMeta = CategorySyncService.extractCategoryMetadata(product.category)
            const channelCatId =
              plat === 'amazon'
                ? (catMeta.amazon_browse_node ?? '2476517011')
                : plat === 'ebay'
                  ? (catMeta.ebay_category_id ?? '57988')
                  : plat === 'etsy'
                    ? (catMeta.etsy_taxonomy_id ?? '15834')
                    : (catMeta.medusaId ?? product.categoryId ?? 'medusa')

            const listingTitle = channelTitle(product, plat, brand)
            const listingDescription = channelDescription(product, plat)

            for (const variant of product.variants ?? []) {
              const varPrices = resolveVariantMultiCurrencyPrices(variant)
              const skuPayload = this.buildSingleVariantPlatformPayload(
                plat,
                product,
                variant,
                brand,
                catMeta
              )
              const extId = `${plat.toUpperCase()}-${brand.slug.toUpperCase()}-${variant.sku}`
              const existing = await ChannelListing.query({ client: trx })
                .where('userId', userId)
                .andWhere('sellerAccountId', sellerAccount.id)
                .andWhere('productVariantId', variant.id)
                .first()

              if (existing?.publicationStatus === 'published') {
                throw new Error('Cannot overwrite a published listing with a local draft.')
              }
              const listing = existing ?? new ChannelListing()
              listing.useTransaction(trx)
              listing.userId = userId
              listing.sellerAccountId = sellerAccount.id
              listing.productVariantId = variant.id
              listing.externalListingId = existing?.externalListingId || extId
              listing.externalVariantId = variant.sku
              listing.externalSku = variant.sku
              listing.channelTitle = `${listingTitle} - ${variantColor(variant).colorName} / ${
                variantSize(variant).sizeKey
              }`.slice(0, 500)
              listing.channelDescription = listingDescription || null
              listing.channelCategoryId = String(channelCatId)
              listing.prices = varPrices
              listing.listedPrice = money(
                varPrices[0]?.amount ?? usdVariantAmount(variant, varPrices),
                varPrices[0]?.currency_code ?? 'USD'
              )
              listing.allocatedQuantity = Number(variant.stockOnHand ?? 0)
              listing.listingStatus = 'draft'
              listing.publicationStatus = publicationStatus
              listing.syncStatus = 'pending'
              listing.lastSyncedAt = null
              listing.channelAttributes = {
                platform: plat,
                brandId: brand.id,
                brandName: brand.name,
                brandSlug: brand.slug,
                productTitle: product.title,
                skuPrefix: product.skuPrefix,
                categoryHandle: catMeta.handle ?? product.category?.taxonomyPath ?? null,
                variantAttributes: variant.attributes ?? {},
                transformedPayload: skuPayload,
              }
              await listing.save()

              listingsPersisted += 1
            }
          }
        }
      }
    })

    for (const p of products) {
      totalVariants += (p.variants ?? []).length
    }

    const finalPayload =
      targetPlatforms.length === 1
        ? payloadsByPlatform[targetPlatforms[0]]
        : {
            generated_at: new Date().toISOString(),
            brand: { id: brand.id, name: brand.name, slug: brand.slug },
            platforms: payloadsByPlatform,
          }

    const filename =
      targetPlatforms.length === 1
        ? `${brand.slug}-${targetPlatforms[0]}-listings.json`
        : `${brand.slug}-multi-platform-listings.json`

    return {
      platform: targetPlatforms[0],
      platformsGenerated: targetPlatforms,
      filename,
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        regNo: brand.regNo ?? null,
        serialNo: brand.serialNo ?? null,
      },
      productCount: products.length,
      variantCount: totalVariants,
      listingsPersisted,
      payload: finalPayload,
    }
  }

  static async publishListingOnPlatform(params: {
    userId: string
    listingId: string
  }): Promise<ChannelListing> {
    void params
    throw new Error('Marketplace publishing is not configured. Download the draft JSON instead.')
  }

  static async publishSkuAcrossPlatforms(params: { userId: string; sku: string }): Promise<number> {
    void params
    throw new Error('Marketplace publishing is not configured. Download the draft JSON instead.')
  }

  static transformForPlatform(
    platform: ListingPlatform,
    products: Product[],
    brand: Brand
  ): Record<string, unknown> {
    switch (platform) {
      case 'amazon':
        return this.transformForAmazon(products, brand)
      case 'ebay':
        return this.transformForEbay(products, brand)
      case 'etsy':
        return this.transformForEtsy(products, brand)
      case 'medusa':
      default:
        return this.transformForMedusa(products, brand)
    }
  }

  static buildSingleVariantPlatformPayload(
    platform: ListingPlatform,
    product: Product,
    variant: ProductVariant,
    brand: Brand,
    catMeta: Record<string, any>
  ): Record<string, unknown> {
    const vAttr = (variant.attributes ?? {}) as Record<string, any>
    const pMeta = (product.metadata ?? {}) as Record<string, any>
    const pAttrs = (pMeta.attributes ?? {}) as Record<string, any>
    const colorInfo = variantColor(variant)
    const sizeInfo = variantSize(variant)
    const colorName = colorInfo.colorName
    const colorMap = colorInfo.colorMap
    const sizeKey = sizeInfo.sizeKey
    const sizeVal = sizeInfo.sizeValue
    const multiPrices = resolveVariantMultiCurrencyPrices(variant)
    const priceNum = usdVariantAmount(variant, multiPrices)
    const images: string[] = Array.isArray(product.images) ? product.images : []

    if (platform === 'amazon') {
      return {
        platform: 'amazon',
        schema: 'SP_API_LISTINGS_ITEM_2021_08_01',
        sku: variant.sku,
        parent_sku: pMeta.structuredCode || product.skuPrefix,
        productType: (product.type || 'COAT').toUpperCase().includes('COAT') ? 'COAT' : 'OUTERWEAR',
        prices: multiPrices,
        attributes: {
          item_name: [
            {
              value: `${brand.name} ${product.title} - ${colorName} ${sizeKey}`.slice(0, 200),
              language_tag: 'en_US',
            },
          ],
          brand: [{ value: brand.name }],
          recommended_browse_nodes: [{ value: String(catMeta.amazon_browse_node || '2476517011') }],
          parentage_level: [{ value: 'child' }],
          child_parent_sku_relationship: [
            {
              child_relationship_type: 'variation',
              parent_sku: String(pMeta.structuredCode || product.skuPrefix),
            },
          ],
          variation_theme: [{ name: 'SIZE_NAME/COLOR_NAME' }],
          product_description: [
            {
              value: channelDescription(product, 'amazon'),
              language_tag: 'en_US',
            },
          ],
          bullet_point: Array.isArray(pAttrs.bullets)
            ? pAttrs.bullets.map((b: string) => ({ value: b, language_tag: 'en_US' }))
            : [],
          color: [{ value: colorName, language_tag: 'en_US' }],
          color_map: [{ value: colorMap }],
          size: [{ value: sizeKey, language_tag: 'en_US' }],
          size_map: [{ value: sizeKey }],
          purchasable_offer: multiPrices.map((mp) => ({
            currency: mp.currency_code,
            our_price: [{ schedule: [{ value_with_tax: mp.amount }] }],
          })),
          list_price: multiPrices.map((mp) => ({
            currency: mp.currency_code,
            value: mp.amount,
          })),
          fulfillment_availability: [
            { fulfillment_channel_code: 'DEFAULT', quantity: Number(variant.stockOnHand ?? 25) },
          ],
        },
      }
    }

    if (platform === 'ebay') {
      return {
        platform: 'ebay',
        schema: 'EBAY_SELL_INVENTORY_V1',
        prices: multiPrices,
        inventoryItem: {
          sku: variant.sku,
          condition: 'NEW',
          product: {
            title: channelTitle(product, 'ebay'),
            subtitle: (product.subTitle || '').slice(0, 55) || undefined,
            brand: brand.name,
            mpn: variant.sku,
            imageUrls: images,
            aspects: {
              'Brand': [brand.name],
              'Color': [colorName],
              'Size': [sizeVal],
              'Size Type': [String(pAttrs.size_type || 'Regular')],
              'Type': [product.type || 'Coat'],
              'Outer Shell Material': [String(pAttrs.material || 'Leather')],
            },
          },
          availability: {
            shipToLocationAvailability: { quantity: Number(variant.stockOnHand ?? 25) },
          },
        },
        offer: {
          sku: variant.sku,
          marketplaceId: 'EBAY_US',
          format: 'FIXED_PRICE',
          categoryId: String(catMeta.ebay_category_id || '57988'),
          listingDescription: channelDescription(product, 'ebay'),
          pricingSummary: {
            price: { currency: multiPrices[0]?.currency_code ?? 'USD', value: priceNum.toFixed(2) },
            multiCurrencyPrices: multiPrices,
          },
          availableQuantity: Number(variant.stockOnHand ?? 25),
        },
      }
    }

    if (platform === 'etsy') {
      return {
        platform: 'etsy',
        schema: 'ETSY_OPEN_API_V3',
        sku: variant.sku,
        taxonomy_id: Number(catMeta.etsy_taxonomy_id || 15834),
        title: channelTitle(product, 'etsy'),
        brand: brand.name,
        prices: multiPrices,
        property_values: [
          { property_id: 200, property_name: 'Primary color', values: [colorName] },
          { property_id: 100, property_name: 'Size', values: [sizeKey] },
        ],
        offering: {
          price: { currency_code: multiPrices[0]?.currency_code ?? 'USD', amount: priceNum },
          multi_currency_prices: multiPrices,
          quantity: Number(variant.stockOnHand ?? 25),
          is_enabled: true,
        },
      }
    }

    return {
      platform: 'medusa',
      schema: 'MEDUSA_ADMIN_PRODUCTS_V2',
      product_handle: `${brand.slug}-${product.skuPrefix || product.slug}`.toLowerCase(),
      brand: { id: brand.id, name: brand.name, slug: brand.slug },
      category_handle: catMeta.handle ?? pMeta.category_handle,
      variant: {
        title: `${colorName} / ${sizeKey}`,
        sku: variant.sku,
        inventory_quantity: Number(variant.stockOnHand ?? 25),
        manage_inventory: true,
        prices: multiPrices.map((mp) => ({
          currency_code: mp.currency_code.toUpperCase(),
          amount: mp.amount,
          amount_minor: Math.round(mp.amount * 100),
        })),
        options: [
          { option: 'Color', value: colorName },
          { option: 'Size', value: sizeKey },
        ],
        metadata: vAttr,
      },
    }
  }

  static transformForMedusa(products: Product[], brand: Brand): Record<string, unknown> {
    const medusaProducts = products.map((product) => {
      const meta = (product.metadata ?? {}) as Record<string, any>
      const attrs = (meta.attributes ?? {}) as Record<string, any>
      const catMeta = CategorySyncService.extractCategoryMetadata(product.category)
      const images: string[] = Array.isArray(product.images) ? product.images : []
      const tags: string[] = Array.isArray(product.tags) ? product.tags : []

      const colorSet = new Set<string>()
      const sizeSet = new Set<string>()
      for (const v of product.variants ?? []) {
        const vAttr = (v.attributes ?? {}) as Record<string, any>
        if (vAttr.color) colorSet.add(String(vAttr.color))
        if (vAttr.size) sizeSet.add(String(vAttr.size))
      }

      const handle = `${brand.slug}-${product.skuPrefix || product.slug}-${product.title}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      return {
        title: product.title,
        subtitle: product.subTitle ?? null,
        description: product.description ?? '',
        handle,
        is_giftcard: false,
        discountable: true,
        status: 'draft',
        type: { value: product.type || 'Outerwear' },
        collection_id: product.collectionName ?? null,
        categories: product.category
          ? [
              {
                id: catMeta.medusaId ?? product.category.id,
                handle: catMeta.handle ?? product.category.taxonomyPath ?? product.category.slug,
                name: product.category.name,
              },
            ]
          : [],
        images,
        thumbnail: images[0] ?? null,
        tags: tags.map((t) => ({ value: String(t) })),
        options: [
          { title: 'Color', values: Array.from(colorSet) },
          { title: 'Size', values: Array.from(sizeSet) },
        ],
        variants: (product.variants ?? []).map((v) => {
          const colorInfo = variantColor(v)
          const sizeInfo = variantSize(v)
          const colorName = colorInfo.colorName
          const sizeKey = sizeInfo.sizeKey
          const multiPrices = resolveVariantMultiCurrencyPrices(v)
          return {
            title: `${colorName} / ${sizeKey}`,
            sku: v.sku,
            barcode: v.barcodeUpcEan ?? null,
            ean: v.barcodeUpcEan ?? null,
            inventory_quantity: Number(v.stockOnHand ?? 25),
            manage_inventory: true,
            allow_backorder: false,
            prices: multiPrices.map((mp) => ({
              currency_code: mp.currency_code.toUpperCase(),
              amount: mp.amount,
              amount_minor: Math.round(mp.amount * 100),
            })),
            options: [
              { option: 'Color', value: colorName },
              { option: 'Size', value: sizeKey },
            ],
            metadata: {
              color_code: colorInfo.code,
              color_map: colorInfo.colorMap,
              size_code: sizeInfo.sizeValue,
            },
          }
        }),
        metadata: {
          brand_id: brand.id,
          brand_name: brand.name,
          brand_slug: brand.slug,
          sku_prefix: product.skuPrefix,
          structured_code: meta.structuredCode ?? product.skuPrefix,
          pattern: meta.pattern ?? 'Solid',
          category_handle: catMeta.handle ?? meta.category_handle,
          attributes: attrs,
        },
      }
    })

    return {
      platform: 'medusa',
      schema_version: 'MEDUSA_ADMIN_PRODUCTS_V2',
      generated_at: new Date().toISOString(),
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        website_url: brand.websiteUrl ?? null,
      },
      products: medusaProducts,
    }
  }

  static transformForAmazon(products: Product[], brand: Brand): Record<string, unknown> {
    const feeds = products.map((product) => {
      const meta = (product.metadata ?? {}) as Record<string, any>
      const attrs = (meta.attributes ?? {}) as Record<string, any>
      const catMeta = CategorySyncService.extractCategoryMetadata(product.category)
      const images: string[] = Array.isArray(product.images) ? product.images : []
      const parentSku = String(meta.structuredCode || product.skuPrefix || product.id)
      const productType = (product.type || 'COAT').toUpperCase().includes('COAT')
        ? 'COAT'
        : 'OUTERWEAR'

      const bullets: string[] = Array.isArray(attrs.bullets) ? attrs.bullets : []
      const genericKeywords: string[] = Array.isArray(attrs.generic_keyword)
        ? attrs.generic_keyword
        : []
      const specialFeatures: string[] = Array.isArray(attrs.special_feature)
        ? attrs.special_feature
        : []
      const closureTypes: string[] = Array.isArray(attrs.closure_type)
        ? attrs.closure_type
        : attrs.closure
          ? [String(attrs.closure)]
          : ['Button']
      const pockets: string[] = Array.isArray(attrs.pockets)
        ? attrs.pockets
        : attrs.pocket_description
          ? [String(attrs.pocket_description)]
          : []

      return {
        parent_sku: parentSku,
        catalog_key: product.skuPrefix,
        productType,
        requirements: 'LISTING',
        parent_attributes: {
          item_name: [
            { value: `${brand.name} ${product.title}`.slice(0, 200), language_tag: 'en_US' },
          ],
          brand: [{ value: brand.name }],
          recommended_browse_nodes: [{ value: String(catMeta.amazon_browse_node || '2476517011') }],
          parentage_level: [{ value: 'parent' }],
          child_parent_sku_relationship: [{ child_relationship_type: 'variation' }],
          variation_theme: [{ name: 'SIZE_NAME/COLOR_NAME' }],
          product_description: [
            {
              value: channelDescription(product, 'amazon'),
              language_tag: 'en_US',
            },
          ],
          bullet_point: bullets.map((b) => ({ value: String(b), language_tag: 'en_US' })),
          generic_keyword: genericKeywords.map((k) => ({
            value: String(k),
            language_tag: 'en_US',
          })),
          department: [{ value: String(attrs.gender || 'mens') }],
          target_gender: [
            {
              value: String(attrs.gender || 'mens')
                .toLowerCase()
                .startsWith('women')
                ? 'female'
                : 'male',
            },
          ],
          age_range_description: [{ value: String(attrs.age_group || 'Adult') }],
          model_name: [{ value: String(attrs.model_name || product.title) }],
          fabric_type: [{ value: String(attrs.fabric || '100% Lambskin Leather') }],
          outer_material_type: [{ value: String(attrs.material || 'Leather') }],
          inner_material_type: [{ value: String(attrs.lining || 'Polyester') }],
          pattern_type: [{ value: String(meta.pattern || 'Solid') }],
          closure_type: closureTypes.map((c) => ({ value: String(c) })),
          coat_silhouette_type: [{ value: String(attrs.coat_silhouette_type || 'Overcoat') }],
          collar_style: [{ value: String(attrs.collar_type || attrs.collar || 'Notch Collar') }],
          sleeve_type: [{ value: String(attrs.sleeve_length || 'Long Sleeve') }],
          pocket_description: pockets.map((p) => ({ value: String(p) })),
          special_feature: specialFeatures.map((f) => ({ value: String(f) })),
        },
        child_variants: (product.variants ?? []).map((v) => {
          const colorInfo = variantColor(v)
          const sizeInfo = variantSize(v)
          const colorName = colorInfo.colorName
          const colorMap = colorInfo.colorMap
          const sizeKey = sizeInfo.sizeKey
          const sizeVal = sizeInfo.sizeValue
          const multiPrices = resolveVariantMultiCurrencyPrices(v)

          const imageLocators: Record<string, { media_location: string }> = {}
          if (images[0]) {
            imageLocators.main_product_image_locator = { media_location: images[0] }
          }
          images.slice(1, 9).forEach((imgUrl, idx) => {
            imageLocators[`other_product_image_locator_${idx + 1}`] = { media_location: imgUrl }
          })

          return {
            sku: v.sku,
            productType,
            prices: multiPrices,
            attributes: {
              item_name: [
                {
                  value: `${brand.name} ${product.title} - ${colorName} ${sizeKey}`.slice(0, 200),
                  language_tag: 'en_US',
                },
              ],
              brand: [{ value: brand.name }],
              parentage_level: [{ value: 'child' }],
              child_parent_sku_relationship: [
                { child_relationship_type: 'variation', parent_sku: parentSku },
              ],
              variation_theme: [{ name: 'SIZE_NAME/COLOR_NAME' }],
              color: [{ value: colorName, language_tag: 'en_US' }],
              color_map: [{ value: colorMap }],
              size: [{ value: sizeKey, language_tag: 'en_US' }],
              size_map: [{ value: sizeKey }],
              apparel_size: [
                {
                  size_system: 'as1',
                  size_class: 'alpha',
                  size: sizeVal.toLowerCase(),
                  body_type: String(attrs.size_type || 'regular').toLowerCase(),
                },
              ],
              purchasable_offer: multiPrices.map((mp) => ({
                currency: mp.currency_code,
                our_price: [{ schedule: [{ value_with_tax: mp.amount }] }],
              })),
              list_price: multiPrices.map((mp) => ({
                currency: mp.currency_code,
                value: mp.amount,
              })),
              fulfillment_availability: [
                {
                  fulfillment_channel_code: 'DEFAULT',
                  quantity: Number(v.stockOnHand ?? 25),
                },
              ],
              ...imageLocators,
            },
          }
        }),
      }
    })

    return {
      platform: 'amazon',
      schema_version: 'SP_API_LISTINGS_ITEM_2021_08_01',
      generated_at: new Date().toISOString(),
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        reg_no: brand.regNo ?? null,
        serial_no: brand.serialNo ?? null,
      },
      feeds,
    }
  }

  static transformForEbay(products: Product[], brand: Brand): Record<string, unknown> {
    const itemGroups = products.map((product) => {
      const meta = (product.metadata ?? {}) as Record<string, any>
      const attrs = (meta.attributes ?? {}) as Record<string, any>
      const catMeta = CategorySyncService.extractCategoryMetadata(product.category)
      const images: string[] = Array.isArray(product.images) ? product.images : []
      const groupKey = String(meta.structuredCode || product.skuPrefix || product.id)

      const ebayTitle = channelTitle(product, 'ebay')
      const ebaySubtitle = String(product.subTitle ?? '').slice(0, 55)
      const ebayDescription = channelDescription(product, 'ebay')

      const colorSet = new Set<string>()
      const sizeSet = new Set<string>()
      for (const v of product.variants ?? []) {
        const vAttr = (v.attributes ?? {}) as Record<string, any>
        if (vAttr.color) colorSet.add(String(vAttr.color))
        if (vAttr.size) sizeSet.add(String(vAttr.size))
      }

      const inventoryItems = (product.variants ?? []).map((v) => {
        const colorName = variantColor(v).colorName
        const sizeVal = variantSize(v).sizeValue
        return {
          sku: v.sku,
          locale: 'en_US',
          condition: 'NEW',
          product: {
            title: ebayTitle,
            subtitle: ebaySubtitle || undefined,
            description: ebayDescription,
            brand: brand.name,
            mpn: v.sku,
            imageUrls: images,
            aspects: {
              'Brand': [brand.name],
              'Color': [colorName],
              'Size': [sizeVal],
              'Size Type': [String(attrs.size_type || 'Regular')],
              'Type': [product.type || 'Coat'],
              'Style': [product.type || 'Duster Coat'],
              'Department': [String(meta.genderLabel || 'Men')],
              'Outer Shell Material': [String(attrs.material || 'Leather')],
              'Fabric Type': [String(attrs.fabric || 'Lambskin Leather')],
              'Lining Material': [String(attrs.lining || 'Polyester')],
              'Closure': [String(attrs.closure || 'Button')],
              'Pattern': [String(meta.pattern || 'Solid')],
              'Garment Care': [String(attrs.care_instructions || 'Dry Clean Only')],
            },
          },
          availability: {
            shipToLocationAvailability: {
              quantity: Number(v.stockOnHand ?? 25),
            },
          },
        }
      })

      const offers = (product.variants ?? []).map((v) => {
        const multiPrices = resolveVariantMultiCurrencyPrices(v)
        const priceNum = usdVariantAmount(v, multiPrices)
        return {
          sku: v.sku,
          marketplaceId: 'EBAY_US',
          format: 'FIXED_PRICE',
          availableQuantity: Number(v.stockOnHand ?? 25),
          categoryId: String(catMeta.ebay_category_id || '57988'),
          listingDescription: ebayDescription,
          pricingSummary: {
            price: {
              currency: multiPrices[0]?.currency_code ?? 'USD',
              value: priceNum.toFixed(2),
            },
            multiCurrencyPrices: multiPrices,
          },
          merchantLocationKey: 'PRIMARY_WAREHOUSE',
        }
      })

      return {
        inventoryItemGroupKey: groupKey,
        inventoryItemGroup: {
          title: ebayTitle,
          subtitle: ebaySubtitle || undefined,
          description: ebayDescription,
          imageUrls: images,
          variantSKUs: (product.variants ?? []).map((v) => v.sku),
          variesBy: {
            aspectsImageVariesBy: ['Color'],
            specifications: [
              { name: 'Color', values: Array.from(colorSet) },
              { name: 'Size', values: Array.from(sizeSet) },
            ],
          },
        },
        inventoryItems,
        offers,
      }
    })

    return {
      platform: 'ebay',
      schema_version: 'EBAY_SELL_INVENTORY_V1',
      generated_at: new Date().toISOString(),
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
      },
      item_groups: itemGroups,
    }
  }

  static transformForEtsy(products: Product[], brand: Brand): Record<string, unknown> {
    const listings = products.map((product) => {
      const meta = (product.metadata ?? {}) as Record<string, any>
      const attrs = (meta.attributes ?? {}) as Record<string, any>
      const catMeta = CategorySyncService.extractCategoryMetadata(product.category)
      const images: string[] = Array.isArray(product.images) ? product.images : []
      const rawTags: string[] = Array.isArray(product.tags) ? product.tags : []

      const etsyTags = Array.from(new Set([brand.name, ...rawTags, product.type || 'leather coat']))
        .map((t) => String(t).trim().slice(0, 20))
        .filter(Boolean)
        .slice(0, 13)

      const materials = [
        attrs.material || 'Leather',
        attrs.fabric || '100% Lambskin Leather',
        attrs.lining || 'Polyester',
        attrs.hardware || 'Silver Tone Hardware',
      ]
        .map((m) => String(m).trim())
        .filter(Boolean)

      const firstPrice = usdVariantAmount(
        product.variants[0],
        resolveVariantMultiCurrencyPrices(product.variants[0])
      )
      const totalStock = (product.variants ?? []).reduce(
        (acc, v) => acc + Number(v.stockOnHand ?? 0),
        0
      )

      return {
        title: channelTitle(product, 'etsy'),
        description: channelDescription(product, 'etsy'),
        price: firstPrice,
        quantity: Math.max(1, totalStock),
        who_made: 'i_did',
        when_made: 'made_to_order',
        taxonomy_id: Number(catMeta.etsy_taxonomy_id || 15834),
        is_supply: false,
        should_auto_renew: true,
        tags: etsyTags,
        materials,
        images,
        brand: brand.name,
        inventory: {
          products: (product.variants ?? []).map((v) => {
            const colorName = variantColor(v).colorName
            const sizeKey = variantSize(v).sizeKey
            const multiPrices = resolveVariantMultiCurrencyPrices(v)
            const priceNum = usdVariantAmount(v, multiPrices)
            return {
              sku: v.sku,
              property_values: [
                {
                  property_id: 200,
                  property_name: 'Primary color',
                  values: [colorName],
                },
                {
                  property_id: 100,
                  property_name: 'Size',
                  values: [sizeKey],
                },
              ],
              offerings: [
                {
                  price: priceNum,
                  prices: multiPrices,
                  quantity: Number(v.stockOnHand ?? 25),
                  is_enabled: true,
                },
              ],
            }
          }),
          price_on_property: [100],
          quantity_on_property: [200, 100],
          sku_on_property: [200, 100],
        },
      }
    })

    return {
      platform: 'etsy',
      schema_version: 'ETSY_OPEN_API_V3',
      generated_at: new Date().toISOString(),
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
      },
      listings,
    }
  }
}
