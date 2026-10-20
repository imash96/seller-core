import logger from '@adonisjs/core/services/logger'
import type OrderPlaced from '#events/order_placed'
import type OrderStatusChanged from '#events/order_status_changed'
import type ShipmentDispatched from '#events/shipment_dispatched'
import type UserOnboarded from '#events/user_onboarded'

/**
 * Example outbound notifier. In production this would post to Slack,
 * email via Resend/SES, or push via webhooks. Here we log so the
 * event bus is observable without external credentials.
 *
 * Demonstrates that a single listener can handle multiple event shapes
 * via a shared `handle()` contract.
 */
export default class NotifySlack {
  async handle(
    event:
      | InstanceType<typeof OrderPlaced>
      | InstanceType<typeof OrderStatusChanged>
      | InstanceType<typeof ShipmentDispatched>
      | InstanceType<typeof UserOnboarded>
  ) {
    const p: any = (event as any).payload ?? {}
    logger.info(
      { event: event.constructor.name, payload: p },
      `[events] ${event.constructor.name} → slack/webhook (stub)`
    )
  }
}
