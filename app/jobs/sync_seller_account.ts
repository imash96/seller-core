import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'

type Payload = {
  userId: string
  sellerAccountId: string
  salesChannelId: string
  requestId?: string
}

/**
 * Marketplace catalog sync — pulls listings/orders from a seller channel.
 * Scheduled via `queue.schedule().every('30m', ...)` in production.
 */
export default class SyncSellerAccount extends Job<Payload> {
  static queue = 'sync'
  static options = {
    maxRetries: 2,
    timeout: '90s',
  }

  async execute() {
    const payload = this.payload as Payload
    const { sellerAccountId, salesChannelId } = payload
    logger.info({ sellerAccountId, salesChannelId }, '[job] syncing seller account')

    // Stub: real implementation would call SP-API / channel APIs.
    // We simulate latency so queue concurrency can be observed.
    await new Promise((r) => setTimeout(r, 200))

    logger.info({ sellerAccountId }, '[job] seller sync complete (stub)')
  }
}
