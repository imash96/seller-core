import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'manual_reconciliations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table
        .string('financial_transaction_id', 64)
        .notNullable()
        .references('id')
        .inTable('financial_transactions')
        .onDelete('RESTRICT')
      table.string('source_reference', 150).notNullable()
      table.decimal('observed_amount', 14, 2).notNullable()
      table.string('currency_code', 3).notNullable()
      table.text('notes').nullable()
      table.string('previous_status', 30).notNullable()
      table
        .string('reconciled_by_user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('reconciled_at', { useTz: true }).notNullable()
      table.timestamp('reversed_at', { useTz: true }).nullable()
      table
        .string('reversed_by_user_id', 64)
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.text('reversal_reason').nullable()
    })
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_active_manual_reconciliation_tx ON manual_reconciliations (financial_transaction_id) WHERE reversed_at IS NULL'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_active_manual_reconciliation_reference ON manual_reconciliations (user_id, lower(source_reference)) WHERE reversed_at IS NULL'
    )
    this.schema.raw(
      'CREATE INDEX idx_manual_reconciliations_user_tx ON manual_reconciliations (user_id, financial_transaction_id)'
    )
    this.schema.raw(
      'ALTER TABLE manual_reconciliations ADD CONSTRAINT chk_manual_reconciliation_amount CHECK (observed_amount >= 0)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
