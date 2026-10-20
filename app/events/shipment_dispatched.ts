import { BaseEvent } from '#events/base'

export default class ShipmentDispatched extends BaseEvent {
  constructor(
    public payload: {
      shipmentId: string
      shipmentNumber: string
      orderId: string
      orderNumber: string
      userId: string
      carrierCode: string
      trackingNumber: string | null
      requestId?: string
    }
  ) {
    super()
  }
}
