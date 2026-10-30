import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import ProductCategory from '#models/product_category'
import { product_categories, flattenMedusaCategories } from '../data/data_category.js'
import type { MedusaCategoryMetadata, MedusaProductCategory } from '../types/catalog_pipeline.js'

export interface ResolvedCategoryMetadata extends MedusaCategoryMetadata {
  medusaId?: string
  handle?: string
  mpath?: string
}

const LEAF_ALIAS_MAP: Record<string, string> = {
  'duster-coats': 'duster',
  'duster-coat': 'duster',
  'pea-coats': 'pea',
  'pea-coat': 'pea',
  'trench-coats': 'trench',
  'trench-coat': 'trench',
  'car-coats': 'car',
  'car-coat': 'car',
  'overcoat': 'overcoats',
  'biker-jackets': 'biker-motorcycle',
  'biker-jacket': 'biker-motorcycle',
  'motorcycle-jackets': 'biker-motorcycle',
  'cafe-racer-jackets': 'cafe-racer',
  'cafe-racer-jacket': 'cafe-racer',
  'bomber-jackets': 'bomber-flight',
  'bomber-jacket': 'bomber-flight',
  'flight-jackets': 'bomber-flight',
  'quilted-jackets': 'quilted-padded',
  'padded-jackets': 'quilted-padded',
  'hooded-jackets': 'hooded',
  'pants': 'pants-trousers',
  'trousers': 'pants-trousers',
  'vests': 'vests-waistcoats',
}

export class CategorySyncService {
  /**
   * Returns the Medusa `/store/product-categories` response payload.
   */
  static getBuiltInMedusaCategories(): MedusaProductCategory[] {
    return product_categories
  }

  /**
   * Normalizes catalog category handles like:
   *   "mens/apparel/outerwear/coats/duster-coats" -> "men/outerwear/coats/duster"
   *   "womens/apparel/outerwear/jackets/biker-jackets" -> "women/outerwear/jackets/biker-motorcycle"
   */
  static normalizeCategoryHandle(rawHandle?: string | null): string {
    if (!rawHandle) return ''
    const segments = rawHandle
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean)
      .filter((seg) => seg !== 'apparel' && seg !== 'clothing')

    if (segments.length === 0) return ''

    if (segments[0] === 'mens' || segments[0] === 'male') segments[0] = 'men'
    if (segments[0] === 'womens' || segments[0] === 'female' || segments[0] === 'ladies') {
      segments[0] = 'women'
    }

    const lastIdx = segments.length - 1
    const leaf = segments[lastIdx]
    if (LEAF_ALIAS_MAP[leaf]) {
      segments[lastIdx] = LEAF_ALIAS_MAP[leaf]
    } else if (leaf.endsWith('-coats') && leaf !== 'overcoats') {
      segments[lastIdx] = leaf.replace(/-coats$/, '')
    } else if (leaf.endsWith('-jackets')) {
      const stripped = leaf.replace(/-jackets$/, '')
      segments[lastIdx] = LEAF_ALIAS_MAP[leaf] ?? stripped
    }

