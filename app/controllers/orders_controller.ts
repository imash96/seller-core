import { DateTime } from 'luxon'
import { csvCell } from '../utils/csv.js'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import { AuditContext } from '#services/audit_context'
import { AuditService } from '#services/audit_service'
import Order from '#models/order'
import Customer from '#models/customer'
import OrderPlaced from '#events/order_placed'
import OrderStatusChanged from '#events/order_status_changed'
import { OrderService } from '../services/order_service.js'
import { RbacService } from '../services/rbac_service.js'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createOrderValidator, bulkOrderImportValidator } from '#validators/operations'
import { OrderStatus } from '../enums/index.js'
import { amountOf, currencyOf, normalizePriceMoney } from '../types/price.js'

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
        // The channel of an order is derived through its seller account, so the
        // relation (and the sales channel behind it) is always loaded.
        .preload('sellerAccount', (r) => r.where('userId', user.id).preload('salesChannel'))
        .preload('lineItems', (lq) =>
          lq
            .where('userId', user.id)
            .if(can('catalog'), (q) =>
              q.preload('productVariant', (vq) =>
                vq.where('userId', user.id).preload('product', (r) => r.where('userId', user.id))
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

    // Every amount is folded into a self-contained PriceMoney object in the order currency.
    const currency = (payload.currencyCode || 'USD').toUpperCase()
    const inCurrency = (value: unknown, fallback = 0) =>
      normalizePriceMoney(value ?? fallback, currency)

    try {
      const order = await OrderService.createOrder({
        userId: user.id,
        actorUserId: user.id,
        sellerAccountId: payload.sellerAccountId ?? null,
        orderNumber: payload.orderNumber,
        externalOrderId: payload.externalOrderId ?? null,
        externalDisplayId: payload.externalDisplayId ?? null,
        marketplaceCode: payload.marketplaceCode || 'direct',
        marketplaceSiteId: payload.marketplaceSiteId ?? null,
        fulfillmentChannel: payload.fulfillmentChannel,
        taxCollectionModel: payload.taxCollectionModel,
        earliestShipAt: payload.earliestShipAt ?? null,
        latestShipAt: payload.latestShipAt ?? null,
        earliestDeliveryAt: payload.earliestDeliveryAt ?? null,
        latestDeliveryAt: payload.latestDeliveryAt ?? null,
        currencyCode: currency,
        reportingCurrencyCode:
          request.input('reportingCurrencyCode') || user.defaultCurrency || 'USD',
        exchangeRate: payload.exchangeRate ?? 1.0,
        shippingCostTotal: inCurrency(payload.shippingCostTotal),
        shippingCostCurrencyCode: payload.shippingCostCurrencyCode || currency,
        marketplaceFeesTotal: payload.marketplaceFeesTotal
          ? inCurrency(payload.marketplaceFeesTotal)
          : undefined,
        paymentProcessingFeesTotal: payload.paymentProcessingFeesTotal
          ? inCurrency(payload.paymentProcessingFeesTotal)
          : undefined,
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
            unitPrice: inCurrency(payload.unitPrice),
            unitCost: payload.unitCost ? inCurrency(payload.unitCost) : undefined,
            taxTotal: inCurrency(payload.taxTotal),
            discountTotal: inCurrency(payload.discountTotal),
            promotionTotal: payload.promotionTotal ? inCurrency(payload.promotionTotal) : undefined,
            shippingTotal: inCurrency(payload.shippingTotal),
            shippingDiscountTotal: payload.shippingDiscountTotal
              ? inCurrency(payload.shippingDiscountTotal)
              : undefined,
            shippingTaxTotal: payload.shippingTaxTotal
              ? inCurrency(payload.shippingTaxTotal)
              : undefined,
          },
        ],
      })
      await order.load('sellerAccount', (accountQuery) => accountQuery.preload('salesChannel'))
      await OrderPlaced.dispatch({
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: user.id,
        customerId: order.customerId,
        currencyCode: currencyOf(order.grandTotal),
        grandTotal: order.grandTotal,
        marketplaceCode: order.channelCode,
        sellerAccountId: order.sellerAccountId,
        requestId: request.id(),
      })

      session.flash(
        'success',
        `Order ${order.orderNumber} created with self-contained PriceMoney totals and P&L calculated.`
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
      await db.transaction(async (trx) => {
        await AuditContext.apply(trx, {
          actorUserId: user.id,
          requestId: request.id(),
          ipAddress: request.ip(),
          userAgent: request.header('user-agent') ?? null,
          reason: 'order.status_updated',
        })
        order.useTransaction(trx)
        order.status = status
        if (status === OrderStatus.CANCELLED) {
          order.cancelledAt = DateTime.now()
        }
        await order.save()
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

      await db.transaction(async (trx) => {
        await AuditContext.apply(trx, {
          actorUserId: user.id,
          requestId: request.id(),
          ipAddress: request.ip(),
          userAgent: request.header('user-agent') ?? null,
          reason: 'order.cancelled',
        })
        order.useTransaction(trx)
        order.status = OrderStatus.CANCELLED
        order.cancelledAt = DateTime.now()
        await order.save()
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

      // Each record is forwarded as a raw payload: OrderService auto-detects
      // Amazon SP-API / eBay Fulfillment / Etsy v3 / MedusaJS v2 / canonical JSON.
      const result = await OrderService.importBulkOrders({
        userId: user.id,
        actorUserId: user.id,
        sellerAccountId: payload.sellerAccountId ?? null,
        idempotencyKey:
          payload.idempotencyKey || request.input('idempotencyKey') || `batch-${Date.now()}`,
        reportingCurrencyCode: user.defaultCurrency || 'USD',
        payloads: items.map((item: any) => ({
          // Envelope form ({ payload, orderItemsPayload, platform }) or the raw
          // marketplace object itself; empty keys are ignored by the normalizer.
          payload: item.payload ?? item,
          orderItemsPayload: item.orderItemsPayload ?? item.orderItems,
          platform: item.platform,
          sellerAccountId: payload.sellerAccountId ?? null,
        })),
      })

      const accepted = result.createdOrderIds.length
      const skipped = result.duplicateOrderNumbers.length
      const rejected = result.errors.length
      const summary = `Sync job ${result.job.id}: imported ${accepted} new orders (${skipped} duplicates skipped${rejected ? `, ${rejected} rejected` : ''}).`
      session.flash(
        rejected && !accepted ? 'error' : 'success',
        rejected && !accepted
          ? `Bulk import failed: ${result.errors[0]?.errorMessage ?? 'validation error'}`
          : summary
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
    await db.transaction(async (trx) => {
      await AuditContext.apply(trx, {
        actorUserId: user.id,
        requestId: request.id(),
        ipAddress: request.ip(),
        userAgent: request.header('user-agent') ?? null,
        reason: 'order.bulk_status_updated',
      })
      for (const order of orders) {
        order.useTransaction(trx)
        order.status = status
        if (status === OrderStatus.CANCELLED) {
          order.cancelledAt = DateTime.now()
        }
        await order.save()
      }
    })

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
      .preload('sellerAccount', (accountQuery) =>
        accountQuery.where('userId', user.id).preload('salesChannel')
      )
      .if(await RbacService.hasPermission(user, 'customers.read', 'customers'), (q) =>
        q.preload('customer', (r) => r.where('userId', user.id))
      )
      .orderBy('orderedAt', 'desc')
    if (ids.length > 0) query.whereIn('id', ids)
    const orders = await query.limit(500)

    const headers = [
      'order_number',
      'external_order_id',
      'external_display_id',
      'channel_code',
      'marketplace_site_id',
      'fulfillment_channel',
      'tax_collection_model',
      'status',
      'payment_status',
      'fulfillment_status',
      'customer_name',
      'customer_email',
      'order_currency',
      'subtotal',
      'discount_total',
      'promotion_total',
      'shipping_total',
      'shipping_discount_total',
      'tax_total',
      'shipping_tax_total',
      'marketplace_withheld_tax_total',
      'grand_total',
      'cogs_total',
      'marketplace_fees_total',
      'shipping_cost_total',
      'net_profit',
      'ordered_at',
      'latest_ship_at',
      'latest_delivery_at',
    ]
    const lines = [
      headers.join(','),
      ...orders.map((o) =>
        [
          o.orderNumber,
          o.externalOrderId,
          o.externalDisplayId,
          o.channelCode,
          o.marketplaceSiteId,
          o.fulfillmentChannel,
          o.taxCollectionModel,
          o.status,
          o.paymentStatus,
          o.fulfillmentStatus,
          o.customer?.fullName,
          o.customer?.email,
          currencyOf(o.grandTotal),
          amountOf(o.subtotal),
          amountOf(o.discountTotal),
          amountOf(o.promotionTotal),
          amountOf(o.shippingTotal),
          amountOf(o.shippingDiscountTotal),
          amountOf(o.taxTotal),
          amountOf(o.shippingTaxTotal),
          amountOf(o.marketplaceWithheldTaxTotal),
          amountOf(o.grandTotal),
          amountOf(o.cogsTotal),
          amountOf(o.marketplaceFeesTotal),
          amountOf(o.shippingCostTotal),
          amountOf(o.netProfit),
          o.orderedAt?.toISO(),
          o.latestShipAt?.toISO(),
          o.latestDeliveryAt?.toISO(),
        ]
          .map(csvCell)
          .join(',')
      ),
    ]

    // Exports are not row mutations, so they are one of the few manual audit rows.
    await AuditService.recordExport({
      actorUserId: user.id,
      entityType: 'orders',
      requestId: request.id(),
      ipAddress: request.ip(),
      metadata: { orderCount: orders.length, ids },
    })

    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.csv"`)
    return response.send(lines.join('\n'))
  }
}
