import { FinancialAccountSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import FinancialTransaction from '#models/financial_transaction'

export default class FinancialAccount extends FinancialAccountSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(account: FinancialAccount) {
    if (!account.id) {
      account.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @hasMany(() => FinancialTransaction, { foreignKey: 'financialAccountId' })
  declare transactions: HasMany<typeof FinancialTransaction>
}
