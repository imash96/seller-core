import { BaseSchema } from '@adonisjs/lucid/schema'
import {
  ReturnStatus,
  ReturnReason,
  ReturnResolutionType,
  ReturnItemCondition,
} from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'return_requests'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE return_status AS ENUM ('requested', 'authorized', 'rejected', 'in_transit', 'received', 'inspected', 'refunded', 'replacement_sent', 'closed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE return_reason AS ENUM ('defective', 'wrong_item', 'damaged_in_transit', 'not_as_described', 'changed_mind', 'size_fit_issue', 'late_delivery', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE return_resolution_type AS ENUM ('refund', 'partial_refund', 'replacement', 'store_credit', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE return_item_condition AS ENUM ('unopened', 'like_new', 'used', 'damaged', 'unsellable');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table
        .uuid('order_line_item_id')
        .notNullable()
        .references('id')
        .inTable('order_line_items')
        .onDelete('RESTRICT')
      table
        .uuid('customer_id')
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('RESTRICT')
      table.string('rma_number', 100).notNullable()
      table.string('external_return_id', 150).nullable()
      table
        .enu('status', Object.values(ReturnStatus), {
          useNative: true,
          enumName: 'return_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(ReturnStatus.REQUESTED)
      table
        .enu('return_reason', Object.values(ReturnReason), {
          useNative: true,
          enumName: 'return_reason',
          existingType: true,
        })
        .notNullable()
        .defaultTo(ReturnReason.OTHER)
      table
        .enu('resolution_type', Object.values(ReturnResolutionType), {
          useNative: true,
          enumName: 'return_resolution_type',
          existingType: true,
        })
        .notNullable()
        .defaultTo(ReturnResolutionType.REFUND)
      table.integer('quantity_requested').notNullable()
      table.integer('quantity_approved').notNullable().defaultTo(0)
      table.integer('quantity_received').notNullable().defaultTo(0)
      table
        .enu('item_condition', Object.values(ReturnItemCondition), {
          useNative: true,
          enumName: 'return_item_condition',
          existingType: true,
        })
        .nullable()
      table.boolean('restock_inventory').notNullable().defaultTo(false)
      table.string('return_carrier', 100).nullable()
      table.string('return_tracking_number', 150).nullable()
      table.text('return_label_url').nullable()
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('return_shipping_cost', 14, 2).notNullable().defaultTo(0)
      table.decimal('restocking_fee_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('refund_amount', 14, 2).notNullable().defaultTo(0)
      table
        .uuid('replacement_order_id')
        .nullable()
        .references('id')
        .inTable('orders')
        .onDelete('SET NULL')
      table.text('customer_comments').nullable()
      table.text('internal_notes').nullable()
      table.jsonb('evidence_images').notNullable().defaultTo('[]')
      table.jsonb('approval_history').notNullable().defaultTo('[]')
      table
        .uuid('reviewed_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('requested_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('authorized_at', { useTz: true }).nullable()
      table.timestamp('received_at', { useTz: true }).nullable()
      table.timestamp('closed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'rma_number'], { indexName: 'uq_return_requests_user_rma' })
      table.index(['order_id'], 'idx_return_requests_order')
      table.index(['order_line_item_id'], 'idx_return_requests_order_line')
      table.index(['user_id', 'status'], 'idx_return_requests_user_status')
      table.check(
        'quantity_requested > 0 AND quantity_approved >= 0 AND quantity_approved <= quantity_requested AND quantity_received >= 0 AND quantity_received <= quantity_requested AND return_shipping_cost >= 0 AND restocking_fee_amount >= 0 AND refund_amount >= 0',
        [],
        'chk_return_requests_quantities_and_amounts'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS return_status;')
      await db.rawQuery('DROP TYPE IF EXISTS return_reason;')
      await db.rawQuery('DROP TYPE IF EXISTS return_resolution_type;')
      await db.rawQuery('DROP TYPE IF EXISTS return_item_condition;')
    })
  }
}
