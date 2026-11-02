import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Order from '#models/order'
import CustomerAddress from '#models/customer_address'
import CustomerRiskSignal from '#models/customer_risk_signal'
import { RiskSeverity, RiskSignalType } from '../enums/index.js'

export interface DetectedRiskSignal {
  signalType: string
  severity: string
  reason: string
  evidence: Record<string, unknown>
}

/** Unreviewed states: a signal with one of these is not raised twice. */
const OPEN_REVIEW_STATES = ['pending_review', 'in_review']

/**
 * Explainable risk detection over facts the order already carries.
 *
 * Every rule is deterministic, cheap and states its evidence, because the product
 * promise is "a human reviews a flagged order", never "the system silently
 * blacklists a buyer". Rules:
 *
 *  - `velocity_spike` — 3+ orders for the same buyer inside 24 hours.
 *  - `shared_address_mismatch` — the shipping address is also used by a different
 *    buyer of the same workspace (reseller / drop-ship / fraud ring indicator).
 *
 * A signal is written once per order and type: repeated evaluation of the same
 * order (retries, re-imports) never duplicates review work.
 */
export class RiskSignalService {
  static async evaluateOrder(input: {
    order: Order
    trx: TransactionClientContract
  }): Promise<CustomerRiskSignal[]> {
    const { order, trx } = input
    const detected = await this.detect(order, trx)
    if (detected.length === 0) return []

    const created: CustomerRiskSignal[] = []
    for (const signal of detected) {
      const existing = await CustomerRiskSignal.query({ client: trx })
        .where('userId', order.userId)
        .where('orderId', order.id)
        .where('signalType', signal.signalType)
        .whereIn('reviewStatus', OPEN_REVIEW_STATES)
        .first()
      if (existing) continue

      created.push(
        await CustomerRiskSignal.create(
          {
            userId: order.userId,
            customerId: order.customerId,
            orderId: order.id,
            signalType: signal.signalType,
            severity: signal.severity,
            reviewStatus: 'pending_review',
            reason: signal.reason,
            evidence: signal.evidence,
          },
          { client: trx }
        )
      )
    }
    return created
  }

  /** Runs every rule and returns the ones that fired for this order. */
  private static async detect(
    order: Order,
    trx: TransactionClientContract
  ): Promise<DetectedRiskSignal[]> {
    const signals: DetectedRiskSignal[] = []

    const windowStart = order.orderedAt.minus({ hours: 24 })
    const recentOrders = await Order.query({ client: trx })
      .where('userId', order.userId)
      .where('customerId', order.customerId)
      .whereBetween('orderedAt', [windowStart.toSQL()!, order.orderedAt.toSQL()!])
    if (recentOrders.length >= 3) {
      signals.push({
        signalType: RiskSignalType.VELOCITY_SPIKE,
        severity: RiskSeverity.HIGH,
        reason: `Buyer placed ${recentOrders.length} orders within 24 hours; verify before dispatch.`,
        evidence: {
          orderNumbers: recentOrders.map((o) => o.orderNumber),
          windowHours: 24,
        },
      })
    }

    if (order.shippingAddressId) {
      const address = await CustomerAddress.query({ client: trx })
        .where('userId', order.userId)
        .where('id', order.shippingAddressId)
        .first()
      const fingerprint = address?.addressFingerprint
      if (fingerprint) {
        const sharingAddresses = await CustomerAddress.query({ client: trx })
          .where('userId', order.userId)
          .where('addressFingerprint', fingerprint)
          .whereNot('customerId', order.customerId)
        if (sharingAddresses.length > 0) {
          signals.push({
            signalType: RiskSignalType.SHARED_ADDRESS_MISMATCH,
            severity: RiskSeverity.MEDIUM,
            reason:
              'This shipping address is also registered to a different buyer in the workspace.',
            evidence: {
              sharedWithCustomerIds: [
                ...new Set(sharingAddresses.map((row) => row.customerId)),
              ].slice(0, 10),
              addressFingerprint: fingerprint,
            },
          })
        }
      }
    }

    return signals
  }
}
