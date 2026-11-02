import { test } from '@japa/runner'
import User from '#models/user'
import Customer from '#models/customer'
import CustomerAddress from '#models/customer_address'
import CustomerRiskSignal from '#models/customer_risk_signal'
import Order from '#models/order'
import { CustomerService, CustomerMergeError } from '#services/customer_service'
import { OrderService } from '#services/order_service'
import { money } from '../../app/types/price.js'

/**
 * Duplicate customer profiles are merged non-destructively. These specs pin the
 * contract: deterministic row locking, explicit FX conversion of lifetime spend,
 * every child record re-pointed, and no way to merge the same record twice.
 */
test.group('Customer merge', () => {
  async function makeUser(label: string, defaultCurrency = 'USD') {
    return User.create({
      email: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
      fullName: 'Merge Owner',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency,
      timezone: 'UTC',
    })
  }

  function makeCustomer(
    userId: string,
    overrides: Partial<{
      fullName: string
      email: string | null
      phone: string | null
      normalizedEmail: string | null
      normalizedPhone: string | null
      ordersCount: number
      totalSpent: any
      riskLevel: string
      riskScore: number
      mergedIntoCustomerId: string | null
    }> = {}
  ) {
    return Customer.create({
      userId,
      fullName: overrides.fullName ?? 'Duplicate Buyer',
      email: overrides.email ?? null,
      phone: overrides.phone ?? null,
      normalizedEmail: overrides.normalizedEmail ?? null,
      normalizedPhone: overrides.normalizedPhone ?? null,
      ordersCount: overrides.ordersCount ?? 0,
      totalSpent: overrides.totalSpent ?? money(0, 'USD'),
      riskLevel: overrides.riskLevel ?? 'low',
      riskScore: overrides.riskScore ?? 0,
      mergedIntoCustomerId: overrides.mergedIntoCustomerId ?? null,
      metadata: {},
    })
  }

  test('re-points every child record and sums the order counters', async ({ assert }) => {
    const user = await makeUser('merge-children')
    const source = await makeCustomer(user.id, {
      fullName: 'Source Buyer',
      email: 'source@example.com',
      ordersCount: 2,
      totalSpent: money(300, 'USD'),
    })
    const target = await makeCustomer(user.id, {
      fullName: 'Target Buyer',
      email: 'target@example.com',
      ordersCount: 1,
      totalSpent: money(100, 'USD'),
    })

    const address = await CustomerAddress.create({
      userId: user.id,
      customerId: source.id,
      addressType: 'shipping',
      recipientName: 'Source Buyer',
      line1: '1 Duplicate Lane',
      city: 'Mumbai',
      stateProvince: 'MH',
      postalCode: '400001',
      countryCode: 'IN',
      addressFingerprint: `fp-${Date.now()}`,
      isDefault: true,
      isVerified: true,
    })
    const signal = await CustomerRiskSignal.create({
      userId: user.id,
      customerId: source.id,
      orderId: null,
      signalType: 'velocity_spike',
      severity: 'high',
      reviewStatus: 'pending_review',
      reason: 'Duplicate profile velocity spike',
      evidence: {},
    })
    const unmovedSignal = await CustomerRiskSignal.create({
      userId: user.id,
      customerId: target.id,
      orderId: null,
      signalType: 'manual_flag',
      severity: 'low',
      reviewStatus: 'pending_review',
      reason: 'Target keeps its own signals',
      evidence: {},
    })

    // A real order through the domain service, so the move is exercised end to end.
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-MERGE-${Date.now()}`,
      currencyCode: 'USD',
      customer: {
        externalCustomerId: `ext-${Date.now()}`,
        fullName: 'Source Buyer',
        email: `source-${Date.now()}@example.com`,
      },
      lines: [
        { sku: `MERGE-${Date.now()}`, title: 'Merge item', quantityOrdered: 1, unitPrice: 50 },
      ],
    })
    // Ensure the domain-created customer is not a third profile polluting the counts.
    const domainCustomerId = order.customerId
    assert.notEqual(domainCustomerId, source.id)

    const result = await CustomerService.mergeCustomers({
      userId: user.id,
      sourceCustomerId: source.id,
      targetCustomerId: target.id,
    })

    assert.equal(result.ordersMoved, 0)
    assert.equal(result.addressesMoved, 1)
    assert.equal(result.riskSignalsMoved, 1)

    await address.refresh()
    assert.equal(address.customerId, target.id)
    assert.isFalse(address.isDefault, 'moved addresses must not claim default status')

    await signal.refresh()
    assert.equal(signal.customerId, target.id)
    await unmovedSignal.refresh()
    assert.equal(unmovedSignal.customerId, target.id, 'target signals are untouched but present')

    const rereadTarget = await Customer.findOrFail(target.id)
    assert.equal(rereadTarget.ordersCount, 3)
    assert.equal(Number(rereadTarget.totalSpent.amount), 400)
    assert.equal(rereadTarget.totalSpent.currency_code, 'USD')

    const rereadSource = await Customer.findOrFail(source.id)
    assert.equal(rereadSource.mergedIntoCustomerId, target.id)
    assert.equal(rereadSource.ordersCount, 0)
    // Historical spend is preserved on the duplicate for audit — never zeroed.
    assert.equal(Number(rereadSource.totalSpent.amount), 300)
  })

  test('moves orders that belong to the duplicate', async ({ assert }) => {
    const user = await makeUser('merge-orders')
    const source = await makeCustomer(user.id, { fullName: 'Src' })
    const target = await makeCustomer(user.id, { fullName: 'Dst' })

    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-MOVE-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Src' },
      lines: [{ sku: `MOVE-${Date.now()}`, title: 'Move item', quantityOrdered: 1, unitPrice: 20 }],
    })
    await Order.query().where('id', order.id).update({ customerId: source.id })

    const result = await CustomerService.mergeCustomers({
      userId: user.id,
      sourceCustomerId: source.id,
      targetCustomerId: target.id,
    })
    assert.equal(result.ordersMoved, 1)

    const reread = await Order.findOrFail(order.id)
    assert.equal(reread.customerId, target.id)
  })

  test('converts lifetime spend across currencies instead of relabelling it', async ({
    assert,
  }) => {
    const user = await makeUser('merge-fx', 'USD')
    const source = await makeCustomer(user.id, {
      fullName: 'INR buyer',
      totalSpent: money(84000, 'INR'),
      ordersCount: 4,
    })
    const target = await makeCustomer(user.id, {
      fullName: 'USD buyer',
      totalSpent: money(100, 'USD'),
      ordersCount: 1,
    })

    const result = await CustomerService.mergeCustomers({
      userId: user.id,
      sourceCustomerId: source.id,
      targetCustomerId: target.id,
      exchangeRates: { INR: 84 }, // 84 INR per USD
    })

    assert.equal(result.target.totalSpent.currency_code, 'USD')
    assert.equal(Number(result.target.totalSpent.amount), 1100) // 100 + 84000/84
    assert.equal(result.target.ordersCount, 5)
  })

  test('missing FX rate aborts the merge without moving anything', async ({ assert }) => {
    const user = await makeUser('merge-no-rate')
    const source = await makeCustomer(user.id, {
      fullName: 'Franc buyer',
      totalSpent: money(1000, 'CHF'),
      ordersCount: 2,
    })
    const target = await makeCustomer(user.id, { fullName: 'USD buyer' })
    const address = await CustomerAddress.create({
      userId: user.id,
      customerId: source.id,
      addressType: 'shipping',
      recipientName: 'Franc buyer',
      line1: '2 Unknown Rate Street',
      city: 'Zurich',
      postalCode: '8001',
      countryCode: 'CH',
      addressFingerprint: `fp-norate-${Date.now()}`,
      isDefault: true,
      isVerified: false,
    })

    const error = await CustomerService.mergeCustomers({
      userId: user.id,
      sourceCustomerId: source.id,
      targetCustomerId: target.id,
    }).catch((e) => e)
    assert.instanceOf(error, CustomerMergeError)
    assert.equal(error.status, 422)

    const rereadAddress = await CustomerAddress.findOrFail(address.id)
    assert.equal(rereadAddress.customerId, source.id, 'the failed merge must roll back')
    const rereadSource = await Customer.findOrFail(source.id)
    assert.isNull(rereadSource.mergedIntoCustomerId)
    assert.equal(Number(rereadSource.totalSpent.amount), 1000)
    const rereadTarget = await Customer.findOrFail(target.id)
    assert.equal(Number(rereadTarget.totalSpent.amount), 0)
  })

  test('rejects self-merge, unknown customers and already-merged rows', async ({ assert }) => {
    const user = await makeUser('merge-guards')
    const a = await makeCustomer(user.id, { fullName: 'A' })
    const b = await makeCustomer(user.id, { fullName: 'B' })
    const merged = await makeCustomer(user.id, {
      fullName: 'Already merged',
      mergedIntoCustomerId: a.id,
    })

    const selfError = await CustomerService.mergeCustomers({
      userId: user.id,
      sourceCustomerId: a.id,
      targetCustomerId: a.id,
    }).catch((e) => e)
    assert.instanceOf(selfError, CustomerMergeError)
    assert.equal(selfError.status, 422)

    const missingError = await CustomerService.mergeCustomers({
      userId: user.id,
      sourceCustomerId: a.id,
      targetCustomerId: 'cust_does_not_exist',
    }).catch((e) => e)
    assert.instanceOf(missingError, CustomerMergeError)
    assert.equal(missingError.status, 404)

    const mergedSourceError = await CustomerService.mergeCustomers({
      userId: user.id,
      sourceCustomerId: merged.id,
      targetCustomerId: b.id,
    }).catch((e) => e)
    assert.instanceOf(mergedSourceError, CustomerMergeError)
    assert.equal(mergedSourceError.status, 409)

    const mergedTargetError = await CustomerService.mergeCustomers({
      userId: user.id,
      sourceCustomerId: b.id,
      targetCustomerId: merged.id,
    }).catch((e) => e)
    assert.instanceOf(mergedTargetError, CustomerMergeError)
    assert.equal(mergedTargetError.status, 409)

    // Nothing was mutated by any rejected attempt.
    const rereadB = await Customer.findOrFail(b.id)
    assert.isNull(rereadB.mergedIntoCustomerId)
    assert.equal(rereadB.ordersCount, 0)
  })

  test('a tenant cannot merge another tenant’s customers', async ({ assert }) => {
    const owner = await makeUser('merge-tenant-owner')
    const outsider = await makeUser('merge-tenant-outsider')
    const a = await makeCustomer(owner.id, { fullName: 'Owner A' })
    const b = await makeCustomer(owner.id, { fullName: 'Owner B' })

    // The scoped lock query never sees foreign rows, so it reports them as missing.
    const error = await CustomerService.mergeCustomers({
      userId: outsider.id,
      sourceCustomerId: a.id,
      targetCustomerId: b.id,
    }).catch((e) => e)
    assert.instanceOf(error, CustomerMergeError)
    assert.equal(error.status, 404)

    const rereadA = await Customer.findOrFail(a.id)
    assert.isNull(rereadA.mergedIntoCustomerId)
  })

  test('merging the same pair twice moves nothing the second time', async ({ assert }) => {
    const user = await makeUser('merge-idempotent')
    const source = await makeCustomer(user.id, { fullName: 'Once', ordersCount: 1 })
    const target = await makeCustomer(user.id, { fullName: 'Survivor', ordersCount: 0 })

    const first = await CustomerService.mergeCustomers({
      userId: user.id,
      sourceCustomerId: source.id,
      targetCustomerId: target.id,
    })
    assert.equal(first.target.ordersCount, 1)

    const second = await CustomerService.mergeCustomers({
      userId: user.id,
      sourceCustomerId: source.id,
      targetCustomerId: target.id,
    }).catch((e) => e)
    assert.instanceOf(second, CustomerMergeError)
    assert.equal(second.status, 409)

    const rereadTarget = await Customer.findOrFail(target.id)
    assert.equal(rereadTarget.ordersCount, 1, 'counters must not be summed twice')

    // Merging back the other direction is also refused: the survivor owns the history.
    const reversed = await CustomerService.mergeCustomers({
      userId: user.id,
      sourceCustomerId: target.id,
      targetCustomerId: source.id,
    }).catch((e) => e)
    assert.instanceOf(reversed, CustomerMergeError)
    assert.equal(reversed.status, 409)
  })
})
