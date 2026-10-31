import { test } from '@japa/runner'
import {
  DEFAULT_CURRENCY_RATES,
  DEFAULT_MULTI_CURRENCIES,
  roundRetailCurrencyAmount,
  buildMultiCurrencyPriceArray,
  normalizePriceMoney,
  normalizePriceMoneyArray,
} from '../../app/types/price.js'
import {
  resolveTierPrice,
  resolveTierMultiCurrencyPrices,
  LIST_PRICES,
} from '../../app/data/catalog_config/prices.js'

test.group('Price & Multi-Currency Engine', () => {
  test('DEFAULT_CURRENCY_RATES contains valid standard exchange rates relative to USD', ({
    assert,
  }) => {
    assert.equal(DEFAULT_CURRENCY_RATES.USD, 1.0)
    assert.isAbove(DEFAULT_CURRENCY_RATES.INR, 50)
    assert.isAbove(DEFAULT_CURRENCY_RATES.JPY, 100)
    assert.isBelow(DEFAULT_CURRENCY_RATES.EUR, 1.0)
    assert.isBelow(DEFAULT_CURRENCY_RATES.GBP, 1.0)
    assert.isAbove(DEFAULT_CURRENCY_RATES.CAD, 1.0)
    assert.isAbove(DEFAULT_CURRENCY_RATES.MXN, 10.0)
    assert.isAbove(DEFAULT_CURRENCY_RATES.AED, 2.0)
  })

  test('roundRetailCurrencyAmount handles USD 2-decimal exactness', ({ assert }) => {
    assert.equal(roundRetailCurrencyAmount(239.99, 'USD'), 239.99)
    assert.equal(roundRetailCurrencyAmount(100, 'USD'), 100.0)
    assert.equal(roundRetailCurrencyAmount(0, 'USD'), 0)
    assert.equal(roundRetailCurrencyAmount(-50, 'USD'), 0)
  })

  test('roundRetailCurrencyAmount implements psychological pricing for EUR, GBP, CAD, AED', ({
    assert,
  }) => {
    const eurPrice = roundRetailCurrencyAmount(239.99, 'EUR')
    // EUR rate is 0.92 -> ~220.79 -> rounded to integer then - 0.01 = .99 ending
    assert.isTrue(eurPrice.toString().endsWith('.99'), `EUR price ${eurPrice} must end in .99`)

    const gbpPrice = roundRetailCurrencyAmount(239.99, 'GBP')
    assert.isTrue(gbpPrice.toString().endsWith('.99'), `GBP price ${gbpPrice} must end in .99`)

    const cadPrice = roundRetailCurrencyAmount(239.99, 'CAD')
    assert.isTrue(cadPrice.toString().endsWith('.99'), `CAD price ${cadPrice} must end in .99`)

    const aedPrice = roundRetailCurrencyAmount(239.99, 'AED')
    assert.isTrue(aedPrice.toString().endsWith('.99'), `AED price ${aedPrice} must end in .99`)
  })

  test('roundRetailCurrencyAmount implements psychological rounding for high-denomination INR and MXN', ({
    assert,
  }) => {
    const inrPrice = roundRetailCurrencyAmount(200, 'INR')
    // 200 * 83.5 = 16700 -> step-50 psychological boundary .99
    assert.isTrue(inrPrice.toString().endsWith('.99'), `INR price ${inrPrice} must end in .99`)
    assert.isAbove(inrPrice, 10000)

    const mxnPrice = roundRetailCurrencyAmount(200, 'MXN')
    assert.isTrue(mxnPrice.toString().endsWith('.99'), `MXN price ${mxnPrice} must end in .99`)
    assert.isAbove(mxnPrice, 2000)
  })

  test('roundRetailCurrencyAmount rounds JPY to nearest whole 100', ({ assert }) => {
    const jpyPrice = roundRetailCurrencyAmount(100, 'JPY')
    // 100 * 152 = 15200
    assert.equal(jpyPrice % 100, 0, `JPY price ${jpyPrice} must be multiple of 100`)
    assert.equal(jpyPrice, 15200)
  })

  test('buildMultiCurrencyPriceArray builds all 6 default currencies with positive amounts', ({
    assert,
  }) => {
    const prices = buildMultiCurrencyPriceArray(249.99)
    assert.equal(prices.length, 6)

    const codes = prices.map((p) => p.currency_code)
    for (const c of DEFAULT_MULTI_CURRENCIES) {
      assert.isTrue(codes.includes(c), `Result must include currency ${c}`)
    }

    for (const p of prices) {
      assert.isAbove(p.amount, 0, `Amount for ${p.currency_code} must be positive`)
      assert.typeOf(p.amount, 'number')
    }

    const usd = prices.find((p) => p.currency_code === 'USD')
    assert.isDefined(usd)
    assert.equal(usd!.amount, 249.99)
  })

  test('normalizePriceMoney accepts numbers, numeric strings, and objects', ({ assert }) => {
    // Plain number
    const p1 = normalizePriceMoney(149.99, 'USD')
    assert.deepEqual(p1, { currency_code: 'USD', amount: 149.99 })

    // String number
    const p2 = normalizePriceMoney('199.50', 'eur')
    assert.deepEqual(p2, { currency_code: 'EUR', amount: 199.5 })

    // Object with camelCase
    const p3 = normalizePriceMoney({ currencyCode: 'gbp', price: 129.95 })
    assert.deepEqual(p3, { currency_code: 'GBP', amount: 129.95 })

    // Object with snake_case
    const p4 = normalizePriceMoney({ currency_code: 'CAD', amount: 310.0 })
    assert.deepEqual(p4, { currency_code: 'CAD', amount: 310.0 })

    // Falsy or empty input falls back safely to 0
    const p5 = normalizePriceMoney(null, 'USD')
    assert.deepEqual(p5, { currency_code: 'USD', amount: 0 })
  })

  test('normalizePriceMoneyArray parses JSON strings and filters duplicates', ({ assert }) => {
    const jsonStr = JSON.stringify([
      { currency_code: 'USD', amount: 199.99 },
      { currency_code: 'EUR', amount: 189.99 },
      { currency_code: 'usd', amount: 209.99 }, // Duplicate USD (overwrites previous)
      { currency_code: 'INVALID', amount: -50 }, // Negative amount skipped
    ])

    const result = normalizePriceMoneyArray(jsonStr, 200, 'USD')
    assert.equal(result.length, 2)

    const usd = result.find((p) => p.currency_code === 'USD')
    assert.isDefined(usd)
    assert.equal(usd!.amount, 209.99)

    const eur = result.find((p) => p.currency_code === 'EUR')
    assert.isDefined(eur)
    assert.equal(eur!.amount, 189.99)
  })

  test('normalizePriceMoneyArray falls back to buildMultiCurrencyPriceArray on empty/invalid input', ({
    assert,
  }) => {
    const fallback1 = normalizePriceMoneyArray([], 150)
    assert.equal(fallback1.length, 6)
    assert.equal(fallback1.find((p) => p.currency_code === 'USD')?.amount, 150)

    const fallback2 = normalizePriceMoneyArray('not valid json', 220)
    assert.equal(fallback2.length, 6)
    assert.equal(fallback2.find((p) => p.currency_code === 'USD')?.amount, 220)
  })

  test('resolveTierPrice and resolveTierMultiCurrencyPrices correctly index modular catalog tiers', ({
    assert,
  }) => {
    // Tier 01 base prices
    assert.equal(resolveTierPrice('01', 0), LIST_PRICES['01'][0])
    assert.equal(resolveTierPrice('01', 3), 239.99)
    assert.equal(resolveTierPrice('01', 999), LIST_PRICES['01'][LIST_PRICES['01'].length - 1]) // Clamped

    // Tier 02 base prices
    assert.equal(resolveTierPrice('02', 0), 269.99)
    assert.equal(resolveTierPrice('02', 3), 289.99)

    // Tier 03 base prices
    assert.equal(resolveTierPrice('03', 0), 239.99)
    assert.equal(resolveTierPrice('03', 3), 259.99)

    // Multi-currency tier generation
    const tier01Prices = resolveTierMultiCurrencyPrices('01', 3)
    assert.equal(tier01Prices.length, 6)
    assert.equal(tier01Prices.find((p) => p.currency_code === 'USD')?.amount, 239.99)
  })
})
