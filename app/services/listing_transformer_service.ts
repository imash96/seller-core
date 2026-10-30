import { DateTime } from 'luxon'
import Brand from '#models/brand'
import Product from '#models/product'
import type ProductVariant from '#models/product_variant'
import ChannelListing from '#models/channel_listing'
import SellerAccount from '#models/seller_account'
import SalesChannel from '#models/sales_channel'
import { CategorySyncService } from './category_sync_service.js'
import type { ListingPlatform } from '../types/catalog_pipeline.js'

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

export class ListingTransformerService {
  /**
   * Ensures a fallback SellerAccount exists for the requested platform (`medusa`, `amazon`, `ebay`, `etsy`)
   * so generated listings can always be stored in `channel_listings` and shown on `/listings`!
   */
  static async resolveOrCreateSellerAccount(
    userId: string,
    platform: ListingPlatform,
    explicitSellerAccountId?: string | null
  ): Promise<SellerAccount> {
    if (explicitSellerAccountId) {
      const found = await SellerAccount.query()
        .where('userId', userId)
        .andWhere('id', explicitSellerAccountId)
        .first()
      if (found) return found
    }

    const platformCodeMap: Record<ListingPlatform, string> = {
      medusa: 'direct',
      amazon: 'amazon',
      ebay: 'ebay',
      etsy: 'etsy',
    }
    const targetCode = platformCodeMap[platform] || 'direct'

    const existingAccounts = await SellerAccount.query()
      .where('userId', userId)
      .preload('salesChannel')
    const matched = existingAccounts.find(
      (sa) =>
        sa.accountName.toLowerCase().includes(platform) ||
        sa.salesChannel?.code?.toLowerCase() === targetCode
    )
    if (matched) return matched

    let channel = await SalesChannel.query().where('code', targetCode).first()
    if (!channel) {
      channel = await SalesChannel.query().first()
    }
    if (!channel) {
      channel = await SalesChannel.create({
        code: targetCode,
        name: platform.toUpperCase(),
        channelType: platform === 'medusa' ? 'direct_webstore' : 'marketplace',
        isActive: true,
      })
    }

    const labelMap: Record<ListingPlatform, string> = {
      medusa: 'Medusa Website Storefront',
      amazon: 'Amazon North America (SP-API)',
      ebay: 'eBay US Store (Inventory API)',
      etsy: 'Etsy Global Shop (Open API v3)',
    }

    return await SellerAccount.create({
      userId,
      salesChannelId: channel.id,
      accountName: labelMap[platform] || `${platform.toUpperCase()} Store`,
      externalSellerId: `${platform.toUpperCase()}-STORE`,
      marketplaceRegion: 'US',
      defaultCurrency: 'USD',
      status: 'active',
      healthStatus: 'healthy',
    })
  }

