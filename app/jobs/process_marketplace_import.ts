import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

type Payload = {
  userId?: string
  sellerAccountId?: string | null
  idempotencyKey?: string
  orders?: Array<{
    orderNumber: string
    externalOrderId?: string | null
    customerFullName: string
    currencyCode?: string
    lines: Array<{ sku: string; title: string; quantityOrdered: number; unitPrice: number }>
  }>
  requestId?: string
  // Fallback: single-order fulfillment context dispatched from event listener
  orderId?: string
  context?: string
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
    const { userId, sellerAccountId, idempotencyKey, orders, requestId } = payload

    if (payload.orderId && !orders) {
      logger.info(
        { orderId: payload.orderId, context: payload.context },
        '[job] fulfillment prep (single order)'
      )
      return
    }

    if (!orders?.length) {
      logger.warn({ idempotencyKey }, '[job] no orders in payload — skipping')
      return
    }

    const { OrderService } = await import('#services/order_service')

    logger.info({ idempotencyKey, count: orders.length }, '[job] processing bulk import')

    const result = await OrderService.importBulkOrders({
      userId: userId!,
      actorUserId: userId!,
      sellerAccountId: (sellerAccountId as string | null) ?? null,
      idempotencyKey: idempotencyKey!,
      orders: orders as any,
    } as any)

    // Emit per-order events (after commit so listeners see persisted rows)
    for (const o of (result as any).createdOrderIds ?? (result as any).createdOrders ?? []) {
      try {
        const orderPlacedMod = await import('#events/order_placed')
        const OrderPlaced = orderPlacedMod.default
        await OrderPlaced.dispatch({
          orderId: (o as any).id,
          orderNumber: (o as any).orderNumber,
          userId: userId!,
          customerId: (o as any).customerId,
          currencyCode: (o as any).currencyCode ?? 'USD',
          totalAmount: String((o as any).totalAmount ?? 0),
          marketplaceCode: (o as any).marketplaceCode ?? 'direct',
          sellerAccountId: (sellerAccountId as string | null) ?? null,
          requestId,
        })
      } catch {}
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

  async failed(error: Error) {
    const payload = this.payload as Payload
    logger.error(
      { err: error, idempotencyKey: (payload as any).idempotencyKey },
      '[job] bulk import failed'
    )
    // Persist failure for ops visibility
    try {
      await db.table('sync_job_errors').insert({
        id: `sje_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sync_job_id: `job_${Date.now()}`,
        error_code: 'QUEUE_FAILED',
        error_message: error.message.slice(0, 2000),
        created_at: new Date().toISOString(),
      })
    } catch {}
  }
}
