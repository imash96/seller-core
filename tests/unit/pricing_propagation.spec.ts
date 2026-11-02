import { test } from '@japa/runner'
import User from '#models/user'
import Brand from '#models/brand'
import ProductVariant from '#models/product_variant'
import ChannelListing from '#models/channel_listing'
import { CatalogService } from '#services/catalog_service'
import { ListingTransformerService } from '#services/listing_transformer_service'
import { SAMPLE_CATALOG_JSON } from '../../app/data/catalog_config/index.js'
import { DEFAULT_MULTI_CURRENCIES, money } from '../../app/types/price.js'
import { resolveTierPrice } from '../../app/data/catalog_config/prices.js'

/**
 * `catalog_items` is USD-only — `base_price_usd` plus a `price_tier` code — and that
 * single USD number is what seeds the MedusaJS v2 price arrays on the Product, every
 * ProductVariant and every ChannelListing. This suite proves the propagation:
 *
 *  - every array covers the expansion set (USD, INR, EUR, GBP, CAD, MXN);
 *  - every entry is a full `{ currency_code, amount, compare_at_amount }` object;
 *  - the USD anchor is exactly the catalog price, and `compare_at_amount` sits above it;
 *  - a per-currency override survives and is never re-derived from the anchor;
 *  - nothing in the chain reintroduces a standalone currency column.
 */
