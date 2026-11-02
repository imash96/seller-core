import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

/**
 * Scheduled janitor.
 *
 * `sessions` holds both the session payload and the revocation registry, so this
 * deletes expired rows (unusable anyway) and revoked rows older than the forensic
 * window, then prunes completed `queue_jobs` history. Wired as a command (cron:
 * `0 * * * * node ace sessions:purge`) so maintenance needs no queue worker.
 */
export default class PurgeSessions extends BaseCommand {
  static commandName = 'sessions:purge'
  static description = 'Delete expired and long-revoked session rows'
  static options: CommandOptions = { startApp: true }

  async run() {
    const { SessionRegistryService } = await import('#services/session_registry_service')
    const purged = await SessionRegistryService.purgeExpired()
    this.logger.success(`purged ${purged} expired session row(s)`)

    // Prune finished queue history older than a week so `queue_jobs` stays small.
    // The queue package owns the table, so a failure is reported, not swallowed.
    try {
      const deleted = await db
        .from('queue_jobs')
        .where('status', 'completed')
        // `finished_at` is a millisecond epoch, not a timestamp column.
        .where('finished_at', '<', DateTime.now().minus({ days: 7 }).toMillis())
        .del()
      this.logger.success(`pruned ${deleted} completed queue job(s)`)
    } catch (error) {
      this.logger.warning(`queue history not pruned: ${(error as Error).message}`)
    }
  }
}