    return segments.join('/')
  }

  /**
   * Extracts the stored Medusa category metadata from `ProductCategory.attributesSchema`
   * (or falls back to looking up the handle in `data-category.ts`).
   */
  static extractCategoryMetadata(category?: ProductCategory | null): ResolvedCategoryMetadata {
    if (!category) return {}
    const rawSchema = category.attributesSchema
    if (rawSchema && typeof rawSchema === 'object' && !Array.isArray(rawSchema)) {
      const schemaObj = rawSchema as Record<string, any>
      return {
        medusaId: schemaObj.medusaId ?? category.id,
        handle: schemaObj.handle ?? category.taxonomyPath ?? category.slug,
        mpath: schemaObj.mpath,
        ...(schemaObj.metadata ?? {}),
      }
    }
    if (Array.isArray(rawSchema) && rawSchema.length > 0 && typeof rawSchema[0] === 'object') {
      const first = rawSchema[0] as Record<string, any>
      if (first.medusaId || first.metadata || first.handle) {
        return {
          medusaId: first.medusaId ?? category.id,
          handle: first.handle ?? category.taxonomyPath ?? category.slug,
          mpath: first.mpath,
          ...(first.metadata ?? {}),
        }
      }
    }

    // Fallback lookup in built-in data-category.ts
    const flat = flattenMedusaCategories()
    const match = flat.find(
      (n) =>
        n.handle === category.slug ||
        n.handle === category.taxonomyPath ||
        n.name.toLowerCase() === category.name.toLowerCase()
    )
    if (match) {
      return {
        medusaId: match.id,
        handle: match.handle,
        mpath: match.mpath,
        ...(match.metadata ?? {}),
      }
    }
    return {
      medusaId: category.id,
      handle: category.taxonomyPath ?? category.slug,
    }
  }

  /**
   * Fetches categories from a remote Medusa `/store/product-categories` endpoint if provided,
   * or uses the bundled `data-category.ts` tree, and upserts all nodes into `product_categories`.
   */
  static async syncFromMedusaEndpoint(
    userId: string,
    medusaBaseUrl?: string | null
  ): Promise<{ syncedCount: number; source: string }> {
    let tree: MedusaProductCategory[] = product_categories
    let source = 'built-in data-category.ts (/store/product-categories)'

    const cleanUrl = (medusaBaseUrl ?? process.env.MEDUSA_BACKEND_URL ?? '').trim()
    if (cleanUrl && /^https?:\/\//i.test(cleanUrl)) {
      const endpoint = cleanUrl.endsWith('/store/product-categories')
        ? cleanUrl
        : `${cleanUrl.replace(/\/+$/, '')}/store/product-categories`
      try {
        const res = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
        })
        if (res.ok) {
          const json = (await res.json()) as any
          const remoteList = Array.isArray(json)
            ? json
            : Array.isArray(json?.product_categories)
              ? json.product_categories
              : null
          if (remoteList && remoteList.length > 0) {
            tree = remoteList
            source = endpoint
          }
        }
      } catch {
        // Fallback to built-in data-category.ts when offline or unreachable
      }
    }

    let syncedCount = 0
    await db.transaction(async (trx) => {
      syncedCount = await this.upsertCategoryTree(userId, tree, null, trx)
    })

    return { syncedCount, source }
  }

  /**
   * Recursively upserts Medusa category nodes into `product_categories`.
   */
  static async upsertCategoryTree(
    userId: string,
    nodes: MedusaProductCategory[],
    parentId: string | null = null,
    trx?: TransactionClientContract
  ): Promise<number> {
    let count = 0

    for (const node of nodes) {
      const handle = (node.handle || node.name)
        .trim()
        .toLowerCase()
        .replace(/^\/+|\/+$/g, '')

      const existingQuery = ProductCategory.query()
        .where('userId', userId)
        .andWhere('slug', handle)
      if (trx) existingQuery.useTransaction(trx)
      let cat = await existingQuery.first()

      const attributesPayload = [
        {
          medusaId: node.id ?? null,
          handle,
          mpath: node.mpath ?? null,
          metadata: node.metadata ?? {},
        },
      ]

      if (!cat) {
        cat = new ProductCategory()
        if (trx) cat.useTransaction(trx)
        cat.userId = userId
        cat.slug = handle
      } else if (trx) {
        cat.useTransaction(trx)
      }

      cat.parentCategoryId = parentId
      cat.name = node.name.trim()
      cat.taxonomyPath = handle
      cat.description = node.description ?? null
      cat.sortOrder = Number(node.rank ?? 0)
      cat.isActive = node.is_active !== false
      cat.attributesSchema = attributesPayload
      await cat.save()
      count += 1

      if (Array.isArray(node.category_children) && node.category_children.length > 0) {
        count += await this.upsertCategoryTree(userId, node.category_children, cat.id, trx)
      }
    }

    return count
  }

  /**
   * 4-step category resolver that maps a catalog entry's `category_handle`, `type`, and `gender`
   * to the best matching `ProductCategory` row for the user.
   * Automatically seeds built-in Medusa categories if none are synced yet.
   */
  static async resolveCategory(
    userId: string,
    categoryHandle?: string | null,
    productType?: string | null,
    gender?: string | null,
    trx?: TransactionClientContract
  ): Promise<ProductCategory | null> {
    const loadCategories = async () => {
      const q = ProductCategory.query().where('userId', userId)
      if (trx) q.useTransaction(trx)
      return await q
    }

    let categories = await loadCategories()
    const hasMedusaHandles = categories.some((c) => (c.taxonomyPath ?? c.slug).includes('/'))
    if (categories.length === 0 || !hasMedusaHandles) {
      await this.upsertCategoryTree(userId, product_categories, null, trx)
      categories = await loadCategories()
    }

    const rawHandle = (categoryHandle ?? '').trim().toLowerCase().replace(/^\/+|\/+$/g, '')
    const normalizedHandle = this.normalizeCategoryHandle(rawHandle)

    // Step 1: Exact handle / slug / taxonomyPath match
    if (rawHandle) {
      const exact = categories.find(
        (c) =>
          c.slug.toLowerCase() === rawHandle ||
          (c.taxonomyPath ?? '').toLowerCase() === rawHandle
      )
      if (exact) return exact
    }

    // Step 2: Normalized path match (e.g. "mens/apparel/outerwear/coats/duster-coats" -> "men/outerwear/coats/duster")
    if (normalizedHandle) {
      const normMatch = categories.find(
        (c) =>
          c.slug.toLowerCase() === normalizedHandle ||
          (c.taxonomyPath ?? '').toLowerCase() === normalizedHandle
      )
      if (normMatch) return normMatch
    }

    // Determine gender prefix ("men", "women", "kids")
    const g = (gender ?? '').trim().toLowerCase()
    const genderPrefix =
      g.startsWith('women') || g.startsWith('female')
        ? 'women'
        : g.startsWith('kid') || g.startsWith('boy') || g.startsWith('girl')
          ? 'kids'
          : normalizedHandle.startsWith('women/')
            ? 'women'
            : normalizedHandle.startsWith('kids/')
              ? 'kids'
              : 'men'

    // Step 3: Product Type + Gender match (e.g. "Duster Coat" -> "Duster Coats" under "men/...")
    if (productType) {
      const cleanType = productType.trim().toLowerCase()
      const pluralType = cleanType.endsWith('s') ? cleanType : `${cleanType}s`
      const typeMatch = categories.find((c) => {
        const cPath = (c.taxonomyPath ?? c.slug).toLowerCase()
        const cName = c.name.trim().toLowerCase()
        const matchesGender = cPath.startsWith(`${genderPrefix}/`) || cPath === genderPrefix
        const matchesName =
          cName === cleanType ||
          cName === pluralType ||
          cName.includes(cleanType) ||
          cleanType.includes(cName.replace(/s$/, ''))
        return matchesGender && matchesName
      })
      if (typeMatch) return typeMatch
    }

    // Step 4: Ancestor / Leaf fallback
    if (normalizedHandle) {
      const parts = normalizedHandle.split('/')
      for (let len = parts.length - 1; len >= 1; len--) {
        const prefix = parts.slice(0, len).join('/')
        const ancestor = categories.find(
          (c) =>
            c.slug.toLowerCase() === prefix || (c.taxonomyPath ?? '').toLowerCase() === prefix
        )
        if (ancestor) return ancestor
      }
    }

    return categories[0] ?? null
  }
}
