import logger from '@adonisjs/core/services/logger'
import type RiskSignalFlagged from '#events/risk_signal_flagged'

/**
 * When a risk signal is flagged, create a review task asynchronously.
 * Keeps the hot path (order creation) from blocking on task creation.
 */
export default class EnqueueRiskReview {
  async handle(event: InstanceType<typeof RiskSignalFlagged>) {
    const { signalId, customerId, severity } = event.payload
    logger.info({ signalId, customerId, severity }, '[events] risk signal → review task enqueued')

    try {
      const reportMod = await import('#jobs/generate_finance_report')
      const GenerateFinanceReport = reportMod.default
      await (GenerateFinanceReport as any).dispatch({
        context: `risk-review-${signalId}`,
        severity,
        customerId,
      } as any)
    } catch (err) {
      logger.warn({ err, signalId }, '[events] risk review dispatch failed')
    }
  }
}
