import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { SessionRegistryService } from '../services/session_registry_service.js'

/**
 * Scheduled janitor — purges the single session store and old queue jobs.
 *
 * `sessions` is both the session payload store and the revocation registry, so one
 * DELETE removes expired sessions (they can never be used again) and revoked rows
 * older than a week (kept that long as a forensic trail). Intended to run hourly
 * via `queue.schedule()`.
 */
export default class CleanupExpiredSessions extends Job<void> {
  static queue = 'maintenance'
  static options = { maxRetries: 1, timeout: '30s' } as const

  async execute() {
    const purgedSessions = await SessionRegistryService.purgeExpired()
    logger.info({ purgedSessions }, '[job] expired sessions purged')

    // Prune completed queue jobs older than 7 days (keeps table small)
    try {
      await db
        .from('queue_jobs')
        .where('status', 'completed')
        .where('completed_at', '<', DateTime.now().minus({ days: 7 }).toSQL()!)
        .del()
    } catch {}
  }
}
