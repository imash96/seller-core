import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Shipment from '#models/shipment'
import ShippingInvoice from '#models/shipping_invoice'
import Order from '#models/order'
import ShipmentDispatched from '#events/shipment_dispatched'
import { FulfillmentAndReturnsService } from '../services/fulfillment_and_returns_service.js'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createShipmentValidator, createShippingInvoiceValidator } from '#validators/operations'
import { ShipmentStatus, OrderStatus } from '../enums/index.js'

export default class ShipmentsController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [shipments, invoices, savedViews, sharedLookups] = await Promise.all([
      Shipment.query()
        .where('userId', user.id)
        .preload('order')
        .preload('shipmentItems', (q) => q.preload('orderLineItem'))
        .orderBy('createdAt', 'desc')
        .limit(100),
      ShippingInvoice.query()
        .where('userId', user.id)
        .preload('lines')
        .orderBy('invoiceDate', 'desc')
        .limit(50),
      WorkspaceLookupService.savedViewsFor(user.id, 'shipments'),
      WorkspaceLookupService.lookups(user.id),
    ])
    return inertia.render('shipments', {
      ...sharedLookups,
      shipments: shipments.map((s) => s.serialize()),
      shippingInvoices: invoices.map((i) => i.serialize()),
      savedViews,
    })
  }

  async storeShipment({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createShipmentValidator)

    try {
      const shipment = await FulfillmentAndReturnsService.createShipment({
        userId: user.id,
        orderId: payload.orderId,
        shipmentNumber: payload.shipmentNumber,
        carrierCode: payload.carrierCode,
        carrierName: payload.carrierName,
        serviceLevel: payload.serviceLevel,
        trackingNumber: payload.trackingNumber,
        lengthCm: payload.lengthCm,
        widthCm: payload.widthCm,
        heightCm: payload.heightCm,
        deadWeightGrams: payload.deadWeightGrams,
        estimatedShippingCost: payload.estimatedShippingCost,
        status: payload.status || ShipmentStatus.IN_TRANSIT,
        items: [
          {
            orderLineItemId: payload.orderLineItemId,
            quantityShipped: payload.quantityShipped,
          },
        ],
      })
      await ShipmentDispatched.dispatch({
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        orderId: payload.orderId,
        orderNumber: (shipment as any).orderNumber ?? String(shipment.shipmentNumber),
        userId: user.id,
        carrierCode: payload.carrierCode,
        trackingNumber: payload.trackingNumber ?? null,
        requestId: request.id(),
      })

      session.flash('success', `Shipment ${shipment.shipmentNumber} created and order updated.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create shipment')
    }
    return response.redirect().back()
  }

  async updateShipmentStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const shipment = await Shipment.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const status = String(request.input('status', ShipmentStatus.DELIVERED))
    shipment.status = status
    if (status === ShipmentStatus.DELIVERED) {
      shipment.deliveredAt = DateTime.now()
      shipment.deliveryNotificationSent = true
      const order = await Order.query()
        .where('userId', user.id)
        .andWhere('id', shipment.orderId)
        .first()
      if (order) {
        order.status = OrderStatus.DELIVERED
        order.deliveredAt = DateTime.now()
        order.deliveryNotificationSentAt = DateTime.now()
        await order.save()
      }
    }
    await shipment.save()

    session.flash('success', `Shipment ${shipment.shipmentNumber} updated to ${status}.`)
    return response.redirect().back()
  }

  async bulkUpdateStatus({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const ids = (request.input('ids') ?? []) as string[]
    const status = String(request.input('status', '')).trim()

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      session.flash('error', 'Select at least one shipment and a valid status.')
      return response.redirect().back()
    }

    const shipments = await Shipment.query().where('userId', user.id).whereIn('id', ids)
    for (const shipment of shipments) {
      shipment.status = status
      if (status === ShipmentStatus.DELIVERED) {
        shipment.deliveredAt = DateTime.now()
        shipment.deliveryNotificationSent = true
      }
      await shipment.save()
    }

    session.flash('success', `Updated ${shipments.length} shipment(s) to "${status}".`)
    return response.redirect().back()
  }

  async bulkExport({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const ids = (request.input('ids') ?? []) as string[]
    const q = Shipment.query().where('userId', user.id).orderBy('createdAt', 'desc')
    if (Array.isArray(ids) && ids.length > 0) {
      q.whereIn('id', ids)
    }
    const shipments = await q.limit(500)
    session.flash('success', `Prepared export for ${shipments.length} shipment(s).`)
    return response.redirect().back()
  }

  async storeShippingInvoice({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createShippingInvoiceValidator)

    try {
      const invoice = await FulfillmentAndReturnsService.createShippingInvoice({
        userId: user.id,
        carrierCode: payload.carrierCode,
        carrierName: payload.carrierName,
        invoiceNumber: payload.invoiceNumber,
        currencyCode: payload.currencyCode || 'USD',
        invoiceDate: payload.invoiceDate,
        dueDate: payload.dueDate,
        lines: [
          {
            shipmentId: payload.shipmentId ?? null,
            chargeType: payload.chargeType,
            expectedAmount: payload.expectedAmount ?? payload.billedAmount,
            billedAmount: payload.billedAmount,
          },
        ],
      })
      session.flash(
        'success',
        `Carrier Invoice ${invoice.invoiceNumber} reconciled (${invoice.reconciliationStatus}, variance: ${invoice.varianceAmount}).`
      )
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create shipping invoice')
    }
    return response.redirect().back()
  }

  async updateInvoiceStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const invoice = await ShippingInvoice.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const status = String(request.input('paymentStatus') ?? request.input('status') ?? 'paid')
    const reconciliationStatus = String(request.input('reconciliationStatus', 'resolved'))
    invoice.paymentStatus = status
    invoice.reconciliationStatus = reconciliationStatus
    if (status === 'paid') {
      invoice.paidAmount = invoice.totalAmount
      invoice.paidAt = DateTime.now()
    }
    await invoice.save()

    session.flash(
      'success',
      `Invoice ${invoice.invoiceNumber} marked ${status} (${reconciliationStatus}).`
    )
    return response.redirect().back()
  }
}
