import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import Notification from '#models/notification'
import { AuditContext } from '../services/audit_context.js'

/** Columns the `chk_notifications_channel` constraint allows. */
const ALLOWED_CHANNELS = ['in_app', 'email', 'sms'] as const
type NotificationChannel = (typeof ALLOWED_CHANNELS)[number]

type Payload = {
  userId?: string
  /** Recipient address (`email`, phone number, or feed label). */
  to: string
  channel: 'email' | 'webhook' | 'in_app' | 'sms'
  subject: string
  body: string
  /** Notification type key, e.g. `order.delivered` (defaults to `system.message`). */
  type?: string
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Durable outbound notification writer.
 *
 * Every delivery attempt ends up as one `notifications` row, which is what the
 * feed, the retry logic and support tooling read. The row is written inside an
 * audited transaction so a delivery is traceable, and the channel is narrowed to
 * the values the database constraint accepts (`webhook` is a transport detail, not
 * a feed channel, so it is recorded as `in_app` with the callback URL as the
 * recipient address).
 *
 * Amounts/metadata live in `body`/`title`: the notifications table has no JSON
 * payload column, so nothing is stuffed into a non-existent field.
 */
export default class SendNotification extends Job<Payload> {
  static queue = 'notifications'
  static options = {
    maxRetries: 5,
    timeout: '30s',
  }

  async execute() {
    const result = await this.deliver(this.payload as Payload)
    logger.info(result, '[job] notification recorded')
  }

  /** Writes the notification and returns what was persisted (testable directly). */
  async deliver(payload: Payload): Promise<{
    persisted: boolean
    channel: NotificationChannel | null
    type: string
  }> {
    const type = payload.type?.trim() || 'system.message'
    const channel = this.normalizeChannel(payload.channel)

    if (!payload.userId) {
      // Without an owner there is no feed to write to; the address is logged so an
      // operator can still see that the message was produced.
      logger.info(
        { to: payload.to, channel, subject: payload.subject },
        '[job] notification has no owner; not persisted'
      )
      return { persisted: false, channel: null, type }
    }

    await AuditContext.run(
      { actorUserId: payload.userId, reason: 'notification.delivered' },
      async (trx) => {
        await Notification.create(
          {
            userId: payload.userId!,
            type,
            title: payload.subject,
            body: payload.body,
            entityType: payload.entityType ?? null,
            entityId: payload.entityId ?? null,
            channel,
            recipientAddress: payload.to || null,
            isRead: false,
            sentAt: DateTime.now(),
          },
          { client: trx }
        )
      }
    )

    return { persisted: true, channel, type }
  }

  /** Maps the transport name onto a channel the `notifications` CHECK accepts. */
  private normalizeChannel(channel: Payload['channel']): NotificationChannel {
    if (channel === 'webhook') return 'in_app'
    return (ALLOWED_CHANNELS as readonly string[]).includes(channel)
      ? (channel as NotificationChannel)
      : 'in_app'
  }
}
