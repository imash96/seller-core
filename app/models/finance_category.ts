/**
 * FinanceCategory — maps to "finance_categories".
 * Hierarchical income/expense categories with cost-bucket classification used by profitability reports.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import FinancialTransaction from './financial_transaction.js'
import AppBaseModel from './base_model.js'

export default class FinanceCategory extends AppBaseModel {
  static readonly table = 'finance_categories'
  static readonly idPrefix = 'fcat'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'parent_id' })
  declare public parentId: string | null

  @column({ columnName: 'name' })
  declare public name: string

  @column({ columnName: 'slug' })
  declare public slug: string

  @column({ columnName: 'category_type' })
  declare public categoryType: string

  @column({ columnName: 'data_classification' })
  declare public dataClassification: string

  @column({ columnName: 'cost_bucket' })
  declare public costBucket: string

  @column({ columnName: 'is_tax_deductible' })
  declare public isTaxDeductible: boolean

  @column({ columnName: 'is_active' })
  declare public isActive: boolean

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => FinanceCategory, { foreignKey: 'parentId' })
  declare public parent: BelongsTo<typeof FinanceCategory>

  @hasMany(() => FinancialTransaction, { foreignKey: 'financeCategoryId' })
  declare public transactions: HasMany<typeof FinancialTransaction>
}
