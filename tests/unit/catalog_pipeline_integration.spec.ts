import { test } from '@japa/runner'
import User from '#models/user'
import Brand from '#models/brand'
import Product from '#models/product'
import ProductCategory from '#models/product_category'
import ProductsController from '#controllers/products_controller'
import ProductVariant from '#models/product_variant'
import ChannelListing from '#models/channel_listing'
import { CatalogService } from '#services/catalog_service'
import { CategorySyncService } from '#services/category_sync_service'
import { ListingTransformerService } from '#services/listing_transformer_service'
import { SAMPLE_CATALOG_JSON } from '../../app/data/catalog_config/index.js'
import { generateEntityId } from '../../app/utils/generate_entity_id.js'
import Role from '#models/role'
import Permission from '#models/permission'
import RolePermission from '#models/role_permission'
import UserRole from '#models/user_role'
import ModuleEntitlement from '#models/module_entitlement'
import CatalogPermissionMiddleware from '#middleware/catalog_permission_middleware'
import type { ListingPlatform } from '../../app/types/catalog_pipeline.js'

test.group('Catalog pipeline integration', (group) => {
  let user: User
  let other: User
  let brand: Brand
  group.setup(async () => {
    const nonce = generateEntityId()
    const createUser = (email: string) =>
      User.create({
        email,
        fullName: 'Catalog Test',
        password: 'ValidPassword123!',
        status: 'active',
        isSuperAdmin: false,
        defaultCurrency: 'USD',
        timezone: 'UTC',
        failedLoginAttempts: 0,
      })
    user = await createUser(`catalog-${nonce}@example.com`)
    other = await createUser(`other-${nonce}@example.com`)
    brand = await Brand.create({
      userId: user.id,
      name: 'Artisan Hide',
      slug: 'artisan-hide',
      isActive: true,
    })
  })

  test('syncs taxonomy and creates the unbranded 20-variant matrix; exports and persists listings', async ({
    assert,
  }) => {
    const { syncedCount } = await CategorySyncService.syncFromMedusaEndpoint(user.id)
    assert.isAbove(syncedCount, 10)
    const category = await CategorySyncService.resolveCategory(
      user.id,
      'mens/apparel/outerwear/coats/duster-coats',
      'Duster Coat',
      'mens'
    )
    assert.equal(category?.taxonomyPath, 'men/outerwear/coats/duster')
    const metadata = CategorySyncService.extractCategoryMetadata(category)
    assert.equal(metadata.medusaId, 'pcat_01K7CG40W523W8G3Z46K75N10P')
    assert.equal(metadata.amazon_browse_node, '2476517011')
    assert.equal(metadata.ebay_category_id, '57988')
    assert.isNull(
      await CategorySyncService.resolveCategory(user.id, 'unknown/no-match', undefined, undefined)
    )

    const result = await CatalogService.importCatalogJson({
      userId: user.id,
      catalogPayload: { SKU1: SAMPLE_CATALOG_JSON.SKU1, SKU2: SAMPLE_CATALOG_JSON.SKU2 },
      priceTier: '01',
      defaultStockOnHand: 0,
    })
    assert.equal(result.productsCreated, 2)
    assert.equal(result.variantsCreated, 20)
    const productIds = result.products.map((product) => product.id)
    const products = await Product.query()
      .where('userId', user.id)
      .whereIn('id', productIds)
      .preload('variants', (q) => q.preload('variantAttributes'))
    for (const product of products) {
      assert.isNull(product.brandId)
      assert.equal(product.variants.length, 10)
      for (const variant of product.variants) {
        assert.equal(variant.stockOnHand, 0)
        // catalog_items is USD-only: the variant price array is derived from the USD tier price.
        const usdPrice = variant.prices.find((price) => price.currency_code === 'USD')
        const sizeAttribute = variant.variantAttributes.find((a) => a.attributeName === 'size')
        assert.equal(usdPrice?.amount, sizeAttribute?.attributeValue === 'Small' ? 229.99 : 239.99)
        assert.isTrue(variant.variantAttributes.some((a) => a.attributeName === 'color'))
        assert.isNotNull(sizeAttribute)
        // product_variant_attributes is the source of truth; the JSONB map mirrors it
        // as a clean { [dimension]: value } document with no derived duplicates.
        assert.deepEqual(Object.keys(variant.attributes).sort(), [
          'color',
          'fit',
          'material',
          'size',
        ])
        for (const attribute of variant.variantAttributes) {
          assert.equal(variant.attributes[attribute.attributeName], attribute.attributeValue)
        }
      }
    }
    for (const platform of ['medusa', 'amazon', 'ebay', 'etsy'] as ListingPlatform[]) {
      const preview = await ListingTransformerService.generateListings({
        userId: user.id,
        brandId: brand.id,
        productIds,
        platform,
      })
      assert.equal(preview.variantCount, 20)
      assert.equal(preview.payload.platform, platform)
      assert.equal(preview.listingsPersisted, 0)
    }
    assert.equal(
      await ChannelListing.query()
        .where('userId', user.id)
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      0
    )
    const saved = await ListingTransformerService.generateListings({
      userId: user.id,
      brandId: brand.id,
      productIds,
      platform: 'amazon',
      persistChannelListings: true,
    })
    assert.equal(saved.listingsPersisted, 20)
    const firstListing = await ChannelListing.query().where('userId', user.id).firstOrFail()
    assert.equal(firstListing.allocatedQuantity, 0)
    for (const product of result.products) {
      await product.refresh()
      assert.isNull(product.brandId)
    }
    await assert.rejects(() =>
      ListingTransformerService.generateListings({
        userId: other.id,
        brandId: brand.id,
        productIds,
        platform: 'amazon',
      })
    )
    await assert.rejects(() =>
      ListingTransformerService.generateListings({
        userId: user.id,
        brandId: brand.id,
        productIds,
        platform: 'amazon',
        persistChannelListings: true,
        sellerAccountId: other.id,
      })
    )
  })

  test('rejects malformed imports and prevents moving existing SKUs between products', async ({
    assert,
  }) => {
    await assert.rejects(
      () => CatalogService.importCatalogJson({ userId: user.id, catalogPayload: [] as any }),
      /object keyed by SKU/
    )
    await assert.rejects(
      () =>
        CatalogService.importCatalogJson({
          userId: user.id,
          catalogPayload: { bad: { title: '' } },
        }),
      /Invalid catalog entry/
    )
    const original = await ProductVariant.query().where('userId', user.id).firstOrFail()
    const saved = await CatalogService.saveCatalogJsonToDb({
      userId: user.id,
      catalogPayload: { CONFLICT: { ...SAMPLE_CATALOG_JSON.SKU1 } },
    })
    const preview = await CatalogService.buildProductPreviewFromCatalogItem({
      userId: user.id,
      catalogItemId: saved.items[0].id,
    })
    preview.variants[0].sku = original.sku
    await assert.rejects(
      () => CatalogService.createProductFromPreview({ userId: user.id, preview }),
      /already belongs to another product/
    )
    const after = await ProductVariant.findOrFail(original.id)
    assert.equal(after.productId, original.productId)
  })
  test('catalog operations enforce action permissions and enabled module', async ({ assert }) => {
    const middleware = new CatalogPermissionMiddleware()
    let continued = false
    const ctx = {
      auth: { getUserOrFail: () => user },
      response: { forbidden: () => 'forbidden' },
    } as any
    const next = async () => {
      continued = true
    }
    assert.equal(await middleware.handle(ctx, next, { action: 'create' }), 'forbidden')
    const role = await Role.create({
      slug: `pipeline-${generateEntityId()}`,
      name: 'Pipeline',
      isSystem: false,
    })
    const permission = await Permission.firstOrCreate(
      { slug: 'catalog.create' },
      { slug: 'catalog.create', name: 'Create catalog', resource: 'catalog', action: 'create' }
    )
    await RolePermission.create({ roleId: role.id, permissionId: permission.id, effect: 'allow' })
    await UserRole.create({ userId: user.id, roleId: role.id })
    assert.equal(await middleware.handle(ctx, next, { action: 'create' }), 'forbidden')
    await ModuleEntitlement.create({
      userId: user.id,
      moduleKey: 'catalog',
      isEnabled: true,
      planTier: 'enterprise',
      limits: {},
    })
    await middleware.handle(ctx, next, { action: 'create' })
    assert.isTrue(continued)
    continued = false
    assert.equal(await middleware.handle(ctx, next, { action: 'delete' }), 'forbidden')
    assert.isFalse(continued)
  })
  test('category endpoint merges only the authenticated tenant custom categories', async ({
    assert,
  }) => {
    await ProductCategory.create({
      userId: user.id,
      name: 'Custom catalog',
      slug: 'custom-catalog',
      taxonomyPath: 'custom-catalog',
      attributesSchema: [],
      isActive: true,
      sortOrder: 0,
    })
    await ProductCategory.create({
      userId: other.id,
      name: 'Private category',
      slug: 'private-category',
      taxonomyPath: 'private-category',
      attributesSchema: [],
      isActive: true,
      sortOrder: 0,
    })
    const response = { json: (value: unknown) => ({ __response: value, __status: 200 }) }
    const controller = new ProductsController()
    const publicResult = await controller.medusaCategoriesEndpoint({ auth: {}, response } as any)
    assert.isFalse(
      publicResult.__response.product_categories.some(
        (category: any) => category.handle === 'custom-catalog'
      )
    )
    const result = await controller.medusaCategoriesEndpoint({ auth: { user }, response } as any)
    assert.isTrue(
      result.__response.product_categories.some(
        (category: any) => category.handle === 'custom-catalog'
      )
    )
    assert.isFalse(
      result.__response.product_categories.some(
        (category: any) => category.handle === 'private-category'
      )
    )
  })
})
