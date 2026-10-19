import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipping_invoices'

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
        .string('financial_account_id', 64)
        .nullable()
        .references('id')
        .inTable('financial_accounts')
        .onDelete('SET NULL')
      table.string('carrier_code', 50).notNullable()
      table.string('carrier_name', 150).notNullable()
      table.string('invoice_number', 100).notNullable()
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('subtotal_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('tax_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('total_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('paid_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('variance_amount', 14, 2).notNullable().defaultTo(0)
      table
        .enum(
          'payment_status',
          ['unpaid', 'partially_paid', 'paid', 'disputed', 'overdue', 'voided'],
          { enumName: 'invoice_payment_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('unpaid')
      table
        .enum(
          'reconciliation_status',
          ['unreconciled', 'matched', 'variance_detected', 'resolved'],
          { enumName: 'invoice_reconciliation_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('unreconciled')
      table.date('invoice_date').notNullable()
      table.date('due_date').nullable()
      table.timestamp('paid_at', { useTz: true }).nullable()
      table.string('payment_reference', 150).nullable()
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE shipping_invoices ADD CONSTRAINT chk_shipping_invoices_amounts_nonneg CHECK (subtotal_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0 AND paid_amount >= 0)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_shipping_invoices_user_carrier_num ON shipping_invoices (user_id, carrier_code, invoice_number)'
    )
    this.schema.raw(
      'CREATE INDEX idx_shipping_invoices_status ON shipping_invoices (user_id, payment_status)'
    )
    this.schema.raw(
      'CREATE INDEX idx_shipping_invoices_due_date ON shipping_invoices (user_id, due_date)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
