import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User from '#models/user'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import OutboxEvent from '#models/outbox_event'
import Notification from '#models/notification'
import Shipment from '#models/shipment'
import Order from '#models/order'
import { OrderService } from '#services/order_service'
import { FulfillmentAndReturnsService } from '#services/fulfillment_and_returns_service'
import { OutboxService } from '#services/outbox_service'
import { money } from '../../app/types/price.js'
import { ReturnReason, ReturnResolutionType, ShipmentStatus } from '../../app/enums/index.js'

/** Drains every due event, regardless of what earlier tests left pending. */
async function drainAll(eventTypes?: string[]) {
  return OutboxService.drain({ limit: 500, eventTypes })
}

async function makeMerchant(label: string) {
  return User.create({
    email: `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    fullName: 'Inventory tester',
    password: 'Password123!',
    status: 'active',
    isSuperAdmin: true,
    defaultCurrency: 'USD',
    timezone: 'UTC',
  })
}

/** Creates a sellable variant with known on-hand/reserved counts. */
async function makeVariant(userId: string, stockOnHand: number) {
  const product = await Product.create({
    userId,
    title: `Inventory product ${Math.random().toString(36).slice(2, 8)}`,
    slug: `inventory-${Math.random().toString(36).slice(2, 10)}`,
    status: 'active',
    hasVariants: false,
    prices: [{ currency_code: 'USD', amount: 50 }],
  })
  return ProductVariant.create({
    userId,
    productId: product.id,
    sku: `INV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    title: 'Inventory variant',
    isDefault: true,
    prices: [{ currency_code: 'USD', amount: 50 }],
    costPrice: money(20, 'USD'),
    manufacturingCost: money(5, 'USD'),
    packagingCost: money(1, 'USD'),
    stockOnHand,
    stockReserved: 0,
    reorderPoint: 0,
    weightGrams: '500',
  })
}

