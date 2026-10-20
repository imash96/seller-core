import { BaseEvent } from '#events/base'

export default class OrderStatusChanged extends BaseEvent {
  constructor(
    public payload: {
      orderId: string
      orderNumber: string
      userId: string
      fromStatus: string
      toStatus: string
      actorUserId: string
      requestId?: string
    }
  ) {
    super()
  }
}
