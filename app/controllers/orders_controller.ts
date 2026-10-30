import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import Customer from '#models/customer'
import OrderPlaced from '#events/order_placed'
import OrderStatusChanged from '#events/order_status_changed'
import { OrderService } from '../services/order_service.js'
import { RbacService } from '../services/rbac_service.js'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createOrderValidator, bulkOrderImportValidator } from '#validators/operations'
import { OrderStatus } from '../enums/index.js'

export default class OrdersController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [orders, customers, savedViews, sharedLookups] = await Promise.all([
      Order.query()
        .where('userId', user.id)
        .preload('customer', (cq) => cq.preload('riskSignals').preload('addresses'))
        .preload('shippingAddress')
        .preload('sellerAccount')
        .preload('lineItems', (lq) =>
          lq.preload('productVariant', (vq) => vq.preload('product'))
        )
        .preload('shipments')
        .orderBy('orderedAt', 'desc')
        .limit(100),
      Customer.query()
        .where('userId', user.id)
        .preload('riskSignals')
        .preload('addresses')
        .orderBy('fullName'),
      WorkspaceLookupService.savedViewsFor(user.id, 'orders'),
      WorkspaceLookupService.lookups(user.id),
    ])

    const enrichedOrders = orders.map((o) => {
      const raw = o.serialize()
      const lineItems = (o.lineItems ?? []).map((li) => {
        const liRaw = li.serialize()
        const prodImages = li.productVariant?.product?.images
        const firstImage =
          Array.isArray(prodImages) && prodImages.length > 0 ? String(prodImages[0]) : null
        return {
          ...liRaw,
          imageUrl: firstImage,
        }
      })
      return {
        ...raw,
        lineItems,
      }
    })

    return inertia.render('orders', {
      ...sharedLookups,
      orders: enrichedOrders,
      customers: customers.map((c) => c.serialize()),
      savedViews,
    })
  }

  async storeOrder({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createOrderValidator)

    try {
      const order = await OrderService.createOrder({
        userId: user.id,
        actorUserId: user.id,
        sellerAccountId: payload.sellerAccountId ?? null,
        orderNumber: payload.orderNumber,
        externalOrderId: payload.externalOrderId ?? null,
        marketplaceCode: payload.marketplaceCode || 'direct',
        currencyCode: payload.currencyCode || 'USD',
        reportingCurrencyCode: user.defaultCurrency || 'USD',
        exchangeRate: payload.exchangeRate ?? 1.0,
        shippingCostAmount: payload.shippingCostAmount ?? 0,
        customer: {
          fullName: payload.customerFullName,
          email: payload.customerEmail ?? null,
          phone: payload.customerPhone ?? null,
        },
        shippingAddress: payload.shippingLine1
          ? {
              recipientName: payload.customerFullName,
              line1: payload.shippingLine1,
              city: payload.shippingCity || 'Seattle',
              postalCode: payload.shippingPostalCode || '98101',
              countryCode: payload.shippingCountryCode || 'US',
            }
          : undefined,
        lines: [
          {
            sku: payload.sku,
            title: payload.itemTitle,
            quantityOrdered: payload.quantityOrdered,
            unitPrice: payload.unitPrice,
            unitCostAmount: payload.unitCostAmount,
            taxAmount: payload.taxAmount ?? 0,
            discountAmount: payload.discountAmount ?? 0,
            shippingAmount: payload.shippingChargedAmount ?? 0,
          },
        ],
      })
      await OrderPlaced.dispatch({
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: user.id,
        customerId: order.customerId,
        currencyCode: order.currencyCode,
        totalAmount: String(order.totalAmount),
        marketplaceCode: order.marketplaceCode,
        sellerAccountId: order.sellerAccountId,
        requestId: request.id(),
      })

      session.flash('success', `Order ${order.orderNumber} created with P&L calculated.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create order')
    }
    return response.redirect().back()
  }

  async updateOrderStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const status = request.input('status')
    const order = await Order.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const prevStatus = order.status
    order.status = status
    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = DateTime.now()
      order.deliveryNotificationSentAt = DateTime.now()
    } else if (status === OrderStatus.CANCELLED) {
      order.cancelledAt = DateTime.now()
    }
    await order.save()

    await RbacService.recordAudit({
      actorUserId: user.id,
      userId: user.id,
      action: 'order.status_updated',
      entityType: 'order',
      entityId: order.id,
      beforeState: { status: prevStatus },
      afterState: { status },
      ipAddress: request.ip(),
    })

    await OrderStatusChanged.dispatch({
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: user.id,
      previousStatus: prevStatus,
      newStatus: status,
      changedByUserId: user.id,
      requestId: request.id(),
    })

    session.flash('success', `Order ${order.orderNumber} updated to ${status}.`)
    return response.redirect().back()
  }

  async deleteOrder({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const order = await Order.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const snapshot = order.serialize()
    order.status = OrderStatus.CANCELLED
    order.cancelledAt = DateTime.now()
    await order.save()

    await RbacService.recordAudit({
      actorUserId: user.id,
      userId: user.id,
      action: 'order.cancelled',
      entityType: 'order',
      entityId: order.id,
      beforeState: snapshot,
      afterState: { status: OrderStatus.CANCELLED },
      ipAddress: request.ip(),
    })

    session.flash('success', `Order ${order.orderNumber} cancelled.`)
    return response.redirect().back()
  }

  async importBulkOrders({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(bulkOrderImportValidator)

    try {
      const parsed = JSON.parse(payload.jsonPayload)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      const { syncJob, created, skipped } = await OrderService.importMarketplaceBatch({
        userId: user.id,
        sellerAccountId: payload.sellerAccountId ?? null,
        marketplaceCode: payload.marketplaceCode,
        defaultReportingCurrency: user.defaultCurrency || 'USD',
        items,
      })
      session.flash(
        'success',
        `Sync job ${syncJob.id}: imported ${created} new orders (${skipped} idempotent duplicates skipped).`
      )
    } catch (err: any) {
      session.flash('error', `Bulk import failed: ${err.message}`)
    }
    return response.redirect().back()
  }

  async bulkUpdateStatus({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const rawIds = request.input('ids', [])
    const ids: string[] = Array.isArray(rawIds)
      ? rawIds.map(String)
      : String(rawIds)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
    const status = String(request.input('status', '')).trim()

    if (!ids.length || !status) {
      session.flash('error', 'Select at least one order and a target status.')
      return response.redirect().back()
    }

    const orders = await Order.query().where('userId', user.id).whereIn('id', ids)
    for (const order of orders) {
      const prevStatus = order.status
      order.status = status
      if (status === OrderStatus.DELIVERED) {
        order.deliveredAt = DateTime.now()
        order.deliveryNotificationSentAt = DateTime.now()
      } else if (status === OrderStatus.CANCELLED) {
        order.cancelledAt = DateTime.now()
      }
      await order.save()
      await RbacService.recordAudit({
        actorUserId: user.id,
        userId: user.id,
        action: 'order.bulk_status_updated',
        entityType: 'order',
        entityId: order.id,
        beforeState: { status: prevStatus },
        afterState: { status },
        ipAddress: request.ip(),
      })
    }

    session.flash('success', `Updated ${orders.length} order(s) to "${status}".`)
    return response.redirect().back()
  }

  async bulkExport({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const rawIds = request.input('ids', [])
    const ids: string[] = Array.isArray(rawIds)
      ? rawIds.map(String)
      : String(rawIds || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)

    const query = Order.query().where('userId', user.id).preload('customer').orderBy('orderedAt', 'desc')
    if (ids.length > 0) query.whereIn('id', ids)
    const orders = await query.limit(500)

    const headers = [
      'order_number',
      'external_order_id',
      'marketplace_code',
      'status',
      'payment_status',
      'fulfillment_status',
      'customer_name',
      'customer_email',
      'currency_code',
      'total_amount',
      'cogs_amount',
      'marketplace_fees_amount',
      'shipping_cost_amount',
      'net_profit_amount',
      'ordered_at',
    ]
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [
      headers.join(','),
      ...orders.map((o) =>
        [
          o.orderNumber,
          o.externalOrderId,
          o.marketplaceCode,
          o.status,
          o.paymentStatus,
          o.fulfillmentStatus,
          o.customer?.fullName,
          o.customer?.email,
          o.currencyCode,
          o.totalAmount,
          o.cogsAmount,
          o.marketplaceFeesAmount,
          o.shippingCostAmount,
          o.netProfitAmount,
          o.orderedAt?.toISO(),
        ]
          .map(escape)
          .join(',')
      ),
    ]

    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.csv"`)
    return response.send(lines.join('\n'))
  }
}
