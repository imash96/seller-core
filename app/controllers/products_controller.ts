import fs from 'node:fs/promises'
import type { HttpContext } from '@adonisjs/core/http'
import Brand from '#models/brand'
import ProductCategory from '#models/product_category'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import ChannelListing from '#models/channel_listing'
import SellerAccount from '#models/seller_account'
import { RbacService } from '#services/rbac_service'
import { CatalogService, type GeneratedProductPreview } from '../services/catalog_service.js'
import { CategorySyncService } from '../services/category_sync_service.js'
import { ListingTransformerService } from '../services/listing_transformer_service.js'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import {
  MAIN_CATALOG_CONFIG,
  SAMPLE_CATALOG_JSON,
  resolveGenderCode,
  resolveTierPrice,
} from '../data/catalog_config/index.js'
import type {
  CatalogJsonPayload,
  ListingPlatform,
  PriceTierCode,
  SkuFormatMode,
} from '../types/catalog_pipeline.js'
import {
  type MedusaVariantPrice,
  buildMultiCurrencyPriceArray,
  money,
  normalizePriceMoney,
  normalizePriceMoneyArray,
  resolvePriceForCurrency,
} from '../types/price.js'
import {
  createProductValidator,
  updateProductValidator,
  createVariantValidator,
  updateBrandValidator,
  updateCategoryValidator,
} from '#validators/operations'

function wantsJson(request: HttpContext['request']): boolean {
  const accept = String(request.header('accept') || '')
  if (accept.includes('application/json') && !request.header('x-inertia')) {
    return true
  }
  return false
}

