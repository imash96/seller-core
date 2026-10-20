import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'refund_transactions'

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
        .string('order_id', 64)
        .notNullable()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
      table
        .string('order_line_item_id', 64)
        .nullable()
        .references('id')
        .inTable('order_line_items')
        .onDelete('SET NULL')
      table
        .string('return_request_id', 64)
        .nullable()
        .references('id')
        .inTable('return_requests')
        .onDelete('SET NULL')
      table
        .string('financial_account_id', 64)
        .nullable()
        .references('id')
        .inTable('financial_accounts')
        .onDelete('SET NULL')
      table.string('refund_number', 100).notNullable()
      table.string('external_refund_id', 150).nullable()
      table
        .enum('status', ['pending', 'processed', 'failed', 'cancelled'], {
          enumName: 'refund_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('processed')
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('items_refund_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('shipping_refund_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('tax_refund_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('restocking_fee_deducted', 14, 2).notNullable().defaultTo(0)
      table.decimal('total_refund_amount', 14, 2).notNullable().defaultTo(0)
      table.text('reason').nullable()
      table.timestamp('processed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE refund_transactions ADD CONSTRAINT chk_refund_transactions_amounts_nonneg CHECK (items_refund_amount >= 0 AND shipping_refund_amount >= 0 AND tax_refund_amount >= 0 AND restocking_fee_deducted >= 0 AND total_refund_amount >= 0)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_refund_transactions_user_number ON refund_transactions (user_id, refund_number)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_refund_transactions_order_ext_id ON refund_transactions (order_id, external_refund_id) WHERE external_refund_id IS NOT NULL'
    )
    this.schema.raw('CREATE INDEX idx_refund_transactions_order ON refund_transactions (order_id)')
    this.schema.raw(
      'CREATE INDEX idx_refund_transactions_return ON refund_transactions (return_request_id)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
