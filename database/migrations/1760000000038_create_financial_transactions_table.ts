import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'financial_transactions'

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
      table
        .string('credit_card_id', 64)
        .nullable()
        .references('id')
        .inTable('credit_cards')
        .onDelete('SET NULL')
      table
        .string('finance_category_id', 64)
        .nullable()
        .references('id')
        .inTable('finance_categories')
        .onDelete('SET NULL')
      table
        .string('seller_account_id', 64)
        .nullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('SET NULL')
      table
        .string('order_id', 64)
        .nullable()
        .references('id')
        .inTable('orders')
        .onDelete('SET NULL')
      table
        .string('product_variant_id', 64)
        .nullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('SET NULL')
      table
        .string('shipping_invoice_id', 64)
        .nullable()
        .references('id')
        .inTable('shipping_invoices')
        .onDelete('SET NULL')
      table.string('reference_number', 100).notNullable()
      table
        .enum(
          'transaction_type',
          [
            'income',
            'expense',
            'transfer',
            'credit_card_payment',
            'refund_payout',
            'marketplace_settlement',
          ],
          { enumName: 'financial_transaction_type', useNative: true, existingType: true }
        )
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
        .enum('status', ['pending', 'posted', 'settled', 'reconciled', 'voided', 'overdue'], {
          enumName: 'financial_transaction_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('posted')
      table.string('description', 255).notNullable()
      table.string('vendor_or_payer', 200).nullable()
      table.string('original_currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('original_amount', 14, 2).notNullable()
      table.decimal('exchange_rate', 18, 8).notNullable().defaultTo(1)
      table.string('reporting_currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('reporting_amount', 14, 2).notNullable()
      table.decimal('tax_amount', 14, 2).notNullable().defaultTo(0)
      table.date('transaction_date').notNullable()
      table.date('conversion_date').nullable()
      table.date('due_date').nullable()
      table.timestamp('settled_at', { useTz: true }).nullable()
      table.timestamp('reconciled_at', { useTz: true }).nullable()
      table.text('receipt_url').nullable()
      table.text('notes').nullable()
      table.jsonb('metadata').notNullable().defaultTo('{}')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE financial_transactions ADD CONSTRAINT chk_financial_transactions_amounts_nonneg CHECK (original_amount >= 0 AND reporting_amount >= 0 AND tax_amount >= 0)'
    )
    this.schema.raw(
      'ALTER TABLE financial_transactions ADD CONSTRAINT chk_financial_transactions_rate_positive CHECK (exchange_rate > 0)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_financial_transactions_user_ref ON financial_transactions (user_id, reference_number)'
    )
    this.schema.raw(
      'CREATE INDEX idx_financial_transactions_user_type_date ON financial_transactions (user_id, transaction_type, transaction_date)'
    )
    this.schema.raw(
      'CREATE INDEX idx_financial_transactions_classification ON financial_transactions (user_id, data_classification)'
    )
    this.schema.raw(
      'CREATE INDEX idx_financial_transactions_order ON financial_transactions (order_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_financial_transactions_seller ON financial_transactions (seller_account_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_financial_transactions_card ON financial_transactions (credit_card_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_financial_transactions_due ON financial_transactions (user_id, status, due_date)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
