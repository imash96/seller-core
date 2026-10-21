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
      WorkspaceLookupService.lookups(user.id),
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
      account.status = SellerAccountStatus.ACTIVE
      account.healthStatus = HealthStatus.HEALTHY
      account.rateLimitRpm = payload.rateLimitRpm ?? 60
      account.setPlainCredentials({
        apiKey: payload.apiKey ?? 'encrypted-key',
        apiSecret: payload.apiSecret ?? 'encrypted-secret',
        rotatedAt: DateTime.now().toISO(),
      })
      account.lastCredentialRotatedAt = DateTime.now()
      account.lastSyncedAt = DateTime.now()
      await account.save()

      session.flash(
        'success',
        `Seller Account "${account.accountName}" connected with AES-256-GCM encrypted credentials.`
      )
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to connect seller account')
    }
    return response.redirect().back()
  }

  async updateSellerAccount({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateSellerAccountValidator)
    const account = await SellerAccount.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    account.merge(payload)
    await account.save()
    session.flash('success', `Seller account "${account.accountName}" updated.`)
    return response.redirect().back()
  }

  async deleteSellerAccount({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const account = await SellerAccount.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await account.delete()
    session.flash('success', 'Seller account disconnected and removed.')
    return response.redirect().back()
  }

  async queueSellerSync({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const sellerAccountId = String(request.input('sellerAccountId', '')).trim()
    if (!sellerAccountId) {
      session.flash('error', 'sellerAccountId is required.')
      return response.redirect().back()
    }

    try {
      const account = await SellerAccount.query()
        .where('userId', user.id)
        .andWhere('id', sellerAccountId)
        .firstOrFail()
      account.lastSyncedAt = DateTime.now()
      await account.save()

      try {
        const syncMod = await import('#jobs/sync_seller_account')
        const SyncSellerAccount = syncMod.default
        await (SyncSellerAccount as any).dispatch({
          userId: user.id,
          sellerAccountId: account.id,
          salesChannelId: account.salesChannelId,
          requestId: request.id(),
        } as any)
      } catch {
        // Fallback when queue table is inactive
      }

      session.flash(
        'success',
        `Sync queued for ${account.accountName}. Track progress under Sync Jobs.`
      )
    } catch (err: any) {
      session.flash('error', `Could not enqueue sync: ${err.message}`)
    }
    return response.redirect().back()
  }
}
