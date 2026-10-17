import { CustomerRiskSignalSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Customer from '#models/customer'

export default class CustomerRiskSignal extends CustomerRiskSignalSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(signal: CustomerRiskSignal) {
    if (!signal.id) {
      signal.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => User, { foreignKey: 'reviewedByUserId' })
  declare reviewedBy: BelongsTo<typeof User>
}
