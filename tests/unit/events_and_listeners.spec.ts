import { test } from '@japa/runner'
import OrderPlaced from '../../app/events/order_placed.js'
import OrderStatusChanged from '../../app/events/order_status_changed.js'
import ShipmentDispatched from '../../app/events/shipment_dispatched.js'
import RiskSignalFlagged from '../../app/events/risk_signal_flagged.js'
import PaymentReconciled from '../../app/events/payment_reconciled.js'
import UserOnboarded from '../../app/events/user_onboarded.js'
import NotifySlack from '../../app/listeners/notify_slack.js'

test.group('Domain Events & Listeners', () => {
  test('OrderPlaced event constructs and serializes domain payload accurately', ({ assert }) => {
    const payload = {
      orderId: 'ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6A',
      orderNumber: 'ORD-2026-8801',
      userId: 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B',
      customerId: 'cus_01K5ZQ7T9V0M8ZK5N7YQ2W4X6C',
      currencyCode: 'USD',
      grandTotal: { currency_code: 'USD', amount: 289.99 },
      marketplaceCode: 'amazon',
      sellerAccountId: 'sacc_01K5ZQ7T9V0M8ZK5N7YQ2W4X6D',
      requestId: 'req_01K5ZQ7T9V0M8ZK5N7YQ2W4X6E',
    }

    const event = new OrderPlaced(payload)
    assert.deepEqual(event.payload, payload)
    assert.equal(event.payload.orderId, 'ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6A')
    assert.deepEqual(event.payload.grandTotal, { currency_code: 'USD', amount: 289.99 })
    assert.equal(event.payload.grandTotal.currency_code, event.payload.currencyCode)
  })

  test('OrderStatusChanged event tracks state transitions and acting user', ({ assert }) => {
    const payload = {
      orderId: 'ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6A',
      orderNumber: 'ORD-2026-8801',
      userId: 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B',
      fromStatus: 'processing',
      toStatus: 'fulfilled',
      actorUserId: 'usr_admin_01',
      requestId: 'req_01K5ZQ7T9V0M8ZK5N7YQ2W4X6E',
    }

    const event = new OrderStatusChanged(payload)
    assert.equal(event.payload.fromStatus, 'processing')
    assert.equal(event.payload.toStatus, 'fulfilled')
    assert.equal(event.payload.actorUserId, 'usr_admin_01')
  })

  test('ShipmentDispatched event retains carrier details and tracking identifiers', ({
    assert,
  }) => {
    const payload = {
      shipmentId: 'shp_01K5ZQ7T9V0M8ZK5N7YQ2W4X6F',
      shipmentNumber: 'SHP-1002',
      orderId: 'ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6A',
      orderNumber: 'ORD-2026-8801',
      userId: 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B',
      carrierCode: 'fedex',
      trackingNumber: '794829104829',
    }

    const event = new ShipmentDispatched(payload)
    assert.equal(event.payload.carrierCode, 'fedex')
    assert.equal(event.payload.trackingNumber, '794829104829')
  })

  test('RiskSignalFlagged event contains severity ranking and reason', ({ assert }) => {
    const payload = {
      signalId: 'sig_01K5ZQ7T9V0M8ZK5N7YQ2W4X6G',
      customerId: 'cus_01K5ZQ7T9V0M8ZK5N7YQ2W4X6C',
      userId: 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B',
      reason: 'Repeated chargeback velocity spike detected',
      severity: 'critical',
    }

    const event = new RiskSignalFlagged(payload)
    assert.equal(event.payload.severity, 'critical')
    assert.include(event.payload.reason, 'chargeback velocity spike')
  })

  test('PaymentReconciled event captures financial transaction settlement details', ({
    assert,
  }) => {
    const payload = {
      financialTransactionId: 'ftx_01K5ZQ7T9V0M8ZK5N7YQ2W4X6H',
      userId: 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B',
      status: 'settled',
      amount: { currency_code: 'USD', amount: 1240.5 },
    }

    const event = new PaymentReconciled(payload)
    assert.equal(event.payload.status, 'settled')
    assert.deepEqual(event.payload.amount, { currency_code: 'USD', amount: 1240.5 })
  })

  test('UserOnboarded event contains user identity and authorizer information', ({ assert }) => {
    const payload = {
      userId: 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6J',
      email: 'newuser@example.com',
      fullName: 'New Merchant',
      actorUserId: 'usr_super_admin',
    }

    const event = new UserOnboarded(payload)
    assert.equal(event.payload.email, 'newuser@example.com')
    assert.equal(event.payload.actorUserId, 'usr_super_admin')
  })

  test('NotifySlack listener handles various event instances without crashing', async ({
    assert,
  }) => {
    const listener = new NotifySlack()

    const orderEvent = new OrderPlaced({
      orderId: 'ord_123',
      orderNumber: 'ORD-123',
      userId: 'usr_123',
      customerId: 'cus_123',
      currencyCode: 'USD',
      grandTotal: { currency_code: 'USD', amount: 100 },
      marketplaceCode: 'direct',
      sellerAccountId: null,
    })

    const statusEvent = new OrderStatusChanged({
      orderId: 'ord_123',
      orderNumber: 'ORD-123',
      userId: 'usr_123',
      fromStatus: 'draft',
      toStatus: 'confirmed',
      actorUserId: 'usr_admin',
    })

    // Should complete cleanly
    await listener.handle(orderEvent)
    await listener.handle(statusEvent)
    assert.isTrue(true)
  })
})
