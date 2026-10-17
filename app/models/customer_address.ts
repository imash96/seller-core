import { CustomerAddressSchema } from '#database/schema'
import { beforeCreate, beforeSave, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7, computeAddressFingerprint } from '../utils/uuid.js'
import User from '#models/user'
import Customer from '#models/customer'

export default class CustomerAddress extends CustomerAddressSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(addr: CustomerAddress) {
    if (!addr.id) {
      addr.id = uuidv7()
    }
  }

  @beforeSave()
  static assignFingerprint(addr: CustomerAddress) {
    if (addr.line1 && addr.city && addr.postalCode && addr.countryCode) {
      addr.addressFingerprint = computeAddressFingerprint({
        line1: addr.line1,
        city: addr.city,
        stateProvince: addr.stateProvince,
        postalCode: addr.postalCode,
        countryCode: addr.countryCode,
      })
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof Customer>
}
