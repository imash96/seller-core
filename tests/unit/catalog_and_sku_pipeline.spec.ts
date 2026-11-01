import { test } from '@japa/runner'
import {
  MAIN_CATALOG_CONFIG,
  extractSequenceNumber,
  buildStructuredBaseCode,
  formatVariantSku,
  resolveColorInfo,
  resolveGenderCode,
  resolveCategoryAndProductCode,
  resolveLeatherCode,
  resolveFitCode,
  SAMPLE_CATALOG_JSON,
} from '../../app/data/catalog_config/index.js'
import { PRODUCT_CATEGORIES, flattenMedusaCategories } from '../../app/data/data_category.js'
import { CategorySyncService } from '../../app/services/category_sync_service.js'

test.group('Catalog & SKU Modular Pipeline', () => {
  test('MAIN_CATALOG_CONFIG contains complete required modular specifications', ({ assert }) => {
    assert.isDefined(MAIN_CATALOG_CONFIG['SKU FORMAT'])
    assert.isDefined(MAIN_CATALOG_CONFIG['GENDER'])
    assert.isDefined(MAIN_CATALOG_CONFIG['Category'])
    assert.isDefined(MAIN_CATALOG_CONFIG['PRODUCT CODES'])
    assert.isDefined(MAIN_CATALOG_CONFIG['FIT'])
    assert.isDefined(MAIN_CATALOG_CONFIG['LENGTH'])
    assert.isDefined(MAIN_CATALOG_CONFIG['LEATHER CODES'])
    assert.isDefined(MAIN_CATALOG_CONFIG['LIST PRICE'])
    assert.isDefined(MAIN_CATALOG_CONFIG['Size Data'])
    assert.isDefined(MAIN_CATALOG_CONFIG['COLOR CODES'])
  })

  test('extractSequenceNumber parses numeric sequences from catalog keys or falls back', ({
    assert,
  }) => {
    assert.equal(extractSequenceNumber('JKT05'), '05')
    assert.equal(extractSequenceNumber('MSR01'), '01')
    assert.equal(extractSequenceNumber('PANTS123'), '23') // 2-digit padding/slice
    assert.equal(extractSequenceNumber('JACKET', 2), '03') // fallback index + 1
    assert.equal(extractSequenceNumber('', 0), '01')
  })

  test('buildStructuredBaseCode combines gender, category, product code and sequence', ({
    assert,
  }) => {
    const code = buildStructuredBaseCode({
      genderCode: 'M',
      categoryCode: 'JK',
      productCode: 'BK',
      sequence: '01',
    })
    assert.equal(code, 'MJKBK01')
  })

  test('formatVariantSku supports standard, prefixed_color, and catalog_key format modes', ({
    assert,
  }) => {
    const params = {
      catalogKey: 'M-JACKET-01',
      structuredCode: 'MJKBK01',
      colorCode: 'BLK',
      materialCode: 'NP',
      fitCode: 'SL',
      sizeValue: 'M',
    }

    // Standard mode: [structuredCode]-[color]-[material]-[fit]-[size]
    const standard = formatVariantSku({ ...params, skuFormat: 'standard' })
    assert.equal(standard, 'MJKBK01-BLK-NP-SL-M')

    // Prefixed color mode: [color]-[structuredCode]-[color]-[material]-[fit]-[size]
    const prefixed = formatVariantSku({ ...params, skuFormat: 'prefixed_color' })
    assert.equal(prefixed, 'BLK-MJKBK01-BLK-NP-SL-M')

    // Catalog key mode: [catalogKey]-[color]-[material]-[fit]-[size]
    const catKey = formatVariantSku({ ...params, skuFormat: 'catalog_key' })
    assert.equal(catKey, 'M-JACKET-01-BLK-NP-SL-M')
  })

  test('resolveColorInfo returns colorMap and display name for known codes and fallback for custom', ({
    assert,
  }) => {
    // Known colors
    const blk = resolveColorInfo('BLK')
    assert.equal(blk.colorName, 'Black')
    assert.equal(blk.colorMap, 'Black')

    const red = resolveColorInfo('red') // Case-insensitive
    assert.equal(red.colorName, 'Red')
    assert.equal(red.colorMap, 'Red')

    const dbr = resolveColorInfo('DBR')
    assert.equal(dbr.colorName, 'Dark Brown')
    assert.equal(dbr.colorMap, 'Brown')

    // Custom or unknown color returns itself safely
    const custom = resolveColorInfo('CUSTOM_TEAL')
    assert.equal(custom.code, 'CUSTOM_TEAL')
    assert.equal(custom.colorName, 'CUSTOM_TEAL')
  })

  test('Taxonomy resolvers correctly identify gender, category, product, leather, and fit codes', ({
    assert,
  }) => {
    // Gender
    assert.deepEqual(resolveGenderCode('Male'), { code: 'M', label: 'Men' })
    assert.deepEqual(resolveGenderCode('women'), { code: 'W', label: 'Women' })
    assert.deepEqual(resolveGenderCode('Unisex'), { code: 'U', label: 'Unisex' })
    assert.deepEqual(resolveGenderCode('Kids'), { code: 'K', label: 'Kids' })

    // Leather
    assert.deepEqual(resolveLeatherCode('Suede'), { code: 'SU', name: 'Suede Leather' })
    assert.deepEqual(resolveLeatherCode('Nubuck'), { code: 'NB', name: 'Nubuck Leather' })
    assert.deepEqual(resolveLeatherCode('Cowhide'), { code: 'CW', name: 'Cowhide' })

    // Fit
    assert.deepEqual(resolveFitCode('Slim'), { code: 'SL', name: 'Slim Fit' })
    assert.deepEqual(resolveFitCode('Regular'), { code: 'RG', name: 'Regular Fit' })

    // Category and product codes
    const res = resolveCategoryAndProductCode('Biker and Motorcycle Jackets')
    assert.isDefined(res)
    assert.typeOf(res.categoryCode, 'string')
    assert.typeOf(res.productCode, 'string')
  })

  test('flattenMedusaCategories flattens tree with parent handles, correct depth, and taxonomy IDs', ({
    assert,
  }) => {
    const flattened = flattenMedusaCategories(PRODUCT_CATEGORIES)
    assert.isAbove(flattened.length, 30, 'Flattened categories should exceed 30 items')

    // Root items should have depth 0 and null parentHandle
    const men = flattened.find((c) => c.handle === 'men')
    assert.isDefined(men)
    assert.equal(men!.depth, 0)
    assert.isNull(men!.parentHandle)

    // Child item: men/outerwear
    const outerwear = flattened.find((c) => c.handle === 'men/outerwear')
    assert.isDefined(outerwear)
    assert.equal(outerwear!.depth, 1)
    assert.equal(outerwear!.parentHandle, 'men')

    // Deep leaf item: men/outerwear/jackets/biker-motorcycle
    const biker = flattened.find((c) => c.handle === 'men/outerwear/jackets/biker-motorcycle')
    assert.isDefined(biker)
    assert.equal(biker!.depth, 3)
    assert.equal(biker!.parentHandle, 'men/outerwear/jackets')
    assert.isDefined(biker!.metadata)
    assert.isDefined(biker!.metadata?.amazon_browse_node)
    assert.isDefined(biker!.metadata?.etsy_taxonomy_id)
    assert.isDefined(biker!.metadata?.ebay_category_id)
  })

  test('CategorySyncService.normalizeCategoryHandle standardizes plural/verbose handles', ({
    assert,
  }) => {
    assert.equal(
      CategorySyncService.normalizeCategoryHandle('mens/apparel/outerwear/jackets/biker-jackets'),
      'men/outerwear/jackets/biker-motorcycle'
    )
    assert.equal(
      CategorySyncService.normalizeCategoryHandle('womens/apparel/outerwear/coats/trench-coats'),
      'women/outerwear/coats/trench'
    )
    assert.equal(
      CategorySyncService.normalizeCategoryHandle('men/outerwear/jackets/bomber-flight'),
      'men/outerwear/jackets/bomber-flight'
    )
  })

  test('SAMPLE_CATALOG_JSON contains valid entries matching catalog schema', ({ assert }) => {
    const keys = Object.keys(SAMPLE_CATALOG_JSON)
    assert.isAbove(keys.length, 0, 'SAMPLE_CATALOG_JSON must contain entries')

    for (const key of keys) {
      const entry = (SAMPLE_CATALOG_JSON as Record<string, any>)[key]
      assert.isDefined(entry.title, `Entry ${key} must have a title`)
      assert.isDefined(entry.type, `Entry ${key} must specify type`)
      assert.isDefined(entry.category_handle, `Entry ${key} must specify category_handle`)
      assert.isDefined(entry.description, `Entry ${key} must specify description`)
      assert.isDefined(entry.attributes, `Entry ${key} must specify attributes`)
      assert.typeOf(entry.attributes, 'object')
    }
  })
  test('category sync rejects request-controlled remote endpoints', async ({ assert }) => {
    const original = process.env.MEDUSA_BACKEND_URL
    delete process.env.MEDUSA_BACKEND_URL
    try {
      await assert.rejects(
        () => CategorySyncService.syncFromMedusaEndpoint('user', 'http://127.0.0.1:1234'),
        /MEDUSA_URL_NOT_ALLOWED/
      )
    } finally {
      if (original === undefined) delete process.env.MEDUSA_BACKEND_URL
      else process.env.MEDUSA_BACKEND_URL = original
    }
  })
})
