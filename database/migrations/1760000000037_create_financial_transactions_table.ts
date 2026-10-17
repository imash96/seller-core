import { BaseSchema } from '@adonisjs/lucid/schema'
import {
  FinancialTransactionType,
  FinancialTransactionStatus,
  DataClassification,
} from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'financial_transactions'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE financial_transaction_type AS ENUM ('income', 'expense', 'transfer', 'credit_card_payment', 'refund_payout', 'marketplace_settlement');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE financial_transaction_status AS ENUM ('pending', 'posted', 'settled', 'reconciled', 'voided', 'overdue');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('financial_account_id')
        .nullable()
        .references('id')
        .inTable('financial_accounts')
        .onDelete('SET NULL')
      table
        .uuid('credit_card_id')
        .nullable()
        .references('id')
        .inTable('credit_cards')
        .onDelete('SET NULL')
      table
        .uuid('finance_category_id')
        .nullable()
        .references('id')
        .inTable('finance_categories')
        .onDelete('SET NULL')
      table
        .uuid('seller_account_id')
        .nullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('SET NULL')
      table.uuid('order_id').nullable().references('id').inTable('orders').onDelete('SET NULL')
      table
        .uuid('product_variant_id')
        .nullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('SET NULL')
      table
        .uuid('shipping_invoice_id')
        .nullable()
        .references('id')
        .inTable('shipping_invoices')
        .onDelete('SET NULL')
      table.string('reference_number', 100).notNullable()
      table
        .enu('transaction_type', Object.values(FinancialTransactionType), {
          useNative: true,
          enumName: 'financial_transaction_type',
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
        .enu('status', Object.values(FinancialTransactionStatus), {
          useNative: true,
          enumName: 'financial_transaction_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(FinancialTransactionStatus.POSTED)
      table.string('description', 255).notNullable()
      table.string('vendor_or_payer', 200).nullable()
      table.string('original_currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('original_amount', 14, 2).notNullable()
      table.decimal('exchange_rate', 18, 8).notNullable().defaultTo(1.0)
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

      table.unique(['user_id', 'reference_number'], {
        indexName: 'uq_financial_transactions_user_ref',
      })
      table.index(
        ['user_id', 'transaction_type', 'transaction_date'],
        'idx_financial_transactions_user_type_date'
      )
      table.index(['user_id', 'data_classification'], 'idx_financial_transactions_classification')
      table.index(['order_id'], 'idx_financial_transactions_order')
      table.index(['seller_account_id'], 'idx_financial_transactions_seller')
      table.index(['credit_card_id'], 'idx_financial_transactions_card')
      table.check(
        'original_amount > 0 AND reporting_amount > 0 AND exchange_rate > 0 AND tax_amount >= 0',
        [],
        'chk_financial_transactions_positive_amounts'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS financial_transaction_type;')
      await db.rawQuery('DROP TYPE IF EXISTS financial_transaction_status;')
    })
  }
}
