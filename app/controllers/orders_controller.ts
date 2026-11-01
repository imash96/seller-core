import { DateTime } from 'luxon'
import { csvCell } from '../utils/csv.js'
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
    const effective = await RbacService.getEffectivePermissions(user)
    const can = (resource: string) =>
      RbacService.allows(user, effective, `${resource}.read`, resource)
    const [orders, customers, savedViews, sharedLookups] = await Promise.all([
      Order.query()
        .where('userId', user.id)
        .if(can('customers'), (q) =>
          q
            .preload('customer', (cq) =>
              cq
                .where('userId', user.id)
                .preload('riskSignals', (r) => r.where('userId', user.id))
                .preload('addresses', (r) => r.where('userId', user.id))
            )
            .preload('shippingAddress', (r) => r.where('userId', user.id))
        )
        .if(can('integrations'), (q) =>
          q.preload('sellerAccount', (r) => r.where('userId', user.id))
        )
        .preload('orderPrices', (q) => q.where('userId', user.id))
        .preload('lineItems', (lq) =>
          lq
            .where('userId', user.id)
            .preload('linePrices', (q) => q.where('userId', user.id))
            .if(can('catalog'), (q) =>
              q.preload('productVariant', (vq) =>
                vq
                  .where('userId', user.id)
                  .preload('product', (r) => r.where('userId', user.id))
                  .preload('priceRecords', (prices) => prices.where('userId', user.id))
              )
            )
        )
        .if(can('shipments'), (q) => q.preload('shipments', (r) => r.where('userId', user.id)))
        .orderBy('orderedAt', 'desc')
        .limit(100),
      can('customers')
        ? Customer.query()
            .where('userId', user.id)
            .preload('riskSignals', (q) => q.where('userId', user.id))
            .preload('addresses', (q) => q.where('userId', user.id))
            .orderBy('fullName')
        : [],
      WorkspaceLookupService.savedViewsFor(user.id, 'orders'),
      WorkspaceLookupService.lookups(user),
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
        reportingCurrencyCode:
          request.input('reportingCurrencyCode') || user.defaultCurrency || 'USD',
        exchangeRate: payload.exchangeRate ?? 1.0,
        shippingCostAmount: payload.shippingCostAmount ?? 0,
        shippingCostCurrencyCode:
          request.input('shippingCostCurrencyCode') || payload.currencyCode || 'USD',
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
            currencyCode: payload.currencyCode || 'USD',
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

      session.flash(
        'success',
        `Order ${order.orderNumber} created with multi-currency OrderPrice records and P&L calculated.`
      )
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create order')
    }
    return response.redirect().back()
  }

  async updateOrderStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const status = request.input('status')
      const order = await Order.query()
        .where('userId', user.id)
        .andWhere('id', params.id)
        .firstOrFail()

      if (
        !Object.values(OrderStatus).includes(status) ||
        status === OrderStatus.DELIVERED ||
        order.status === OrderStatus.DELIVERED
      ) {
        session.flash('error', 'Invalid status. Mark shipments delivered to complete an order.')
        return response.redirect().back()
      }
      const prevStatus = order.status
      order.status = status
      if (status === OrderStatus.CANCELLED) {
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
        fromStatus: prevStatus,
        toStatus: status,
        actorUserId: user.id,
        requestId: request.id(),
      })

      session.flash('success', `Order ${order.orderNumber} updated to ${status}.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to update order status.')
    }
    return response.redirect().back()
  }

  async deleteOrder({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
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
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to cancel order.')
    }
    return response.redirect().back()
  }

  async importBulkOrders({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(bulkOrderImportValidator)

    try {
      const rawJson = String(
        (payload as any).ordersJson ||
          request.input('ordersJson') ||
          request.input('jsonPayload') ||
          '[]'
      )
      let parsed: any
      try {
        parsed = JSON.parse(rawJson)
      } catch {
        session.flash('error', 'Bulk import failed: Invalid JSON format.')
        return response.redirect().back()
      }

      const rawItems = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object'
          ? [parsed]
          : []
      const items = rawItems.filter((item: any) => item && typeof item === 'object')

      if (items.length === 0) {
        session.flash(
          'error',
          'Bulk import failed: No valid order records found in the provided payload.'
        )
        return response.redirect().back()
      }

      const normalizedOrders = items.map((item: any, idx: number) => ({
        orderNumber: String(item.orderNumber || `IMP-${Date.now()}-${idx + 1}`),
        externalOrderId: item.externalOrderId ? String(item.externalOrderId) : null,
        marketplaceCode: String(item.marketplaceCode || 'amazon'),
        currencyCode: String(item.currencyCode || 'USD').toUpperCase(),
        reportingCurrencyCode: user.defaultCurrency || 'USD',
        exchangeRate: Number(item.exchangeRate || 1),
        shippingCostAmount: Number(item.shippingCostAmount || 0),
        customer: {
          fullName: String(item.customerFullName || item.customer?.fullName || 'Marketplace Buyer'),
          email: item.customerEmail || item.customer?.email || null,
          phone: item.customerPhone || item.customer?.phone || null,
        },
        lines: Array.isArray(item.lines)
          ? item.lines.map((l: any) => ({
              sku: String(l.sku || 'SKU-001'),
              title: String(l.title || l.sku || 'Imported Item'),
              quantityOrdered: Math.max(1, Number(l.quantityOrdered || 1)),
              currencyCode: String(l.currencyCode || item.currencyCode || 'USD').toUpperCase(),
              unitPrice: Number(l.unitPrice || 0),
              unitCostAmount: Number(l.unitCostAmount || 0),
              taxAmount: Number(l.taxAmount || 0),
              discountAmount: Number(l.discountAmount || 0),
              shippingAmount: Number(l.shippingAmount || 0),
            }))
          : [],
      }))

      const { job, createdOrderIds, duplicateOrderNumbers } = await OrderService.importBulkOrders({
        userId: user.id,
        actorUserId: user.id,
        sellerAccountId: payload.sellerAccountId ?? null,
        idempotencyKey:
          payload.idempotencyKey || request.input('idempotencyKey') || `batch-${Date.now()}`,
        orders: normalizedOrders,
      })

      session.flash(
        'success',
        `Sync job ${job.id}: imported ${createdOrderIds.length} new orders (${duplicateOrderNumbers.length} duplicates skipped).`
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

    if (
      !ids.length ||
      !Object.values(OrderStatus).includes(status as any) ||
      status === OrderStatus.DELIVERED
    ) {
      session.flash('error', 'Select at least one order and a target status.')
      return response.redirect().back()
    }

    const orders = await Order.query().where('userId', user.id).whereIn('id', ids)
    if (orders.some((order) => order.status === OrderStatus.DELIVERED)) {
      session.flash('error', 'Delivered orders cannot be changed through bulk status updates.')
      return response.redirect().back()
    }
    for (const order of orders) {
      const prevStatus = order.status
      order.status = status
      if (status === OrderStatus.CANCELLED) {
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

    const query = Order.query()
      .where('userId', user.id)
      .if(await RbacService.hasPermission(user, 'customers.read', 'customers'), (q) =>
        q.preload('customer', (r) => r.where('userId', user.id))
      )
      .orderBy('orderedAt', 'desc')
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
          .map(csvCell)
          .join(',')
      ),
    ]

    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.csv"`)
    return response.send(lines.join('\n'))
  }
}
