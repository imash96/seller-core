import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import SellerAccount from '#models/seller_account'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createSellerAccountValidator, updateSellerAccountValidator } from '#validators/operations'
import { SellerAccountStatus, HealthStatus } from '../enums/index.js'

export default class SellerAccountsController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [accounts, savedViews, sharedLookups] = await Promise.all([
      SellerAccount.query()
        .where('userId', user.id)
        .preload('salesChannel')
        .orderBy('createdAt', 'desc'),
      WorkspaceLookupService.savedViewsFor(user.id, 'seller_accounts'),
      WorkspaceLookupService.lookups(user),
    ])
    return inertia.render('accounts', {
      ...sharedLookups,
      sellerAccounts: accounts.map((a) => ({
        ...a.serialize(),
        encryptedCredentials: a.encryptedCredentials ? '[AES-256-GCM ENCRYPTED]' : null,
      })),
      savedViews,
    })
  }

  async storeSellerAccount({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createSellerAccountValidator)

    try {
      const account = new SellerAccount()
      account.userId = user.id
      account.salesChannelId = payload.salesChannelId
      account.accountName = payload.accountName
      account.externalSellerId = payload.externalSellerId
      account.marketplaceRegion = payload.marketplaceRegion.toUpperCase()
      account.defaultCurrency = payload.defaultCurrency.toUpperCase()
      account.status = SellerAccountStatus.PENDING_SETUP
      account.healthStatus = HealthStatus.UNKNOWN
      account.rateLimitRpm = payload.rateLimitRpm ?? 60
      if (payload.apiKey || payload.apiSecret) {
        account.setPlainCredentials({
          apiKey: payload.apiKey ?? '',
          apiSecret: payload.apiSecret ?? '',
          rotatedAt: DateTime.now().toISO(),
        })
        account.lastCredentialRotatedAt = DateTime.now()
      }
      await account.save()

      session.flash(
        'success',
        `Seller Account "${account.accountName}" saved with encrypted credentials; connection and sync are not configured.`
      )
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to connect seller account')
    }
    return response.redirect().back()
  }

  async updateSellerAccount({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const payload = await request.validateUsing(updateSellerAccountValidator)
      const account = await SellerAccount.query()
        .where('id', params.id)
        .andWhere('userId', user.id)
        .firstOrFail()
      account.merge(payload)
      await account.save()
      session.flash('success', `Seller account "${account.accountName}" updated.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to update seller account.')
    }
    return response.redirect().back()
  }

  async deleteSellerAccount({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const account = await SellerAccount.query()
        .where('id', params.id)
        .andWhere('userId', user.id)
        .firstOrFail()
      await account.delete()
      session.flash('success', 'Seller account disconnected and removed.')
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to delete seller account.')
    }
    return response.redirect().back()
  }

  async queueSellerSync({ auth, response, session }: HttpContext) {
    auth.getUserOrFail()
    session.flash('error', 'Marketplace account sync is not configured. No sync was performed.')
    return response.redirect().back()
  }
}
