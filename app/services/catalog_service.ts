import db from '@adonisjs/lucid/services/db'
import CatalogItem from '#models/catalog_item'
import type ProductCategory from '#models/product_category'
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
import { CategorySyncService } from './category_sync_service.js'
import { normalizeVariantAttributes, variantAttributePairs } from '../utils/variant_attributes.js'
import {
  extractSequenceNumber,
  buildStructuredBaseCode,
  resolveGenderCode,
  resolveCategoryAndProductCode,
  resolveLeatherCode,
  resolveFitCode,
  resolveColorInfo,
  resolveSizeInfo,
  resolveTierPrice,
  formatVariantSku,
} from '../data/catalog_config/index.js'
import type {
  CatalogJsonEntry,
  CatalogJsonPayload,
  PriceTierCode,
  SkuFormatMode,
} from '../types/catalog_pipeline.js'
import {
  type MedusaVariantPrice,
  type PriceMoney,
  applyCurrencyOverrides,
  buildMultiCurrencyPriceArray,
  money,
  normalizeNullablePriceMoney,
  normalizePriceMoney,
  normalizePriceMoneyArray,
} from '../types/price.js'

/**
 * Variant input accepted by `CatalogService.createProduct` / `createVariant`.
 *
 * `priceUsd` is the USD base price from the catalog tier or manual entry; it is
 * expanded into the full MedusaJS v2 multi-currency `prices` array unless an
 * explicit `prices` array (or per-currency overrides) is supplied. Cost values
 * are `PriceMoney` objects (a bare number is treated as USD).
 */
export interface VariantInput {
  sku: string
  title?: string
  barcodeUpcEan?: string | null
  mpn?: string | null
  asin?: string | null
  /** USD base price used to derive the multi-currency price array. */
  priceUsd?: number
  /** Explicit MedusaJS v2 price array (takes precedence over `priceUsd`). */
  prices?: MedusaVariantPrice[]
  /** Per-currency overrides applied on top of the derived array. */
  priceOverrides?: Record<string, Partial<MedusaVariantPrice>>
  costPrice?: PriceMoney | number
  manufacturingCost?: PriceMoney | number
  packagingCost?: PriceMoney | number
  stockOnHand?: number
  reorderPoint?: number
  weightGrams?: number | null
  attributes?: Record<string, string>
  listings?: Array<{
    sellerAccountId: string
    externalListingId: string
    asin?: string | null
    channelTitle?: string | null
    listedPrice?: PriceMoney | number
    listedPriceUsd?: number
    prices?: MedusaVariantPrice[]
    allocatedQuantity?: number
  }>
}

export interface GeneratedVariantPreview {
  sku: string
  title: string
  colorCode: string
  colorName: string
  colorMap: string
  sizeValue: string
  sizeKey: string
  materialCode: string
  materialName: string
  fitCode: string
  fitName: string
  /** USD base price this variant was derived from (catalog tier price). */
  priceUsd: number
  /** MedusaJS v2 multi-currency price array. */
  prices: MedusaVariantPrice[]
  costPrice: PriceMoney
  manufacturingCost: PriceMoney
  packagingCost: PriceMoney
  stockOnHand: number
  included: boolean
}

export interface GeneratedProductPreview {
  catalogItemId: string
  catalogKey: string
  structuredCode: string
  title: string
  subTitle: string
  type: string
  gender: string
  /** Relational taxonomy (`product_categories.id`) — the only category reference. */
  categoryId: string | null
  categoryName: string
  categoryHandle: string
  description: string
  pattern: string
  materialCode: string
  materialName: string
  fitCode: string
  fitName: string
  priceTier: PriceTierCode
  skuFormat: SkuFormatMode
  /** Base USD price of the catalog tier (expanded into `variants[].prices`). */
  basePriceUsd: number
  prices: MedusaVariantPrice[]
  images: string[]
  tags: string[]
  attributes: Record<string, unknown>
  variants: GeneratedVariantPreview[]
}

export class CatalogService {
  static async listCatalogItems(userId: string): Promise<CatalogItem[]> {
    return CatalogItem.query()
      .where('userId', userId)
      .preload('resolvedCategory', (q) => q.where('userId', userId))
      .preload('convertedProduct', (q) => q.where('userId', userId))
      .orderBy('catalogKey', 'asc')
  }

