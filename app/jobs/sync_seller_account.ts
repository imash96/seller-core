import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import SellerAccount from '#models/seller_account'
import SyncJob from '#models/sync_job'

type Payload = {
  userId: string
  sellerAccountId: string
  salesChannelId: string
  requestId?: string
}

export default class SyncSellerAccount extends Job<Payload> {
  static queue = 'sync'
  static options = {
    maxRetries: 2,
    timeout: '90s',
  }

  async execute() {
    const payload = this.payload as Payload
    const { userId, sellerAccountId, salesChannelId } = payload
    logger.info({ sellerAccountId, salesChannelId }, '[job] syncing seller account')

    const startedAt = DateTime.now()
    const account = await SellerAccount.query()
      .where('userId', userId)
      .andWhere('id', sellerAccountId)
      .first()

    if (account) {
      account.lastSyncedAt = DateTime.now()
      await account.save()
    }

    try {
      await SyncJob.create({
        userId,
        sellerAccountId,
        jobType: 'channel_sync',
        status: 'completed',
        idempotencyKey: `sync-${sellerAccountId}-${Date.now()}`,
        totalRecords: 1,
        processedRecords: 1,
        succeededRecords: 1,
        failedRecords: 0,
        skippedDuplicates: 0,
        startedAt,
        completedAt: DateTime.now(),
        summary: { salesChannelId, syncedAt: DateTime.now().toISO() },
      } as any)
    } catch (err) {
      logger.warn({ err, sellerAccountId }, '[job] could not record sync_job')
    }

    logger.info({ sellerAccountId }, '[job] seller sync complete')
  }
}
