import { CustomerSchema } from '#database/schema'
import { beforeCreate, beforeSave, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7, normalizeEmail, normalizePhone } from '../utils/uuid.js'
import User from '#models/user'
import CustomerAddress from '#models/customer_address'
import CustomerRiskSignal from '#models/customer_risk_signal'
import Order from '#models/order'

export default class Customer extends CustomerSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(customer: Customer) {
    if (!customer.id) {
      customer.id = uuidv7()
    }
  }

  @beforeSave()
  static normalizeIdentityFields(customer: Customer) {
    if (customer.$dirty.email !== undefined) {
      customer.normalizedEmail = normalizeEmail(customer.email)
    }
    if (customer.$dirty.phone !== undefined) {
      customer.normalizedPhone = normalizePhone(customer.phone)
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Customer, { foreignKey: 'mergedIntoCustomerId' })
  declare mergedIntoCustomer: BelongsTo<typeof Customer>

  @hasMany(() => CustomerAddress, { foreignKey: 'customerId' })
  declare addresses: HasMany<typeof CustomerAddress>

  @hasMany(() => CustomerRiskSignal, { foreignKey: 'customerId' })
  declare riskSignals: HasMany<typeof CustomerRiskSignal>

  @hasMany(() => Order, { foreignKey: 'customerId' })
  declare orders: HasMany<typeof Order>
}
