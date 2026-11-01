import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import AuditLog from '#models/audit_log'
import ShippingInvoiceLine from '#models/shipping_invoice_line'
import { csvCell } from '../utils/csv.js'
import type { HttpContext } from '@adonisjs/core/http'
import { RbacService } from '#services/rbac_service'
import Shipment from '#models/shipment'
import ShippingInvoice from '#models/shipping_invoice'
import ShipmentDispatched from '#events/shipment_dispatched'
import { FulfillmentAndReturnsService } from '../services/fulfillment_and_returns_service.js'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createShipmentValidator, createShippingInvoiceValidator } from '#validators/operations'
import { ShipmentStatus } from '../enums/index.js'

export default class ShipmentsController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const effective = await RbacService.getEffectivePermissions(user)
    const can = (resource: string) =>
      RbacService.allows(user, effective, `${resource}.read`, resource)
    const [shipments, invoices, savedViews, sharedLookups] = await Promise.all([
      Shipment.query()
        .where('userId', user.id)
        .if(can('orders'), (q) => q.preload('order', (r) => r.where('userId', user.id)))
        .preload('shipmentItems', (q) =>
          q
            .where('userId', user.id)
            .if(can('orders'), (r) =>
              r.preload('orderLineItem', (line) => line.where('userId', user.id))
            )
        )
        .orderBy('createdAt', 'desc')
        .limit(100),
      ShippingInvoice.query()
        .where('userId', user.id)
        .preload('lines', (q) => q.where('userId', user.id))
        .orderBy('invoiceDate', 'desc')
        .limit(50),
      WorkspaceLookupService.savedViewsFor(user.id, 'shipments'),
      WorkspaceLookupService.lookups(user),
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
    try {
      const status = String(request.input('status', '')).trim()
      await FulfillmentAndReturnsService.updateShipmentStatuses({
        userId: user.id,
        shipmentIds: [params.id],
        status,
      })
      session.flash('success', `Shipment updated to ${status}.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to update shipment.')
    }
    return response.redirect().back()
  }

  async deleteShipment({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      await Shipment.query().where('userId', user.id).where('id', params.id).firstOrFail()
      // Removing a shipment would orphan fulfillment quantities and financial records.
      session.flash(
        'error',
        'Shipments cannot be deleted after allocation. Update the status instead.'
      )
    } catch {
      session.flash('error', 'Shipment not found.')
    }
    return response.redirect().back()
  }

  async bulkUpdateStatus({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const ids = request.input('ids')
      if (!Array.isArray(ids)) throw new Error('Select at least one shipment.')
      const status = String(request.input('status', '')).trim()
      const count = await FulfillmentAndReturnsService.updateShipmentStatuses({
        userId: user.id,
        shipmentIds: ids,
        status,
      })
      session.flash('success', `Updated ${count} shipment(s) to "${status}".`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to update shipments.')
    }
    return response.redirect().back()
  }

  async bulkUpdateShipmentStatus(ctx: HttpContext) {
    return this.bulkUpdateStatus(ctx)
  }

  async bulkExport({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const ids = request.input('ids') ?? []
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string'))
      return response.badRequest({ error: 'Invalid shipment selection.' })
    const query = Shipment.query().where('userId', user.id).orderBy('createdAt', 'desc')
    if (ids.length) query.whereIn('id', ids)
    const shipments = await query.limit(500)
    const rows = [
      [
        'shipment_number',
        'order_id',
        'carrier_code',
        'carrier_name',
        'tracking_number',
        'status',
        'currency',
        'estimated_cost',
        'shipped_at',
        'delivered_at',
      ].join(','),
      ...shipments.map((shipment) =>
        [
          shipment.shipmentNumber,
          shipment.orderId,
          shipment.carrierCode,
          shipment.carrierName,
          shipment.trackingNumber,
          shipment.status,
          shipment.currencyCode,
          shipment.estimatedShippingCost,
          shipment.shippedAt?.toISO(),
          shipment.deliveredAt?.toISO(),
        ]
          .map(csvCell)
          .join(',')
      ),
    ]
    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header(
      'Content-Disposition',
      `attachment; filename="shipments-export-${Date.now()}.csv"`
    )
    return response.send(rows.join('\n'))
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
            expectedAmount: payload.expectedAmount,
            billedAmount: payload.billedAmount,
          },
        ],
      })
      session.flash(
        'success',
        `Carrier invoice ${invoice.invoiceNumber} recorded locally (${invoice.reconciliationStatus}, variance: ${invoice.varianceAmount}).`
      )
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create shipping invoice')
    }
    return response.redirect().back()
  }

  async storeCarrierInvoice(ctx: HttpContext) {
    return this.storeShippingInvoice(ctx)
  }

  async updateInvoiceStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const status = String(request.input('paymentStatus', '')).trim()
    const reconciliation = String(request.input('reconciliationStatus', '')).trim()
    const reference = String(request.input('paymentReference', '')).trim()
    const note = String(request.input('notes', '')).trim()
    const amountText = String(request.input('paidAmount', '')).trim()
    if (
      !['unpaid', 'partially_paid', 'paid', 'overdue', 'disputed', 'voided'].includes(status) ||
      !['unreconciled', 'matched', 'variance_detected', 'resolved'].includes(reconciliation) ||
      note.length < 3 ||
      note.length > 2000 ||
      reference.length > 255 ||
      !/^\d{1,12}(?:\.\d{1,2})?$/.test(amountText)
    )
      return response.badRequest({
        error: 'Provide valid status, paid amount, and an explanatory note.',
      })
    const result = await db.transaction(async (trx) => {
      const invoice = await ShippingInvoice.query({ client: trx })
        .where('userId', user.id)
        .where('id', params.id)
        .forUpdate()
        .first()
      if (!invoice) return { status: 404, error: 'Invoice not found.' }
      const amount = Number(amountText)
      const total = Number(invoice.totalAmount)
      if (
        (status === 'paid' && (amount !== total || !reference)) ||
        (status === 'partially_paid' && (amount <= 0 || amount >= total || !reference)) ||
        (['unpaid', 'overdue', 'voided'].includes(status) && amount !== 0) ||
        amount > total ||
        (amount > 0 && !reference)
      )
        return {
          status: 422,
          error: 'Paid amount and reference must agree with payment status and invoice total.',
        }
      const lines = await ShippingInvoiceLine.query({ client: trx })
        .where('userId', user.id)
        .where('shippingInvoiceId', invoice.id)
      if (
        reconciliation === 'matched' &&
        (invoice.reconciliationStatus === 'unreconciled' ||
          lines.some(
            (line) =>
              line.expectedAmount === null ||
              line.varianceAmount === null ||
              Number(line.varianceAmount) !== 0
          ))
      )
        return {
          status: 422,
          error:
            'An unverified or discrepant invoice cannot be marked matched. Use resolved with a note after manual review.',
        }
      const before = {
        paymentStatus: invoice.paymentStatus,
        reconciliationStatus: invoice.reconciliationStatus,
        paidAmount: invoice.paidAmount,
        paymentReference: invoice.paymentReference,
      }
      invoice.paymentStatus = status
      invoice.reconciliationStatus = reconciliation
      invoice.paidAmount = amount.toFixed(2)
      invoice.paidAt = status === 'paid' ? (invoice.paidAt ?? DateTime.now()) : null
      invoice.paymentReference = reference || null
      invoice.notes = note
      await invoice.save()
      await AuditLog.create(
        {
          actorUserId: user.id,
          userId: user.id,
          action: 'shipping_invoice.manual_review',
          entityType: 'shipping_invoices',
          entityId: invoice.id,
          requestId: request.id(),
          beforeState: before,
          afterState: {
            paymentStatus: status,
            reconciliationStatus: reconciliation,
            paidAmount: invoice.paidAmount,
            paymentReference: invoice.paymentReference,
            notes: note,
          },
          metadata: { verification: 'manual' },
        },
        { client: trx }
      )
      return { status: 200, number: invoice.invoiceNumber }
    })
    if (result.status !== 200) {
      if (request.header('x-inertia')) {
        session.flash('error', result.error ?? 'Unable to update invoice.')
        return response.redirect().back()
      }
      return response.status(result.status).send({ error: result.error })
    }
    session.flash(
      'success',
      `Invoice ${result.number} updated locally; no carrier or payment provider was contacted.`
    )
    return response.redirect().back()
  }

  async updateCarrierInvoice(ctx: HttpContext) {
    return this.updateInvoiceStatus(ctx)
  }

  async deleteCarrierInvoice({ response }: HttpContext) {
    return response.conflict({
      error: 'Invoice deletion is disabled to preserve billing history and shipment allocations.',
    })
  }
}
