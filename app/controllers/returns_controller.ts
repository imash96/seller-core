import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import ReturnRequest from '#models/return_request'
import RefundTransaction from '#models/refund_transaction'
import { FulfillmentAndReturnsService } from '../services/fulfillment_and_returns_service.js'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createReturnRequestValidator, createRefundValidator } from '#validators/operations'
import { ReturnItemCondition } from '../enums/index.js'

const VALID_RETURN_CONDITIONS = new Set<string>(Object.values(ReturnItemCondition))

function normalizeReturnItemCondition(raw?: unknown): string | null {
  if (!raw) return null
  const val = String(raw).trim().toLowerCase()
  if (!val) return null
  if (VALID_RETURN_CONDITIONS.has(val)) return val
  if (val === 'new') return ReturnItemCondition.LIKE_NEW
  if (val === 'defective') return ReturnItemCondition.UNSELLABLE
  return ReturnItemCondition.USED
}

export default class ReturnsController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [returns, refunds, savedViews, sharedLookups] = await Promise.all([
      ReturnRequest.query()
        .where('userId', user.id)
        .preload('order')
        .preload('orderLineItem')
        .preload('customer')
        .orderBy('requestedAt', 'desc')
        .limit(100),
      RefundTransaction.query()
        .where('userId', user.id)
        .preload('order')
        .orderBy('createdAt', 'desc')
        .limit(50),
      WorkspaceLookupService.savedViewsFor(user.id, 'returns'),
      WorkspaceLookupService.lookups(user.id),
    ])
    return inertia.render('returns', {
      ...sharedLookups,
      returnRequests: returns.map((r) => r.serialize()),
      refundTransactions: refunds.map((r) => r.serialize()),
      savedViews,
    })
  }

  async storeReturnRequest({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createReturnRequestValidator)

    try {
      const rma = await FulfillmentAndReturnsService.createReturnRequest({
        userId: user.id,
        orderId: payload.orderId,
        orderLineItemId: payload.orderLineItemId,
        rmaNumber: payload.rmaNumber,
        returnReason: payload.returnReason,
        resolutionType: payload.resolutionType,
        quantityRequested: payload.quantityRequested,
        restockingFeeAmount: payload.restockingFeeAmount ?? 0,
        customerComments: payload.customerComments,
      })

      const normalizedCond = normalizeReturnItemCondition(request.input('itemCondition'))
      if (normalizedCond) {
        rma.itemCondition = normalizedCond
      }
      if (request.input('returnCarrier')) {
        rma.returnCarrier = String(request.input('returnCarrier')).trim()
      }
      if (request.input('returnTrackingNumber')) {
        rma.returnTrackingNumber = String(request.input('returnTrackingNumber')).trim()
      }
      if (request.input('internalNotes')) {
        rma.internalNotes = String(request.input('internalNotes')).trim()
      }
      await rma.save()

      session.flash('success', `Return Request ${rma.rmaNumber} authorized.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create return request')
    }
    return response.redirect().back()
  }

  async storeReturn(ctx: HttpContext) {
    return this.storeReturnRequest(ctx)
  }

  async updateReturnStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const rma = await ReturnRequest.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const status = String(request.input('status', 'received'))
    const normalizedCond = normalizeReturnItemCondition(request.input('itemCondition'))
    rma.status = status
    if (normalizedCond) {
      rma.itemCondition = normalizedCond
    }
    if (request.input('resolutionType')) {
      rma.resolutionType = String(request.input('resolutionType'))
    }
    if (request.input('quantityApproved') !== undefined && request.input('quantityApproved') !== '') {
      rma.quantityApproved = Math.max(0, Number(request.input('quantityApproved')))
    }
    if (request.input('quantityReceived') !== undefined && request.input('quantityReceived') !== '') {
      rma.quantityReceived = Math.max(0, Number(request.input('quantityReceived')))
    }
    if (request.input('refundAmount') !== undefined && request.input('refundAmount') !== '') {
      rma.refundAmount = Math.max(0, Number(request.input('refundAmount'))).toFixed(2)
    }
    if (
      request.input('restockingFeeAmount') !== undefined &&
      request.input('restockingFeeAmount') !== ''
    ) {
      rma.restockingFeeAmount = Math.max(0, Number(request.input('restockingFeeAmount'))).toFixed(2)
    }
    if (
      request.input('returnShippingCost') !== undefined &&
      request.input('returnShippingCost') !== ''
    ) {
      rma.returnShippingCost = Math.max(0, Number(request.input('returnShippingCost'))).toFixed(2)
    }
    if (request.input('returnCarrier') !== undefined) {
      rma.returnCarrier = String(request.input('returnCarrier')).trim() || null
    }
    if (request.input('returnTrackingNumber') !== undefined) {
      rma.returnTrackingNumber = String(request.input('returnTrackingNumber')).trim() || null
    }
    if (request.input('internalNotes') !== undefined) {
      rma.internalNotes = String(request.input('internalNotes')).trim() || null
    }
    if (status === 'received') {
      rma.receivedAt = DateTime.now()
      if (!rma.quantityReceived) {
        rma.quantityReceived = rma.quantityRequested
      }
    } else if (status === 'closed') {
      rma.closedAt = DateTime.now()
    }
    await rma.save()

    session.flash('success', `RMA ${rma.rmaNumber} updated to ${status}.`)
    return response.redirect().back()
  }

  async deleteReturn({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const rma = await ReturnRequest.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()
    await rma.delete()
    session.flash('success', `RMA ${rma.rmaNumber} deleted.`)
    return response.redirect().back()
  }

  async storeRefund({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createRefundValidator)

    try {
      const refund = await FulfillmentAndReturnsService.processRefund({
        userId: user.id,
        actorUserId: user.id,
        orderId: payload.orderId,
        returnRequestId: payload.returnRequestId ?? null,
        refundNumber: payload.refundNumber,
        itemsRefundAmount: payload.itemsRefundAmount,
        shippingRefundAmount: payload.shippingRefundAmount ?? 0,
        taxRefundAmount: payload.taxRefundAmount ?? 0,
        restockingFeeDeducted: payload.restockingFeeDeducted ?? 0,
        reason: payload.reason,
      })
      session.flash(
        'success',
        `Refund ${refund.refundNumber} (${refund.totalRefundAmount} ${refund.currencyCode}) processed and posted to ledger.`
      )
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to process refund')
    }
    return response.redirect().back()
  }
}
