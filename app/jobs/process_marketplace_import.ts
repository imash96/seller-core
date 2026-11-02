import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import SyncJob from '#models/sync_job'
import Order from '#models/order'
import { AuditContext } from '../services/audit_context.js'
import { SyncJobStatus } from '../enums/index.js'
import OrderPlaced from '#events/order_placed'
import { OrderService, type CreateOrderInput } from '../services/order_service.js'
import type { MarketplacePlatform } from '../services/order_sync_normalizer_service.js'
import { currencyOf } from '../types/price.js'

/**
 * One canonical order accepted by the bulk importer: exactly the shape
 * `OrderService.createOrder` takes, minus the identity/tenancy fields the job
 * supplies itself.
 */
export type ImportOrderPayload = Omit<
  CreateOrderInput,
  'userId' | 'sellerAccountId' | 'syncJobId' | 'actorUserId'
>

/** Raw marketplace payloads normalized before import (SP-API / eBay / Etsy / MedusaJS). */
type RawMarketplacePayload = {
  platform: MarketplacePlatform
  order: unknown
  /** Amazon SP-API order items response, when taxes/prices live in a second call. */
  orderItems?: unknown
}

type Payload = {
  userId: string
  sellerAccountId?: string | null
  idempotencyKey: string
  /** Canonical Seller Core orders. */
  orders?: ImportOrderPayload[]
  /** Raw marketplace payloads; the platform is auto-detected. */
  platformPayloads?: RawMarketplacePayload[]
  requestId?: string
}

/**
 * Bulk marketplace import — the canonical queue job for this SaaS.
 *
 * Idempotent: same (userId, idempotencyKey) never double-inserts.
 * Retries: transient DB/validation errors are retried via queue retry policy.
 * Events: emits OrderPlaced per successful order so listeners react async.
 */
export default class ProcessMarketplaceImport extends Job<Payload> {
  static queue = 'imports'
  static options = {
    maxRetries: 3,
    timeout: '2m',
  }

  async execute() {
    const payload = this.payload as Payload
    const { userId, sellerAccountId, idempotencyKey, requestId } = payload
    let orders = payload.orders

    // Raw marketplace payloads go through OrderService.importBulkOrders, which
    // auto-detects the platform and records normalization failures per record.
    const payloads = (payload.platformPayloads ?? []).map((raw) => ({
      platform: raw.platform,
      payload: raw.order,
      orderItemsPayload: raw.orderItems,
      sellerAccountId: (sellerAccountId as string | null) ?? null,
    }))

    if (!orders?.length && !payloads.length) {
      throw new Error(
        'VALIDATION_ERROR: a bulk import needs at least one canonical order or platform payload.'
      )
    }

    logger.info(
      { idempotencyKey, count: (orders?.length ?? 0) + payloads.length },
      '[job] processing bulk import'
    )

    const result = await OrderService.importBulkOrders({
      userId,
      actorUserId: userId,
      sellerAccountId: sellerAccountId ?? null,
      idempotencyKey,
      orders,
      payloads,
      correlationId: requestId ?? undefined,
    })

    // Emit per-order events (after commit so listeners see persisted rows)
    for (const orderId of result.createdOrderIds) {
      try {
        const placed = await Order.query()
          .where('id', orderId)
          .preload('sellerAccount', (sellerAccountQuery) =>
            sellerAccountQuery.preload('salesChannel')
          )
          .firstOrFail()
        await OrderPlaced.dispatch({
          orderId: placed.id,
          orderNumber: placed.orderNumber,
          userId: userId,
          customerId: placed.customerId,
          currencyCode: currencyOf(placed.grandTotal),
          grandTotal: placed.grandTotal,
          marketplaceCode: placed.channelCode,
          sellerAccountId: (sellerAccountId as string | null) ?? null,
          requestId,
        })
      } catch (err) {
        // One undeliverable event must not fail an import that already committed.
        // The order row is the source of truth, so log loudly and continue.
        logger.error({ err, orderId }, '[job] order placed event could not be dispatched')
      }
    }

    logger.info(
      {
        idempotencyKey,
        succeeded: result.job?.succeededRecords,
        failed: result.job?.failedRecords,
      },
      '[job] bulk import complete'
    )
  }

  /**
   * Persists the failure on the real `sync_jobs` row so retries and the imports
   * UI see the same history the successful path writes.
   */
  async failed(error: Error) {
    const payload = this.payload as Payload
    logger.error({ err: error, idempotencyKey: payload.idempotencyKey }, '[job] bulk import failed')
    try {
      const job = await SyncJob.query()
        .where('userId', payload.userId)
        .where('idempotencyKey', payload.idempotencyKey)
        .first()
      if (!job) return
      await AuditContext.transaction(async (trx) => {
        job.useTransaction(trx)
        job.status = SyncJobStatus.FAILED
        job.errorSummary = { queue_error: error.message.slice(0, 2000) }
        job.completedAt = DateTime.now()
        await job.save()
      })
    } catch (persistError) {
      logger.warn({ err: persistError }, '[job] failed to persist import failure')
    }
  }
}
