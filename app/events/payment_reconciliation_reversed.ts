import { BaseEvent } from '#events/base'
import type { PriceMoney } from '../types/price.js'

/**
 * A manual reconciliation match was reversed, so the ledger entry is again unmatched.
 *
 * Published only after the reversal commits — listeners must never observe a
 * half-written reversal, and a listener failure must not undo the ledger change.
 */
export default class PaymentReconciliationReversed extends BaseEvent {
  constructor(
    public payload: {
      financialTransactionId: string
      userId: string
      status: string
      /** Restored ledger amount as a self-contained `{ currency_code, amount }` object. */
      amount: PriceMoney
      reason: string
      requestId?: string
    }
  ) {
    super()
  }
}
