import logger from '@adonisjs/core/services/logger'
import type OrderPlaced from '#events/order_placed'
import PrepareFulfillment from '#jobs/prepare_fulfillment'

/**
 * Decouples order placement from fulfillment preparation.
 *
 * The HTTP request only writes the order; the pick/pack preparation (weight
 * roll-up, carrier suggestion, due-date reminder) happens in the queue where it
 * can be retried and where a slow carrier API cannot block the response.
 */
export default class QueueFulfillment {
  async handle(event: InstanceType<typeof OrderPlaced>) {
    const { orderId, orderNumber, userId, requestId } = event.payload
    // An event without an order/user identity cannot be prepared; dropping it here
    // keeps an invalid payload out of the queue instead of poisoning a worker.
    if (!orderId || !userId) {
      logger.warn({ orderNumber }, '[events] fulfillment job skipped: incomplete payload')
      return
    }
    try {
      await PrepareFulfillment.dispatch({ orderId, userId, requestId })
      logger.info({ orderId, orderNumber }, '[events] fulfillment job dispatched')
    } catch (err) {
      logger.warn(
        { err, orderId },
        '[events] fulfillment dispatch failed; queue retry policy applies'
      )
    }
  }
}