  static async saveCatalogJsonToDb(params: {
    userId: string
    catalogPayload: CatalogJsonPayload
    priceTier?: PriceTierCode
  }): Promise<{ savedCount: number; items: CatalogItem[] }> {
    const { userId, catalogPayload, priceTier = '01' } = params
    if (!catalogPayload || typeof catalogPayload !== 'object' || Array.isArray(catalogPayload)) {
      throw new Error('Catalog JSON must be an object keyed by SKU.')
    }
    const entries = Object.entries(catalogPayload)
    if (entries.length > 500) throw new Error('Catalog import supports at most 500 entries.')
    if (entries.length === 0) {
      throw new Error('Catalog JSON payload must contain at least one SKU entry.')
    }

    const savedItems: CatalogItem[] = []
    await db.transaction(async (trx) => {
      for (const [i, [catalogKey, entry]] of entries.entries() as IterableIterator<
        [number, [string, CatalogJsonEntry]]
      >) {
        if (
          !catalogKey.trim() ||
          !entry ||
          typeof entry !== 'object' ||
          Array.isArray(entry) ||
          typeof entry.title !== 'string' ||
          !entry.title.trim()
        ) {
          throw new Error(`Invalid catalog entry: ${catalogKey}. A non-empty title is required.`)
        }
        const spec = entry.varaints ?? entry.variants
        if (spec && (typeof spec !== 'object' || Array.isArray(spec)))
          throw new Error(`Invalid variants for ${catalogKey}.`)
        for (const values of [spec?.color, spec?.size]) {
          if (
            values !== undefined &&
            (!Array.isArray(values) ||
              values.length === 0 ||
              values.length > 100 ||
              values.some((v) => typeof v !== 'string' || !v.trim()))
          ) {
            throw new Error(`Invalid variant values for ${catalogKey}.`)
          }
        }
        if ((spec?.color?.length ?? 1) * (spec?.size?.length ?? 1) > 1000)
          throw new Error(`Too many variants for ${catalogKey}.`)

        const item = await this.upsertCatalogEntryInTrx(
          userId,
          catalogKey.trim(),
          entry,
          priceTier,
          i,
          trx
        )
        savedItems.push(item)
      }
    })

    return { savedCount: savedItems.length, items: savedItems }
  }

  private static async upsertCatalogEntryInTrx(
    userId: string,
    catalogKey: string,
    entry: CatalogJsonEntry,
    defaultPriceTier: PriceTierCode,
    index: number,
    trx?: any
  ): Promise<CatalogItem> {
    const category = await CategorySyncService.resolveCategory(
      userId,
      entry.category_handle,
      entry.type,
      entry.attributes?.gender,
      trx
    )
    const categoryMeta = CategorySyncService.extractCategoryMetadata(category)
    const genderInfo = resolveGenderCode(entry.attributes?.gender ?? categoryMeta.gender)
    const catProdInfo = resolveCategoryAndProductCode(entry.type, entry.category_handle)
    const leatherInfo = resolveLeatherCode(
      entry.attributes?.fabric || entry.attributes?.material,
      entry.attributes?.leather_code
    )
    const fitInfo = resolveFitCode(entry.attributes?.fit || entry.attributes?.size_type)
    const sequence = extractSequenceNumber(catalogKey, index)
    const structuredCode = buildStructuredBaseCode({
      genderCode: genderInfo.code,
      categoryCode: catProdInfo.categoryCode,
      productCode: catProdInfo.productCode,
      sequence,
    })

    const varSpec = entry.varaints ??
      entry.variants ?? { color: ['BLK'], size: ['S', 'M', 'L', 'XL'] }
    const firstColor =
      Array.isArray(varSpec.color) && varSpec.color.length > 0 ? varSpec.color[0] : 'BLK'
    const fileName = `${structuredCode}-${firstColor}-${leatherInfo.code}-${fitInfo.code}`

    const activeTier: PriceTierCode =
      (entry.attributes?.price_tier as PriceTierCode) || defaultPriceTier

    const q = CatalogItem.query().where('userId', userId).andWhere('catalogKey', catalogKey)
    if (trx) q.useTransaction(trx)
    let item = await q.first()

    if (!item) {
      item = new CatalogItem()
      if (trx) item.useTransaction(trx)
      item.userId = userId
      item.catalogKey = catalogKey
      item.status = 'draft'
    } else if (trx) {
      item.useTransaction(trx)
    }

    item.structuredCode = structuredCode
    item.fileName = fileName
    item.title = String(entry.title).slice(0, 60)
    item.subTitle = entry.subTitle ? String(entry.subTitle).slice(0, 60) : null
    item.type = entry.type || catProdInfo.productTypeName
    item.gender = genderInfo.label
    // Taxonomy is relational only: `resolved_category_id`, never a code/label pair.
    item.resolvedCategoryId = category?.id ?? null
    item.description = entry.description ?? null
    item.pattern = entry.pattern || 'Solid'
    item.priceTier = activeTier
    // Catalog pricing is USD-only; the multi-currency array is derived later on
    // Product / ProductVariant creation.
    item.basePriceUsd = resolveTierPrice(activeTier, 3).toFixed(2)
    item.attributes = {
      ...(entry.attributes ?? {}),
      // SKU-scheme components are domain attributes now that the dedicated
      // code columns are gone; they stay with the item so previews can be re-derived.
      category_code: catProdInfo.categoryCode,
      product_code: catProdInfo.productCode,
      material_code: leatherInfo.code,
      fit_code: fitInfo.code,
    }
    item.images = Array.isArray(entry.images) ? entry.images : []
    item.tags = Array.isArray(entry.tags) ? entry.tags : []
    item.variantsSpec = {
      color: Array.isArray(varSpec.color) && varSpec.color.length > 0 ? varSpec.color : ['BLK'],
      size:
        Array.isArray(varSpec.size) && varSpec.size.length > 0
          ? varSpec.size
          : ['S', 'M', 'L', 'XL', '2XL'],
      size_group: varSpec.size_group ?? 'alpha',
    }

    await item.save()
    return item
  }

