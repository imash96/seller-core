import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import Shipment from '#models/shipment'
import Notification from '#models/notification'
import OutboxEvent from '#models/outbox_event'
import { AuditContext } from './audit_context.js'
import { OutboxEventStatus } from '../enums/index.js'

/** An event type the dispatcher has no publisher for — dead-lettered immediately. */
class UnhandledOutboxEventError extends Error {
  constructor(eventType: string) {
    super(`UNHANDLED_EVENT_TYPE: no publisher is registered for "${eventType}".`)
    this.name = 'UnhandledOutboxEventError'
  }
}

/** One drained event, as reported back to the caller (and the job log). */
export type OutboxPublication = {
  id: string
  eventType: string
  aggregateType: string
  aggregateId: string
  status: 'published' | 'retried' | 'dead_letter'
  error?: string
}

export type OutboxDrainSummary = {
  claimed: number
  published: number
  retried: number
  deadLettered: number
  events: OutboxPublication[]
}

/** Rows stuck in `processing` longer than this are treated as abandoned claims. */
const STALE_CLAIM_MINUTES = 5
/** Retry backoff starts here and doubles per attempt, capped at an hour. */
const BASE_BACKOFF_SECONDS = 30
const MAX_BACKOFF_SECONDS = 3600

/**
 * Drains the transactional outbox.
 *
 * `outbox_events` is written inside the same transaction as the aggregate change,
 * so a crash between "order saved" and "notification delivered" cannot lose the
 * event — this service is the other half of that guarantee:
 *
 *  - **Claim** — rows in `pending`/`failed` whose `next_retry_at` has passed (plus
 *    stale `processing` rows from a worker that died mid-flight) are claimed with
 *    `FOR UPDATE SKIP LOCKED`, so any number of workers can drain concurrently
 *    without publishing the same event twice.
 *  - **Publish** — each `event_type` maps to a publisher below. Publishers are
 *    idempotent (`ensureNotification` dedupes on entity + type), because a claim
 *    can legitimately be re-delivered after a crash.
 *  - **Settle** — success marks the row `published` with `processed_at`; failure
 *    increments `retry_count` and schedules the next attempt with exponential
 *    backoff; the row goes to `dead_letter` once `max_retries` is exhausted, so a
 *    permanently broken event stops consuming a worker slot while staying visible.
 */
export class OutboxService {
  /** Exponential backoff (seconds) before retry number `retryCount`. */
  static backoffSeconds(retryCount: number): number {
    const attempt = Math.max(0, Math.trunc(retryCount))
    return Math.min(MAX_BACKOFF_SECONDS, BASE_BACKOFF_SECONDS * 2 ** attempt)
  }

  /**
   * Claims and publishes up to `limit` due events.
   *
   * Safe to call repeatedly and concurrently; returns a per-event summary rather
   * than throwing, so one poison event never stops the batch.
   */
  static async drain(
    options: {
      limit?: number
      eventTypes?: string[]
      now?: DateTime
    } = {}
  ): Promise<OutboxDrainSummary> {
    const limit = Math.min(Math.max(Math.trunc(Number(options.limit ?? 50)), 1), 500)
    const now = options.now ?? DateTime.now()
    const claimed = await this.claim(limit, options.eventTypes ?? null, now)

    const summary: OutboxDrainSummary = {
      claimed: claimed.length,
      published: 0,
      retried: 0,
      deadLettered: 0,
      events: [],
    }

    for (const event of claimed) {
      const publication = await this.publishOne(event, now)
      summary.events.push(publication)
      if (publication.status === 'published') summary.published += 1
      else if (publication.status === 'retried') summary.retried += 1
      else summary.deadLettered += 1
    }

    if (claimed.length > 0) logger.info(summary, '[outbox] drain finished')
    return summary
  }

  /**
   * Atomically moves due rows to `processing` and returns them.
   *
   * The `UPDATE ... FROM (SELECT ... FOR UPDATE SKIP LOCKED)` shape is what makes
   * the claim exclusive: a competing worker skips locked rows instead of blocking.
   */
  private static async claim(
    limit: number,
    eventTypes: string[] | null,
    now: DateTime
  ): Promise<OutboxEvent[]> {
    const typeFilter = eventTypes?.length
      ? `AND event_type = ANY(ARRAY[${eventTypes.map(() => '?').join(', ')}]::text[])`
      : ''
    const bindings: unknown[] = [
      OutboxEventStatus.PENDING,
      OutboxEventStatus.FAILED,
      now.toSQL(),
      OutboxEventStatus.PROCESSING,
      now.toSQL(),
      STALE_CLAIM_MINUTES,
      ...(eventTypes ?? []),
      limit,
    ]

    const result = await db.rawQuery<{ rows: Record<string, any>[] }>(
      `
      WITH due AS (
        SELECT id
          FROM outbox_events
         WHERE (
                 (
                   status IN (?, ?)
                   AND (next_retry_at IS NULL OR next_retry_at <= ?::timestamptz)
                 )
                 OR (
                   status = ?
                   AND updated_at <= ?::timestamptz - interval '1 minute' * ?
                 )
               )
           ${typeFilter}
         ORDER BY created_at
         LIMIT ?
         FOR UPDATE SKIP LOCKED
      )
      UPDATE outbox_events target
         SET status = '${OutboxEventStatus.PROCESSING}',
             updated_at = now()
        FROM due
       WHERE target.id = due.id
      RETURNING target.*
      `,
      bindings
    )

    return result.rows.map((row) => {
      const event = new OutboxEvent()
      event.merge(row)
      return event
    })
  }