  /**
   * Stage 4: Links one or more `Product` + `ProductVariant[]` records with a selected `Brand`,
   * transforms them into the target e-commerce platform schema(s) (`medusa`, `amazon`, `ebay`, `etsy`),
   * and persists `ChannelListing` records in PostgreSQL so they appear on `/listing` grouped by SKU.
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
      assignBrandToProduct = true,
      persistChannelListings = true,
      publicationStatus = 'unpublished',
    } = params

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

    const queriedProducts = await prodQuery
    const products = queriedProducts.filter((p) => (p.variants ?? []).length > 0)
    if (products.length === 0) {
      throw new Error('No products with variants found to transform into platform listings.')
    }

    if (assignBrandToProduct) {
      for (const product of products) {
        product.brandId = brand.id
        await product.save()
      }
    }

    const targetPlatforms: ListingPlatform[] =
      Array.isArray(platforms) && platforms.length > 0 ? platforms : [platform]

    let listingsPersisted = 0
    let totalVariants = 0
    const payloadsByPlatform: Record<string, Record<string, unknown>> = {}

    for (const plat of targetPlatforms) {
      const platPayload = this.transformForPlatform(plat, products, brand)
      payloadsByPlatform[plat] = platPayload

      if (persistChannelListings) {
        const sellerAccount = await this.resolveOrCreateSellerAccount(
          userId,
          plat,
          targetPlatforms.length === 1 ? sellerAccountId : null
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

          const channelTitle =
            plat === 'ebay'
              ? product.title80 || product.title75 || product.title
              : plat === 'etsy'
                ? product.title75 || product.title80 || product.title
                : `${brand.name} ${product.title}`.slice(0, 200)

          const channelDescription =
            plat === 'amazon'
              ? product.shortDescription || product.description
              : plat === 'ebay' || plat === 'etsy'
                ? product.extendedDescription || product.description
                : product.description

          for (const variant of product.variants ?? []) {
            const skuPayload = this.buildSingleVariantPlatformPayload(
              plat,
              product,
              variant,
              brand,
              catMeta
            )
            const extId = `${plat.toUpperCase()}-${brand.slug.toUpperCase()}-${variant.sku}`
            const existing = await ChannelListing.query()
              .where('userId', userId)
              .andWhere('sellerAccountId', sellerAccount.id)
              .andWhere('productVariantId', variant.id)
              .first()

            const listing = existing ?? new ChannelListing()
            listing.userId = userId
            listing.sellerAccountId = sellerAccount.id
            listing.productId = product.id
            listing.productVariantId = variant.id
            listing.externalListingId = existing?.externalListingId || extId
            listing.externalVariantId = variant.sku
            listing.externalSku = variant.sku
            listing.channelTitle =
              `${channelTitle} - ${(variant.attributes as any)?.color_name || ''} / ${(variant.attributes as any)?.size_key || ''}`.slice(
                0,
                500
              )
            listing.channelDescription = channelDescription ?? null
            listing.channelCategoryId = String(channelCatId)
            listing.currencyCode = variant.currencyCode || 'USD'
            listing.listedPrice = Number(variant.retailPrice || 239.99).toFixed(2)
            listing.allocatedQuantity = Number(variant.stockOnHand || 25)
            listing.listingStatus = publicationStatus === 'published' ? 'active' : 'draft'
            listing.publicationStatus = publicationStatus
            listing.syncStatus = publicationStatus === 'published' ? 'synced' : 'pending'
            listing.lastSyncedAt = publicationStatus === 'published' ? DateTime.now() : null
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

  /**
   * Publishes a single `ChannelListing` on its target platform (`publicationStatus = 'published'`,
   * `listingStatus = 'active'`, `syncStatus = 'synced'`, `lastSyncedAt = now`).
   */
  static async publishListingOnPlatform(params: {
    userId: string
    listingId: string
  }): Promise<ChannelListing> {
    const listing = await ChannelListing.query()
      .where('userId', params.userId)
      .andWhere('id', params.listingId)
      .preload('product')
      .preload('productVariant')
      .preload('sellerAccount')
      .firstOrFail()

    listing.listingStatus = 'active'
    listing.publicationStatus = 'published'
    listing.syncStatus = 'synced'
    listing.lastSyncedAt = DateTime.now()
    listing.lastSyncError = null
    await listing.save()
    return listing
  }

