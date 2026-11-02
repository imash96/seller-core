import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import { OutboxService } from '../services/outbox_service.js'

type Payload = {
  /** Maximum number of due events claimed by this run. */
  limit?: number
  /** Optional allow-list of `event_type`s (e.g. a single-topic worker). */
  eventTypes?: string[]
}

/**
 * Queue entry point for the transactional outbox drain.
 *
 * The job is deliberately thin: claiming, publishing, retry backoff and
 * dead-lettering all live in `OutboxService` so the same drain can be triggered by
 * the worker, a test, or an operator CLI without duplicating policy.
 *
 * A drain never throws for a single poisoned event (the service reports it and
 * schedules a retry / dead-letter), so the queue does not retry whole batches.
 */
export default class DrainOutbox extends Job<Payload> {
  static queue = 'outbox'
  static options = {
    maxRetries: 1,
    timeout: '120s',
  }

  async execute() {
    const payload = (this.payload ?? {}) as Payload
    const summary = await OutboxService.drain({
      limit: payload.limit ?? 50,
      eventTypes: payload.eventTypes,
    })
    logger.info(
      {
        claimed: summary.claimed,
        published: summary.published,
        retried: summary.retried,
        deadLettered: summary.deadLettered,
      },
      '[job] outbox drained'
    )
  }
}
