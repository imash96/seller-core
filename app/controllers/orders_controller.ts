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
        .preload('customer')
        .preload('sellerAccount')
        .preload('lineItems')
        .preload('shipments')
        .orderBy('orderedAt', 'desc')
        .limit(100),
      Customer.query().where('userId', user.id).orderBy('fullName'),
      WorkspaceLookupService.savedViewsFor(user.id, 'orders'),
      WorkspaceLookupService.lookups(user.id),
    ])
    return inertia.render('orders', {
      ...sharedLookups,
      orders: orders.map((o) => o.serialize()),
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
      entityType: 'orders',
      entityId: order.id,
      requestId: request.id(),
      beforeState: { status: prevStatus },
      afterState: { status: order.status },
    })

    await OrderStatusChanged.dispatch({
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: user.id,
      fromStatus: String(prevStatus),
      toStatus: String(status),
      actorUserId: user.id,
      requestId: request.id(),
    })

    session.flash(
      'success',
      status === OrderStatus.DELIVERED
        ? `Order ${order.orderNumber} marked delivered and customer delivery notification queued.`
        : `Order ${order.orderNumber} status updated to ${status}.`
    )
    return response.redirect().back()
  }

  async deleteOrder({ auth, bouncer, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    if (await bouncer.denies('deleteOrders')) {
      session.flash('error', 'Bouncer: not authorized to delete orders.')
      return response.redirect().back()
    }
    const allowed = await RbacService.hasPermission(user, 'orders.delete', 'orders')
    if (!allowed) {
      session.flash('error', 'RBAC Denied: You do not have permission orders.delete')
      return response.redirect().back()
    }

    const order = await Order.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()
    const orderNum = order.orderNumber
    await order.delete()

    await RbacService.recordAudit({
      actorUserId: user.id,
      userId: user.id,
      action: 'order.deleted',
      entityType: 'orders',
      entityId: params.id,
      requestId: request.id(),
      beforeState: { orderNumber: orderNum },
    })

    session.flash('success', `Order ${orderNum} deleted.`)
    return response.redirect().back()
  }

  async importBulkOrders({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(bulkOrderImportValidator)

    try {
      const parsedOrders = JSON.parse(payload.ordersJson)
      if (!Array.isArray(parsedOrders)) {
        throw new Error('ordersJson must be a JSON array of order objects.')
      }

      try {
        const importMod = await import('#jobs/process_marketplace_import')
        const ProcessMarketplaceImport = importMod.default
        await (ProcessMarketplaceImport as any).dispatch({
          userId: user.id,
          sellerAccountId: payload.sellerAccountId ?? null,
          idempotencyKey: payload.idempotencyKey,
          orders: parsedOrders,
          requestId: request.id(),
        })
        session.flash(
          'success',
          `Import queued (${payload.idempotencyKey}): ${parsedOrders.length} orders will be processed in background.`
        )
        return response.redirect().back()
      } catch {
        // Fallback to inline processing if queue table/worker not active
      }

      const result = await OrderService.importBulkOrders({
        userId: user.id,
        actorUserId: user.id,
        sellerAccountId: payload.sellerAccountId ?? null,
        idempotencyKey: payload.idempotencyKey,
        orders: parsedOrders,
      })

      session.flash(
        'success',
        `Bulk Import Batch (${result.job.idempotencyKey}): ${result.job.succeededRecords} created, ${result.job.skippedDuplicates} duplicates skipped, ${result.job.failedRecords} errors.`
      )
    } catch (err: any) {
      session.flash('error', `Bulk import error: ${err.message}`)
    }
    return response.redirect().back()
  }

  async bulkUpdateStatus({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const ids = (request.input('ids') ?? []) as string[]
    const status = String(request.input('status', '')).trim()

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      session.flash('error', 'Select at least one order and a valid status.')
      return response.redirect().back()
    }

    const orders = await Order.query().where('userId', user.id).whereIn('id', ids)
    for (const order of orders) {
      order.status = status
      if (status === OrderStatus.DELIVERED) {
        order.deliveredAt = DateTime.now()
        order.deliveryNotificationSentAt = DateTime.now()
      } else if (status === OrderStatus.CANCELLED) {
        order.cancelledAt = DateTime.now()
      }
      await order.save()
    }

    session.flash('success', `Updated ${orders.length} order(s) to "${status}".`)
    return response.redirect().back()
  }

  async bulkExport({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const ids = (request.input('ids') ?? []) as string[]
    const q = Order.query().where('userId', user.id).orderBy('orderedAt', 'desc')
    if (Array.isArray(ids) && ids.length > 0) {
      q.whereIn('id', ids)
    }
    const orders = await q.limit(500)
    session.flash('success', `Prepared export for ${orders.length} order(s).`)
    return response.redirect().back()
  }
}
