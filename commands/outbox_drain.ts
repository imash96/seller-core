import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Publishes due transactional-outbox events.
 *
 * The same work the `outbox` queue worker does, exposed as a one-shot command so a
 * plain cron entry (`* * * * * node ace outbox:drain`) keeps the outbox moving on a
 * deployment that runs no queue worker. Safe to run concurrently: claiming uses
 * `FOR UPDATE SKIP LOCKED`.
 */
export default class OutboxDrain extends BaseCommand {
  static commandName = 'outbox:drain'
  static description = 'Publish due outbox events (pending/failed with an elapsed retry window)'
  static options: CommandOptions = { startApp: true }

  async run() {
    const { OutboxService } = await import('#services/outbox_service')
    const summary = await OutboxService.drain({ limit: 200 })
    this.logger.info(
      `claimed ${summary.claimed} · published ${summary.published} · retried ${summary.retried} · dead-lettered ${summary.deadLettered}`
    )
    for (const event of summary.events) {
      const line = `${event.eventType} (${event.aggregateType}/${event.aggregateId}) → ${event.status}`
      if (event.status === 'published') this.logger.success(line)
      else this.logger.warning(`${line}: ${event.error ?? 'unknown error'}`)
    }
  }
}
