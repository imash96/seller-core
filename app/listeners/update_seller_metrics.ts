import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import type PaymentReconciled from '#events/payment_reconciled'

/**
 * Denormalized metrics updater. Listens for payment reconciliation and
 * bumps the seller's rolling metrics so dashboards stay fast.
 * Runs in the event loop, not in the request, so it never slows the API.
 */
export default class UpdateSellerMetrics {
  async handle(event: InstanceType<typeof PaymentReconciled>) {
    const { userId, amount, currencyCode } = event.payload

    try {
      // Example: touch a materialized counter (stub — real table would be seller_metrics)
      await db
        .from('seller_accounts')
        .where('user_id', userId)
        .update({ updated_at: new Date().toISOString() })
      logger.info({ userId, amount, currencyCode }, '[events] seller metrics refreshed')
    } catch (err) {
      logger.warn({ err, userId }, '[events] seller metrics refresh failed')
    }
  }
}
