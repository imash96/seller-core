/* eslint-disable @unicorn/no-await-expression-member -- Response status assertions */
import { test } from '@japa/runner'
import User from '#models/user'
import Shipment from '#models/shipment'
import OutboxEvent from '#models/outbox_event'
import Order from '#models/order'
import ReturnRequest from '#models/return_request'
import RefundTransaction from '#models/refund_transaction'
import FinancialTransaction from '#models/financial_transaction'
import ShippingInvoice from '#models/shipping_invoice'
import AuditLog from '#models/audit_log'
import { ListingTransformerService } from '#services/listing_transformer_service'

// Exercise the real HTTP stack, session cookie and CSRF checks; DB reads verify persisted effects.
test.group('Local fulfillment HTTP workflow', () => {
  test('login, split shipments, delivery, tenant isolation and idempotency', async ({ assert }) => {
    const nonce = Date.now().toString()
    const user = await User.create({
      email: `http-${nonce}@example.com`,
      fullName: 'HTTP operator',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const other = await User.create({
      email: `http-other-${nonce}@example.com`,
      fullName: 'Other operator',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const base = 'http://localhost:3333'
    const jar = new Map<string, string>()
    const send = async (path: string, body?: Record<string, unknown>) => {
      const xsrf = jar.get('XSRF-TOKEN')
      const response = await fetch(base + path, {
        method: body ? 'POST' : 'GET',
        redirect: 'manual',
        headers: {
          cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
          ...(body
            ? { 'content-type': 'application/json', 'x-xsrf-token': decodeURIComponent(xsrf ?? '') }
            : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(';')[0]
        const index = pair.indexOf('=')
        jar.set(pair.slice(0, index), pair.slice(index + 1))
      }
      return response
    }
    const noCsrf = await fetch(`${base}/orders`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
    assert.notEqual(noCsrf.status, 200)
    await send('/store/product-categories')
    const login = await send('/', { email: user.email, password: 'Password123!' })
    assert.equal(login.status, 302)
    assert.include(login.headers.get('location') ?? '', 'dashboard')
    assert.equal((await send('/health/live')).status, 200)
    assert.equal((await send('/health/ready')).status, 200)
    await send('/carrier-invoices', {
      carrierCode: 'ups',
      carrierName: 'UPS',
      invoiceNumber: `INV-${nonce}`,
      invoiceDate: '2026-01-01',
      chargeType: 'base_freight',
      billedAmount: 10,
    })
    const invoice = await ShippingInvoice.query()
      .where('userId', user.id)
      .where('invoiceNumber', `INV-${nonce}`)
      .firstOrFail()
    assert.equal(invoice.reconciliationStatus, 'unreconciled')
    const manual = {
      paymentStatus: 'paid',
      reconciliationStatus: 'resolved',
      paidAmount: '10',
      notes: 'Reviewed manually',
    }
    assert.equal((await send(`/carrier-invoices/${invoice.id}`, manual)).status, 422)
    assert.equal(
      (
        await send(`/carrier-invoices/${invoice.id}`, {
          ...manual,
          paymentReference: 'receipt-123',
          reconciliationStatus: 'matched',
        })
      ).status,
      422
    )
    assert.equal(
      (
        await send(`/carrier-invoices/${invoice.id}`, {
          ...manual,
          paymentReference: 'receipt-123',
        })
      ).status,
      302
    )
    await invoice.refresh()
    assert.equal(invoice.paymentStatus, 'paid')
    assert.equal(invoice.paymentReference, 'receipt-123')
    assert.lengthOf(
      await AuditLog.query()
        .where('entityId', invoice.id)
        .where('action', 'shipping_invoice.manual_review'),
      1
    )
    assert.equal((await send(`/carrier-invoices/${invoice.id}/delete`, {})).status, 409)

    const forged = await fetch(`${base}/orders`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'cookie': [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
        'content-type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        orderNumber: `FORGED-${nonce}`,
        customerFullName: 'Buyer',
        sku: 'sku',
        itemTitle: 'Item',
        quantityOrdered: 1,
        unitPrice: 10,
      }),
    })
    assert.equal(forged.status, 302)
    assert.isNull(await Order.query().where('orderNumber', `FORGED-${nonce}`).first())
    await send('/orders', {
      orderNumber: `HTTP-${nonce}`,
      customerFullName: 'Buyer',
      sku: `HTTP-${nonce}`,
      itemTitle: 'Item',
      quantityOrdered: 2,
      unitPrice: 10,
    })
    const order = await Order.query()
      .where('userId', user.id)
      .where('orderNumber', `HTTP-${nonce}`)
      .preload('lineItems')
      .firstOrFail()
    for (const n of [1, 2]) {
      const res = await send('/shipments', {
        orderId: order.id,
        orderLineItemId: order.lineItems[0].id,
        shipmentNumber: `HTTP-${nonce}-${n}`,
        carrierCode: 'ups',
        carrierName: 'UPS',
        quantityShipped: 1,
      })
      assert.equal(res.status, 302)
    }
    const shipments = await Shipment.query()
      .where('userId', user.id)
      .where('orderId', order.id)
      .orderBy('shipmentNumber')
    assert.lengthOf(shipments, 2)
    await send(`/shipments/${shipments[0].id}/status`, { status: 'delivered' })
    await order.refresh()
    assert.notEqual(order.status, 'delivered')
    await shipments[0].refresh()
    assert.isFalse(shipments[0].deliveryNotificationSent)
    await send(`/shipments/${shipments[0].id}/status`, { status: 'delivered' })
    const outbox = await OutboxEvent.query()
      .where('aggregateId', shipments[0].id)
      .where('eventType', 'shipment.delivered.notify_customer')
    assert.lengthOf(outbox, 1)
    await send('/shipments/bulk/status', {
      ids: [shipments[1].id, 'not-owned'],
      status: 'delivered',
    })
    await shipments[1].refresh()
    assert.notEqual(shipments[1].status, 'delivered')
    await send('/shipments/bulk/status', { ids: [shipments[1].id], status: 'delivered' })
    await order.refresh()
    assert.equal(order.status, 'delivered')
    await send('/returns', {
      orderId: order.id,
      orderLineItemId: order.lineItems[0].id,
      rmaNumber: `RMA-${nonce}`,
      returnReason: 'defective',
      quantityRequested: 1,
    })
    const rma = await ReturnRequest.query()
      .where('userId', user.id)
      .where('rmaNumber', `RMA-${nonce}`)
      .firstOrFail()
    await send('/refunds', {
      orderId: order.id,
      returnRequestId: rma.id,
      refundNumber: `REF-${nonce}`,
      itemsRefundAmount: 10,
    })
    const refund = await RefundTransaction.query()
      .where('userId', user.id)
      .where('refundNumber', `REF-${nonce}`)
      .firstOrFail()
    assert.equal(Number(refund.totalRefundAmount), 10)
    await send('/refunds', {
      orderId: order.id,
      refundNumber: `OVER-${nonce}`,
      itemsRefundAmount: 20,
    })
    assert.isNull(
      await RefundTransaction.query()
        .where('userId', user.id)
        .where('refundNumber', `OVER-${nonce}`)
        .first()
    )
    const exported = await send('/shipments/bulk/export', { ids: [shipments[0].id] })
    assert.include(exported.headers.get('content-type') ?? '', 'text/csv')
    assert.include(await exported.text(), shipments[0].shipmentNumber)
    await send(`/shipments/${shipments[0].id}/delete`, {})
    assert.isNotNull(await Shipment.find(shipments[0].id))
    await send('/logout', {})
    await send('/', { email: other.email, password: 'Password123!' })
    const crossTenantLedger = await send('/financial-transactions', {
      referenceNumber: `CROSS-${nonce}`,
      transactionType: 'income',
      description: 'Invalid other workspace order',
      originalAmount: 10,
      transactionDate: '2026-01-01',
      orderId: order.id,
    })
    assert.equal(crossTenantLedger.status, 400)
    assert.isNull(
      await FinancialTransaction.query().where('referenceNumber', `CROSS-${nonce}`).first()
    )
    await send('/shipments', {
      orderId: order.id,
      orderLineItemId: order.lineItems[0].id,
      shipmentNumber: `FOREIGN-${nonce}`,
      carrierCode: 'ups',
      carrierName: 'UPS',
      quantityShipped: 1,
    })
    assert.isNull(await Shipment.query().where('shipmentNumber', `FOREIGN-${nonce}`).first())
    await send(`/shipments/${shipments[1].id}/status`, { status: 'exception' })
    await shipments[1].refresh()
    assert.equal(shipments[1].status, 'delivered')
    await send('/logout', {})
    const limited = await User.create({
      email: `http-limited-${nonce}@example.com`,
      fullName: 'Limited operator',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: false,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    await send('/', { email: limited.email, password: 'Password123!' })
    const forbidden = await send('/shipments/bulk/status', {
      ids: [shipments[1].id],
      status: 'delivered',
    })
    assert.equal(forbidden.status, 403)
    const forbiddenPage = await send('/orders')
    assert.equal(forbiddenPage.status, 403)
    await assert.rejects(
      () =>
        ListingTransformerService.publishListingOnPlatform({
          userId: other.id,
          listingId: 'missing',
        }),
      /not configured/
    )
  })
})
