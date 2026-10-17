import { BaseSchema } from '@adonisjs/lucid/schema'
import { InvoicePaymentStatus, InvoiceReconciliationStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'shipping_invoices'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE invoice_payment_status AS ENUM ('unpaid', 'partially_paid', 'paid', 'disputed', 'overdue', 'voided');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE invoice_reconciliation_status AS ENUM ('unreconciled', 'matched', 'variance_detected', 'resolved');
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
        .enu('payment_status', Object.values(InvoicePaymentStatus), {
          useNative: true,
          enumName: 'invoice_payment_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(InvoicePaymentStatus.UNPAID)
      table
        .enu('reconciliation_status', Object.values(InvoiceReconciliationStatus), {
          useNative: true,
          enumName: 'invoice_reconciliation_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(InvoiceReconciliationStatus.UNRECONCILED)
      table.date('invoice_date').notNullable()
      table.date('due_date').nullable()
      table.timestamp('paid_at', { useTz: true }).nullable()
      table.string('payment_reference', 150).nullable()
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'carrier_code', 'invoice_number'], {
        indexName: 'uq_shipping_invoices_user_carrier_num',
      })
      table.index(['user_id', 'payment_status'], 'idx_shipping_invoices_status')
      table.check(
        'subtotal_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0 AND paid_amount >= 0',
        [],
        'chk_shipping_invoices_totals_non_neg'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS invoice_payment_status;')
      await db.rawQuery('DROP TYPE IF EXISTS invoice_reconciliation_status;')
    })
  }
}
