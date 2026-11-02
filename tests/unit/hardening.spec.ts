import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import FinancialAccount from '#models/financial_account'
import { OrderService } from '#services/order_service'
import { CatalogService } from '#services/catalog_service'
import { FulfillmentAndReturnsService } from '#services/fulfillment_and_returns_service'
import {
  DEFAULT_MULTI_CURRENCIES,
  convertMoney,
  money,
  sumMoneyConverted,
} from '../../app/types/price.js'
import { ReturnReason, ReturnResolutionType } from '../../app/enums/index.js'

async function makeUser(label: string) {
  return User.create({
    email: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    fullName: 'Hardening tester',
    password: 'Password123!',
    status: 'active',
    isSuperAdmin: true,
    defaultCurrency: 'USD',
    timezone: 'UTC',
  })
}

test.group('Money hardening', () => {
  test('the database rejects malformed PriceMoney objects', async ({ assert }) => {
    const user = await makeUser('hardening-money')

    // Lowercase / non-ISO currency codes never reach a money column.
    await assert.rejects(() =>
      db.rawQuery(
        `insert into financial_accounts (id, user_id, account_name, account_type, data_classification, current_balance)
         values (?, ?, ?, 'bank_checking', 'business', ?::jsonb)`,
        ['fac_bad1', user.id, 'Bad currency', JSON.stringify({ currency_code: 'usd', amount: 1 })]
      )
    )
    // A bare number is not a PriceMoney.
    await assert.rejects(() =>
      db.rawQuery(
        `insert into financial_accounts (id, user_id, account_name, account_type, data_classification, current_balance)
         values (?, ?, ?, 'bank_checking', 'business', ?::jsonb)`,
        ['fac_bad2', user.id, 'Bare number', '12.50']
      )
    )
    // Negatives are only allowed where the column explicitly permits them.
    const negatives = await db.rawQuery<{ rows: { strict: boolean; relaxed: boolean }[] }>(
      `select is_valid_price_money('{"currency_code":"USD","amount":-1}'::jsonb) as strict,
              is_valid_price_money('{"currency_code":"USD","amount":-1}'::jsonb, true) as relaxed`
    )
    assert.isFalse(negatives.rows[0].strict)
    assert.isTrue(negatives.rows[0].relaxed)
    // …while a well-formed object is accepted.
    await FinancialAccount.create({
      userId: user.id,
      accountName: 'Good balance',
      accountType: 'bank_checking',
      dataClassification: 'business',
      currentBalance: money(12.5, 'USD'),
    })
    assert.isTrue(true)
  })

  test('FX helpers refuse unknown currencies and never return a made-up rate', ({ assert }) => {
    // Same currency is always 1:1 and needs no rate table entry.
    assert.equal(convertMoney(money(10, 'USD'), 'USD').amount, 10)
    // A currency with no rate cannot be converted; the amount is not silently kept.
    const unknown = convertMoney(money(10, 'ZZZ'), 'USD')
    assert.equal(unknown.amount, 0)
    // Sums convert each entry into the target currency.
    const total = sumMoneyConverted(
      [money(100, 'USD'), money(7400, 'INR'), money(100, 'CAD')],
      'USD'
    )
    assert.equal(total.currency_code, 'USD')
    // 100 USD + ~88 USD of INR + ~73 USD of CAD — converted, not summed as raw numbers.
    assert.isAbove(total.amount, 200)
    assert.isBelow(total.amount, 400)
  })

  test('an order without any usable FX rate is rejected instead of assuming parity', async ({
    assert,
  }) => {
    const user = await makeUser('hardening-fx')
    await assert.rejects(
      () =>
        OrderService.createOrder({
          userId: user.id,
          orderNumber: `ORD-FX-${Date.now()}`,
          currencyCode: 'ZZZ',
          reportingCurrencyCode: 'ZZY',
          customer: { fullName: 'Unknown currency buyer' },
          lines: [{ sku: 'FX-1', title: 'FX item', quantityOrdered: 1, unitPrice: 10 }],
        }),
      /exchange rate|VALIDATION_ERROR/i
    )

    // An explicit marketplace rate always wins, and reporting currency converts.
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-FX-OK-${Date.now()}`,
      currencyCode: 'CAD',
      reportingCurrencyCode: 'USD',
      exchangeRate: 0.5,
      customer: { fullName: 'Rate buyer' },
      lines: [{ sku: 'FX-2', title: 'FX item', quantityOrdered: 1, unitPrice: 100 }],
    })
    assert.equal(order.grandTotal.currency_code, 'CAD')
    assert.equal(order.reportingTotal.currency_code, 'USD')
    assert.equal(Number(order.reportingTotal.amount), 50)
  })

  test('foreign-currency costs are converted and the applied rates are recorded', async ({
    assert,
  }) => {
    const user = await makeUser('hardening-fx-cogs')
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-COGS-${Date.now()}`,
      currencyCode: 'USD',
      // Sourced in INR: the cost is booked in a different currency than the sale.
      customer: { fullName: 'Sourcing buyer' },
      lines: [
        {
          sku: 'COGS-1',
          title: 'Sourced item',
          quantityOrdered: 1,
          unitPrice: 100,
          unitCost: money(2500, 'INR'),
        },
      ],
    })

    assert.equal(order.cogsTotal.currency_code, 'USD')
    assert.isAbove(Number(order.cogsTotal.amount), 0)
    const fx = order.channelMetadata?.fxConversions
    assert.isObject(fx)
    assert.isNumber(fx['INR->USD'])
  })

  test('a foreign-tenant RMA cannot be received and cannot restock stock', async ({ assert }) => {
    const owner = await makeUser('hardening-rma-owner')
    const outsider = await makeUser('hardening-rma-outsider')

    const product = await Product.create({
      userId: owner.id,
      title: `RMA hardening ${Date.now()}`,
      slug: `rma-hardening-${Date.now()}`,
      status: 'active',
      hasVariants: false,
      prices: [{ currency_code: 'USD', amount: 40 }],
    })
    const variant = await ProductVariant.create({
      userId: owner.id,
      productId: product.id,
      sku: `HRD-${Date.now()}`,
      title: 'Hardening variant',
      isDefault: true,
      prices: [{ currency_code: 'USD', amount: 40 }],
      costPrice: money(15, 'USD'),
      manufacturingCost: money(3, 'USD'),
      packagingCost: money(1, 'USD'),
      stockOnHand: 6,
      stockReserved: 0,
      reorderPoint: 0,
      weightGrams: '200',
    })

    const order = await OrderService.createOrder({
      userId: owner.id,
      orderNumber: `ORD-HRD-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Hardening Buyer' },
      lines: [
        {
          productVariantId: variant.id,
          sku: variant.sku,
          title: variant.title,
          quantityOrdered: 2,
          unitPrice: 40,
          unitCost: 15,
        },
      ],
    })
    await order.load('lineItems')
    await FulfillmentAndReturnsService.createShipment({
      userId: owner.id,
      orderId: order.id,
      shipmentNumber: `SHP-HRD-${Date.now()}`,
      carrierCode: 'ups',
      carrierName: 'UPS',
      items: [{ orderLineItemId: order.lineItems[0].id, quantityShipped: 2 }],
    })
    const rma = await FulfillmentAndReturnsService.createReturnRequest({
      userId: owner.id,
      orderId: order.id,
      orderLineItemId: order.lineItems[0].id,
      rmaNumber: `RMA-HRD-${Date.now()}`,
      returnReason: ReturnReason.DEFECTIVE,
      resolutionType: ReturnResolutionType.REFUND,
      quantityRequested: 2,
    })
    await variant.refresh()
    const stockBefore = Number(variant.stockOnHand)

    // Another tenant can neither see nor receive this RMA.
    await assert.rejects(
      () =>
        FulfillmentAndReturnsService.receiveReturn({
          userId: outsider.id,
          returnRequestId: rma.id,
          quantityReceived: 1,
        }),
      /E_ROW_NOT_FOUND|not found/i
    )
    await variant.refresh()
    assert.equal(Number(variant.stockOnHand), stockBefore)

    // The owner can.
    const received = await FulfillmentAndReturnsService.receiveReturn({
      userId: owner.id,
      returnRequestId: rma.id,
      quantityReceived: 1,
    })
    assert.equal(received.restockedUnits, 1)
    await variant.refresh()
    assert.equal(Number(variant.stockOnHand), stockBefore + 1)
  })

  test('return quantities above the ordered quantity never restock more than shipped', async ({
    assert,
  }) => {
    const owner = await makeUser('hardening-over-return')
    const order = await OrderService.createOrder({
      userId: owner.id,
      orderNumber: `ORD-OVR-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Over return buyer' },
      lines: [{ sku: 'OVR-1', title: 'Over return item', quantityOrdered: 1, unitPrice: 10 }],
    })
    await order.load('lineItems')

    await assert.rejects(
      () =>
        FulfillmentAndReturnsService.createReturnRequest({
          userId: owner.id,
          orderId: order.id,
          orderLineItemId: order.lineItems[0].id,
          rmaNumber: `RMA-OVR-${Date.now()}`,
          returnReason: ReturnReason.CHANGED_MIND,
          resolutionType: ReturnResolutionType.REFUND,
          quantityRequested: 2,
        }),
      /OVER_RETURN_LIMIT/
    )
    assert.isTrue(true)
  })

  test('a partial price array is expanded to every default currency, explicit amounts win', async ({
    assert,
  }) => {
    const user = await makeUser('hardening-coverage')
    const product = await CatalogService.createProduct({
      userId: user.id,
      title: `Coverage product ${Date.now()}`,
      skuPrefix: `COV-${Date.now()}`,
      hasVariants: false,
      variants: [
        {
          sku: `COV-${Date.now()}`,
          title: 'Coverage variant',
          // Only two currencies are supplied; the rest must be derived from USD.
          prices: [
            { currency_code: 'USD', amount: 100 },
            { currency_code: 'CAD', amount: 141.4 },
          ],
          stockOnHand: 3,
        },
      ],
    })
    await product.load('variants')
    const prices = product.variants[0].prices
    assert.lengthOf(prices, DEFAULT_MULTI_CURRENCIES.length)
    assert.sameMembers(
      prices.map((price) => price.currency_code),
      DEFAULT_MULTI_CURRENCIES
    )
    // Explicit values are never overwritten by derived ones…
    assert.equal(prices.find((price) => price.currency_code === 'USD')?.amount, 100)
    assert.equal(prices.find((price) => price.currency_code === 'CAD')?.amount, 141.4)
    // …and the derived ones are plausible retail amounts, not the USD number.
    assert.isAbove(prices.find((price) => price.currency_code === 'INR')?.amount ?? 0, 1000)
  })
})