  static async upsertSingleCatalogItem(params: {
    userId: string
    id?: string | null
    catalogKey: string
    title: string
    subTitle?: string
    type?: string
    gender?: string
    /** Taxonomy handle/path resolved into `resolved_category_id`. */
    categoryHandle?: string
    description?: string
    pattern?: string
    material?: string
    fabric?: string
    lining?: string
    closure?: string
    collar?: string
    hardware?: string
    coatSilhouetteType?: string
    collarType?: string
    sleeveLength?: string
    sleeveType?: string
    pocketDescription?: string
    pocketsCsv?: string
    sizeType?: string
    ageGroup?: string
    careInstructions?: string
    modelName?: string
    priceTier?: PriceTierCode
    colorsCsv?: string
    sizesCsv?: string
    imagesCsv?: string
    tagsCsv?: string
    bulletsText?: string
    keywordsText?: string
    specialFeaturesLines?: string
  }): Promise<CatalogItem> {
    const colors = (params.colorsCsv || 'BLK,BLU')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
    const sizes = (params.sizesCsv || 'S,M,L,XL,2XL')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const images = (params.imagesCsv || 'https://example.com/image1.jpg')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const tags = (params.tagsCsv || 'leather,outerwear')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const bullets = (params.bulletsText || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const keywords = (params.keywordsText || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const specialFeatures = (params.specialFeaturesLines || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const pockets = (params.pocketsCsv || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    let existing: CatalogItem | null = null
    if (params.id) {
      existing = await CatalogItem.query()
        .where('userId', params.userId)
        .andWhere('id', params.id)
        .preload('resolvedCategory')
        .first()
    }
    const prevAttrs = (existing?.attributes ?? {}) as Record<string, any>

    const entry: CatalogJsonEntry = {
      title: params.title,
      subTitle: params.subTitle,
      type: params.type || existing?.type || 'Duster Coat',
      category_handle:
        params.categoryHandle ||
        existing?.resolvedCategory?.taxonomyPath ||
        existing?.resolvedCategory?.slug ||
        'mens/apparel/outerwear/coats/duster-coats',
      description: params.description ?? existing?.description ?? '',
      pattern: params.pattern || existing?.pattern || 'Solid',
      attributes: {
        ...prevAttrs,
        gender: params.gender || prevAttrs.gender || 'mens',
        material: params.material || prevAttrs.material || 'Leather',
        fabric: params.fabric || prevAttrs.fabric || '100% Lambskin Leather',
        lining: params.lining || prevAttrs.lining || 'Polyester',
        closure: params.closure || prevAttrs.closure || 'Single-Breasted Front Button Closure',
        collar: params.collar || prevAttrs.collar || 'Notch Collar',
        hardware: params.hardware || prevAttrs.hardware || 'Silver Tone',
        coat_silhouette_type:
          params.coatSilhouetteType || prevAttrs.coat_silhouette_type || 'duster_coat',
        collar_type: params.collarType || prevAttrs.collar_type || 'notch',
        sleeve_length: params.sleeveLength || prevAttrs.sleeve_length || 'Long Sleeve',
        sleeve_type: params.sleeveType || prevAttrs.sleeve_type || 'Standard Sleeve',
        pocket_description:
          params.pocketDescription || prevAttrs.pocket_description || 'Flap Pocket',
        pockets: pockets.length > 0 ? pockets : prevAttrs.pockets || [],
        size_type: params.sizeType || prevAttrs.size_type || 'regular',
        age_group: params.ageGroup || prevAttrs.age_group || 'adult',
        care_instructions:
          params.careInstructions || prevAttrs.care_instructions || 'Dry Clean Only',
        model_name: params.modelName || prevAttrs.model_name || params.title,
        price_tier: params.priceTier || (existing?.priceTier as PriceTierCode) || '01',
        bullets: bullets.length > 0 ? bullets : prevAttrs.bullets || [],
        generic_keyword: keywords.length > 0 ? keywords : prevAttrs.generic_keyword || [],
        special_feature:
          specialFeatures.length > 0 ? specialFeatures : prevAttrs.special_feature || [],
      },
      images,
      tags,
      varaints: {
        color: colors,
        size: sizes,
      },
    }

    return await db.transaction(async (trx) => {
      if (existing && existing.catalogKey !== params.catalogKey.trim()) {
        existing.useTransaction(trx)
        existing.catalogKey = params.catalogKey.trim()
        await existing.save()
      }
      return await this.upsertCatalogEntryInTrx(
        params.userId,
        params.catalogKey.trim(),
        entry,
        params.priceTier || '01',
        0,
        trx
      )
    })
  }

  static async deleteCatalogItem(userId: string, id: string): Promise<void> {
    const item = await CatalogItem.query().where('userId', userId).andWhere('id', id).firstOrFail()
    await item.delete()
  }

  /**
   * Builds a rich, editable Product + Cartesian Variant Matrix preview for a single `CatalogItem`
   * including multi-currency `prices: PriceMoney[]` arrays (`USD`, `INR`, `EUR`, `GBP`, `CAD`, `MXN`).
   */
  static async buildProductPreviewFromCatalogItem(params: {
    userId: string
    catalogItemId: string
    priceTier?: PriceTierCode
    skuFormat?: SkuFormatMode
    defaultStockOnHand?: number
    costRatio?: number
  }): Promise<GeneratedProductPreview> {
    const item = await CatalogItem.query()
      .where('userId', params.userId)
      .andWhere('id', params.catalogItemId)
      .preload('resolvedCategory', (q) => q.where('userId', params.userId))
      .firstOrFail()

    const legacyCategoryHandle =
      typeof item.attributes?.category_handle === 'string' ? item.attributes.category_handle : null
    const resolvedCategory = item.resolvedCategory as unknown as ProductCategory | undefined
    const categoryHandleHint =
      resolvedCategory?.taxonomyPath ?? resolvedCategory?.slug ?? legacyCategoryHandle
    const category =
      resolvedCategory ??
      (await CategorySyncService.resolveCategory(
        params.userId,
        categoryHandleHint,
        item.type,
        item.gender,
        undefined,
        false
      ))

    const activeTier: PriceTierCode = params.priceTier || (item.priceTier as PriceTierCode) || '01'
    const skuFormat: SkuFormatMode = params.skuFormat || 'standard'
    const stockOnHand = params.defaultStockOnHand ?? 25
    const costRatio = params.costRatio ?? 0.42
    if (
      !Number.isInteger(stockOnHand) ||
      stockOnHand < 0 ||
      !Number.isFinite(costRatio) ||
      costRatio < 0
    )
      throw new Error('Invalid stock or cost ratio.')
    if (
      !['01', '02', '03'].includes(activeTier) ||
      !['standard', 'prefixed_color', 'catalog_key'].includes(skuFormat)
    )
      throw new Error('Invalid price tier or SKU format.')

    const leatherInfo = resolveLeatherCode(
      item.attributes?.fabric || item.attributes?.material,
      typeof item.attributes?.material_code === 'string' ? item.attributes.material_code : undefined
    )
    const fitInfo = resolveFitCode(
      (typeof item.attributes?.fit_code === 'string' ? item.attributes.fit_code : undefined) ||
        item.attributes?.size_type
    )
    const structuredCode =
      item.structuredCode ||
      buildStructuredBaseCode({
        genderCode: resolveGenderCode(item.gender).code,
        categoryCode:
          typeof item.attributes?.category_code === 'string' ? item.attributes.category_code : 'CT',
        productCode:
          typeof item.attributes?.product_code === 'string' ? item.attributes.product_code : 'DC',
        sequence: extractSequenceNumber(item.catalogKey),
      })

    const varSpec = (item.variantsSpec ?? {}) as {
      color?: string[]
      size?: string[]
      size_group?: 'alpha' | 'numeric' | 'age' | 'pillowCover'
    }
    const colors =
      Array.isArray(varSpec.color) && varSpec.color.length > 0 ? varSpec.color : ['BLK']
    const sizes =
      Array.isArray(varSpec.size) && varSpec.size.length > 0
        ? varSpec.size
        : ['S', 'M', 'L', 'XL', '2XL']
    const sizeGroup = varSpec.size_group ?? 'alpha'

    const variants: GeneratedVariantPreview[] = []
    for (const rawColor of colors) {
      const colorInfo = resolveColorInfo(rawColor)
      for (const rawSize of sizes) {
        const sizeInfo = resolveSizeInfo(rawSize, sizeGroup)
        // USD only in the catalog; expanded into the MedusaJS v2 price array.
        const priceUsd = resolveTierPrice(activeTier, sizeInfo.sizeIndex)
        const costAmount = Number((priceUsd * costRatio).toFixed(2))
        const costPrice = money(costAmount, 'USD')
        const manufacturingCost = money(Number((costAmount * 0.85).toFixed(2)), 'USD')
        const packagingCost = money(Number((costAmount * 0.15).toFixed(2)), 'USD')
        const multiPrices = buildMultiCurrencyPriceArray(priceUsd)
        const sku = formatVariantSku({
          catalogKey: item.catalogKey,
          structuredCode,
          colorCode: colorInfo.code,
          materialCode: leatherInfo.code,
          fitCode: fitInfo.code,
          sizeValue: sizeInfo.sizeValue,
          skuFormat,
        })

        variants.push({
          sku,
          title: `${item.title} - ${colorInfo.colorName} / ${sizeInfo.sizeKey}`,
          colorCode: colorInfo.code,
          colorName: colorInfo.colorName,
          colorMap: colorInfo.colorMap,
          sizeValue: sizeInfo.sizeValue,
          sizeKey: sizeInfo.sizeKey,
          materialCode: leatherInfo.code,
          materialName: leatherInfo.name,
          fitCode: fitInfo.code,
          fitName: fitInfo.name,
          priceUsd,
          prices: multiPrices,
          costPrice,
          manufacturingCost,
          packagingCost,
          stockOnHand,
          included: true,
        })
      }
    }

    const basePriceUsd = resolveTierPrice(activeTier, 3)
    const baseProductPrices =
      variants.length > 0 ? variants[0].prices : buildMultiCurrencyPriceArray(basePriceUsd)

    return {
      catalogItemId: item.id,
      catalogKey: item.catalogKey,
      structuredCode,
      title: item.title,
      subTitle: item.subTitle || '',
      type: item.type || 'Duster Coat',
      gender: item.gender || 'Men',
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? 'Coat',
      categoryHandle: category?.taxonomyPath ?? category?.slug ?? '',
      description: item.description || '',
      pattern: item.pattern || 'Solid',
      materialCode: leatherInfo.code,
      materialName: leatherInfo.name,
      fitCode: fitInfo.code,
      fitName: fitInfo.name,
      priceTier: activeTier,
      skuFormat,
      basePriceUsd,
      prices: baseProductPrices,
      images: Array.isArray(item.images) ? item.images : [],
      tags: Array.isArray(item.tags) ? item.tags : [],
      attributes: (item.attributes ?? {}) as Record<string, unknown>,
      variants,
    }
  }

  /**
   * Confirms and converts a `CatalogItem` into a brand-agnostic `Product` + `ProductVariant` +
   * `ProductPrice` + `ProductVariantPrice` + `ProductVariantAttribute` rows.
   */
  static async createProductFromPreview(params: {
    userId: string
    preview: GeneratedProductPreview
  }): Promise<{ product: Product; variantsCreated: number }> {
    const { userId, preview } = params
    const includedVariants = (preview.variants ?? []).filter((v) => v.included !== false)
    if (includedVariants.length === 0) {
      throw new Error('At least one variant SKU must be included to create a Product.')
    }

    let variantsCreated = 0
    const product = await db.transaction(async (trx) => {
      const catalogItem = await CatalogItem.query({ client: trx })
        .where('userId', userId)
        .andWhere('id', preview.catalogItemId)
        .forUpdate()
        .firstOrFail()
      if (catalogItem.catalogKey !== preview.catalogKey)
        throw new Error('Catalog key does not match the selected item.')

      const category = preview.categoryId
        ? await db
            .from('product_categories')
            .where('id', preview.categoryId)
            .andWhere('user_id', userId)
            .first()
        : null

      if (preview.categoryId && !category) throw new Error('Category not found for this user.')

      const cleanSlugBase = `${preview.catalogKey}-${preview.title}`
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 200)

      let prod = await Product.query({ client: trx })
        .where('userId', userId)
        .andWhere((q) => q.where('skuPrefix', preview.catalogKey).orWhere('slug', cleanSlugBase))
        .first()

      if (!prod) {
        prod = new Product()
        prod.useTransaction(trx)
        prod.userId = userId
        prod.slug = cleanSlugBase || `prod-${Date.now()}`
      } else {
        prod.useTransaction(trx)
      }

      const firstVarUsd = Number(includedVariants[0]?.priceUsd ?? preview.basePriceUsd ?? 239.99)
      // USD catalog price -> MedusaJS v2 multi-currency array.
      const productPrices = normalizePriceMoneyArray(preview.prices, firstVarUsd, 'USD')

      if (!prod.$isPersisted) prod.brandId = null
      prod.categoryId = category ? category.id : preview.categoryId || null
      prod.skuPrefix = preview.catalogKey
      prod.title = String(preview.title).slice(0, 255)
      prod.subTitle = preview.subTitle ? String(preview.subTitle).slice(0, 255) : null
      prod.description = preview.description || null
      prod.type = preview.type || 'Coat'
      prod.status = ProductStatus.ACTIVE
      prod.hasVariants = true
      prod.variationDimensions = ['color', 'size']
      prod.prices = productPrices
      prod.images = Array.isArray(preview.images) ? preview.images : []
      prod.tags = Array.isArray(preview.tags) ? preview.tags : []
      prod.dimensionsCm = {}
      prod.metadata = {
        catalogItemId: preview.catalogItemId,
        catalogKey: preview.catalogKey,
        structuredCode: preview.structuredCode,
        genderLabel: preview.gender,
        materialCode: preview.materialCode,
        materialName: preview.materialName,
        fitCode: preview.fitCode,
        fitName: preview.fitName,
        priceTier: preview.priceTier,
        skuFormat: preview.skuFormat,
        pattern: preview.pattern || 'Solid',
        attributes: preview.attributes ?? {},
      }
      await prod.save()

      for (const [i, vPrev] of includedVariants.entries()) {
        const priceUsd = Number(vPrev.priceUsd ?? firstVarUsd)
        const costPrice = normalizePriceMoney(vPrev.costPrice, 'USD')
        const manufacturingCost = normalizePriceMoney(
          vPrev.manufacturingCost,
          costPrice.currency_code
        )
        const packagingCost = normalizePriceMoney(vPrev.packagingCost, costPrice.currency_code)
        const variantPrices = normalizePriceMoneyArray(vPrev.prices, priceUsd, 'USD')

        let variant = await ProductVariant.query({ client: trx })
          .where('userId', userId)
          .andWhere('sku', vPrev.sku.trim())
          .first()

        if (!variant) {
          variant = new ProductVariant()
          variant.useTransaction(trx)
          variant.userId = userId
          variant.sku = vPrev.sku.trim()
        } else {
          if (variant.productId !== prod.id)
            throw new Error(`SKU ${vPrev.sku} already belongs to another product.`)
          variant.useTransaction(trx)
        }

        variant.productId = prod.id
        variant.title = (
          vPrev.title || `${prod.title} - ${vPrev.colorName} / ${vPrev.sizeKey}`
        ).slice(0, 255)
        variant.isDefault = i === 0
        variant.mpn = variant.sku
        const dimensionAttributes = normalizeVariantAttributes({
          color: vPrev.colorName,
          size: vPrev.sizeKey,
          material: vPrev.materialName,
          fit: vPrev.fitName,
        })
        variant.attributes = dimensionAttributes
        variant.prices = variantPrices
        variant.costPrice = costPrice
        variant.manufacturingCost = manufacturingCost
        variant.packagingCost = packagingCost
        variant.stockOnHand = Math.max(0, Number(vPrev.stockOnHand ?? 25))
        if (!variant.$isPersisted) variant.stockReserved = 0
        variant.reorderPoint = 5
        variant.images = Array.isArray(preview.images) ? preview.images : []
        variant.status = VariantStatus.ACTIVE
        await variant.save()
        variantsCreated += 1

        await ProductVariantAttribute.query({ client: trx })
          .where('productVariantId', variant.id)
          .delete()

        for (const pair of variantAttributePairs(dimensionAttributes)) {
          const attrRow = new ProductVariantAttribute()
          attrRow.useTransaction(trx)
          attrRow.userId = userId
          attrRow.productVariantId = variant.id
          attrRow.attributeName = pair.name
          attrRow.attributeValue = pair.value
          await attrRow.save()
        }
      }

      if (catalogItem) {
        catalogItem.useTransaction(trx)
        catalogItem.title = prod.title
        catalogItem.subTitle = prod.subTitle
        catalogItem.description = prod.description
        catalogItem.resolvedCategoryId = prod.categoryId
        catalogItem.priceTier = preview.priceTier
        catalogItem.status = 'converted'
        catalogItem.convertedProductId = prod.id
        await catalogItem.save()
      }

      return prod
    })

    return { product, variantsCreated }
  }

  /**
   * Creates a product with zero (standalone) or multiple variations, persisting `ProductPrice` and `ProductVariantPrice`.
   */
  /**
   * Resolves the MedusaJS v2 price array for one variant input.
   *
   * Priority: explicit `prices` array -> derived array from the USD base price
   * (`buildMultiCurrencyPriceArray`) -> USD list fallback. Per-currency
   * `priceOverrides` are applied on top of the derived array.
   */
  static resolveVariantPrices(
    input: VariantInput,
    fallbackUsdAmount = 239.99
  ): MedusaVariantPrice[] {
    if (Array.isArray(input.prices) && input.prices.length > 0) {
      return normalizePriceMoneyArray(input.prices, input.priceUsd ?? fallbackUsdAmount)
    }
    const baseUsd = Number.isFinite(Number(input.priceUsd))
      ? Number(input.priceUsd)
      : Number(fallbackUsdAmount)
    return applyCurrencyOverrides(buildMultiCurrencyPriceArray(baseUsd), input.priceOverrides)
  }

  /**
   * Creates one sellable ProductVariant (plus its attribute rows and channel
   * listings) and derives the multi-currency `prices` array from a USD amount
   * when only a USD price is provided.
   */
  static async createVariant(params: {
    userId: string
    product: Product
    variant: VariantInput
    index?: number
    hasVariants?: boolean
    trx?: any
  }): Promise<ProductVariant> {
    const { userId, product, variant: vInput } = params
    const index = params.index ?? 0
    const hasVariants = params.hasVariants ?? product.hasVariants
    if (!vInput?.sku || !String(vInput.sku).trim()) {
      throw new Error('VALIDATION_ERROR: A variant SKU is required.')
    }

    const varPrices = this.resolveVariantPrices(
      vInput,
      Number(vInput.priceUsd ?? product.prices?.[0]?.amount ?? 239.99)
    )
    // Cost fields are self-contained PriceMoney objects; a bare number is USD.
    const costPrice = normalizePriceMoney(vInput.costPrice ?? 0, 'USD')
    const manufacturingCost = normalizePriceMoney(
      vInput.manufacturingCost ?? 0,
      costPrice.currency_code
    )
    const packagingCost = normalizePriceMoney(vInput.packagingCost ?? 0, costPrice.currency_code)

    const variant = new ProductVariant()
    if (params.trx) variant.useTransaction(params.trx)
    variant.userId = userId
    variant.productId = product.id
    variant.sku = vInput.sku.trim()
    variant.title = (vInput.title || product.title).trim()
    variant.isDefault = !hasVariants || index === 0
    variant.barcodeUpcEan = vInput.barcodeUpcEan ?? null
    variant.mpn = vInput.mpn ?? null
    variant.asin = vInput.asin ?? null
    const dimensionAttributes = normalizeVariantAttributes(vInput.attributes)
    variant.attributes = dimensionAttributes
    variant.prices = varPrices
    variant.costPrice = costPrice
    variant.manufacturingCost = manufacturingCost
    variant.packagingCost = packagingCost
    variant.stockOnHand = Math.max(0, Number(vInput.stockOnHand ?? 0))
    if (!variant.$isPersisted) variant.stockReserved = 0
    variant.reorderPoint = Number(vInput.reorderPoint ?? 5)
    variant.weightGrams =
      vInput.weightGrams !== undefined && vInput.weightGrams !== null
        ? Number(vInput.weightGrams).toFixed(2)
        : product.weightGrams
    variant.dimensionsCm = {}
    variant.images = []
    variant.status = VariantStatus.ACTIVE
    await variant.save()

    for (const pair of variantAttributePairs(dimensionAttributes)) {
      const attrRow = new ProductVariantAttribute()
      if (params.trx) attrRow.useTransaction(params.trx)
      attrRow.userId = userId
      attrRow.productVariantId = variant.id
      attrRow.attributeName = pair.name
      attrRow.attributeValue = pair.value
      await attrRow.save()
    }

    for (const lInput of vInput.listings ?? []) {
      const listingPrices =
        Array.isArray(lInput.prices) && lInput.prices.length > 0
          ? normalizePriceMoneyArray(lInput.prices, Number(lInput.listedPriceUsd ?? 0))
          : varPrices
      // The primary listed amount falls back to the first entry of the listing's
      // own price array, so a CAD-only listing never inherits a USD amount.
      const listed =
        normalizeNullablePriceMoney(lInput.listedPrice, listingPrices[0]?.currency_code ?? 'USD') ??
        money(
          listingPrices[0]?.amount ?? vInput.priceUsd ?? 0,
          listingPrices[0]?.currency_code ?? 'USD'
        )

      const listing = new ChannelListing()
      if (params.trx) listing.useTransaction(params.trx)
      listing.userId = userId
      listing.sellerAccountId = lInput.sellerAccountId
      listing.productVariantId = variant.id
      listing.externalListingId = lInput.externalListingId
      listing.externalSku = variant.sku
      // ASIN is the variant's marketplace identity; a listing never stores a copy.
      if (lInput.asin && !variant.asin) {
        variant.asin = lInput.asin
        await variant.save()
      }
      listing.channelTitle = lInput.channelTitle ?? variant.title
      listing.prices = listingPrices
      listing.listedPrice = listed
      listing.allocatedQuantity = Number(lInput.allocatedQuantity ?? variant.stockOnHand)
      listing.listingStatus = ListingStatus.ACTIVE
      listing.publicationStatus = PublicationStatus.PUBLISHED
      listing.syncStatus = EntitySyncStatus.SYNCED
      listing.channelAttributes = {}
      await listing.save()
    }

    return variant
  }

  /**
   * Creates a product with zero (standalone) or multiple variations. When only a
   * USD price is known it is expanded into the MedusaJS v2 multi-currency array
   * for the product and every variant.
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
    prices?: MedusaVariantPrice[]
    variants: VariantInput[]
  }): Promise<Product> {
    if (!input.title || !input.title.trim()) {
      throw new Error('VALIDATION_ERROR: A product title is required.')
    }
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

      const firstUsd = Number(input.variants[0]?.priceUsd ?? 149.99)
      const productPrices =
        Array.isArray(input.prices) && input.prices.length > 0
          ? normalizePriceMoneyArray(input.prices, firstUsd)
          : buildMultiCurrencyPriceArray(firstUsd)

      const product = new Product()
      product.useTransaction(trx)
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
      product.prices = productPrices
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
        await this.createVariant({
          userId: input.userId,
          product,
          variant: input.variants[i],
          index: i,
          hasVariants: product.hasVariants,
          trx,
        })
      }

      return product
    })
  }

  static async importCatalogJson(params: {
    userId: string
    catalogPayload: CatalogJsonPayload
    priceTier?: PriceTierCode
    skuFormat?: SkuFormatMode
    defaultStockOnHand?: number
    costRatio?: number
    convertImmediately?: boolean
  }): Promise<{
    catalogItemsSaved: number
    productsCreated: number
    variantsCreated: number
    products: Product[]
  }> {
    if (params.priceTier && !['01', '02', '03'].includes(params.priceTier))
      throw new Error('Invalid price tier.')
    if (
      params.skuFormat &&
      !['standard', 'prefixed_color', 'catalog_key'].includes(params.skuFormat)
    )
      throw new Error('Invalid SKU format.')
    if (
      params.defaultStockOnHand !== undefined &&
      (!Number.isInteger(params.defaultStockOnHand) || params.defaultStockOnHand < 0)
    )
      throw new Error('Invalid initial stock.')
    if (
      params.costRatio !== undefined &&
      (!Number.isFinite(params.costRatio) || params.costRatio < 0)
    )
      throw new Error('Invalid cost ratio.')
    const { items } = await this.saveCatalogJsonToDb({
      userId: params.userId,
      catalogPayload: params.catalogPayload,
      priceTier: params.priceTier,
    })

    if (params.convertImmediately === false) {
      return {
        catalogItemsSaved: items.length,
        productsCreated: 0,
        variantsCreated: 0,
        products: [],
      }
    }

    let productsCreated = 0
    let variantsCreated = 0
    const createdProducts: Product[] = []

    for (const item of items) {
      const preview = await this.buildProductPreviewFromCatalogItem({
        userId: params.userId,
        catalogItemId: item.id,
        priceTier: params.priceTier,
        skuFormat: params.skuFormat,
        defaultStockOnHand: params.defaultStockOnHand,
        costRatio: params.costRatio,
      })
      const res = await this.createProductFromPreview({
        userId: params.userId,
        preview,
      })
      productsCreated += 1
      variantsCreated += res.variantsCreated
      createdProducts.push(res.product)
    }

    return {
      catalogItemsSaved: items.length,
      productsCreated,
      variantsCreated,
      products: createdProducts,
    }
  }
}
