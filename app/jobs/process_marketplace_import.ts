import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import type { PriceMoney } from '../types/price.js'
import type { MarketplacePlatform } from '../services/order_sync_normalizer_service.js'

/** Canonical order payload accepted by the bulk importer. */
export type ImportOrderPayload = {
  orderNumber: string
  externalOrderId?: string | null
  customerFullName?: string
  currencyCode?: string
  reportingCurrencyCode?: string
  exchangeRate?: number
  /** Currency of the carrier cost when it differs from the order currency. */
  shippingCostCurrencyCode?: string
  lines: Array<{
    sku: string
    title: string
    quantityOrdered: number
    unitPrice: number | PriceMoney
    taxTotal?: number | PriceMoney
    shippingTaxTotal?: number | PriceMoney
    shippingTotal?: number | PriceMoney
    promotionTotal?: number | PriceMoney
    discountTotal?: number | PriceMoney
    unitCost?: number | PriceMoney
    fulfillmentChannel?: 'MFN' | 'AFN' | 'FBA' | '3PL' | 'direct'
  }>
}

/** Raw marketplace payloads normalized before import (SP-API / eBay / Etsy / MedusaJS). */
type RawMarketplacePayload = {
  platform: MarketplacePlatform
  order: unknown
  /** Amazon SP-API order items response, when taxes/prices live in a second call. */
  orderItems?: unknown
}

type Payload = {
  userId?: string
  sellerAccountId?: string | null
  idempotencyKey?: string
  orders?: ImportOrderPayload[]
  platformPayloads?: RawMarketplacePayload[]
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

    if (payload.orderId && !orders) {
      logger.info(
        { orderId: payload.orderId, context: payload.context },
        '[job] fulfillment prep (single order)'
      )
      return
    }

    if (!orders?.length && !payloads.length) {
      logger.warn({ idempotencyKey }, '[job] no orders in payload — skipping')
      return
    }

    const { OrderService } = await import('#services/order_service')

    logger.info(
      { idempotencyKey, count: (orders?.length ?? 0) + payloads.length },
      '[job] processing bulk import'
    )

    const result = await OrderService.importBulkOrders({
      userId: userId!,
      actorUserId: userId!,
      sellerAccountId: (sellerAccountId as string | null) ?? null,
      idempotencyKey: idempotencyKey!,
      orders: orders as any,
      payloads,
    } as any)

    const { default: Order } = await import('#models/order')
    const { currencyOf } = await import('../types/price.js')

    // Emit per-order events (after commit so listeners see persisted rows)
    for (const o of (result as any).createdOrderIds ?? (result as any).createdOrders ?? []) {
      try {
        const orderPlacedMod = await import('#events/order_placed')
        const OrderPlaced = orderPlacedMod.default
        const orderId = typeof o === 'string' ? o : o.id
        const placed = await Order.query()
          .where('id', orderId)
          .preload('sellerAccount', (sellerAccountQuery) =>
            sellerAccountQuery.preload('salesChannel')
          )
          .firstOrFail()
        await OrderPlaced.dispatch({
          orderId: placed.id,
          orderNumber: placed.orderNumber,
          userId: userId!,
          customerId: placed.customerId,
          currencyCode: currencyOf(placed.grandTotal),
          grandTotal: placed.grandTotal,
          marketplaceCode: placed.channelCode,
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
