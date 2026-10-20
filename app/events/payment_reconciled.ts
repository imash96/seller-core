import { BaseEvent } from '#events/base'

export default class PaymentReconciled extends BaseEvent {
  constructor(
    public payload: {
      financialTransactionId: string
      userId: string
      status: string
      amount: string
      currencyCode: string
      requestId?: string
    }
  ) {
    super()
  }
}
