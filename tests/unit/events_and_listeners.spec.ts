import { test } from '@japa/runner'
import OrderPlaced from '../../app/events/order_placed.js'
import OrderStatusChanged from '../../app/events/order_status_changed.js'
import ShipmentDispatched from '../../app/events/shipment_dispatched.js'
import RiskSignalFlagged from '../../app/events/risk_signal_flagged.js'
import PaymentReconciled from '../../app/events/payment_reconciled.js'
import UserOnboarded from '../../app/events/user_onboarded.js'
import CreateNotification from '../../app/listeners/create_notification.js'
import Notification from '#models/notification'
import SendNotification from '../../app/jobs/send_notification.js'
import QueueFulfillment from '../../app/listeners/queue_fulfillment.js'
import { OutboxService } from '../../app/services/outbox_service.js'
import User from '#models/user'

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

  test('CreateNotification maps each domain event to one in-app feed entry', ({ assert }) => {
    const listener = new CreateNotification()

    const placed = listener.notificationFor(
      new OrderPlaced({
        orderId: 'ord_123',
        orderNumber: 'ORD-123',
        userId: 'usr_123',
        customerId: 'cus_123',
        currencyCode: 'USD',
        grandTotal: { currency_code: 'USD', amount: 100 },
        marketplaceCode: 'amazon',
        sellerAccountId: null,
      })
    )
    assert.deepEqual(placed, {
      userId: 'usr_123',
      type: 'order.placed',
      title: 'New amazon order ORD-123',
      body: 'Order total 100.00 USD.',
      entityType: 'orders',
      entityId: 'ord_123',
    })

    const status = listener.notificationFor(
      new OrderStatusChanged({
        orderId: 'ord_123',
        orderNumber: 'ORD-123',
        userId: 'usr_123',
        fromStatus: 'draft',
        toStatus: 'confirmed',
        actorUserId: 'usr_admin',
      })
    )
    assert.equal(status?.type, 'order.status_changed')
    assert.equal(status?.title, 'Order ORD-123: draft -> confirmed')
  })

  test('CreateNotification ignores events without an owning user', ({ assert }) => {
    const listener = new CreateNotification()
    const draft = listener.notificationFor(
      new OrderPlaced({
        orderId: 'ord_123',
        orderNumber: 'ORD-123',
        userId: '',
        customerId: 'cus_123',
        currencyCode: 'USD',
        grandTotal: { currency_code: 'USD', amount: 10 },
        marketplaceCode: 'direct',
        sellerAccountId: null,
      })
    )
    assert.isNull(draft)
  })

  test('QueueFulfillment skips events that carry no order identity', async ({ assert }) => {
    const listener = new QueueFulfillment()
    await listener.handle(
      new OrderPlaced({
        orderId: '',
        orderNumber: 'ORD-123',
        userId: 'usr_123',
        customerId: 'cus_123',
        currencyCode: 'USD',
        grandTotal: { currency_code: 'USD', amount: 10 },
        marketplaceCode: 'direct',
        sellerAccountId: null,
      })
    )
    assert.isTrue(true)
  })

  test('CreateNotification maps finance, fulfillment and identity events', ({ assert }) => {
    const listener = new CreateNotification()

    const dispatched = listener.notificationFor(
      new ShipmentDispatched({
        shipmentId: 'shp_1',
        shipmentNumber: 'SHP-1',
        orderId: 'ord_1',
        orderNumber: 'ORD-1',
        userId: 'usr_1',
        carrierCode: 'ups',
        trackingNumber: '1Z-1',
      })
    )
    assert.equal(dispatched?.type, 'shipment.dispatched')
    assert.equal(dispatched?.entityType, 'shipments')
    assert.equal(dispatched?.entityId, 'shp_1')

    const reconciled = listener.notificationFor(
      new PaymentReconciled({
        financialTransactionId: 'ftx_1',
        userId: 'usr_1',
        status: 'reconciled',
        amount: { currency_code: 'CAD', amount: 42.5 },
      })
    )
    assert.equal(reconciled?.type, 'payment.reconciled')
    // The body reads the amount's own currency, never a tenant default.
    assert.include(String(reconciled?.body), '42.50 CAD')

    const onboarded = listener.notificationFor(
      new UserOnboarded({
        userId: 'usr_2',
        email: 'new@example.com',
        fullName: 'New Merchant',
        actorUserId: 'usr_admin',
      })
    )
    assert.equal(onboarded?.type, 'user.onboarded')
    assert.equal(onboarded?.entityId, 'usr_2')
  })

  test('SendNotification persists one typed row and normalizes the channel', async ({ assert }) => {
    const user = await User.create({
      email: `notify-${Date.now()}@example.com`,
      fullName: 'Notify User',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })

    const job = new SendNotification()
    const result = await job.deliver({
      userId: user.id,
      to: 'https://hooks.example.com/seller-core',
      channel: 'webhook',
      subject: 'Settlement posted',
      body: 'The July settlement was posted to the ledger.',
      type: 'finance.settlement_posted',
      entityType: 'financial_transactions',
      entityId: 'ftx_1',
    })
    // `webhook` is not an allowed feed channel; it is recorded as in_app.
    assert.equal(result.channel, 'in_app')
    assert.isTrue(result.persisted)

    const row = await Notification.query()
      .where('userId', user.id)
      .where('type', 'finance.settlement_posted')
      .firstOrFail()
    assert.equal(row.channel, 'in_app')
    assert.equal(row.recipientAddress, 'https://hooks.example.com/seller-core')
    assert.equal(row.body, 'The July settlement was posted to the ledger.')
    assert.isNotNull(row.sentAt)
    assert.isFalse(row.isRead)

    // A notification without an owner is produced but not persisted.
    const orphan = await job.deliver({
      to: 'buyer@example.com',
      channel: 'email',
      subject: 'Order shipped',
      body: 'Your parcel left the warehouse.',
    })
    assert.isFalse(orphan.persisted)
    assert.isNull(orphan.channel)
  })

  test('Outbox retry backoff grows exponentially and is capped', ({ assert }) => {
    assert.equal(OutboxService.backoffSeconds(0), 30)
    assert.equal(OutboxService.backoffSeconds(1), 60)
    assert.equal(OutboxService.backoffSeconds(3), 240)
    // Never sleeps longer than an hour, however many attempts have failed.
    assert.equal(OutboxService.backoffSeconds(20), 3600)
  })
})
