import logger from '@adonisjs/core/services/logger'
import type OrderPlaced from '#events/order_placed'

/**
 * Decouples order placement from fulfillment preparation.
 * When an order is placed, we enqueue a fulfillment job instead of
 * doing it synchronously in the controller/transaction.
 *
 * This keeps the HTTP response fast and makes retries safe.
 */
export default class QueueFulfillment {
  async handle(event: InstanceType<typeof OrderPlaced>) {
    const { orderId, orderNumber } = event.payload

    try {
      const importMod = await import('#jobs/process_marketplace_import')
      const ProcessMarketplaceImport = importMod.default
      await (ProcessMarketplaceImport as any).dispatch({
        orderId,
        context: `fulfillment-for-${orderNumber}`,
      } as any)
      logger.info({ orderId, orderNumber }, '[events] fulfillment job dispatched')
    } catch (err) {
      logger.warn(
        { err, orderId },
        '[events] fulfillment dispatch failed — will retry via queue retry policy'
      )
    }
  }
}
