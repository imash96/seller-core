import { test } from '@japa/runner'
import User from '#models/user'
import Customer from '#models/customer'
import FinancialAccount from '#models/financial_account'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import Shipment from '#models/shipment'
import { OrderService } from '#services/order_service'
import { money } from '../../app/types/price.js'

async function makeUser(label: string) {
  return User.create({
    email: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    fullName: 'Serialization tester',
    password: 'Password123!',
    status: 'active',
    isSuperAdmin: true,
    defaultCurrency: 'USD',
    timezone: 'UTC',
  })
}

test.group('Serialized money carries its own currency', () => {
  test('a non-USD account serializes the currency of its balance, not the user default', async ({
    assert,
  }) => {
    const user = await makeUser('serialize-account')
    const account = await FinancialAccount.create({
      userId: user.id,
      accountName: `Banque ${Date.now()}`,
      accountType: 'bank_checking',
      dataClassification: 'business',
      currentBalance: money(1240.5, 'CAD'),
    })

    const serialized = account.serialize()
    // The row-level currency is derived from the money object itself…
    assert.equal(serialized.currencyCode, 'CAD')
    assert.deepEqual(serialized.currentBalance, { currency_code: 'CAD', amount: 1240.5 })
    // …so no standalone currency column has to exist on the table.
    assert.notProperty(serialized, 'currency_code')
  })

  test('a customer balance in EUR keeps its currency in serialized output', async ({ assert }) => {
    const user = await makeUser('serialize-customer')
    const customer = await Customer.create({
      userId: user.id,
      fullName: 'Euro Buyer',
      email: `euro-${Date.now()}@example.com`,
      totalSpent: money(320.25, 'EUR'),
      ordersCount: 2,
    })

    const serialized = customer.serialize()
    assert.equal(serialized.currencyCode, 'EUR')
    assert.equal(serialized.totalSpent.amount, 320.25)
    assert.equal(serialized.totalSpent.currency_code, 'EUR')
  })

  test('variants expose the full price array, a price alias and inventory value', async ({
    assert,
  }) => {
    const user = await makeUser('serialize-variant')
    const product = await Product.create({
      userId: user.id,
      title: 'Serialization product',
      slug: `serialization-${Date.now()}`,
      status: 'active',
      hasVariants: false,
      prices: [{ currency_code: 'USD', amount: 120 }],
    })
    const variant = await ProductVariant.create({
      userId: user.id,
      productId: product.id,
      sku: `SER-${Date.now()}`,
      title: 'Serialization variant',
      isDefault: true,
      prices: [
        { currency_code: 'USD', amount: 120 },
        { currency_code: 'INR', amount: 9990 },
        { currency_code: 'MXN', amount: 2150 },
      ],
      costPrice: money(48, 'USD'),
      manufacturingCost: money(10, 'USD'),
      packagingCost: money(2, 'USD'),
      stockOnHand: 5,
      stockReserved: 1,
      reorderPoint: 2,
      weightGrams: '400',
    })

    const serialized = variant.serialize()
    assert.lengthOf(serialized.prices, 3)
    // `price` is a MedusaJS v2 alias of the same array — never a bare amount.
    assert.deepEqual(serialized.price, serialized.prices)
    assert.includeDeepMembers(serialized.prices, [{ currency_code: 'INR', amount: 9990 }])
    assert.deepEqual(serialized.inventoryValue, { currency_code: 'USD', amount: 240 })
    // stock_available is a generated column and is still readable.
    await variant.refresh()
    assert.equal(Number(variant.stockAvailable), 4)
  })

  test('an order serializes every amount as its own PriceMoney, never a bare number', async ({
    assert,
  }) => {
    const user = await makeUser('serialize-order')
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-SER-FX-${Date.now()}`,
      marketplaceCode: 'ebay',
      currencyCode: 'USD',
      customer: { fullName: 'Serialization Buyer', email: 'serialize-fx@buyer.io' },
      lines: [
        {
          sku: 'SER-FX-1',
          title: 'Serialized coat',
          quantityOrdered: 2,
          unitPrice: money(150, 'USD'),
          // COGS sourced in India: the line keeps INR, the order total converts to USD.
          unitCost: money(4200, 'INR'),
          taxLines: [{ code: 'US-TX', rate: 8.25, total: money(12.38, 'USD') }],
        },
      ],
      subtotal: money(300, 'USD'),
      shippingTotal: money(15, 'USD'),
      taxTotal: money(24.75, 'USD'),
      grandTotal: money(339.75, 'USD'),
      marketplaceFeesTotal: money(34, 'USD'),
      paymentProcessingFeesTotal: money(0, 'USD'),
      shippingCostTotal: money(340, 'MXN'),
    })
    await order.load('lineItems')

    const serialized = order.serialize()
    const orderMoneyFields = [
      'subtotal',
      'discountTotal',
      'promotionTotal',
      'shippingTotal',
      'shippingDiscountTotal',
      'taxTotal',
      'shippingTaxTotal',
      'grandTotal',
      'marketplaceFeesTotal',
      'paymentProcessingFeesTotal',
      'refundedTotal',
      'cogsTotal',
      'shippingCostTotal',
      'netProceeds',
      'grossProfit',
      'netProfit',
      'marketplaceWithheldTaxTotal',
      'reportingTotal',
    ] as const
    for (const field of orderMoneyFields) {
      const value = serialized[field]
      assert.isObject(value, `${field} must serialize as a PriceMoney object`)
      assert.match(value.currency_code, /^[A-Z]{3}$/, `${field} needs an ISO currency`)
      assert.isNumber(value.amount, `${field} needs a numeric amount`)
    }
    assert.equal(serialized.currencyCode, 'USD')
    assert.notProperty(serialized, 'currency_code')
    // A cost booked in another currency is stored as booked; only the P&L converts it.
    assert.equal(serialized.shippingCostTotal.currency_code, 'MXN')
    assert.equal(serialized.shippingCostTotal.amount, 340)
    assert.equal(serialized.grandTotal.amount, 339.75)
    // 339.75 − 34 fees − 340/17.15 carrier − COGS(₹4200) ⇒ a numeric, USD-denominated profit.
    assert.equal(serialized.netProfit.currency_code, 'USD')
    assert.isNumber(serialized.netProfit.amount)

    const [line] = serialized.lineItems
    assert.equal(line.unitPrice.currency_code, 'USD')
    // Line-level COGS keeps the currency it was booked in — only order roll-ups convert.
    assert.equal(line.unitCost.currency_code, 'INR')
    assert.equal(line.unitCost.amount, 4200)
    assert.equal(line.taxLines[0].total.currency_code, 'USD')
    assert.equal(line.grandTotal.currency_code, 'USD')
  })

  test('models without a monetary identity do not invent a currencyCode', async ({ assert }) => {
    const user = await makeUser('serialize-shipment')
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-SER-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Serialization Buyer', email: 'serialize@buyer.io' },
      lines: [{ sku: 'SER-1', title: 'Serialized item', quantityOrdered: 1, unitPrice: 10 }],
    })
    const shipment = await Shipment.create({
      userId: user.id,
      orderId: order.id,
      shipmentNumber: `SHP-SER-${Date.now()}`,
      carrierCode: 'ups',
      carrierName: 'UPS',
      status: 'pending',
      estimatedShippingCost: money(12.75, 'MXN'),
    })
    const serialized = shipment.serialize()
    assert.equal(serialized.currencyCode, 'MXN')
    assert.equal(serialized.estimatedShippingCost.currency_code, 'MXN')
  })
})
