import { BaseEvent } from '#events/base'

export default class UserOnboarded extends BaseEvent {
  constructor(
    public payload: {
      userId: string
      email: string
      fullName: string
      actorUserId: string
      requestId?: string
    }
  ) {
    super()
  }
}