test.group('Inventory transitions & transactional outbox', () => {
  test('cancelling an order releases only the units it still holds', async ({ assert }) => {
    const user = await makeMerchant('cancel-stock')
    const variant = await makeVariant(user.id, 10)

    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-CXL-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Cancelling Buyer', email: 'cancel@buyer.io' },
      lines: [
        {
          productVariantId: variant.id,
          sku: variant.sku,
          title: variant.title,
          quantityOrdered: 3,
          unitPrice: 50,
          unitCost: 20,
        },
      ],
    })

    await variant.refresh()
    assert.equal(Number(variant.stockReserved), 3)
    assert.equal(Number(variant.stockOnHand), 10)

    const first = await OrderService.cancelOrder({ userId: user.id, orderId: order.id })
    assert.equal(first.releasedUnits, 3)
    await variant.refresh()
    // Cancelled before dispatch: the units never left the warehouse.
    assert.equal(Number(variant.stockReserved), 0)
    assert.equal(Number(variant.stockOnHand), 10)

    // Idempotent: a second cancellation releases nothing.
    const second = await OrderService.cancelOrder({ userId: user.id, orderId: order.id })
    assert.equal(second.releasedUnits, 0)
    await variant.refresh()
    assert.equal(Number(variant.stockReserved), 0)
  })

  test('shipping an order consumes the reservation and decrements on-hand stock', async ({
    assert,
  }) => {
    const user = await makeMerchant('ship-stock')
    const variant = await makeVariant(user.id, 8)

    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-SHIP-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Shipping Buyer', email: 'ship@buyer.io' },
      lines: [
        {
          productVariantId: variant.id,
          sku: variant.sku,
          title: variant.title,
          quantityOrdered: 2,
          unitPrice: 50,
          unitCost: 20,
        },
      ],
    })
    await order.load('lineItems')

    await FulfillmentAndReturnsService.createShipment({
      userId: user.id,
      orderId: order.id,
      shipmentNumber: `SHP-STOCK-${Date.now()}`,
      carrierCode: 'ups',
      carrierName: 'UPS',
      status: ShipmentStatus.IN_TRANSIT,
      items: [{ orderLineItemId: order.lineItems[0].id, quantityShipped: 2 }],
    })

    await variant.refresh()
    assert.equal(Number(variant.stockOnHand), 6)
    assert.equal(Number(variant.stockReserved), 0)
    // stock_available is a generated column, so it must agree with both sides.
    assert.equal(Number(variant.stockAvailable), 6)

    // Over-shipping the same order line is still rejected after the stock move.
    await assert.rejects(
      () =>
        FulfillmentAndReturnsService.createShipment({
          userId: user.id,
          orderId: order.id,
          shipmentNumber: `SHP-STOCK-OVER-${Date.now()}`,
          carrierCode: 'ups',
          carrierName: 'UPS',
          items: [{ orderLineItemId: order.lineItems[0].id, quantityShipped: 1 }],
        }),
      /OVER_FULFILLMENT|exceeds|quantity/i
    )
    await variant.refresh()
    assert.equal(Number(variant.stockOnHand), 6)
  })

  test('receiving a return restocks the delta once and marks the RMA received', async ({
    assert,
  }) => {
    const user = await makeMerchant('rma-stock')
    const variant = await makeVariant(user.id, 5)

    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-RMA-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Returning Buyer', email: 'rma@buyer.io' },
      lines: [
        {
          productVariantId: variant.id,
          sku: variant.sku,
          title: variant.title,
          quantityOrdered: 2,
          unitPrice: 50,
          unitCost: 20,
        },
      ],
    })
    await order.load('lineItems')

    await FulfillmentAndReturnsService.createShipment({
      userId: user.id,
      orderId: order.id,
      shipmentNumber: `SHP-RMA-${Date.now()}`,
      carrierCode: 'ups',
      carrierName: 'UPS',
      status: ShipmentStatus.DELIVERED,
      items: [{ orderLineItemId: order.lineItems[0].id, quantityShipped: 2 }],
    })
    await variant.refresh()
    assert.equal(Number(variant.stockOnHand), 3)

    const rma = await FulfillmentAndReturnsService.createReturnRequest({
      userId: user.id,
      orderId: order.id,
      orderLineItemId: order.lineItems[0].id,
      rmaNumber: `RMA-STOCK-${Date.now()}`,
      returnReason: ReturnReason.DEFECTIVE,
      resolutionType: ReturnResolutionType.REFUND,
      quantityRequested: 2,
    })

    const received = await FulfillmentAndReturnsService.receiveReturn({
      userId: user.id,
      returnRequestId: rma.id,
      quantityReceived: 1,
    })
    assert.equal(received.restockedUnits, 1)
    assert.equal(received.returnRequest.status, 'received')
    assert.isNotNull(received.returnRequest.receivedAt)
    await variant.refresh()
    assert.equal(Number(variant.stockOnHand), 4)

    // Re-confirming the same receipt must not restock twice.
    const again = await FulfillmentAndReturnsService.receiveReturn({
      userId: user.id,
      returnRequestId: rma.id,
      quantityReceived: 1,
    })
    assert.equal(again.restockedUnits, 0)
    await variant.refresh()
    assert.equal(Number(variant.stockOnHand), 4)

    // Receiving more units than were approved is clamped to the approved quantity.
    const clamped = await FulfillmentAndReturnsService.receiveReturn({
      userId: user.id,
      returnRequestId: rma.id,
      quantityReceived: 99,
    })
    assert.equal(clamped.restockedUnits, 1)
    await variant.refresh()
    assert.equal(Number(variant.stockOnHand), 5)
  })

  test('a returned-to-sender shipment puts the units back on the shelf', async ({ assert }) => {
    const user = await makeMerchant('rts-stock')
    const variant = await makeVariant(user.id, 4)

    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-RTS-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Undeliverable Buyer', email: 'rts@buyer.io' },
      lines: [
        {
          productVariantId: variant.id,
          sku: variant.sku,
          title: variant.title,
          quantityOrdered: 2,
          unitPrice: 50,
          unitCost: 20,
        },
      ],
    })
    await order.load('lineItems')

    const shipment = await FulfillmentAndReturnsService.createShipment({
      userId: user.id,
      orderId: order.id,
      shipmentNumber: `SHP-RTS-${Date.now()}`,
      carrierCode: 'ups',
      carrierName: 'UPS',
      status: ShipmentStatus.IN_TRANSIT,
      items: [{ orderLineItemId: order.lineItems[0].id, quantityShipped: 2 }],
    })
    await variant.refresh()
    assert.equal(Number(variant.stockOnHand), 2)

    await FulfillmentAndReturnsService.updateShipmentStatuses({
      userId: user.id,
      shipmentIds: [shipment.id],
      status: ShipmentStatus.RETURNED_TO_SENDER,
    })
    await variant.refresh()
    assert.equal(Number(variant.stockOnHand), 4)

    // Applying the same terminal status again is a no-op, not a second restock.
    await FulfillmentAndReturnsService.updateShipmentStatuses({
      userId: user.id,
      shipmentIds: [shipment.id],
      status: ShipmentStatus.RETURNED_TO_SENDER,
    })
    await variant.refresh()
    assert.equal(Number(variant.stockOnHand), 4)
  })

  test('the outbox publishes order.created exactly once and becomes idempotent', async ({
    assert,
  }) => {
    const user = await makeMerchant('outbox-order')
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-OBX-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Outbox Buyer', email: 'outbox@buyer.io' },
      lines: [{ sku: 'OBX-1', title: 'Outbox item', quantityOrdered: 1, unitPrice: 25 }],
    })

    const row = await OutboxEvent.query()
      .where('aggregateId', order.id)
      .where('eventType', 'order.created')
      .firstOrFail()
    assert.equal(row.status, 'pending')
    assert.equal(row.retryCount, 0)

    const summary = await drainAll()
    assert.isAtLeast(summary.published, 1)

    await row.refresh()
    assert.equal(row.status, 'published')
    assert.isNotNull(row.processedAt)
    assert.isNull(row.nextRetryAt)

    const notification = await Notification.query()
      .where('userId', user.id)
      .where('type', 'order.placed')
      .where('entityId', order.id)
      .firstOrFail()
    assert.equal(notification.channel, 'in_app')

    // Draining again finds nothing due: the claim already consumed the row.
    const second = await drainAll()
    assert.equal(second.claimed, 0)
    assert.lengthOf(
      await Notification.query()
        .where('userId', user.id)
        .where('type', 'order.placed')
        .where('entityId', order.id),
      1
    )
  })

  test('the delivery notification is published once and flags the shipment', async ({ assert }) => {
    const user = await makeMerchant('outbox-delivery')
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-DLV-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Delivered Buyer', email: 'delivered@buyer.io' },
      lines: [{ sku: 'DLV-1', title: 'Delivered item', quantityOrdered: 1, unitPrice: 25 }],
    })
    await order.load('lineItems')

    const shipment = await FulfillmentAndReturnsService.createShipment({
      userId: user.id,
      orderId: order.id,
      shipmentNumber: `SHP-DLV-${Date.now()}`,
      carrierCode: 'ups',
      carrierName: 'UPS',
      trackingNumber: '1Z-DELIVERED-1',
      status: ShipmentStatus.DELIVERED,
      items: [{ orderLineItemId: order.lineItems[0].id, quantityShipped: 1 }],
    })
    await shipment.refresh()
    assert.isFalse(shipment.deliveryNotificationSent)

    await drainAll(['shipment.delivered.notify_customer'])

    await shipment.refresh()
    assert.isTrue(shipment.deliveryNotificationSent)
    assert.lengthOf(
      await Notification.query()
        .where('userId', user.id)
        .where('type', 'shipment.delivered')
        .where('entityId', shipment.id),
      1
    )

    // Re-publishing the same event is deduplicated by (type, entity).
    await drainAll(['shipment.delivered.notify_customer'])
    assert.lengthOf(
      await Notification.query()
        .where('userId', user.id)
        .where('type', 'shipment.delivered')
        .where('entityId', shipment.id),
      1
    )
  })

  test('a failing publication is retried with backoff, then dead-lettered', async ({ assert }) => {
    const broken = await OutboxEvent.create({
      userId: null,
      aggregateType: 'orders',
      aggregateId: `ord_${Date.now()}`,
      eventType: 'order.created',
      idempotencyKey: `order.created:missing-user:${Date.now()}`,
      payload: { orderNumber: 'ORD-BROKEN' },
      status: 'pending',
      retryCount: 0,
      maxRetries: 2,
    })

    const first = await drainAll(['order.created'])
    assert.isAtLeast(first.retried, 1)
    await broken.refresh()
    assert.equal(broken.status, 'failed')
    assert.equal(broken.retryCount, 1)
    assert.isNotNull(broken.nextRetryAt)
    assert.isNotNull(broken.lastError)

    // The backoff window is not over yet, so the row is not due.
    const blocked = await drainAll()
    assert.equal(blocked.claimed, 0)

    // Pretend the backoff elapsed; the next failure exhausts max_retries.
    await broken.refresh()
    broken.nextRetryAt = DateTime.now().minus({ seconds: 1 })
    await broken.save()
    const second = await drainAll(['order.created'])
    assert.equal(second.deadLettered, 1)
    await broken.refresh()
    assert.equal(broken.status, 'dead_letter')
    assert.equal(broken.retryCount, 2)

    // A dead-lettered row is never claimed again.
    const afterDeadLetter = await drainAll()
    assert.equal(afterDeadLetter.claimed, 0)
  })

  test('an event type with no publisher is dead-lettered immediately', async ({ assert }) => {
    const row = await OutboxEvent.create({
      userId: null,
      aggregateType: 'orders',
      aggregateId: `ord_${Date.now()}`,
      eventType: 'unknown.event',
      idempotencyKey: `unknown.event:${Date.now()}`,
      payload: {},
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
    })

    const summary = await drainAll()
    assert.equal(summary.deadLettered, 1)
    await row.refresh()
    assert.equal(row.status, 'dead_letter')
    assert.include(String(row.lastError), 'UNHANDLED_EVENT_TYPE')
  })

  test('drain only touches rows within the tenant-neutral claim window', async ({ assert }) => {
    const user = await makeMerchant('outbox-shipment-flag')
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `ORD-CLAIM-${Date.now()}`,
      currencyCode: 'USD',
      customer: { fullName: 'Claim Buyer', email: 'claim@buyer.io' },
      lines: [{ sku: 'CLAIM-1', title: 'Claim item', quantityOrdered: 1, unitPrice: 10 }],
    })
    await order.load('lineItems')
    const shipment = await FulfillmentAndReturnsService.createShipment({
      userId: user.id,
      orderId: order.id,
      shipmentNumber: `SHP-CLAIM-${Date.now()}`,
      carrierCode: 'ups',
      carrierName: 'UPS',
      status: ShipmentStatus.DELIVERED,
      items: [{ orderLineItemId: order.lineItems[0].id, quantityShipped: 1 }],
    })

    // Simulate a worker that claimed the delivery event and then died: the row is
    // left in `processing` and must become claimable again after the stale window.
    await OutboxEvent.query()
      .where('aggregateId', shipment.id)
      .where('eventType', 'shipment.delivered.notify_customer')
      .update({ status: 'processing', updatedAt: DateTime.now().toSQL() })
    await drainAll()
    const stuck = await drainAll(['shipment.delivered.notify_customer'])
    assert.equal(stuck.claimed, 0)

    await OutboxEvent.query()
      .where('aggregateId', shipment.id)
      .where('eventType', 'shipment.delivered.notify_customer')
      .update({ status: 'processing', updatedAt: DateTime.now().minus({ minutes: 10 }).toSQL() })
    await shipment.refresh()
    assert.isFalse(shipment.deliveryNotificationSent)
    const recovered = await drainAll(['shipment.delivered.notify_customer'])
    assert.equal(recovered.published, 1)
    await shipment.refresh()
    assert.isTrue(shipment.deliveryNotificationSent)
    assert.isNotNull(await Shipment.find(shipment.id))
    assert.isNotNull(await Order.find(order.id))
  })
})
