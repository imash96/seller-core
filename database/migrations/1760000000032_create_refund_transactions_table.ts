import { BaseSchema } from '@adonisjs/lucid/schema'
import { RefundStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'refund_transactions'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE refund_status AS ENUM ('pending', 'processed', 'failed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('RESTRICT')
      table
        .uuid('order_line_item_id')
        .nullable()
        .references('id')
        .inTable('order_line_items')
        .onDelete('SET NULL')
      table
        .uuid('return_request_id')
        .nullable()
        .references('id')
        .inTable('return_requests')
        .onDelete('SET NULL')
      table
        .uuid('financial_account_id')
        .nullable()
        .references('id')
        .inTable('financial_accounts')
        .onDelete('SET NULL')
      table.string('refund_number', 100).notNullable()
      table.string('external_refund_id', 150).nullable()
      table
        .enu('status', Object.values(RefundStatus), {
          useNative: true,
          enumName: 'refund_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(RefundStatus.PROCESSED)
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

      table.unique(['user_id', 'refund_number'], {
        indexName: 'uq_refund_transactions_user_number',
      })
      table.index(['order_id'], 'idx_refund_transactions_order')
      table.index(['return_request_id'], 'idx_refund_transactions_return')
      table.check(
        'items_refund_amount >= 0 AND shipping_refund_amount >= 0 AND tax_refund_amount >= 0 AND restocking_fee_deducted >= 0 AND total_refund_amount >= 0',
        [],
        'chk_refund_transactions_amounts_non_neg'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS refund_status;')
    })
  }
}
