import { BaseSchema } from '@adonisjs/lucid/schema'
import { CustomerRiskLevel } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE customer_risk_level AS ENUM ('low', 'medium', 'high', 'under_review', 'cleared');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('external_customer_id', 150).nullable()
      table.string('full_name', 255).notNullable()
      table.string('first_name', 120).nullable()
      table.string('last_name', 120).nullable()
      table.string('company_name', 200).nullable()
      table.string('email', 255).nullable()
      table.string('normalized_email', 255).nullable()
      table.string('proxy_email', 255).nullable()
      table.string('phone', 50).nullable()
      table.string('normalized_phone', 50).nullable()
      table.string('preferred_currency', 3).notNullable().defaultTo('USD')
      table.integer('orders_count').notNullable().defaultTo(0)
      table.decimal('total_spent', 14, 2).notNullable().defaultTo(0)
      table.boolean('is_repeat_customer').notNullable().defaultTo(false)
      table
        .enu('risk_level', Object.values(CustomerRiskLevel), {
          useNative: true,
          enumName: 'customer_risk_level',
          existingType: true,
        })
        .notNullable()
        .defaultTo(CustomerRiskLevel.LOW)
      table.integer('risk_score').notNullable().defaultTo(0)
      table
        .uuid('merged_into_customer_id')
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
      table.text('notes').nullable()
      table.jsonb('metadata').notNullable().defaultTo('{}')
      table.timestamp('first_order_at', { useTz: true }).nullable()
      table.timestamp('last_order_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id'], 'idx_customers_user')
      table.index(['user_id', 'normalized_email'], 'idx_customers_user_norm_email')
      table.index(['user_id', 'normalized_phone'], 'idx_customers_user_norm_phone')
      table.index(['user_id', 'external_customer_id'], 'idx_customers_user_ext_id')
      table.index(['user_id', 'risk_level'], 'idx_customers_user_risk')
      table.check('orders_count >= 0 AND total_spent >= 0', [], 'chk_customers_stats_non_neg')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS customer_risk_level;')
    })
  }
}
