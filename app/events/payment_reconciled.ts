import { BaseEvent } from '#events/base'
import type { PriceMoney } from '../types/price.js'

export default class PaymentReconciled extends BaseEvent {
  constructor(
    public payload: {
      financialTransactionId: string
      userId: string
      status: string
      /** Reconciled amount as a self-contained `{ currency_code, amount }` object. */
      amount: PriceMoney
      requestId?: string
    }
  ) {
    super()
  }
}
