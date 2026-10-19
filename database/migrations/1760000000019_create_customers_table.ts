import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
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
        .enum('risk_level', ['low', 'medium', 'high', 'under_review', 'cleared'], {
          enumName: 'customer_risk_level',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('low')
      table.integer('risk_score').notNullable().defaultTo(0)
      table
        .string('merged_into_customer_id', 64)
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
    })

    this.schema.raw(
      'ALTER TABLE customers ADD CONSTRAINT chk_customers_orders_count_nonneg CHECK (orders_count >= 0)'
    )
    this.schema.raw(
      'ALTER TABLE customers ADD CONSTRAINT chk_customers_total_spent_nonneg CHECK (total_spent >= 0)'
    )
    this.schema.raw(
      'ALTER TABLE customers ADD CONSTRAINT chk_customers_risk_score_nonneg CHECK (risk_score >= 0)'
    )
    this.schema.raw('CREATE INDEX idx_customers_user ON customers (user_id)')
    this.schema.raw(
      'CREATE INDEX idx_customers_user_norm_email ON customers (user_id, normalized_email)'
    )
    this.schema.raw(
      'CREATE INDEX idx_customers_user_norm_phone ON customers (user_id, normalized_phone)'
    )
    this.schema.raw(
      'CREATE INDEX idx_customers_user_ext_id ON customers (user_id, external_customer_id)'
    )
    this.schema.raw('CREATE INDEX idx_customers_user_risk ON customers (user_id, risk_level)')
    this.schema.raw(
      'CREATE INDEX idx_customers_user_merged_into ON customers (user_id, merged_into_customer_id)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
