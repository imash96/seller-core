import { test } from '@japa/runner'
import { ListingTransformerService } from '../../app/services/listing_transformer_service.js'
import Product from '../../app/models/product.js'
import ProductVariant from '../../app/models/product_variant.js'
import Brand from '../../app/models/brand.js'
import { buildMultiCurrencyPriceArray, money } from '../../app/types/price.js'

test.group('Listing Transformer Service', () => {
  function createSampleData() {
    const brand = new Brand()
    brand.id = 'brd_01K5ZQ7T9V0M8ZK5N7YQ2W4X6A'
    brand.name = 'Artisan Hide'
    brand.slug = 'artisan-hide'

    const product = new Product()
    product.id = 'prd_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B'
    product.title = "Men's Vintage Leather Biker Jacket"
    product.slug = 'mens-vintage-leather-biker-jacket'
    product.type = 'Biker Jacket'
    product.skuPrefix = 'MVL'
    product.description =
      'Handcrafted 100% genuine vintage leather biker jacket with asymmetrical zipper.'
    product.images = ['https://cdn.example.com/products/jacket-front.jpg']
    product.metadata = {
      structuredCode: 'MJKBK01',
      attributes: {
        fabric: '100% Lambskin Leather',
        lining: 'Polyester',
        closure: 'Zipper',
      },
    }

    const variant = new ProductVariant()
    variant.id = 'var_01K5ZQ7T9V0M8ZK5N7YQ2W4X6C'
    variant.productId = product.id
    variant.sku = 'MJKBK01-BLK-NP-SL-M'
    variant.title = "Men's Vintage Leather Biker Jacket - Black / Medium"
    variant.prices = buildMultiCurrencyPriceArray(249.99)
    variant.costPrice = money(74.5, 'USD')
    variant.manufacturingCost = money(12, 'USD')
    variant.packagingCost = money(3, 'USD')
    variant.stockOnHand = 50
    variant.attributes = {
      color: 'Black',
      color_name: 'Black',
      color_map: 'Black',
      size: 'Medium',
      size_value: 'M',
    }

    product.variants = [variant] as any
    return { brand, product, variant }
  }

  test('buildSingleVariantPlatformPayload generates Amazon SP-API structure', ({ assert }) => {
    const { brand, product, variant } = createSampleData()
    const catMeta = { amazon_browse_node: '2476517011' }

    const payload = ListingTransformerService.buildSingleVariantPlatformPayload(
      'amazon',
      product,
      variant,
      brand,
      catMeta
    )

    assert.equal(payload.platform, 'amazon')
    assert.equal(payload.schema, 'SP_API_LISTINGS_ITEM_2021_08_01')
    assert.equal(payload.sku, variant.sku)
    assert.equal(payload.parent_sku, 'MJKBK01')

    const attrs = payload.attributes as Record<string, any>
    assert.isDefined(attrs)
    assert.isDefined(attrs.item_name)
    assert.isDefined(attrs.brand)
    assert.equal(attrs.brand[0].value, 'Artisan Hide')
    assert.isDefined(attrs.recommended_browse_nodes)
    assert.equal(attrs.recommended_browse_nodes[0].value, '2476517011')
    assert.equal(attrs.color[0].value, 'Black')
    assert.equal(attrs.size[0].value, 'Medium')
  })

  test('buildSingleVariantPlatformPayload generates eBay Sell Inventory payload', ({ assert }) => {
    const { brand, product, variant } = createSampleData()
    const catMeta = { ebay_category_id: '57988' }

    const payload = ListingTransformerService.buildSingleVariantPlatformPayload(
      'ebay',
      product,
      variant,
      brand,
      catMeta
    )

    assert.equal(payload.platform, 'ebay')
    assert.equal(payload.schema, 'EBAY_SELL_INVENTORY_V1')

    const inv = payload.inventoryItem as Record<string, any>
    assert.isDefined(inv)
    assert.equal(inv.sku, variant.sku)
    assert.equal(inv.condition, 'NEW')

    const productNode = inv.product as Record<string, any>
    assert.isDefined(productNode)
    assert.equal(productNode.title, product.title)
    assert.isDefined(productNode.aspects)
    assert.equal(productNode.aspects.Brand[0], 'Artisan Hide')
    assert.equal(productNode.aspects.Color[0], 'Black')
    assert.equal(productNode.aspects.Size[0], 'M')

    const offer = payload.offer as Record<string, any>
    assert.isDefined(offer)
    assert.equal(offer.sku, variant.sku)
    assert.equal(offer.marketplaceId, 'EBAY_US')
    assert.equal(offer.format, 'FIXED_PRICE')
  })

  test('buildSingleVariantPlatformPayload generates Etsy Open API v3 payload', ({ assert }) => {
    const { brand, product, variant } = createSampleData()
    const catMeta = { etsy_taxonomy_id: '15834' }

    const payload = ListingTransformerService.buildSingleVariantPlatformPayload(
      'etsy',
      product,
      variant,
      brand,
      catMeta
    )

    assert.equal(payload.platform, 'etsy')
    assert.equal(payload.schema, 'ETSY_OPEN_API_V3')
    assert.equal(payload.sku, variant.sku)
    assert.equal(payload.taxonomy_id, 15834)
    assert.equal(payload.title, product.title)
    assert.equal(payload.brand, brand.name)
    assert.isDefined(payload.property_values)
    assert.isDefined(payload.offering)

    const offering = payload.offering as Record<string, any>
    assert.equal(offering.price.amount, 249.99)
    assert.equal(offering.quantity, 50)
  })

  test('buildSingleVariantPlatformPayload generates Medusa website structure with multi-currency', ({
    assert,
  }) => {
    const { brand, product, variant } = createSampleData()
    const catMeta = { medusaId: 'pcat_01K4VSA1J991RSRQK6548DT621' }

    const payload = ListingTransformerService.buildSingleVariantPlatformPayload(
      'medusa',
      product,
      variant,
      brand,
      catMeta
    )

    assert.equal(payload.platform, 'medusa')
    assert.equal(payload.schema, 'MEDUSA_ADMIN_PRODUCTS_V2')
    assert.equal(payload.product_handle, 'artisan-hide-mvl')

    const variantNode = payload.variant as Record<string, any>
    assert.isDefined(variantNode)
    assert.equal(variantNode.sku, variant.sku)
    assert.isDefined(variantNode.prices)
    assert.isTrue(Array.isArray(variantNode.prices))
    assert.isAbove((variantNode.prices as any[]).length, 0)

    const prices = variantNode.prices as any[]
    const usd = prices.find((p) => p.currency_code === 'USD')
    assert.isDefined(usd)
    assert.equal(usd.amount, 249.99)
  })

  test('transformForPlatform delegates to correct platform-specific feed transformers', ({
    assert,
  }) => {
    const { brand, product } = createSampleData()
    const products = [product]

    // Amazon feed
    const amzFeed = ListingTransformerService.transformForPlatform('amazon', products, brand)
    assert.equal(amzFeed.platform, 'amazon')
    assert.equal(amzFeed.schema_version, 'SP_API_LISTINGS_ITEM_2021_08_01')
    assert.isDefined(amzFeed.feeds)
    assert.isTrue(Array.isArray(amzFeed.feeds))

    // eBay feed
    const ebayFeed = ListingTransformerService.transformForPlatform('ebay', products, brand)
    assert.equal(ebayFeed.platform, 'ebay')
    assert.equal(ebayFeed.schema_version, 'EBAY_SELL_INVENTORY_V1')
    assert.isDefined(ebayFeed.item_groups)
    assert.isTrue(Array.isArray(ebayFeed.item_groups))

    // Etsy feed (and verify strict 13 tags limit)
    product.tags = [
      'tag1',
      'tag2',
      'tag3',
      'tag4',
      'tag5',
      'tag6',
      'tag7',
      'tag8',
      'tag9',
      'tag10',
      'tag11',
      'tag12',
      'tag13',
      'tag14',
      'tag15',
    ]
    const etsyFeed = ListingTransformerService.transformForPlatform('etsy', products, brand)
    assert.equal(etsyFeed.platform, 'etsy')
    assert.isDefined(etsyFeed.listings)
    assert.isTrue(Array.isArray(etsyFeed.listings))
    const firstEtsyListing = (etsyFeed.listings as any[])[0]
    assert.isAtMost(firstEtsyListing.tags.length, 13, 'Etsy listing must not exceed 13 tags')

    // Medusa feed
    const medusaFeed = ListingTransformerService.transformForPlatform('medusa', products, brand)
    assert.equal(medusaFeed.platform, 'medusa')
    assert.equal(medusaFeed.schema_version, 'MEDUSA_ADMIN_PRODUCTS_V2')
    assert.isDefined(medusaFeed.products)
    assert.isTrue(Array.isArray(medusaFeed.products))
  })
})
