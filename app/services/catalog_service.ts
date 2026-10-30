import db from '@adonisjs/lucid/services/db'
import CatalogItem from '#models/catalog_item'
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
import {
  MAIN_CATALOG_CONFIG,
  SAMPLE_CATALOG_JSON,
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
  retailPrice: number
  costPrice: number
  stockOnHand: number
  included: boolean
}

export interface GeneratedProductPreview {
  catalogItemId: string
  catalogKey: string
  structuredCode: string
  title: string
  title75: string
  title80: string
  subTitle: string
  subTitle125: string
  type: string
  gender: string
  categoryId: string | null
  categoryName: string
  categoryHandle: string
  description: string
  shortDescription: string
  extendedDescription: string
  pattern: string
  materialCode: string
  materialName: string
  fitCode: string
  fitName: string
  priceTier: PriceTierCode
  skuFormat: SkuFormatMode
  images: string[]
  tags: string[]
  attributes: Record<string, unknown>
  variants: GeneratedVariantPreview[]
}

let catalogTableEnsured = false

export class CatalogService {
  /**
   * Idempotently ensures the `catalog_items` table exists in PostgreSQL even if
   * `node ace migration:run` has not been re-run yet.
   */
  static async ensureCatalogTable(): Promise<void> {
    if (catalogTableEnsured) return
    try {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS catalog_items (
          id varchar(64) NOT NULL PRIMARY KEY,
          user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          catalog_key varchar(100) NOT NULL,
          structured_code varchar(100) NULL,
          file_name varchar(255) NULL,
          title varchar(255) NOT NULL,
          title_75 varchar(255) NULL,
          title_80 varchar(255) NULL,
          sub_title varchar(255) NULL,
          sub_title_125 varchar(255) NULL,
          type varchar(100) NULL,
          gender varchar(50) NOT NULL DEFAULT 'Men',
          category_code varchar(20) NOT NULL DEFAULT 'CT',
          category_name varchar(100) NOT NULL DEFAULT 'Coat',
          product_code varchar(20) NOT NULL DEFAULT 'DC',
          category_handle varchar(500) NULL,
          resolved_category_id varchar(64) NULL REFERENCES product_categories(id) ON DELETE SET NULL,
          description text NULL,
          short_description text NULL,
          extended_description text NULL,
          pattern varchar(100) NULL DEFAULT 'Solid',
          material_code varchar(20) NOT NULL DEFAULT 'NP',
          fit_code varchar(20) NOT NULL DEFAULT 'RG',
          price_tier varchar(10) NOT NULL DEFAULT '01',
          attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
          images jsonb NOT NULL DEFAULT '[]'::jsonb,
          tags jsonb NOT NULL DEFAULT '[]'::jsonb,
          variants_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
          status varchar(50) NOT NULL DEFAULT 'draft',
          converted_product_id varchar(64) NULL REFERENCES products(id) ON DELETE SET NULL,
          created_at timestamptz NOT NULL DEFAULT NOW(),
          updated_at timestamptz NOT NULL DEFAULT NOW()
        );
      `)
      await db.rawQuery(
        `CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_items_user_key ON catalog_items (user_id, catalog_key);`
      )
      await db.rawQuery(
        `CREATE INDEX IF NOT EXISTS idx_catalog_items_user_filters ON catalog_items (user_id, gender, category_name, type, status);`
      )
      catalogTableEnsured = true
    } catch {
      // Ignore if running in read-only or concurrent transaction
    }
  }

  /**
   * Lists all DB-stored `CatalogItem` rows for the user, auto-seeding the sample catalog
   * (`SKU1`, `SKU2`, `SKU3`, `SKU4`) on first visit if the user has zero catalog items.
   */
  static async listCatalogItems(userId: string): Promise<CatalogItem[]> {
    await this.ensureCatalogTable()
    let items = await CatalogItem.query()
      .where('userId', userId)
      .preload('resolvedCategory')
      .preload('convertedProduct')
      .orderBy('catalogKey', 'asc')

    if (items.length === 0) {
      await this.saveCatalogJsonToDb({
        userId,
        catalogPayload: SAMPLE_CATALOG_JSON,
        priceTier: '01',
      })
      items = await CatalogItem.query()
        .where('userId', userId)
        .preload('resolvedCategory')
        .preload('convertedProduct')
        .orderBy('catalogKey', 'asc')
    }

    return items
  }

  /**
   * Saves a Catalog JSON payload (`{"SKU1": {...}, "SKU2": {...}}`) into `catalog_items` table
   * as brand-agnostic catalog records ready to filter, edit, preview, and convert to Products.
   */
  static async saveCatalogJsonToDb(params: {
    userId: string
    catalogPayload: CatalogJsonPayload
    priceTier?: PriceTierCode
  }): Promise<{ savedCount: number; items: CatalogItem[] }> {
    await this.ensureCatalogTable()
    const { userId, catalogPayload, priceTier = '01' } = params
    const entries = Object.entries(catalogPayload ?? {})
    if (entries.length === 0) {
      throw new Error('Catalog JSON payload must contain at least one SKU entry.')
    }

    const savedItems: CatalogItem[] = []
    await db.transaction(async (trx) => {
      for (let i = 0; i < entries.length; i++) {
        const [catalogKey, entry] = entries[i] as [string, CatalogJsonEntry]
        if (!entry || typeof entry !== 'object' || !entry.title) continue

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

    const varSpec = entry.varaints ?? entry.variants ?? { color: ['BLK'], size: ['S', 'M', 'L', 'XL'] }
    const firstColor =
      Array.isArray(varSpec.color) && varSpec.color.length > 0 ? varSpec.color[0] : 'BLK'
    const fileName = `${structuredCode}-${firstColor}-${leatherInfo.code}-${fitInfo.code}`

    const activeTier: PriceTierCode =
      (entry.attributes?.price_tier as PriceTierCode) ||
      (sequence === '02' || sequence === '03' ? (sequence as PriceTierCode) : defaultPriceTier)

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
    item.title75 = String(entry.title75 || entry.title).slice(0, 75)
    item.title80 = String(entry.title80 || entry.title75 || entry.title).slice(0, 80)
    item.subTitle = entry.subTitle ? String(entry.subTitle).slice(0, 60) : null
    item.subTitle125 = entry.subTitle125
      ? String(entry.subTitle125).slice(0, 125)
      : entry.subTitle
        ? String(entry.subTitle).slice(0, 125)
        : null
    item.type = entry.type || catProdInfo.productTypeName
    item.gender = genderInfo.label
    item.categoryCode = catProdInfo.categoryCode
    item.categoryName = catProdInfo.categoryName
    item.productCode = catProdInfo.productCode
    item.categoryHandle =
      entry.category_handle || categoryMeta.handle || category?.taxonomyPath || null
    item.resolvedCategoryId = category?.id ?? null
    item.description = entry.description ?? null
    item.shortDescription = entry.shortDescription
      ? String(entry.shortDescription).slice(0, 500)
      : null
    item.extendedDescription = entry.extendedDescription
      ? String(entry.extendedDescription).slice(0, 3000)
      : null
    item.pattern = entry.pattern || 'Solid'
    item.materialCode = leatherInfo.code
    item.fitCode = fitInfo.code
    item.priceTier = activeTier
    item.attributes = entry.attributes ?? {}
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

  /**
   * Creates or updates a single `CatalogItem` from form fields on `/catalog`.
   */
  static async upsertSingleCatalogItem(params: {
    userId: string
    id?: string | null
    catalogKey: string
    title: string
    title75?: string
    title80?: string
    subTitle?: string
    subTitle125?: string
    type?: string
    gender?: string
    categoryHandle?: string
    description?: string
    shortDescription?: string
    extendedDescription?: string
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
    await this.ensureCatalogTable()
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
        .first()
    }
    const prevAttrs = (existing?.attributes ?? {}) as Record<string, any>

    const entry: CatalogJsonEntry = {
      title: params.title,
      title75: params.title75 || params.title,
      title80: params.title80 || params.title75 || params.title,
      subTitle: params.subTitle,
      subTitle125: params.subTitle125 || params.subTitle,
      type: params.type || existing?.type || 'Duster Coat',
      category_handle:
        params.categoryHandle ||
        existing?.categoryHandle ||
        'mens/apparel/outerwear/coats/duster-coats',
      description: params.description ?? existing?.description ?? '',
      shortDescription: params.shortDescription ?? existing?.shortDescription ?? '',
      extendedDescription: params.extendedDescription ?? existing?.extendedDescription ?? '',
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

  /**
   * Deletes a `CatalogItem` by ID.
   */
  static async deleteCatalogItem(userId: string, id: string): Promise<void> {
    await this.ensureCatalogTable()
    const item = await CatalogItem.query().where('userId', userId).andWhere('id', id).firstOrFail()
    await item.delete()
  }

  /**
   * Builds a rich, editable Product + Cartesian Variant Matrix preview for a single `CatalogItem`
   * BEFORE creating the `Product` and `ProductVariant` rows in PostgreSQL.
   */
  static async buildProductPreviewFromCatalogItem(params: {
    userId: string
    catalogItemId: string
    priceTier?: PriceTierCode
    skuFormat?: SkuFormatMode
    defaultStockOnHand?: number
    costRatio?: number
  }): Promise<GeneratedProductPreview> {
    await this.ensureCatalogTable()
    const item = await CatalogItem.query()
      .where('userId', params.userId)
      .andWhere('id', params.catalogItemId)
      .preload('resolvedCategory')
      .firstOrFail()

    const category =
      item.resolvedCategory ||
      (await CategorySyncService.resolveCategory(
        params.userId,
        item.categoryHandle,
        item.type,
        item.gender
      ))

    const activeTier: PriceTierCode =
      params.priceTier || (item.priceTier as PriceTierCode) || '01'
    const skuFormat: SkuFormatMode = params.skuFormat || 'standard'
    const stockOnHand = params.defaultStockOnHand ?? 25
    const costRatio = params.costRatio ?? 0.42

    const leatherInfo = resolveLeatherCode(
      item.attributes?.fabric || item.attributes?.material,
      item.materialCode
    )
    const fitInfo = resolveFitCode(item.fitCode || item.attributes?.size_type)
    const structuredCode =
      item.structuredCode ||
      buildStructuredBaseCode({
        genderCode: resolveGenderCode(item.gender).code,
        categoryCode: item.categoryCode || 'CT',
        productCode: item.productCode || 'DC',
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
        const retailPrice = resolveTierPrice(activeTier, sizeInfo.sizeIndex)
        const costPrice = Number((retailPrice * costRatio).toFixed(2))
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
          retailPrice,
          costPrice,
          stockOnHand,
          included: true,
        })
      }
    }

    return {
      catalogItemId: item.id,
      catalogKey: item.catalogKey,
      structuredCode,
      title: item.title,
      title75: item.title75 || item.title,
      title80: item.title80 || item.title75 || item.title,
      subTitle: item.subTitle || '',
      subTitle125: item.subTitle125 || item.subTitle || '',
      type: item.type || 'Duster Coat',
      gender: item.gender || 'Men',
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? item.categoryName ?? 'Coat',
      categoryHandle: category?.taxonomyPath ?? item.categoryHandle ?? '',
      description: item.description || '',
      shortDescription: item.shortDescription || '',
      extendedDescription: item.extendedDescription || '',
      pattern: item.pattern || 'Solid',
      materialCode: leatherInfo.code,
      materialName: leatherInfo.name,
      fitCode: fitInfo.code,
      fitName: fitInfo.name,
      priceTier: activeTier,
      skuFormat,
      images: Array.isArray(item.images) ? item.images : [],
      tags: Array.isArray(item.tags) ? item.tags : [],
      attributes: (item.attributes ?? {}) as Record<string, unknown>,
      variants,
    }
  }

  /**
   * Confirms and converts a `CatalogItem` (with user-edited product & variant preview fields)
   * into a brand-agnostic `Product` (`brandId = null`) + `ProductVariant` + `ProductVariantAttribute` rows.
   */
  static async createProductFromPreview(params: {
    userId: string
    preview: GeneratedProductPreview
  }): Promise<{ product: Product; variantsCreated: number }> {
    await this.ensureCatalogTable()
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
        .first()

      const category = preview.categoryId
        ? await db
            .from('product_categories')
            .where('id', preview.categoryId)
            .andWhere('user_id', userId)
            .first()
        : null

      const cleanSlugBase = `${preview.catalogKey}-${preview.title}`
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 200)

      let prod = await Product.query({ client: trx })
        .where('userId', userId)
        .andWhere((q) =>
          q.where('skuPrefix', preview.catalogKey).orWhere('slug', cleanSlugBase)
        )
        .first()

      if (!prod) {
        prod = new Product()
        prod.useTransaction(trx)
        prod.userId = userId
        prod.slug = cleanSlugBase || `prod-${Date.now()}`
      } else {
        prod.useTransaction(trx)
      }

      const tierPriceArray =
        MAIN_CATALOG_CONFIG['LIST PRICE'][preview.priceTier] ??
        MAIN_CATALOG_CONFIG['LIST PRICE']['01']

      prod.brandId = null
      prod.categoryId = category ? category.id : preview.categoryId || null
      prod.skuPrefix = preview.catalogKey
      prod.title = String(preview.title).slice(0, 60)
      prod.title75 = String(preview.title75 || preview.title).slice(0, 75)
      prod.title80 = String(preview.title80 || preview.title75 || preview.title).slice(0, 80)
      prod.subTitle = preview.subTitle ? String(preview.subTitle).slice(0, 60) : null
      prod.subTitle125 = preview.subTitle125 ? String(preview.subTitle125).slice(0, 125) : null
      prod.description = preview.description || null
      prod.shortDescription = preview.shortDescription
        ? String(preview.shortDescription).slice(0, 500)
        : null
      prod.extendedDescription = preview.extendedDescription
        ? String(preview.extendedDescription).slice(0, 3000)
        : null
      prod.type = preview.type || 'Coat'
      prod.status = ProductStatus.ACTIVE
      prod.hasVariants = true
      prod.variationDimensions = ['color', 'size']
      prod.listPrice = tierPriceArray.map((price, idx) => ({
        currency_code: 'USD',
        size_value: MAIN_CATALOG_CONFIG['Size Data'].alpha[idx]?.['Size Value'] ?? String(idx),
        price,
      }))
      prod.salePrice = []
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
        category_handle: preview.categoryHandle,
        resolved_category_handle: preview.categoryHandle,
        attributes: preview.attributes ?? {},
      }
      await prod.save()

      for (let i = 0; i < includedVariants.length; i++) {
        const vPrev = includedVariants[i]
        const retailPrice = Number(vPrev.retailPrice || 239.99)
        const costPrice = Number(vPrev.costPrice ?? (retailPrice * 0.42).toFixed(2))
        const manufacturingCost = Number((costPrice * 0.85).toFixed(2))
        const packagingCost = Number((costPrice * 0.15).toFixed(2))

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
          variant.useTransaction(trx)
        }

        variant.productId = prod.id
        variant.title = (vPrev.title || `${prod.title} - ${vPrev.colorName} / ${vPrev.sizeKey}`).slice(
          0,
          255
        )
        variant.isDefault = i === 0
        variant.mpn = variant.sku
        variant.attributes = {
          color_code: vPrev.colorCode,
          color: vPrev.colorName,
          color_name: vPrev.colorName,
          color_map: vPrev.colorMap,
          size_code: vPrev.sizeValue,
          size: vPrev.sizeKey,
          size_value: vPrev.sizeValue,
          size_key: vPrev.sizeKey,
          material_code: vPrev.materialCode,
          material_name: vPrev.materialName,
          fit_code: vPrev.fitCode,
          fit_name: vPrev.fitName,
          structured_code: preview.structuredCode,
        }
        variant.currencyCode = 'USD'
        variant.retailPrice = retailPrice.toFixed(2)
        variant.compareAtPrice = (retailPrice + 40).toFixed(2)
        variant.costPrice = costPrice.toFixed(2)
        variant.manufacturingCost = manufacturingCost.toFixed(2)
        variant.packagingCost = packagingCost.toFixed(2)
        variant.stockOnHand = Math.max(0, Number(vPrev.stockOnHand ?? 25))
        variant.stockReserved = 0
        variant.reorderPoint = 5
        variant.images = Array.isArray(preview.images) ? preview.images : []
        variant.status = VariantStatus.ACTIVE
        await variant.save()
        variantsCreated += 1

        await ProductVariantAttribute.query({ client: trx })
          .where('productVariantId', variant.id)
          .delete()

        const pairs: Array<[string, string]> = [
          ['color', vPrev.colorName],
          ['color_code', vPrev.colorCode],
          ['color_map', vPrev.colorMap],
          ['size', vPrev.sizeKey],
          ['size_value', vPrev.sizeValue],
          ['material', vPrev.materialName],
          ['fit', vPrev.fitName],
        ]
        for (const [attrName, attrValue] of pairs) {
          const attrRow = new ProductVariantAttribute()
          attrRow.useTransaction(trx)
          attrRow.userId = userId
          attrRow.productVariantId = variant.id
          attrRow.attributeName = attrName
          attrRow.attributeValue = attrValue
          await attrRow.save()
        }
      }

      if (catalogItem) {
        catalogItem.useTransaction(trx)
        catalogItem.title = prod.title
        catalogItem.title75 = prod.title75
        catalogItem.title80 = prod.title80
        catalogItem.subTitle = prod.subTitle
        catalogItem.subTitle125 = prod.subTitle125
        catalogItem.description = prod.description
        catalogItem.shortDescription = prod.shortDescription
        catalogItem.extendedDescription = prod.extendedDescription
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
   * Creates a product with zero (standalone) or multiple variations.
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

  /**
   * Batch imports a Catalog JSON payload into `catalog_items` AND optionally converts all entries
   * directly into `Product` + `ProductVariant` rows.
   */
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
