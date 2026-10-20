import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'

type Payload = {
  userId?: string
  to: string
  channel: 'email' | 'webhook' | 'in_app'
  subject: string
  body: string
  metadata?: Record<string, unknown>
}

/**
 * Outbound notification job — email/webhook/in_app.
 * Keeps controllers from awaiting network I/O on the request.
 */
export default class SendNotification extends Job<Payload> {
  static queue = 'notifications'
  static options = {
    maxRetries: 5,
    timeout: '30s',
  }

  async execute() {
    const payload = this.payload as Payload
    const { to, channel, subject } = payload
    logger.info({ to, channel, subject }, '[job] sending notification (stub)')

    // Real impl: Resend / SES / Slack webhook.
    // Throw to trigger retry if downstream is down.
    await new Promise((r) => setTimeout(r, 100))
    logger.info({ to, channel }, '[job] notification sent')
  }
}
