import { BaseEvent } from '#events/base'

export default class RiskSignalFlagged extends BaseEvent {
  constructor(
    public payload: {
      signalId: string
      customerId: string
      userId: string
      reason: string
      severity: string
      requestId?: string
    }
  ) {
    super()
  }
}
