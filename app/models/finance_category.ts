import { FinanceCategorySchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import FinancialTransaction from '#models/financial_transaction'

export default class FinanceCategory extends FinanceCategorySchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(category: FinanceCategory) {
    if (!category.id) {
      category.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => FinanceCategory, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof FinanceCategory>

  @hasMany(() => FinanceCategory, { foreignKey: 'parentId' })
  declare children: HasMany<typeof FinanceCategory>

  @hasMany(() => FinancialTransaction, { foreignKey: 'financeCategoryId' })
  declare transactions: HasMany<typeof FinancialTransaction>
}
