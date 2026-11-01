import { Job } from '@boringnode/queue'

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
    throw new Error('Marketplace account sync is not configured. No sync was performed.')
  }
}
