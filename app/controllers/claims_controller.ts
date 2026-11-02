import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import MarketplaceClaim from '#models/marketplace_claim'
import Order from '#models/order'
import SellerAccount from '#models/seller_account'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { amountOf, currencyOf, normalizePriceMoney } from '../types/price.js'

export default class ClaimsController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [claims, savedViews, sharedLookups] = await Promise.all([
      MarketplaceClaim.query()
        .where('userId', user.id)
        .preload('order', (q) => q.where('userId', user.id))
        .orderBy('createdAt', 'desc')
        .limit(100),
      WorkspaceLookupService.savedViewsFor(user.id, 'claims'),
      WorkspaceLookupService.lookups(user),
    ])
    return inertia.render('claims', {
      ...sharedLookups,
      claims: claims.map((c) => c.serialize()),
      savedViews,
    })
  }

  async storeMarketplaceClaim({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const orderId = String(request.input('orderId', '')).trim()
      const order = await Order.query()
        .where('userId', user.id)
        .andWhere('id', orderId)
        .firstOrFail()

      const claimNumber = String(request.input('claimNumber', `CLM-${Date.now()}`)).trim()
      const claimType = String(request.input('claimType', 'a_to_z_guarantee'))
      // Claim amounts are self-contained PriceMoney; they may be disputed in another currency.
      const disputedTotal = normalizePriceMoney(
        request.input('disputedAmount') ?? amountOf(order.grandTotal) ?? 50,
        request.input('currencyCode') || currencyOf(order.grandTotal)
      )
      const sellerLiabilityTotal = normalizePriceMoney(
        request.input('sellerLiabilityAmount') ?? 0,
        disputedTotal.currency_code
      )
      const sellerAccountId =
        String(request.input('sellerAccountId', '')).trim() || order.sellerAccountId
      if (sellerAccountId) {
        const seller = await SellerAccount.query()
          .where('userId', user.id)
          .where('id', sellerAccountId)
          .first()
        if (!seller || (order.sellerAccountId && order.sellerAccountId !== seller.id))
          return response.badRequest({
            error: 'Seller account must belong to this user and match the order.',
          })
      }
      const respondByAt = request.input('respondByAt')
      const status = String(request.input('status', 'under_review'))

      // The marketplace account and customer are derived through the order.
      const claim = await MarketplaceClaim.create({
        userId: user.id,
        orderId: order.id,
        claimNumber,
        externalClaimId: request.input('externalClaimId') || claimNumber,
        claimType,
        status,
        disputedTotal,
        sellerLiabilityTotal,
        reason: request.input('reason') || 'Customer marketplace claim opened',
        evidenceSubmitted: { resolutionNotes: request.input('resolutionNotes') || null },
        respondByAt: respondByAt ? DateTime.fromISO(String(respondByAt)) : null,
      })

      session.flash('success', `Marketplace Claim ${claim.claimNumber} logged.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to log marketplace claim')
    }
    return response.redirect().back()
  }

  async storeClaim(ctx: HttpContext) {
    return this.storeMarketplaceClaim(ctx)
  }

  async updateClaimStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const claim = await MarketplaceClaim.query()
        .where('userId', user.id)
        .andWhere('id', params.id)
        .firstOrFail()

      const status = String(request.input('status', 'won'))
      claim.status = status
      if (request.input('claimType')) {
        claim.claimType = String(request.input('claimType'))
      }
      if (request.input('externalClaimId')) {
        claim.externalClaimId = String(request.input('externalClaimId'))
      }
      const disputed = request.input('disputedAmount')
      if (disputed !== undefined && disputed !== null && disputed !== '') {
        claim.disputedTotal = normalizePriceMoney(disputed, claim.disputedTotal.currency_code)
      }
      const liability = request.input('sellerLiabilityAmount')
      if (liability !== undefined && liability !== null && liability !== '') {
        claim.sellerLiabilityTotal = normalizePriceMoney(
          liability,
          claim.sellerLiabilityTotal.currency_code
        )
      }
      if (request.input('reason')) {
        claim.reason = String(request.input('reason'))
      }
      const notes = request.input('resolutionNotes')
      if (notes !== undefined && notes !== null && notes !== '') {
        claim.evidenceSubmitted = {
          ...(claim.evidenceSubmitted || {}),
          resolutionNotes: String(notes),
        }
      }
      const respondByAt = request.input('respondByAt')
      if (respondByAt) claim.respondByAt = DateTime.fromISO(String(respondByAt))
      if (['won', 'lost', 'closed'].includes(status)) {
        claim.resolvedAt = DateTime.now()
      }
      await claim.save()

      session.flash('success', `Claim ${claim.claimNumber} status updated to ${status}.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to update claim')
    }
    return response.redirect().back()
  }

  async updateClaim(ctx: HttpContext) {
    return this.updateClaimStatus(ctx)
  }

  async deleteClaim({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const claim = await MarketplaceClaim.query()
        .where('userId', user.id)
        .andWhere('id', params.id)
        .firstOrFail()
      await claim.delete()
      session.flash('success', `Claim ${claim.claimNumber} deleted.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to delete claim')
    }
    return response.redirect().back()
  }
}
