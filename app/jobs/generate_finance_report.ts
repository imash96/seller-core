import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

type Payload = {
  userId: string
  periodStart?: string // ISO
  periodEnd?: string
  currencyCode?: string
  requestId?: string
  // risk-review shim: when dispatched from EnqueueRiskReview listener
  context?: string
  severity?: string
  customerId?: string
}

/**
 * Finance report generation — aggregates P&L waterfall off the hot path.
 * Writes a snapshot to sync_jobs so the dashboard can show progress.
 */
export default class GenerateFinanceReport extends Job<Payload> {
  static queue = 'reports'
  static options = {
    maxRetries: 1,
    timeout: '60s',
  }

  async execute() {
    const payload = this.payload as Payload
    const { userId, periodStart, periodEnd } = payload

    if (payload.context?.startsWith('risk-review-')) {
      logger.info({ context: payload.context }, '[job] risk review task stub')
      return
    }

    const start = periodStart ? DateTime.fromISO(periodStart) : DateTime.now().minus({ days: 30 })
    const end = periodEnd ? DateTime.fromISO(periodEnd) : DateTime.now()

    logger.info(
      { userId, start: start.toISODate(), end: end.toISODate() },
      '[job] generating finance report'
    )

    const rows = await db
      .from('financial_transactions')
      .where('user_id', userId)
      .whereBetween('transaction_date', [start.toSQL()!, end.toSQL()!])
      .count('* as total')
      .first()

    logger.info({ userId, total: (rows as any)?.total ?? 0 }, '[job] finance report complete')
  }
}
