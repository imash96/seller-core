import { test } from '@japa/runner'

// The helpers live in the Inertia project (a composite TS project referenced by the
// backend tsconfig), so they are loaded at runtime instead of being statically imported:
// a static import would pull the whole client project into the server typecheck.
const moduleUrl = new URL('../../inertia/lib/money-form.ts', import.meta.url).href
type MoneyFormModule = {
  moneyAwareDefaults: (fields: any[]) => Record<string, string>
  withMoneyPairs: (data: Record<string, any>) => Record<string, any>
}
const { moneyAwareDefaults, withMoneyPairs } = (await import(moduleUrl)) as MoneyFormModule

/**
 * The per-amount currency inputs submit `<name>__amount` + `<name>__currency`; these
 * helpers are the only place that pair becomes a `{ amount, currencyCode }` object.
 * A regression here silently books every amount in USD.
 */
test.group('Inertia money form helpers', () => {
  test('collapse each amount pair into a PriceMoney-shaped object', ({ assert }) => {
    const payload = withMoneyPairs({
      orderNumber: 'ORD-1',
      subtotal__amount: '120.5',
      subtotal__currency: 'cad',
      taxTotal__amount: '15.06',
      taxTotal__currency: 'CAD',
    })

    assert.deepEqual(payload, {
      orderNumber: 'ORD-1',
      subtotal: { amount: 120.5, currencyCode: 'CAD' },
      taxTotal: { amount: 15.06, currencyCode: 'CAD' },
    })
    assert.notProperty(payload, 'subtotal__amount')
    assert.notProperty(payload, 'subtotal__currency')
  })

  test('keeps one currency per amount, never re-basing on a sibling', ({ assert }) => {
    const payload = withMoneyPairs({
      shipping_cost_total__amount: '42',
      shipping_cost_total__currency: 'MXN',
      tax_total__amount: '7',
      tax_total__currency: 'INR',
    })

    assert.deepEqual(payload.shipping_cost_total, { amount: 42, currencyCode: 'MXN' })
    assert.deepEqual(payload.tax_total, { amount: 7, currencyCode: 'INR' })
  })

  test('drops empty and non-numeric amounts instead of booking zero', ({ assert }) => {
    const payload = withMoneyPairs({
      refundAmount__amount: '',
      refundAmount__currency: 'USD',
      restockingFee__amount: 'n/a',
      restockingFee__currency: 'USD',
      notes: 'kept',
    })

    assert.deepEqual(payload, { notes: 'kept' })
  })

  test('defaults a missing currency to USD and ignores stray currency keys', ({ assert }) => {
    const payload = withMoneyPairs({ unitPrice__amount: '9.99', stale__currency: 'EUR' })

    assert.deepEqual(payload, { unitPrice: { amount: 9.99, currencyCode: 'USD' } })
  })

  test('seeds money defaults from the sibling currency field', ({ assert }) => {
    const defaults = moneyAwareDefaults([
      { name: 'currencyCode', kind: 'select', default: 'CAD' },
      { name: 'subtotal', kind: 'money', currencyFrom: 'currencyCode' },
      { name: 'shippingTotal', kind: 'money', defaultCurrency: 'MXN' },
      { name: 'quantity', kind: 'number', default: '1' },
    ])

    assert.equal(defaults.currencyCode, 'CAD')
    assert.equal(defaults.subtotal, '')
    assert.equal(defaults.subtotal__currency, 'CAD')
    assert.equal(defaults.shippingTotal__currency, 'MXN')
    assert.equal(defaults.quantity, '1')
    assert.notProperty(defaults, 'quantity__currency')
  })

  test('falls back to USD when nothing supplies a currency', ({ assert }) => {
    const defaults = moneyAwareDefaults([{ name: 'unitPrice', kind: 'money' }])
    assert.equal(defaults.unitPrice__currency, 'USD')
  })
})