export default class ProductsController {
  /**
   * GET /products
   */
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const canReadIntegrations = await RbacService.hasPermission(
      user,
      'integrations.read',
      'integrations'
    )
    const [products, channelListings, savedViews, sharedLookups] = await Promise.all([
      Product.query()
        .where('userId', user.id)
        .preload('brand', (q) => q.where('userId', user.id))
        .preload('category', (q) => q.where('userId', user.id))
        .preload('variants', (q) =>
          q
            .where('userId', user.id)
            .preload('variantAttributes', (r) => r.where('userId', user.id))
            .preload('listings', (r) => r.where('userId', user.id))
        )
        .orderBy('createdAt', 'desc')
        .limit(100),
      ChannelListing.query()
        .where('userId', user.id)
        .preload('productVariant', (q) =>
          q.where('userId', user.id).preload('product', (pq) => pq.where('userId', user.id))
        )
        .if(canReadIntegrations, (q) =>
          q.preload('sellerAccount', (r) => r.where('userId', user.id))
        )
        .orderBy('createdAt', 'desc')
        .limit(200),
      WorkspaceLookupService.savedViewsFor(user.id, 'products'),
      WorkspaceLookupService.lookups(user),
    ])
    return inertia.render('products', {
      ...sharedLookups,
      products: products.map((p) => p.serialize()),
      channelListings: channelListings.map((c) => c.serialize()),
      savedViews,
      catalogConfig: MAIN_CATALOG_CONFIG,
      sampleCatalogJson: SAMPLE_CATALOG_JSON,
    })
  }

  /**
   * GET /inventory
   */
  async inventoryPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const canReadIntegrations = await RbacService.hasPermission(
      user,
      'integrations.read',
      'integrations'
    )
    const [products, channelListings, savedViews, sharedLookups] = await Promise.all([
      Product.query()
        .where('userId', user.id)
        .preload('brand', (q) => q.where('userId', user.id))
        .preload('category', (q) => q.where('userId', user.id))
        .preload('variants', (q) =>
          q
            .where('userId', user.id)
            .preload('variantAttributes', (r) => r.where('userId', user.id))
            .preload('listings', (r) => r.where('userId', user.id))
        )
        .orderBy('createdAt', 'desc')
        .limit(100),
      ChannelListing.query()
        .where('userId', user.id)
        .preload('productVariant', (q) =>
          q.where('userId', user.id).preload('product', (pq) => pq.where('userId', user.id))
        )
        .if(canReadIntegrations, (q) =>
          q.preload('sellerAccount', (r) => r.where('userId', user.id))
        )
        .orderBy('createdAt', 'desc')
        .limit(200),
      WorkspaceLookupService.savedViewsFor(user.id, 'products'),
      WorkspaceLookupService.lookups(user),
    ])
    return inertia.render('inventory', {
      ...sharedLookups,
      products: products.map((p) => p.serialize()),
      channelListings: channelListings.map((c) => c.serialize()),
      savedViews,
    })
  }

  /**
   * GET /catalog & GET /catalogs
   */
  async catalogsPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const canReadIntegrations = await RbacService.hasPermission(
      user,
      'integrations.read',
      'integrations'
    )
    const [catalogItems, products, channelListings, savedViews, sharedLookups] = await Promise.all([
      CatalogService.listCatalogItems(user.id),
      Product.query()
        .where('userId', user.id)
        .preload('brand', (q) => q.where('userId', user.id))
        .preload('category', (q) => q.where('userId', user.id))
        .preload('variants', (q) =>
          q
            .where('userId', user.id)
            .preload('variantAttributes', (r) => r.where('userId', user.id))
            .preload('listings', (r) => r.where('userId', user.id))
        )
        .orderBy('createdAt', 'desc')
        .limit(100),
      ChannelListing.query()
        .where('userId', user.id)
        .preload('productVariant', (q) =>
          q.where('userId', user.id).preload('product', (pq) => pq.where('userId', user.id))
        )
        .if(canReadIntegrations, (q) =>
          q.preload('sellerAccount', (r) => r.where('userId', user.id))
        )
        .orderBy('createdAt', 'desc')
        .limit(200),
      WorkspaceLookupService.savedViewsFor(user.id, 'products'),
      WorkspaceLookupService.lookups(user),
    ])

    const enrichedCatalogItems = catalogItems.map((c) => {
      const raw = c.serialize()
      const varSpec = (c.variantsSpec ?? {}) as {
        color?: string[]
        size?: string[]
        size_group?: string
      }
      const colors = Array.isArray(varSpec.color) ? varSpec.color : ['BLK']
      const sizes = Array.isArray(varSpec.size) ? varSpec.size : ['S', 'M', 'L', 'XL']
      const genderInfo = resolveGenderCode(c.gender)
      const tierCode = (c.priceTier || '01') as PriceTierCode
      // catalog_items is USD-only; the multi-currency array is derived here for display.
      const basePriceUsd = Number(c.basePriceUsd || resolveTierPrice(tierCode, 3))
      const prices = buildMultiCurrencyPriceArray(basePriceUsd)
      const attrs = (c.attributes ?? {}) as Record<string, any>
      const category = c.resolvedCategory as unknown as
        { name?: string; slug?: string; taxonomyPath?: string } | undefined

      return {
        ...raw,
        skuCode: c.catalogKey,
        catalogKey: c.catalogKey,
        structuredBaseCode: c.structuredCode,
        structuredCode: c.structuredCode,
        productType: c.type || 'Duster Coat',
        // Taxonomy is relational; the codes are derived SKU-scheme attributes.
        categoryName: category?.name ?? null,
        categoryHandle: category?.taxonomyPath ?? category?.slug ?? null,
        categoryCode: attrs.category_code ?? null,
        productCode: attrs.product_code ?? null,
        fitCode: attrs.fit_code ?? null,
        type: c.type || 'Duster Coat',
        genderCode: genderInfo.code,
        gender: c.gender,
        leatherCode: attrs.material_code ?? null,
        materialCode: attrs.material_code ?? null,
        lengthCode: 'RG',
        priceTierCode: tierCode,
        priceTier: tierCode,
        basePriceUsd,
        price: prices,
        prices,
        colorCodes: colors,
        sizeCodes: sizes,
        variantsConfig: {
          color: colors,
          size: sizes,
          sizeGroup: varSpec.size_group || 'alpha',
        },
        estimatedVariantCount: colors.length * sizes.length,
        convertedProductTitle: c.convertedProduct?.title ?? null,
      }
    })

    const modularConfig = {
      skuFormat: MAIN_CATALOG_CONFIG['SKU FORMAT'],
      fileNameFormat: MAIN_CATALOG_CONFIG['FILE NAME'],
      skuExample: MAIN_CATALOG_CONFIG['SKU EXAMPLE'],
      fileExample: MAIN_CATALOG_CONFIG['FILE EXAMPLE'],
      genders: MAIN_CATALOG_CONFIG.GENDER,
      categories: MAIN_CATALOG_CONFIG.Category,
      productCodes: MAIN_CATALOG_CONFIG['PRODUCT CODES'],
      fits: MAIN_CATALOG_CONFIG.FIT,
      lengths: MAIN_CATALOG_CONFIG.LENGTH,
      leatherCodes: MAIN_CATALOG_CONFIG['LEATHER CODES'],
      colorCodes: Object.fromEntries(
        Object.entries(MAIN_CATALOG_CONFIG['COLOR CODES']).map(([k, v]) => [
          k,
          { name: v.colorName, colorMap: v.colorMap },
        ])
      ),
      sizeGroups: Object.keys(MAIN_CATALOG_CONFIG['Size Data']),
      priceTiers: Object.fromEntries(
        Object.entries(MAIN_CATALOG_CONFIG['LIST PRICE']).map(([tier, arr]) => [
          tier,
          {
            label: `Tier ${tier}`,
            currency: 'USD',
            prices: Object.fromEntries(
              arr.map((p, idx) => [
                MAIN_CATALOG_CONFIG['Size Data'].alpha[idx]?.['Size Value'] ?? `S${idx}`,
                p,
              ])
            ),
            multiCurrencyPrices: buildMultiCurrencyPriceArray(
              resolveTierPrice(tier as PriceTierCode, 3)
            ),
          },
        ])
      ),
    }

    return inertia.render('catalogs', {
      ...sharedLookups,
      catalogItems: enrichedCatalogItems,
      products: products.map((p) => p.serialize()),
      channelListings: channelListings.map((c) => c.serialize()),
      savedViews,
      modularConfig,
      catalogConfig: MAIN_CATALOG_CONFIG,
      sampleCatalogJson: SAMPLE_CATALOG_JSON,
    })
  }

  /**
   * GET /listing & GET /listings
   */
  async listingsPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const canReadIntegrations = await RbacService.hasPermission(
      user,
      'integrations.read',
      'integrations'
    )
    const [products, channelListings, savedViews, sharedLookups] = await Promise.all([
      Product.query()
        .where('userId', user.id)
        .preload('brand', (q) => q.where('userId', user.id))
        .preload('category', (q) => q.where('userId', user.id))
        .preload('variants', (q) =>
          q
            .where('userId', user.id)
            .preload('variantAttributes', (r) => r.where('userId', user.id))
            .preload('listings', (r) => r.where('userId', user.id))
        )
        .orderBy('createdAt', 'desc')
        .limit(100),
      ChannelListing.query()
        .where('userId', user.id)
        .preload('productVariant', (vq) =>
          vq.where('userId', user.id).preload('product', (q) =>
            q
              .where('userId', user.id)
              .preload('brand', (r) => r.where('userId', user.id))
              .preload('category', (r) => r.where('userId', user.id))
          )
        )
        .if(canReadIntegrations, (q) =>
          q.preload('sellerAccount', (r) => r.where('userId', user.id).preload('salesChannel'))
        )
        .orderBy('createdAt', 'desc')
        .limit(300),
      WorkspaceLookupService.savedViewsFor(user.id, 'products'),
      WorkspaceLookupService.lookups(user),
    ])

    const enrichedListings = channelListings.map((c) => {
      const raw = c.serialize()
      const attrs = (c.channelAttributes ?? {}) as Record<string, any>
      const platform = String(
        attrs.platform ||
          c.sellerAccount?.salesChannel?.code ||
          (c.sellerAccount as any)?.marketplaceCode ||
          'medusa'
      ).toLowerCase()
      return {
        ...raw,
        platform,
        productTitle: c.product?.title ?? c.channelTitle ?? '—',
        productId: c.product?.id ?? null,
        variantTitle: c.productVariant?.title ?? c.externalSku ?? '—',
        brandName: attrs.brandName || c.product?.brand?.name || 'Artisan Hide',
        categoryName: c.product?.category?.name || 'Outerwear',
        asin: c.productVariant?.asin ?? null,
        transformedPayload: attrs.transformedPayload ?? attrs,
        publishedUrl: attrs.publishedUrl ?? null,
      }
    })

    // Build Grouped-by-SKU structure (`skuGroups`)
    const skuMap = new Map<
      string,
      {
        sku: string
        productVariantId: string
        productId: string
        productTitle: string
        variantTitle: string
        brandName: string
        categoryName: string
        prices: MedusaVariantPrice[]
        stockOnHand: number
        platforms: any[]
      }
    >()

    for (const p of products) {
      for (const v of p.variants ?? []) {
        if (!skuMap.has(v.sku)) {
          const vSer = v.serialize()
          skuMap.set(v.sku, {
            sku: v.sku,
            productVariantId: v.id,
            productId: p.id,
            productTitle: p.title,
            variantTitle: v.title,
            brandName: p.brand?.name ?? 'Brand-Agnostic',
            categoryName: p.category?.name ?? 'Outerwear',
            prices: vSer.prices,
            stockOnHand: Number(v.stockOnHand ?? 0),
            platforms: [],
          })
        }
      }
    }

    for (const l of enrichedListings as Array<Record<string, any>>) {
      const skuKey = String(l.externalSku || 'SKU')
      if (!skuMap.has(skuKey)) {
        const listingPrices: MedusaVariantPrice[] = Array.isArray(l.prices) ? l.prices : []
        const listedMoney = normalizePriceMoney(l.listedPrice, 'USD')
        skuMap.set(skuKey, {
          sku: skuKey,
          productVariantId: String(l.productVariantId ?? ''),
          productId: String(l.productId ?? ''),
          productTitle: String(l.productTitle ?? '—'),
          variantTitle: String(l.variantTitle ?? skuKey),
          brandName: String(l.brandName ?? 'Artisan Hide'),
          categoryName: String(l.categoryName ?? 'Outerwear'),
          prices:
            listingPrices.length > 0
              ? listingPrices
              : buildMultiCurrencyPriceArray(listedMoney.amount),
          stockOnHand: Number(l.allocatedQuantity ?? 0),
          platforms: [],
        })
      }
      const grp = skuMap.get(skuKey)!
      if (l.brandName && grp.brandName === 'Brand-Agnostic') {
        grp.brandName = String(l.brandName)
      }
      grp.platforms.push(l)
    }

    return inertia.render('listings', {
      ...sharedLookups,
      products: products.map((p) => p.serialize()),
      channelListings: enrichedListings,
      skuGroups: Array.from(skuMap.values()),
      savedViews,
      catalogConfig: MAIN_CATALOG_CONFIG,
    })
  }

  /**
   * Stage 1 Endpoint: Medusa-compatible `GET /store/product-categories`
   */
  async medusaCategoriesEndpoint({ response, auth }: HttpContext) {
    const tree = structuredClone(CategorySyncService.getBuiltInMedusaCategories())
    if (auth.user) {
      const categories = await ProductCategory.query()
        .where('userId', auth.user.id)
        .orderBy('sortOrder')
      const byHandle = new Map<string, (typeof tree)[number]>()
      const index = (nodes: typeof tree) => {
        for (const node of nodes) {
          byHandle.set(node.handle, node)
          if (node.category_children) index(node.category_children)
        }
      }
      index(tree)
      const builtInHandles = new Set(byHandle.keys())
      const byId = new Map(categories.map((category) => [category.id, category]))
      for (const category of categories) {
        if (byHandle.has(category.slug)) continue
        const meta = CategorySyncService.extractCategoryMetadata(category)
        const { medusaId, handle, mpath, ...metadata } = meta
        byHandle.set(category.slug, {
          id: medusaId ?? category.id,
          name: category.name,
          handle: handle ?? category.slug,
          mpath,
          rank: category.sortOrder,
          is_active: category.isActive,
          metadata,
          category_children: [],
        })
      }
      for (const category of categories) {
        // Built-in entries are already present in the cloned tree.
        if (builtInHandles.has(category.slug)) continue
        const node = byHandle.get(category.slug)!
        const parent = category.parentCategoryId && byId.get(category.parentCategoryId)
        const parentNode = parent && byHandle.get(parent.slug)
        const siblings = parentNode ? (parentNode.category_children ??= []) : tree
        if (!siblings.some((entry) => entry.handle === node.handle)) siblings.push(node)
      }
    }
    return response.json({ product_categories: tree })
  }

  /**
   * Stage 1 Action: `POST /catalogs/sync-categories`
   */
  async syncMedusaCategories({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const medusaBaseUrl = String(request.input('medusaBaseUrl', '')).trim() || null

    try {
      const { syncedCount, source } = await CategorySyncService.syncFromMedusaEndpoint(
        user.id,
        medusaBaseUrl,
        request.input('source') === 'built-in' ? 'built-in' : 'configured'
      )
      const msg = `Synced ${syncedCount} hierarchical Medusa categories from ${source}.`
      if (wantsJson(request)) {
        return response.json({
          ok: true,
          success: true,
          totalCategories: syncedCount,
          created: syncedCount,
          updated: 0,
          source,
          message: msg,
        })
      }
      session.flash('success', msg)
    } catch (err: any) {
      const msg = err.message || 'Failed to sync Medusa categories.'
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: msg })
      }
      session.flash('error', msg)
    }
    return response.redirect().back()
  }

  /**
   * Stage 2 Action: `POST /catalogs/import-json` & `POST /catalogs/import`
   */
  async importCatalogJson({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const rawCatalogInput = request.input('catalogJson')
    let rawJsonText = typeof rawCatalogInput === 'string' ? rawCatalogInput.trim() : ''
    const uploadedFile = request.file('catalogFile', {
      size: '10mb',
      extnames: ['json'],
    })

    if (uploadedFile && !uploadedFile.isValid) {
      const msg = 'Catalog file must be a JSON file no larger than 10 MB.'
      if (wantsJson(request)) return response.badRequest({ ok: false, error: msg })
      session.flash('error', msg)
      return response.redirect().back()
    }
    if (!rawJsonText && uploadedFile && uploadedFile.tmpPath) {
      rawJsonText = await fs.readFile(uploadedFile.tmpPath, 'utf-8')
    }

    let catalogPayload: CatalogJsonPayload
    try {
      const bodyPayload = request.input('catalogPayload')
      if (bodyPayload && typeof bodyPayload === 'object') {
        catalogPayload = bodyPayload as CatalogJsonPayload
      } else if (rawCatalogInput && typeof rawCatalogInput === 'object') {
        catalogPayload = rawCatalogInput as CatalogJsonPayload
      } else if (rawJsonText) {
        catalogPayload = JSON.parse(rawJsonText) as CatalogJsonPayload
      } else {
        throw new Error('Provide a catalog JSON file or JSON text.')
      }

      if (!catalogPayload || typeof catalogPayload !== 'object') {
        throw new Error('Catalog payload must be a non-null object.')
      }
    } catch (err: any) {
      const msg = `Invalid Catalog JSON syntax: ${err.message || 'Check JSON structure.'}`
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: msg })
      }
      session.flash('error', msg)
      return response.redirect().back()
    }

    const priceTier = (String(request.input('priceTier', '01')).trim() || '01') as PriceTierCode
    const skuFormat = (String(request.input('skuFormat', 'standard')).trim() ||
      'standard') as SkuFormatMode
    const defaultStockOnHand = Number(request.input('defaultStockOnHand', 25))
    const convertImmediately =
      request.input('convertImmediately') !== false &&
      request.input('convertImmediately') !== 'false'

    try {
      const result = await CatalogService.importCatalogJson({
        userId: user.id,
        catalogPayload,
        priceTier,
        skuFormat,
        defaultStockOnHand,
        convertImmediately,
      })

      const msg = convertImmediately
        ? `Catalog imported & converted: ${result.catalogItemsSaved} catalog SKUs, ${result.productsCreated} products, and ${result.variantsCreated} variants created.`
        : `Saved ${result.catalogItemsSaved} Catalog SKU(s) to database. Click "Convert to Product" on any SKU to preview & edit before creating.`

      if (wantsJson(request)) {
        return response.json({
          ok: true,
          success: true,
          message: msg,
          savedCatalogCount: result.catalogItemsSaved,
          ...result,
        })
      }

      session.flash('success', msg)
    } catch (err: any) {
      const msg = err.message || 'Failed to import Catalog JSON.'
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: msg })
      }
      session.flash('error', msg)
    }

    return response.redirect().back()
  }

  /**
   * Catalog CRUD: `POST /catalog-items` (Create) & `POST /catalog-items/:id` (Update)
   */
  async saveCatalogItem({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const id = params.id || request.input('id') || null
    const catalogKey = String(request.input('catalogKey') || request.input('skuCode') || '').trim()
    const title = String(request.input('title', '')).trim()

    if (!catalogKey || !title) {
      const msg = 'Catalog SKU Key and Title are required.'
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: msg })
      }
      session.flash('error', msg)
      return response.redirect().back()
    }

    try {
      const saved = await CatalogService.upsertSingleCatalogItem({
        userId: user.id,
        id,
        catalogKey,
        title,
        subTitle: request.input('subTitle'),
        type: request.input('type') || request.input('productType'),
        gender: request.input('gender') || request.input('genderCode'),
        categoryHandle: request.input('categoryHandle'),
        description: request.input('description'),
        pattern: request.input('pattern'),
        material: request.input('material'),
        fabric: request.input('fabric'),
        lining: request.input('lining'),
        closure: request.input('closure'),
        collar: request.input('collar'),
        hardware: request.input('hardware'),
        coatSilhouetteType: request.input('coatSilhouetteType'),
        collarType: request.input('collarType'),
        sleeveLength: request.input('sleeveLength'),
        sleeveType: request.input('sleeveType'),
        pocketDescription: request.input('pocketDescription'),
        pocketsCsv: request.input('pocketsCsv'),
        sizeType: request.input('sizeType'),
        ageGroup: request.input('ageGroup'),
        careInstructions: request.input('careInstructions'),
        modelName: request.input('modelName'),
        priceTier: (request.input('priceTier') ||
          request.input('priceTierCode') ||
          '01') as PriceTierCode,
        colorsCsv: request.input('colorsCsv') || request.input('colorCodes'),
        sizesCsv: request.input('sizesCsv') || request.input('sizeCodes'),
        imagesCsv: request.input('imagesCsv'),
        tagsCsv: request.input('tagsCsv'),
        bulletsText: request.input('bulletsText') || request.input('featuresLines'),
        keywordsText: request.input('keywordsText'),
        specialFeaturesLines: request.input('specialFeaturesLines'),
      })

      const msg = `Catalog SKU "${saved.catalogKey}" (${saved.title}) saved.`
      if (wantsJson(request)) {
        return response.json({
          ok: true,
          success: true,
          message: msg,
          item: {
            ...saved.serialize(),
            skuCode: saved.catalogKey,
            structuredBaseCode: saved.structuredCode,
          },
        })
      }
      session.flash('success', msg)
    } catch (err: any) {
      const msg = err.message || 'Failed to save catalog SKU.'
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: msg })
      }
      session.flash('error', msg)
    }
    return response.redirect().back()
  }

  /**
   * Catalog CRUD: `POST /catalog-items/:id/delete`
   */
  async deleteCatalogItem({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      await CatalogService.deleteCatalogItem(user.id, params.id)
      if (wantsJson(request)) {
        return response.json({ ok: true, success: true })
      }
      session.flash('success', 'Catalog SKU deleted.')
    } catch (err: any) {
      const msg = err.message || 'Failed to delete catalog SKU.'
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: msg })
      }
      session.flash('error', msg)
    }
    return response.redirect().back()
  }

  /**
   * Stage 3 Preview: `POST /catalog-items/:id/preview`
   */
  async previewCatalogConversion({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const priceTier = (String(request.input('priceTier', '')).trim() || undefined) as
      PriceTierCode | undefined
    const skuFormat = (String(request.input('skuFormat', '')).trim() || undefined) as
      SkuFormatMode | undefined
    const defaultStockOnHand = Number(request.input('defaultStockOnHand', 25))

    try {
      const preview = await CatalogService.buildProductPreviewFromCatalogItem({
        userId: user.id,
        catalogItemId: params.id,
        priceTier,
        skuFormat,
        defaultStockOnHand,
      })
      const normalizedPreview = {
        ...preview,
        skuKey: preview.catalogKey,
        structuredBaseCode: preview.structuredCode,
        productType: preview.type,
        priceTierCode: preview.priceTier,
        variants: preview.variants.map((v, idx) => ({
          ...v,
          sizeCode: v.sizeValue,
          sizeLabel: v.sizeKey,
          manufacturingCost: money(
            Number((v.costPrice.amount * 0.82).toFixed(2)),
            v.costPrice.currency_code
          ),
          packagingCost: money(
            Number((v.costPrice.amount * 0.18).toFixed(2)),
            v.costPrice.currency_code
          ),
          barcode: `299000${idx + 1}`,
        })),
      }
      return response.json({ ok: true, success: true, preview: normalizedPreview })
    } catch (err: any) {
      return response.badRequest({
        ok: false,
        error: err.message || 'Failed to build product preview from catalog SKU.',
      })
    }
  }

  /**
   * Stage 3 Confirm Conversion: `POST /catalog-items/:id/convert`
   */
  async convertCatalogItemToProduct({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      let rawPreview = request.input('preview') as any
      if (typeof rawPreview === 'string') {
        try {
          rawPreview = JSON.parse(rawPreview)
        } catch {
          rawPreview = null
        }
      }
      let preview: GeneratedProductPreview
      if (!rawPreview || typeof rawPreview !== 'object') {
        preview = await CatalogService.buildProductPreviewFromCatalogItem({
          userId: user.id,
          catalogItemId: params.id,
          priceTier: request.input('priceTier') as PriceTierCode,
          skuFormat: request.input('skuFormat') as SkuFormatMode,
          defaultStockOnHand: Number(request.input('defaultStockOnHand', 25)),
        })
      } else {
        preview = {
          ...rawPreview,
          catalogItemId: params.id,
          catalogKey: rawPreview.catalogKey || rawPreview.skuKey || 'SKU1',
          structuredCode: rawPreview.structuredCode || rawPreview.structuredBaseCode || 'MCTDC01',
          type: rawPreview.type || rawPreview.productType || 'Duster Coat',
          priceTier: rawPreview.priceTier || rawPreview.priceTierCode || '01',
          prices: normalizePriceMoneyArray(rawPreview.prices, 239.99),
          variants: Array.isArray(rawPreview.variants)
            ? rawPreview.variants
                .filter((v: any) => v && typeof v === 'object')
                .map((v: any) => ({
                  ...v,
                  sizeValue: v.sizeValue || v.sizeCode || 'M',
                  sizeKey: v.sizeKey || v.sizeLabel || 'Medium',
                  prices: normalizePriceMoneyArray(v.prices, Number(v.retailPrice ?? 239.99)),
                  included: v.included !== false,
                }))
            : [],
        }
      }

      const { product, variantsCreated } = await CatalogService.createProductFromPreview({
        userId: user.id,
        preview,
      })

      const msg = `Converted Catalog SKU "${preview.catalogKey}" → Product "${product.title}" with ${variantsCreated} multi-currency variants!`
      if (wantsJson(request)) {
        return response.json({
          ok: true,
          success: true,
          message: msg,
          productId: product.id,
          variantsCreated,
        })
      }

      session.flash('success', msg)
    } catch (err: any) {
      const msg = err.message || 'Failed to convert Catalog SKU to Product.'
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: msg })
      }
      session.flash('error', msg)
    }

    return response.redirect().back()
  }

  /**
   * Stage 4 Action: `POST /catalogs/generate-listings`
   */
  async generatePlatformListings({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const brandId = String(request.input('brandId', '')).trim()
    const platform = (String(request.input('platform', 'medusa')).trim().toLowerCase() ||
      'medusa') as ListingPlatform

    const rawPlatforms = request.input('platforms')
    const platforms: ListingPlatform[] | undefined = Array.isArray(rawPlatforms)
      ? (rawPlatforms
          .map((p) => String(p).trim().toLowerCase())
          .filter(Boolean) as ListingPlatform[])
      : typeof rawPlatforms === 'string' && rawPlatforms.trim()
        ? (rawPlatforms
            .split(',')
            .map((p) => p.trim().toLowerCase())
            .filter(Boolean) as ListingPlatform[])
        : undefined

    const sellerAccountId = String(request.input('sellerAccountId', '')).trim() || null
    const assignBrandToProduct =
      request.input('assignBrandToProduct') === true ||
      request.input('assignBrandToProduct') === 'true'
    const persistChannelListings =
      request.input('persistChannelListings') === true ||
      request.input('persistChannelListings') === 'true'

    const rawProductIds = request.input('productIds')
    const productIds: string[] = Array.isArray(rawProductIds)
      ? rawProductIds.map((id) => String(id).trim()).filter(Boolean)
      : typeof rawProductIds === 'string' && rawProductIds.trim()
        ? rawProductIds
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []

    if (!brandId) {
      const msg =
        'Please select a Brand to link with the catalog products before generating listings.'
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: msg })
      }
      session.flash('error', msg)
      return response.redirect().back()
    }

    try {
      const result = await ListingTransformerService.generateListings({
        userId: user.id,
        productIds: productIds.length > 0 ? productIds : undefined,
        brandId,
        platform,
        platforms,
        sellerAccountId,
        assignBrandToProduct,
        persistChannelListings,
      })

      if (request.input('download') === 'true' || request.input('download') === true) {
        const jsonString = JSON.stringify(result.payload, null, 2)
        response.header('Content-Type', 'application/json; charset=utf-8')
        response.header('Content-Disposition', `attachment; filename="${result.filename}"`)
        return response.send(jsonString)
      }

      if (wantsJson(request)) {
        return response.json({
          ok: true,
          success: true,
          brandName: result.brand.name,
          platforms: result.platformsGenerated,
          channelListingsUpserted: result.listingsPersisted,
          ...result,
        })
      }

      session.flash(
        'success',
        `Generated ${result.platformsGenerated.map((p) => p.toUpperCase()).join(', ')} listings for brand "${result.brand.name}" (${result.productCount} products, ${result.variantCount} variants, ${result.listingsPersisted} channel listings saved).`
      )
      return response.redirect().back()
    } catch (err: any) {
      const msg = err.message || 'Failed to generate platform listings.'
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: msg })
      }
      session.flash('error', msg)
      return response.redirect().back()
    }
  }

  /**
   * Stage 4 Action: `POST /channel-listings/:id/publish`
   */
  async publishChannelListing({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const listing = await ListingTransformerService.publishListingOnPlatform({
        userId: user.id,
        listingId: params.id,
      })
      const plat = String((listing.channelAttributes as any)?.platform || 'medusa')
      const msg = `Published SKU ${listing.externalSku} on ${plat.toUpperCase()} (${listing.externalListingId}).`
      if (wantsJson(request)) {
        return response.json({
          ok: true,
          success: true,
          message: msg,
          listing: {
            ...listing.serialize(),
            platform: plat,
          },
        })
      }
      session.flash('success', msg)
    } catch (err: any) {
      const msg = err.message || 'Failed to publish channel listing.'
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: msg })
      }
      session.flash('error', msg)
    }
    return response.redirect().back()
  }

  /**
   * Stage 4 Action: `POST /channel-listings/publish-sku`
   */
  async publishSkuGroup({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const sku = String(request.input('sku', '')).trim()
    if (!sku) {
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: 'SKU is required.' })
      }
      session.flash('error', 'SKU is required.')
      return response.redirect().back()
    }

    try {
      const count = await ListingTransformerService.publishSkuAcrossPlatforms({
        userId: user.id,
        sku,
      })
      const msg = `Published ${count} platform listing(s) for SKU ${sku}.`
      if (wantsJson(request)) {
        return response.json({
          ok: true,
          success: true,
          publishedCount: count,
          platforms: ['medusa', 'amazon', 'ebay', 'etsy'],
          message: msg,
        })
      }
      session.flash('success', msg)
    } catch (err: any) {
      const msg = err.message || 'Failed to publish SKU across platforms.'
      if (wantsJson(request)) {
        return response.badRequest({ ok: false, error: msg })
      }
      session.flash('error', msg)
    }
    return response.redirect().back()
  }

  /**
   * Stage 4 CRUD: `POST /channel-listings/:id`
   */
  async updateChannelListing({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const listing = await ChannelListing.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    if (request.input('channelTitle') !== undefined) {
      listing.channelTitle = String(request.input('channelTitle')).trim()
    }
    if (request.input('channelDescription') !== undefined) {
      listing.channelDescription = String(request.input('channelDescription')).trim()
    }
    if (request.input('externalListingId') !== undefined) {
      listing.externalListingId = String(request.input('externalListingId')).trim()
    }
    if (request.input('externalVariantId') !== undefined) {
      listing.externalVariantId = String(request.input('externalVariantId')).trim() || null
    }
    if (request.input('externalSku') !== undefined) {
      listing.externalSku = String(request.input('externalSku')).trim()
    }
    if (request.input('asin') !== undefined) {
      // ASIN belongs to the sellable unit; the listing reads it through the variant.
      const variant = await ProductVariant.findByOrFail('id', listing.productVariantId)
      variant.asin = String(request.input('asin')).trim() || null
      await variant.save()
    }
    if (request.input('channelCategoryId') !== undefined) {
      listing.channelCategoryId = String(request.input('channelCategoryId')).trim() || null
    }
    const requestedCurrency =
      request.input('currencyCode') !== undefined
        ? String(request.input('currencyCode')).trim().toUpperCase()
        : null
    if (request.input('listedPrice') !== undefined) {
      const price = Number(request.input('listedPrice'))
      if (price >= 0) {
        listing.listedPrice = money(price, requestedCurrency || listing.listedPrice.currency_code)
      }
    }
    if (request.input('allocatedQuantity') !== undefined) {
      const qty = Number(request.input('allocatedQuantity'))
      if (qty >= 0) listing.allocatedQuantity = qty
    }
    if (request.input('listingStatus') !== undefined) {
      listing.listingStatus = String(request.input('listingStatus')).trim()
    }
    if (
      request.input('publicationStatus') !== undefined &&
      String(request.input('publicationStatus')).trim() !== listing.publicationStatus
    ) {
      const message = 'Publication status cannot be changed without a marketplace integration.'
      if (wantsJson(request)) return response.badRequest({ ok: false, error: message })
      session.flash('error', message)
      return response.redirect().back()
    }

    const rawPrices = request.input('prices') ?? request.input('pricesJson')
    if (rawPrices !== undefined) {
      // Listings store a MedusaJS v2 price array plus a self-contained listedPrice.
      const normalizedPrices = normalizePriceMoneyArray(
        rawPrices,
        listing.listedPrice.amount || 239.99,
        listing.listedPrice.currency_code || 'USD'
      )
      listing.prices = normalizedPrices
      const primary =
        normalizedPrices.find(
          (entry) => entry.currency_code === listing.listedPrice.currency_code
        ) ?? normalizedPrices[0]
      if (primary) {
        listing.listedPrice = money(primary.amount, primary.currency_code)
      }
    }

    await listing.save()
    const msg = `Listing ${listing.externalListingId} (${listing.externalSku}) updated.`
    if (wantsJson(request)) {
      return response.json({ ok: true, success: true, message: msg, listing: listing.serialize() })
    }
    session.flash('success', msg)
    return response.redirect().back()
  }

  async storeProduct({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createProductValidator)

    try {
      const rawHasVariants = (payload as any).hasVariants
      const hasVariants =
        typeof rawHasVariants === 'string' ? rawHasVariants === 'true' : Boolean(rawHasVariants)
      const rawVD = (payload as any).variationDimensions
      const variationDimensions: string[] =
        typeof rawVD === 'string'
          ? rawVD
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : Array.isArray(rawVD)
            ? rawVD
            : []

      const rawPrices = request.input('prices') ?? request.input('pricesJson')
      // catalog_items is USD-only, so the derived array is anchored on the USD price.
      const normalizedPrices = normalizePriceMoneyArray(rawPrices, payload.priceUsd, 'USD')

      const product = await CatalogService.createProduct({
        userId: user.id,
        brandId: payload.brandId ?? null,
        categoryId: payload.categoryId ?? null,
        title: payload.title,
        description: payload.description ?? null,
        skuPrefix: (payload as any).skuPrefix ?? payload.sku,
        hasVariants,
        variationDimensions,
        prices: normalizedPrices,
        variants: [
          {
            sku: payload.sku,
            title: payload.title,
            asin: payload.asin ?? null,
            priceUsd: payload.priceUsd,
            prices: normalizedPrices,
            costPrice: payload.costPrice ?? 0,
            manufacturingCost: payload.manufacturingCost ?? 0,
            packagingCost: payload.packagingCost ?? 0,
            stockOnHand: payload.stockOnHand ?? 0,
          },
        ],
      })
      session.flash(
        'success',
        `Product "${product.title}" (SKU: ${payload.sku}) created with multi-currency prices.`
      )
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create product')
    }
    return response.redirect().back()
  }

  async updateProduct({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateProductValidator)
    const product = await Product.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    product.merge(payload)
    if (request.input('skuPrefix')) {
      product.skuPrefix = String(request.input('skuPrefix')).trim()
    }
    const rawPrices = request.input('prices') ?? request.input('pricesJson')
    if (rawPrices !== undefined) {
      const normalizedPrices = normalizePriceMoneyArray(rawPrices, 239.99, 'USD')
      product.prices = normalizedPrices
    }
    await product.save()
    session.flash('success', `Product "${product.title}" updated.`)
    return response.redirect().back()
  }

  async deleteProduct({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const product = await Product.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    product.status = 'archived'
    await product.save()
    session.flash('success', `Product "${product.title}" archived.`)
    return response.redirect().back()
  }

  async storeVariant({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createVariantValidator)
    const product = await Product.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()

    const rawPrices = request.input('prices') ?? request.input('pricesJson')
    const varPrices = normalizePriceMoneyArray(rawPrices, payload.priceUsd, 'USD')

    await CatalogService.createVariant({
      userId: user.id,
      product,
      variant: {
        sku: payload.sku,
        title: payload.title,
        asin: payload.asin ?? null,
        priceUsd: payload.priceUsd,
        prices: varPrices,
        costPrice: payload.costPrice ?? 0,
        manufacturingCost: payload.manufacturingCost ?? 0,
        packagingCost: payload.packagingCost ?? 0,
        stockOnHand: payload.stockOnHand ?? 0,
        attributes:
          payload.attributeName && payload.attributeValue
            ? { [payload.attributeName]: payload.attributeValue }
            : undefined,
      },
    })

    session.flash('success', `Variant ${payload.sku} created with multi-currency prices.`)
    return response.redirect().back()
  }

  async updateVariantStock({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const variant = await ProductVariant.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const stockOnHand = Number(request.input('stockOnHand', variant.stockOnHand))
    const currentPrice = resolvePriceForCurrency(variant.prices, 'USD') ?? money(0, 'USD')
    const retailPrice = Number(request.input('retailPrice', currentPrice.amount))
    const costPrice =
      request.input('costPrice') !== undefined && request.input('costPrice') !== ''
        ? Number(request.input('costPrice'))
        : variant.costPrice.amount

    if (stockOnHand < 0 || retailPrice < 0 || costPrice < 0) {
      session.flash('error', 'Stock and prices must be non-negative.')
      return response.redirect().back()
    }

    variant.stockOnHand = stockOnHand
    variant.costPrice = money(costPrice, variant.costPrice.currency_code)

    const rawPrices = request.input('prices') ?? request.input('pricesJson')
    // The variant price array is the single source of truth for every currency.
    variant.prices = normalizePriceMoneyArray(
      rawPrices,
      retailPrice,
      request.input('currencyCode')
        ? String(request.input('currencyCode')).trim().toUpperCase()
        : currentPrice.currency_code
    )
    await variant.save()

    session.flash(
      'success',
      `Updated SKU ${variant.sku}: Stock=${stockOnHand}, Price=${(resolvePriceForCurrency(variant.prices, 'USD') ?? money(0, 'USD')).amount} (${variant.prices.length} currencies synced)`
    )
    return response.redirect().back()
  }

  async deleteVariant({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const variant = await ProductVariant.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await variant.delete()
    session.flash('success', 'Variant deleted.')
    return response.redirect().back()
  }

  async storeBrand({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    if (!name) {
      session.flash('error', 'Brand name is required.')
      return response.redirect().back()
    }
    const slug =
      String(request.input('slug', '')).trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    await Brand.updateOrCreate(
      { userId: user.id, slug },
      {
        userId: user.id,
        name,
        slug,
        regNo: request.input('regNo') || null,
        serialNo: request.input('serialNo') || null,
        websiteUrl: request.input('websiteUrl') || null,
        isActive: true,
      }
    )
    session.flash('success', `Brand "${name}" saved.`)
    return response.redirect().back()
  }

  async updateBrand({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateBrandValidator)
    const brand = await Brand.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    brand.merge(payload)
    if (request.input('regNo') !== undefined) {
      brand.regNo = request.input('regNo') || null
    }
    if (request.input('serialNo') !== undefined) {
      brand.serialNo = request.input('serialNo') || null
    }
    await brand.save()
    session.flash('success', `Brand "${brand.name}" updated.`)
    return response.redirect().back()
  }

  async deleteBrand({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const brand = await Brand.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await brand.delete()
    session.flash('success', 'Brand deleted.')
    return response.redirect().back()
  }

  async storeCategory({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    if (!name) {
      session.flash('error', 'Category name is required.')
      return response.redirect().back()
    }
    const slug =
      String(request.input('slug', '')).trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    await ProductCategory.updateOrCreate(
      { userId: user.id, slug },
      {
        userId: user.id,
        name,
        slug,
        parentCategoryId: request.input('parentCategoryId') || null,
        taxonomyPath: request.input('taxonomyPath') || slug,
        attributesSchema: [],
      }
    )
    session.flash('success', `Category "${name}" saved.`)
    return response.redirect().back()
  }

  async updateCategory({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateCategoryValidator)
    const category = await ProductCategory.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    category.merge(payload)
    await category.save()
    session.flash('success', `Category "${category.name}" updated.`)
    return response.redirect().back()
  }

  async deleteCategory({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const category = await ProductCategory.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await category.delete()
    session.flash('success', 'Category deleted.')
    return response.redirect().back()
  }

  async storeChannelListing({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const productVariantId = String(request.input('productVariantId', '')).trim()
    const sellerAccountId = String(request.input('sellerAccountId', '')).trim()
    const channelSku = String(request.input('channelSku', '')).trim()
    const externalListingId = String(request.input('externalListingId', '')).trim()
    const listedPrice = Number(request.input('listedPrice', 0))

    const variant = await ProductVariant.query()
      .where('userId', user.id)
      .andWhere('id', productVariantId)
      .firstOrFail()
    const sellerAccount = await SellerAccount.query()
      .where('userId', user.id)
      .andWhere('id', sellerAccountId)
      .firstOrFail()

    const variantUsdPrice = resolvePriceForCurrency(variant.prices, 'USD') ?? money(0, 'USD')
    const effPrice = listedPrice > 0 ? listedPrice : variantUsdPrice.amount
    const rawPrices = request.input('prices') ?? request.input('pricesJson')
    const lPrices = normalizePriceMoneyArray(
      rawPrices ?? variant.prices,
      effPrice,
      sellerAccount.defaultCurrency || 'USD'
    )
    const listedMoney =
      lPrices.find((entry) => entry.currency_code === (sellerAccount.defaultCurrency || 'USD')) ??
      lPrices[0] ??
      money(effPrice, sellerAccount.defaultCurrency || 'USD')

    await ChannelListing.create({
      userId: user.id,
      sellerAccountId: sellerAccount.id,
      productId: variant.productId,
      productVariantId: variant.id,
      externalListingId: externalListingId || `LST-${Date.now()}`,
      externalSku: channelSku || variant.sku,
      listedPrice: listedMoney,
      prices: lPrices,
      allocatedQuantity: Number(request.input('allocatedQuantity', variant.stockOnHand)),
      listingStatus: 'draft',
      publicationStatus: 'unpublished',
      syncStatus: 'pending',
      lastSyncedAt: null,
    })

    session.flash(
      'success',
      `Published SKU ${variant.sku} to ${sellerAccount.accountName} (${externalListingId || variant.sku}).`
    )
    return response.redirect().back()
  }

  async deleteChannelListing({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const listing = await ChannelListing.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await listing.delete()
    session.flash('success', 'Channel listing removed.')
    return response.redirect().back()
  }
}