test.group('Catalog pricing propagation', () => {
  async function makeUser(label: string) {
    return User.create({
      email: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
      fullName: 'Pricing Propagation',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
  }

  function assertMedusaPriceArray(assert: any, label: string, prices: any[], usdAnchor: number) {
    assert.isArray(prices, `${label} must store a price array`)
    assert.sameMembers(
      prices.map((price) => price.currency_code),
      [...DEFAULT_MULTI_CURRENCIES],
      `${label} must cover every expansion currency`
    )
    for (const price of prices) {
      assert.match(price.currency_code, /^[A-Z]{3}$/, `${label} entry needs an ISO code`)
      assert.isNumber(price.amount, `${label} entry needs a numeric amount`)
      assert.isAbove(price.amount, 0, `${label} ${price.currency_code} must be positive`)
      assert.isNumber(
        price.compare_at_amount,
        `${label} ${price.currency_code} must carry compare_at_amount`
      )
      assert.isAbove(
        price.compare_at_amount,
        price.amount,
        `${label} ${price.currency_code} compare-at must sit above the sale price`
      )
    }
    const usd = prices.find((price) => price.currency_code === 'USD')
    assert.equal(usd.amount, usdAnchor, `${label} USD must be the catalog anchor`)
  }

  test('a USD catalog price seeds product, variant and listing price arrays', async ({
    assert,
  }) => {
    const user = await makeUser('pricing-propagation')

    // Save the catalog row only: conversion to a product happens below, through the
    // same preview → create flow the Catalog page uses.
    const saved = await CatalogService.importCatalogJson({
      userId: user.id,
      catalogPayload: { SKU1: SAMPLE_CATALOG_JSON.SKU1 },
      priceTier: '01',
      defaultStockOnHand: 5,
      convertImmediately: false,
    })
    assert.equal(saved.catalogItemsSaved, 1)
    assert.equal(saved.productsCreated, 0)

    // catalog_items stays USD-only: a numeric USD anchor plus a tier code.
    const storedItem = await CatalogService.listCatalogItems(user.id).then((items) => items[0])
    assert.isDefined(storedItem, 'the catalog row must exist before conversion')
    // numeric column → Lucid hands back a decimal string; the model exposes the
    // canonical PriceMoney through `basePriceMoney`.
    const catalogUsd = Number(storedItem.basePriceUsd)
    assert.isAbove(catalogUsd, 0)
    assert.deepEqual(storedItem.basePrice, money(catalogUsd, 'USD'))
    // Serialized catalog rows expose the USD PriceMoney and never a bare currency column.
    const serialized = storedItem.serialize()
    assert.equal(serialized.basePrice.currency_code, 'USD')
    assert.equal(serialized.basePrice.amount, catalogUsd)
    assert.notProperty(serialized, 'currencyCode')
    // The price tier drives the USD anchor: the first variant inherits exactly that.
    assert.equal(resolveTierPrice('01', 3), catalogUsd)
    assert.equal(storedItem.priceTier, '01')

    const preview = await CatalogService.buildProductPreviewFromCatalogItem({
      userId: user.id,
      catalogItemId: storedItem.id,
      defaultStockOnHand: 5,
    })
    // Each size has its own USD anchor derived from the catalog tier; the product
    // row takes the first variant's array.
    const previewUsdBySku = new Map(
      preview.variants.map((variant) => [variant.sku, variant.priceUsd] as const)
    )
    const usdAnchor = preview.variants[0].priceUsd
    assert.isAbove(usdAnchor, 0)
    assert.isAbove(new Set(previewUsdBySku.values()).size, 1, 'sizes must price differently')

    const { product, variantsCreated } = await CatalogService.createProductFromPreview({
      userId: user.id,
      preview,
    })
    assert.isAbove(variantsCreated, 0)

    await product.refresh()
    assertMedusaPriceArray(assert, 'products.prices', product.prices, usdAnchor)

    const variants = await ProductVariant.query().where('productId', product.id)
    assert.lengthOf(variants, variantsCreated)
    for (const variant of variants) {
      const expectedUsd = previewUsdBySku.get(variant.sku)
      assert.isDefined(expectedUsd, `variant ${variant.sku} must come from the preview`)
      assertMedusaPriceArray(
        assert,
        `variants[${variant.sku}].prices`,
        variant.prices,
        expectedUsd!
      )
    }

    // Channel listings inherit the same array when the platform feed is persisted.
    const brand = await Brand.create({
      userId: user.id,
      name: 'Propagation Brand',
      slug: `propagation-${Date.now()}`,
      isActive: true,
    })
    const generated = await ListingTransformerService.generateListings({
      userId: user.id,
      brandId: brand.id,
      productIds: [product.id],
      platform: 'amazon',
      persistChannelListings: true,
    })
    assert.equal(generated.listingsPersisted, variantsCreated)
    const listings = await ChannelListing.query().where('userId', user.id)
    assert.lengthOf(listings, variantsCreated)
    for (const listing of listings) {
      if (!Array.isArray(listing.prices) || listing.prices.length === 0) continue
      const expectedUsd = previewUsdBySku.get(
        String(listing.externalSku ?? '').replace(/^AMZ-/, '')
      )
      if (expectedUsd === undefined) continue
      assertMedusaPriceArray(
        assert,
        `channel_listings[${listing.externalSku}].prices`,
        listing.prices,
        expectedUsd
      )
      assert.equal(listing.listedPrice.currency_code, 'USD')
    }
  })

  test('per-currency overrides win over the derived anchor and stay untouched', async ({
    assert,
  }) => {
    const user = await makeUser('pricing-override')
    const sku = `OVR-${Date.now()}`
    const product = await CatalogService.createProduct({
      userId: user.id,
      title: 'Override Coat',
      hasVariants: false,
      variants: [
        {
          sku,
          title: 'Override Coat — Black',
          priceUsd: 200,
          // An explicit INR price must survive even though the USD anchor would derive
          // a different psychological price.
          prices: [money(19999, 'INR')],
        },
      ],
    })
    await product.refresh()
    assertMedusaPriceArray(assert, 'products.prices', product.prices, 200)

    const variant = await ProductVariant.query().where('productId', product.id).firstOrFail()
    const inr = variant.prices.find((price) => price.currency_code === 'INR')
    assert.equal(inr?.amount, 19999, 'the explicit INR override must be stored verbatim')
    // A partial explicit array is still expanded to every currency.
    assert.sameMembers(
      variant.prices.map((price) => price.currency_code),
      [...DEFAULT_MULTI_CURRENCIES]
    )
  })

  test('resolving variant prices from a USD anchor is pure and currency-complete', ({ assert }) => {
    const prices = CatalogService.resolveVariantPrices(
      { sku: 'PURE-1', title: 'Pure Coat', priceUsd: 200 } as any,
      239.99
    )
    assert.sameMembers(
      prices.map((price) => price.currency_code),
      [...DEFAULT_MULTI_CURRENCIES]
    )
    assert.equal(prices.find((price) => price.currency_code === 'USD')?.amount, 200)

    // Idempotent: re-resolving the derived array is a no-op (no compounding conversion),
    // so a save → reload → save cycle can never drift the price.
    const again = CatalogService.resolveVariantPrices(
      { sku: 'PURE-1', title: 'Pure Coat', priceUsd: 200, prices } as any,
      200
    )
    assert.deepEqual(again, prices)

    // An override replaces one currency and leaves the rest derived.
    const withOverride = CatalogService.resolveVariantPrices({
      sku: 'PURE-1',
      title: 'Pure Coat',
      priceUsd: 200,
      priceOverrides: { INR: { amount: 17999 } },
    } as any)
    assert.equal(withOverride.find((price) => price.currency_code === 'INR')?.amount, 17999)
    assert.equal(
      withOverride.find((price) => price.currency_code === 'USD')?.amount,
      prices.find((price) => price.currency_code === 'USD')?.amount
    )

    // A missing USD anchor falls back to the documented default rather than zero.
    const fallback = CatalogService.resolveVariantPrices({ sku: 'PURE-2', title: 'x' } as any)
    assert.equal(fallback.find((price) => price.currency_code === 'USD')?.amount, 239.99)
  })
})
