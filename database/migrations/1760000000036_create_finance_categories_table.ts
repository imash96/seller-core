import { BaseSchema } from '@adonisjs/lucid/schema'
import {
  FinanceCategoryType,
  FinanceCostBucket,
  DataClassification,
} from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'finance_categories'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE finance_category_type AS ENUM ('income', 'expense');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE finance_cost_bucket AS ENUM ('cogs', 'shipping', 'marketplace_fee', 'marketing', 'software', 'operations', 'tax', 'personal', 'other_income', 'sales_revenue');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('parent_id')
        .nullable()
        .references('id')
        .inTable('finance_categories')
        .onDelete('SET NULL')
      table.string('name', 150).notNullable()
      table.string('slug', 150).notNullable()
      table
        .enu('category_type', Object.values(FinanceCategoryType), {
          useNative: true,
          enumName: 'finance_category_type',
          existingType: true,
        })
        .notNullable()
      table
        .enu('data_classification', Object.values(DataClassification), {
          useNative: true,
          enumName: 'data_classification',
          existingType: true,
        })
        .notNullable()
        .defaultTo(DataClassification.BUSINESS)
      table
        .enu('cost_bucket', Object.values(FinanceCostBucket), {
          useNative: true,
          enumName: 'finance_cost_bucket',
          existingType: true,
        })
        .notNullable()
        .defaultTo(FinanceCostBucket.OPERATIONS)
      table.boolean('is_tax_deductible').notNullable().defaultTo(true)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'category_type', 'slug'], {
        indexName: 'uq_finance_categories_user_type_slug',
      })
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS finance_category_type;')
      await db.rawQuery('DROP TYPE IF EXISTS finance_cost_bucket;')
    })
  }
}