  /**
   * Publishes all platform listings sharing the same Variant SKU (`externalSku`) across all platforms.
   */
  static async publishSkuAcrossPlatforms(params: { userId: string; sku: string }): Promise<number> {
    const listings = await ChannelListing.query()
      .where('userId', params.userId)
      .andWhere('externalSku', params.sku)

    for (const listing of listings) {
      listing.listingStatus = 'active'
      listing.publicationStatus = 'published'
      listing.syncStatus = 'synced'
      listing.lastSyncedAt = DateTime.now()
      listing.lastSyncError = null
      await listing.save()
    }
    return listings.length
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

  /**
   * Builds a per-variant-SKU transformed payload stored inside `ChannelListing.channelAttributes.transformedPayload`
   * so every SKU on `/listings` can preview or download its exact platform JSON.
   */
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
    const colorName = String(vAttr.color_name || vAttr.color || 'Black')
    const colorMap = String(vAttr.color_map || colorName)
    const sizeKey = String(vAttr.size_key || vAttr.size || 'Medium')
    const sizeVal = String(vAttr.size_value || vAttr.size_code || 'M')
    const priceNum = Number(variant.retailPrice || 239.99)
    const images: string[] = Array.isArray(product.images) ? product.images : []

    if (platform === 'amazon') {
      return {
        platform: 'amazon',
        schema: 'SP_API_LISTINGS_ITEM_2021_08_01',
        sku: variant.sku,
        parent_sku: pMeta.structuredCode || product.skuPrefix,
        productType: (product.type || 'COAT').toUpperCase().includes('COAT') ? 'COAT' : 'OUTERWEAR',
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
              value: (product.shortDescription || product.description || '').slice(0, 500),
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
          purchasable_offer: [
            {
              currency: variant.currencyCode || 'USD',
              our_price: [{ schedule: [{ value_with_tax: priceNum }] }],
            },
          ],
          list_price: [{ currency: variant.currencyCode || 'USD', value: priceNum }],
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
        inventoryItem: {
          sku: variant.sku,
          condition: 'NEW',
          product: {
            title: (product.title80 || product.title75 || product.title).slice(0, 80),
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
          listingDescription: (product.extendedDescription || product.description || '').slice(
            0,
            3000
          ),
          pricingSummary: {
            price: { currency: variant.currencyCode || 'USD', value: priceNum.toFixed(2) },
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
        title: (product.title75 || product.title).slice(0, 140),
        brand: brand.name,
        property_values: [
          { property_id: 200, property_name: 'Primary color', values: [colorName] },
          { property_id: 100, property_name: 'Size', values: [sizeKey] },
        ],
        offering: {
          price: priceNum,
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
        prices: [
          {
            currency_code: (variant.currencyCode || 'USD').toLowerCase(),
            amount: priceNum,
            amount_minor: Math.round(priceNum * 100),
          },
        ],
        options: [
          { option: 'Color', value: colorName },
          { option: 'Size', value: sizeKey },
        ],
        metadata: vAttr,
      },
    }
  }

  /**
   * 1. Website / Medusa.js Admin Product Schema (`POST /admin/products`)
   */
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
        if (vAttr.color_name || vAttr.color) colorSet.add(String(vAttr.color_name || vAttr.color))
        if (vAttr.size_key || vAttr.size) sizeSet.add(String(vAttr.size_key || vAttr.size))
      }

      const handle = `${brand.slug}-${product.skuPrefix || product.slug}-${product.title}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      return {
        title: product.title,
        subtitle: product.subTitle ?? product.subTitle125 ?? null,
        description: product.description ?? product.shortDescription ?? '',
        handle,
        is_giftcard: false,
        discountable: true,
        status: 'published',
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
          const vAttr = (v.attributes ?? {}) as Record<string, any>
          const colorName = String(vAttr.color_name || vAttr.color || 'Black')
          const sizeKey = String(vAttr.size_key || vAttr.size || 'Medium')
          const priceDecimal = Number(v.retailPrice || 239.99)
          return {
            title: `${colorName} / ${sizeKey}`,
            sku: v.sku,
            barcode: v.barcodeUpcEan ?? null,
            ean: v.barcodeUpcEan ?? null,
            inventory_quantity: Number(v.stockOnHand ?? 25),
            manage_inventory: true,
            allow_backorder: false,
            prices: [
              {
                currency_code: (v.currencyCode || 'USD').toLowerCase(),
                amount: priceDecimal,
                amount_minor: Math.round(priceDecimal * 100),
              },
            ],
            options: [
              { option: 'Color', value: colorName },
              { option: 'Size', value: sizeKey },
            ],
            metadata: {
              color_code: vAttr.color_code ?? 'BLK',
              color_map: vAttr.color_map ?? colorName,
              size_code: vAttr.size_code ?? vAttr.size_value ?? 'M',
              size_key: sizeKey,
              material_code: vAttr.material_code ?? 'NP',
              fit_code: vAttr.fit_code ?? 'RG',
            },
          }
        }),
        metadata: {
          brand_id: brand.id,
          brand_name: brand.name,
          brand_slug: brand.slug,
          sku_prefix: product.skuPrefix,
          structured_code: meta.structuredCode ?? product.skuPrefix,
          title_75: product.title75,
          title_80: product.title80,
          sub_title_125: product.subTitle125,
          short_description: product.shortDescription,
          extended_description: product.extendedDescription,
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

  /**
   * 2. Amazon Selling Partner API (`LISTINGS_ITEM` Parent-Child Feed)
   */
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
              value: (product.shortDescription || product.description || '').slice(0, 500),
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
          const vAttr = (v.attributes ?? {}) as Record<string, any>
          const colorName = String(vAttr.color_name || vAttr.color || 'Black')
          const colorMap = String(vAttr.color_map || colorName)
          const sizeKey = String(vAttr.size_key || vAttr.size || 'Medium')
          const sizeVal = String(vAttr.size_value || vAttr.size_code || 'M')
          const priceNum = Number(v.retailPrice || 239.99)

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
              purchasable_offer: [
                {
                  currency: v.currencyCode || 'USD',
                  our_price: [{ schedule: [{ value_with_tax: priceNum }] }],
                },
              ],
              list_price: [{ currency: v.currencyCode || 'USD', value: priceNum }],
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

  /**
   * 3. eBay Sell Inventory API (`inventoryItemGroup` + `inventoryItems` + `offers`)
   */
  static transformForEbay(products: Product[], brand: Brand): Record<string, unknown> {
    const itemGroups = products.map((product) => {
      const meta = (product.metadata ?? {}) as Record<string, any>
      const attrs = (meta.attributes ?? {}) as Record<string, any>
      const catMeta = CategorySyncService.extractCategoryMetadata(product.category)
      const images: string[] = Array.isArray(product.images) ? product.images : []
      const groupKey = String(meta.structuredCode || product.skuPrefix || product.id)

      const ebayTitle = (product.title80 || product.title75 || product.title).slice(0, 80)
      const ebaySubtitle = (product.subTitle || product.subTitle125 || '').slice(0, 55)
      const ebayDescription = (
        product.extendedDescription ||
        product.description ||
        product.shortDescription ||
        ''
      ).slice(0, 3000)

      const colorValues = Array.from(
        new Set(
          (product.variants ?? []).map((v) => {
            const a = (v.attributes ?? {}) as Record<string, any>
            return String(a.color_name || a.color || 'Black')
          })
        )
      )
      const sizeValues = Array.from(
        new Set(
          (product.variants ?? []).map((v) => {
            const a = (v.attributes ?? {}) as Record<string, any>
            return String(a.size_value || a.size_code || a.size || 'M')
          })
        )
      )

      const department = String(attrs.gender || 'mens')
        .toLowerCase()
        .startsWith('women')
        ? 'Women'
        : 'Men'

      return {
        inventoryItemGroupKey: groupKey,
        catalogKey: product.skuPrefix,
        title: ebayTitle,
        subtitle: ebaySubtitle || undefined,
        description: ebayDescription,
        imageUrls: images,
        aspects: {
          'Brand': [brand.name],
          'Type': [product.type || 'Coat'],
          'Style': [String(attrs.coat_silhouette_type || product.type || 'Overcoat')],
          'Outer Shell Material': [String(attrs.material || 'Leather')],
          'Fabric Type': [String(attrs.fabric || '100% Lambskin Leather')],
          'Lining Material': [String(attrs.lining || 'Polyester')],
          'Closure': Array.isArray(attrs.closure_type)
            ? attrs.closure_type
            : [String(attrs.closure || 'Button')],
          'Collar Style': [String(attrs.collar_type || 'Notch Collar')],
          'Pattern': [String(meta.pattern || 'Solid')],
          'Department': [department],
          'Size Type': [String(attrs.size_type || 'Regular')],
          'Sleeve Length': [String(attrs.sleeve_length || 'Long Sleeve')],
          'Features': Array.isArray(attrs.special_feature) ? attrs.special_feature : [],
          'Model': [String(attrs.model_name || product.title)],
        },
        variesBy: {
          aspectsImageVariesBy: ['Color'],
          specifications: [
            { name: 'Color', values: colorValues },
            { name: 'Size', values: sizeValues },
          ],
        },
        variantSKUs: (product.variants ?? []).map((v) => v.sku),
        inventoryItems: (product.variants ?? []).map((v) => {
          const vAttr = (v.attributes ?? {}) as Record<string, any>
          const colorName = String(vAttr.color_name || vAttr.color || 'Black')
          const sizeVal = String(vAttr.size_value || vAttr.size_code || 'M')
          return {
            sku: v.sku,
            condition: 'NEW',
            product: {
              title: ebayTitle,
              brand: brand.name,
              mpn: v.sku,
              imageUrls: images,
              aspects: {
                'Brand': [brand.name],
                'Color': [colorName],
                'Size': [sizeVal],
                'Size Type': [String(attrs.size_type || 'Regular')],
                'Department': [department],
                'Type': [product.type || 'Coat'],
                'Outer Shell Material': [String(attrs.material || 'Leather')],
              },
            },
            availability: {
              shipToLocationAvailability: {
                quantity: Number(v.stockOnHand ?? 25),
              },
            },
          }
        }),
        offers: (product.variants ?? []).map((v) => ({
          sku: v.sku,
          marketplaceId: 'EBAY_US',
          format: 'FIXED_PRICE',
          categoryId: String(catMeta.ebay_category_id || '57988'),
          listingDescription: ebayDescription,
          pricingSummary: {
            price: {
              currency: v.currencyCode || 'USD',
              value: Number(v.retailPrice || 239.99).toFixed(2),
            },
          },
          availableQuantity: Number(v.stockOnHand ?? 25),
        })),
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

  /**
   * 4. Etsy Open API v3 (`createDraftListing` + `updateListingInventory`)
   */
  static transformForEtsy(products: Product[], brand: Brand): Record<string, unknown> {
    const listings = products.map((product) => {
      const meta = (product.metadata ?? {}) as Record<string, any>
      const attrs = (meta.attributes ?? {}) as Record<string, any>
      const catMeta = CategorySyncService.extractCategoryMetadata(product.category)
      const prodTags: string[] = Array.isArray(product.tags) ? product.tags : []
      const catTags: string[] = Array.isArray(catMeta.tags) ? catMeta.tags : []
      const mergedTags = Array.from(new Set([...prodTags, ...catTags, brand.name])).slice(0, 13)

      return {
        catalog_key: product.skuPrefix,
        draft_listing: {
          title: (product.title75 || product.title80 || product.title).slice(0, 140),
          description: (
            product.extendedDescription ||
            product.description ||
            product.shortDescription ||
            ''
          ).slice(0, 3000),
          taxonomy_id: Number(catMeta.etsy_taxonomy_id || 15834),
          who_made: 'i_did',
          when_made: 'made_to_order',
          is_supply: false,
          materials: [
            String(attrs.material || 'Leather'),
            String(attrs.fabric || '100% Lambskin Leather'),
            String(attrs.lining || 'Polyester'),
          ].filter(Boolean),
          tags: mergedTags,
          images: Array.isArray(product.images) ? product.images : [],
          brand_partner: brand.name,
        },
        inventory: {
          products: (product.variants ?? []).map((v) => {
            const vAttr = (v.attributes ?? {}) as Record<string, any>
            const colorName = String(vAttr.color_name || vAttr.color || 'Black')
            const sizeKey = String(vAttr.size_key || vAttr.size || 'Medium')
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
                  price: Number(v.retailPrice || 239.99),
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
