import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

/**
 * Scheduled janitor — revokes expired user_sessions and prunes old queue jobs.
 * Intended to run every hour via `queue.schedule()`.
 */
export default class CleanupExpiredSessions extends Job<void> {
  static queue = 'maintenance'
  static options = { maxRetries: 1, timeout: '30s' } as const

  async execute() {
    const now = DateTime.now().toSQL()!

    const expired = await db
      .from('user_sessions')
      .where('expires_at', '<', now)
      .where('is_revoked', false)
      .update({ is_revoked: true, revoked_at: now })

    logger.info({ expired }, '[job] expired sessions revoked')

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
