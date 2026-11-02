import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import Notification from '#models/notification'
import { AuditContext } from '../services/audit_context.js'
import type OrderPlaced from '#events/order_placed'
import type OrderStatusChanged from '#events/order_status_changed'
import type PaymentReconciled from '#events/payment_reconciled'
import type PaymentReconciliationReversed from '#events/payment_reconciliation_reversed'
import type ShipmentDispatched from '#events/shipment_dispatched'
import type UserOnboarded from '#events/user_onboarded'

type DomainEvent =
  | InstanceType<typeof OrderPlaced>
  | InstanceType<typeof OrderStatusChanged>
  | InstanceType<typeof PaymentReconciled>
  | InstanceType<typeof PaymentReconciliationReversed>
  | InstanceType<typeof ShipmentDispatched>
  | InstanceType<typeof UserOnboarded>

export interface NotificationDraft {
  userId: string
  type: string
  title: string
  body: string
  entityType: string | null
  entityId: string | null
}

/**
 * Turns domain events into persisted in-app notifications.
 *
 * This is the single place where the event bus fans out to the notification feed:
 * every event maps to one `notifications` row (channel `in_app`), written inside an
 * audited transaction so the feed itself is traceable. Outbound delivery is a
 * separate concern (`#jobs/send_notification`), which is why nothing here talks to
 * a network provider — a missing Slack/email credential must never lose an event.
 */
export default class CreateNotification {
  async handle(event: DomainEvent) {
    const draft = this.notificationFor(event)
    if (!draft) return
    try {
      await AuditContext.transaction(async (trx) => {
        await Notification.create(
          {
            userId: draft.userId,
            type: draft.type,
            title: draft.title,
            body: draft.body,
            entityType: draft.entityType,
            entityId: draft.entityId,
            channel: 'in_app',
            recipientAddress: null,
            isRead: false,
            sentAt: DateTime.now(),
          },
          { client: trx }
        )
      })
    } catch (err) {
      // A notification is best-effort: it must never fail the business operation
      // that emitted the event, but the failure stays visible in the log.
      logger.warn({ err, type: draft.type }, '[events] notification not persisted')
    }
  }

  /**
   * Maps an event to the notification it should produce (null = not notifiable).
   *
   * Public and side-effect free so the event → feed mapping is directly testable
   * without writing rows.
   */
  notificationFor(event: DomainEvent): NotificationDraft | null {
    const payload = event.payload as Record<string, any>
    const userId = String(payload.userId ?? '')
    if (!userId) return null

    switch (event.constructor.name) {
      case 'OrderPlaced':
        return {
          userId,
          type: 'order.placed',
          title: `New ${payload.marketplaceCode || 'direct'} order ${payload.orderNumber}`,
          body: `Order total ${Number(payload.grandTotal?.amount ?? 0).toFixed(2)} ${payload.grandTotal?.currency_code ?? ''}.`,
          entityType: 'orders',
          entityId: payload.orderId ?? null,
        }
      case 'OrderStatusChanged':
        return {
          userId,
          type: 'order.status_changed',
          title: `Order ${payload.orderNumber}: ${payload.fromStatus} -> ${payload.toStatus}`,
          body: `Status changed by an operator; the row history is in the audit trail.`,
          entityType: 'orders',
          entityId: payload.orderId ?? null,
        }
      case 'ShipmentDispatched':
        return {
          userId,
          type: 'shipment.dispatched',
          title: `Shipment ${payload.shipmentNumber} dispatched`,
          body: `${String(payload.carrierCode ?? '').toUpperCase()} tracking ${payload.trackingNumber ?? 'n/a'}.`,
          entityType: 'shipments',
          entityId: payload.shipmentId ?? null,
        }
      case 'PaymentReconciled':
        return {
          userId,
          type: 'payment.reconciled',
          title: 'Ledger entry reconciled',
          body: `Matched ${Number(payload.amount?.amount ?? 0).toFixed(2)} ${payload.amount?.currency_code ?? ''} against an external statement.`,
          entityType: 'financial_transactions',
          entityId: payload.financialTransactionId ?? null,
        }
      case 'PaymentReconciliationReversed':
        return {
          userId,
          type: 'payment.reconciliation_reversed',
          title: 'Ledger reconciliation reversed',
          body: `The ${Number(payload.amount?.amount ?? 0).toFixed(2)} ${payload.amount?.currency_code ?? ''} match was reversed: ${payload.reason}`,
          entityType: 'financial_transactions',
          entityId: payload.financialTransactionId ?? null,
        }
      case 'UserOnboarded':
        return {
          userId,
          type: 'user.onboarded',
          title: 'Welcome to Seller Core',
          body: `Account ${payload.email ?? ''} was provisioned by your administrator.`,
          entityType: 'users',
          entityId: userId,
        }
      default:
        return null
    }
  }
}
