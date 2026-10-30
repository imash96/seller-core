import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import MarketplaceClaim from '#models/marketplace_claim'
import Order from '#models/order'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'

export default class ClaimsController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [claims, savedViews, sharedLookups] = await Promise.all([
      MarketplaceClaim.query()
        .where('userId', user.id)
        .preload('order')
        .orderBy('createdAt', 'desc')
        .limit(100),
      WorkspaceLookupService.savedViewsFor(user.id, 'claims'),
      WorkspaceLookupService.lookups(user.id),
    ])
    return inertia.render('claims', {
      ...sharedLookups,
      claims: claims.map((c) => c.serialize()),
      savedViews,
    })
  }

  async storeMarketplaceClaim({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const orderId = String(request.input('orderId', '')).trim()
    const order = await Order.query().where('userId', user.id).andWhere('id', orderId).firstOrFail()

    const claimNumber = String(request.input('claimNumber', `CLM-${Date.now()}`)).trim()
    const claimType = String(request.input('claimType', 'a_to_z_guarantee'))
    const disputedAmount = Number(request.input('disputedAmount', order.totalAmount || 50))
    const sellerLiabilityAmount = Number(request.input('sellerLiabilityAmount', 0))
    const sellerAccountId =
      String(request.input('sellerAccountId', '')).trim() || order.sellerAccountId
    const respondByAt = request.input('respondByAt')
    const status = String(request.input('status', 'under_review'))

    const claim = await MarketplaceClaim.create({
      userId: user.id,
      orderId: order.id,
      sellerAccountId: sellerAccountId || null,
      claimNumber,
      externalClaimId: request.input('externalClaimId') || claimNumber,
      claimType,
      status,
      currencyCode: request.input('currencyCode') || order.currencyCode,
      disputedAmount: disputedAmount.toFixed(2),
      sellerLiabilityAmount: sellerLiabilityAmount.toFixed(2),
      reason: request.input('reason') || 'Customer marketplace claim opened',
      evidenceSubmitted: { resolutionNotes: request.input('resolutionNotes') || null },
      respondByAt: respondByAt ? DateTime.fromISO(String(respondByAt)) : null,
    })

    session.flash('success', `Marketplace Claim ${claim.claimNumber} logged.`)
    return response.redirect().back()
  }

  async storeClaim(ctx: HttpContext) {
    return this.storeMarketplaceClaim(ctx)
  }

  async updateClaimStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
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
      claim.disputedAmount = Number(disputed).toFixed(2)
    }
    const liability = request.input('sellerLiabilityAmount')
    if (liability !== undefined && liability !== null && liability !== '') {
      claim.sellerLiabilityAmount = Number(liability).toFixed(2)
    }
    if (request.input('reason')) {
      claim.reason = String(request.input('reason'))
    }
    const notes = request.input('resolutionNotes')
    if (notes !== undefined && notes !== null && notes !== '') {
      claim.evidenceSubmitted = { ...(claim.evidenceSubmitted || {}), resolutionNotes: String(notes) }
    }
    const respondByAt = request.input('respondByAt')
    if (respondByAt) claim.respondByAt = DateTime.fromISO(String(respondByAt))
    if (['won', 'lost', 'closed'].includes(status)) {
      claim.resolvedAt = DateTime.now()
    }
    await claim.save()

    session.flash('success', `Claim ${claim.claimNumber} status updated to ${status}.`)
    return response.redirect().back()
  }

  async updateClaim(ctx: HttpContext) {
    return this.updateClaimStatus(ctx)
  }

  async deleteClaim({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const claim = await MarketplaceClaim.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()
    await claim.delete()
    session.flash('success', `Claim ${claim.claimNumber} deleted.`)
    return response.redirect().back()
  }
}
