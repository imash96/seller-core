import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import { SellerAccountSyncService } from '../services/seller_account_sync_service.js'

type Payload = {
  userId: string
  sellerAccountId: string
  requestId?: string | null
}

/**
 * Queue entry point for the marketplace account sync.
 *
 * All logic lives in `SellerAccountSyncService` so the same behavior can be
 * exercised synchronously (tests, retries, admin tools); the job only adapts it
 * to the queue contract and logs the outcome.
 */
export default class SyncSellerAccount extends Job<Payload> {
  static queue = 'sync'
  static options = {
    maxRetries: 2,
    timeout: '90s',
  }

  async execute() {
    const { userId, sellerAccountId, requestId } = this.payload as Payload
    const result = await SellerAccountSyncService.sync({ userId, sellerAccountId, requestId })
    logger.info(
      { sellerAccountId: result.sellerAccountId, healthStatus: result.healthStatus },
      '[job] seller account synced'
    )
  }
}