  /** Runs the publisher for one claimed event and settles its row. */
  private static async publishOne(event: OutboxEvent, now: DateTime): Promise<OutboxPublication> {
    const base = {
      id: event.id,
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
    }

    try {
      await this.publish(event)
      await OutboxEvent.query().where('id', event.id).update({
        status: OutboxEventStatus.PUBLISHED,
        processedAt: now,
        lastError: null,
        nextRetryAt: null,
      })
      return { ...base, status: 'published' }
    } catch (err: any) {
      const message = String(err?.message ?? err).slice(0, 1000)
      const retryCount = Number(event.retryCount ?? 0) + 1
      const exhausted =
        err instanceof UnhandledOutboxEventError || retryCount >= Number(event.maxRetries ?? 5)

      if (exhausted) {
        await OutboxEvent.query().where('id', event.id).update({
          status: OutboxEventStatus.DEAD_LETTER,
          retryCount,
          lastError: message,
          nextRetryAt: null,
        })
        logger.error({ ...base, retryCount, message }, '[outbox] event dead-lettered')
        return { ...base, status: 'dead_letter', error: message }
      }

      await OutboxEvent.query()
        .where('id', event.id)
        .update({
          status: OutboxEventStatus.FAILED,
          retryCount,
          lastError: message,
          nextRetryAt: now.plus({ seconds: this.backoffSeconds(retryCount) }),
        })
      logger.warn({ ...base, retryCount, message }, '[outbox] publish failed; retry scheduled')
      return { ...base, status: 'retried', error: message }
    }
  }

  /** Dispatches a claimed event to its publisher. */
  private static async publish(event: OutboxEvent): Promise<void> {
    switch (event.eventType) {
      // Guarantees the seller's feed learns about an order even if the in-process
      // `OrderPlaced` listener failed after commit.
      case 'order.created':
        return await this.publishOrderCreated(event)
      // The customer-facing delivery message is the piece the shipment flow cannot
      // send inside its own transaction.
      case 'shipment.delivered.notify_customer':
        return await this.publishShipmentDelivered(event)
      default:
        throw new UnhandledOutboxEventError(event.eventType)
    }
  }

  private static async publishOrderCreated(event: OutboxEvent): Promise<void> {
    const payload = event.payload ?? {}
    const userId = event.userId ?? payload.userId
    if (!userId) throw new Error('INVALID_PAYLOAD: order.created is missing user_id.')

    const grandTotal = payload.grandTotal ?? null
    const amount = Number(grandTotal?.amount ?? 0)
    const currency = String(grandTotal?.currency_code ?? '')
    await this.ensureNotification(
      userId,
      {
        type: 'order.placed',
        title: `Order ${payload.orderNumber ?? event.aggregateId} recorded`,
        body: `Order total ${amount.toFixed(2)} ${currency}.`,
        entityType: 'orders',
        entityId: event.aggregateId,
      },
      'order.created'
    )
  }

  private static async publishShipmentDelivered(event: OutboxEvent): Promise<void> {
    const payload = event.payload ?? {}
    const userId = event.userId ?? payload.userId
    if (!userId) throw new Error('INVALID_PAYLOAD: delivery notification is missing user_id.')

    const shipmentId = String(payload.shipmentId ?? event.aggregateId)
    await this.ensureNotification(
      userId,
      {
        type: 'shipment.delivered',
        title: `Delivery confirmed for order ${payload.orderNumber ?? ''}`.trim(),
        body: payload.trackingNumber
          ? `Carrier tracking ${payload.trackingNumber} reports the parcel delivered.`
          : 'The carrier reports the parcel delivered.',
        entityType: 'shipments',
        entityId: shipmentId,
      },
      'shipment.delivered.notify_customer'
    )

    // `delivery_notification_sent` is the flag the shipment UI reads; only set it
    // once the delivery message actually exists.
    await AuditContext.run(
      { actorUserId: null, reason: 'shipment.delivery_notified' },
      async (trx) => {
        const shipment = await Shipment.query({ client: trx }).where('id', shipmentId).first()
        if (!shipment || shipment.deliveryNotificationSent) return
        shipment.useTransaction(trx)
        shipment.deliveryNotificationSent = true
        await shipment.save()
      }
    )
  }

  /**
   * Creates the in-app notification unless an identical one already exists.
   *
   * Deduplication is by (`user_id`, `type`, `entity_type`, `entity_id`), which is
   * exactly the identity of "this event was delivered" — so a re-claimed or
   * re-published row cannot fan out twice.
   */
  private static async ensureNotification(
    userId: string,
    draft: {
      type: string
      title: string
      body: string
      entityType: string
      entityId: string
    },
    reason: string
  ): Promise<void> {
    await AuditContext.run({ actorUserId: null, reason: `outbox.${reason}` }, async (trx) => {
      const existing = await Notification.query({ client: trx })
        .where('userId', userId)
        .where('type', draft.type)
        .where('entityType', draft.entityType)
        .where('entityId', draft.entityId)
        .first()
      if (existing) return

      await Notification.create(
        {
          userId,
          type: draft.type,
          title: draft.title,
          body: draft.body,
          entityType: draft.entityType,
          entityId: draft.entityId,
          channel: 'in_app',
          recipientAddress: null,
          isRead: false,
          sentAt: DateTime.now(),
        },
        { client: trx }
      )
    })
  }
}
