import { BaseEvent } from '#events/base'

type Payload = {
  orderId: string
  orderNumber: string
  userId: string
  customerId: string
  currencyCode: string
  totalAmount: string
  marketplaceCode: string
  sellerAccountId: string | null
  requestId?: string
}

export default class OrderPlaced extends BaseEvent {
  constructor(public payload: Payload) {
    super()
  }
}
