import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'finance_categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .string('parent_id', 64)
        .nullable()
        .references('id')
        .inTable('finance_categories')
        .onDelete('SET NULL')
      table.string('name', 150).notNullable()
      table.string('slug', 150).notNullable()
      table
        .enum('category_type', ['income', 'expense'], {
          enumName: 'finance_category_type',
          useNative: true,
          existingType: true,
        })
        .notNullable()
      table
        .enum('data_classification', ['business', 'household_personal'], {
          enumName: 'data_classification',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('business')
      table
        .enum(
          'cost_bucket',
          [
            'cogs',
            'shipping',
            'marketplace_fee',
            'marketing',
            'software',
            'operations',
            'manufacturing',
            'tax',
            'personal',
            'other_income',
            'sales_revenue',
          ],
          { enumName: 'finance_cost_bucket', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('operations')
      table.boolean('is_tax_deductible').notNullable().defaultTo(true)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX uq_finance_categories_user_type_slug ON finance_categories (user_id, category_type, slug)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
