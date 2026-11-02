import { BaseEvent } from '#events/base'
import type { PriceMoney } from '../types/price.js'

type Payload = {
  orderId: string
  orderNumber: string
  userId: string
  customerId: string
  /** Order currency, derived from the grand total's own currency code. */
  currencyCode: string
  /** Self-contained grand total; listeners read the amount without a currency column. */
  grandTotal: PriceMoney
  marketplaceCode: string
  sellerAccountId: string | null
  requestId?: string
}

export default class OrderPlaced extends BaseEvent {
  constructor(public payload: Payload) {
    super()
  }
}
