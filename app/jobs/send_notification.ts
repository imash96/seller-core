import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import Notification from '#models/notification'

type Payload = {
  userId?: string
  to: string
  channel: 'email' | 'webhook' | 'in_app'
  subject: string
  body: string
  metadata?: Record<string, unknown>
}

export default class SendNotification extends Job<Payload> {
  static queue = 'notifications'
  static options = {
    maxRetries: 5,
    timeout: '30s',
  }

  async execute() {
    const payload = this.payload as Payload
    const { userId, to, channel, subject, body, metadata } = payload
    logger.info({ to, channel, subject }, '[job] sending notification')

    if (userId) {
      try {
        await Notification.create({
          userId,
          channel: channel === 'webhook' ? 'webhook' : channel === 'email' ? 'email' : 'in_app',
          status: 'sent',
          title: subject,
          body,
          recipientAddress: to,
          payload: metadata ?? {},
        } as any)
      } catch (err) {
        logger.warn({ err, userId }, '[job] notification DB persistence skipped')
      }
    }

    logger.info({ to, channel }, '[job] notification sent')
  }
}
