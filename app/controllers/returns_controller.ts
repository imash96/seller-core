import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import ReturnRequest from '#models/return_request'
import RefundTransaction from '#models/refund_transaction'
import { FulfillmentAndReturnsService } from '../services/fulfillment_and_returns_service.js'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createReturnRequestValidator, createRefundValidator } from '#validators/operations'

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
      session.flash('success', `Return Request ${rma.rmaNumber} authorized.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create return request')
    }
    return response.redirect().back()
  }

  async updateReturnStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const rma = await ReturnRequest.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const status = String(request.input('status', 'received'))
    const itemCondition = request.input('itemCondition')
    rma.status = status
    if (itemCondition) {
      rma.itemCondition = String(itemCondition)
    }
    if (status === 'received') {
      rma.receivedAt = DateTime.now()
      rma.quantityReceived = rma.quantityRequested
    } else if (status === 'closed') {
      rma.closedAt = DateTime.now()
    }
    await rma.save()

    session.flash('success', `RMA ${rma.rmaNumber} updated to ${status}.`)
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
