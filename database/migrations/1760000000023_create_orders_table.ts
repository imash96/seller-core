import { BaseSchema } from '@adonisjs/lucid/schema'
import {
  OrderSourceType,
  OrderStatus,
  OrderPaymentStatus,
  FulfillmentStatus,
  EntitySyncStatus,
} from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE order_source_type AS ENUM ('manual', 'marketplace_import', 'api_bulk', 'webstore', 'replacement');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE order_status AS ENUM ('draft', 'pending', 'confirmed', 'processing', 'partially_fulfilled', 'fulfilled', 'delivered', 'cancelled', 'on_hold');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE order_payment_status AS ENUM ('unpaid', 'authorized', 'paid', 'partially_refunded', 'refunded', 'chargeback', 'voided');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE fulfillment_status AS ENUM ('unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled', 'returned');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('seller_account_id')
        .nullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('SET NULL')
      table
        .uuid('customer_id')
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('RESTRICT')
      table
        .uuid('shipping_address_id')
        .nullable()
        .references('id')
        .inTable('customer_addresses')
        .onDelete('SET NULL')
      table
        .uuid('billing_address_id')
        .nullable()
        .references('id')
        .inTable('customer_addresses')
        .onDelete('SET NULL')
      table
        .uuid('sync_job_id')
        .nullable()
        .references('id')
        .inTable('sync_jobs')
        .onDelete('SET NULL')
      table.string('order_number', 100).notNullable()
      table.string('external_order_id', 150).nullable()
      table
        .enu('source_type', Object.values(OrderSourceType), {
          useNative: true,
          enumName: 'order_source_type',
          existingType: true,
        })
        .notNullable()
        .defaultTo(OrderSourceType.MANUAL)
      table.string('marketplace_code', 50).notNullable().defaultTo('direct')
      table
        .enu('status', Object.values(OrderStatus), {
          useNative: true,
          enumName: 'order_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(OrderStatus.PENDING)
      table
        .enu('payment_status', Object.values(OrderPaymentStatus), {
          useNative: true,
          enumName: 'order_payment_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(OrderPaymentStatus.PAID)
      table
        .enu('fulfillment_status', Object.values(FulfillmentStatus), {
          useNative: true,
          enumName: 'fulfillment_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(FulfillmentStatus.UNFULFILLED)
      table
        .enu('sync_status', Object.values(EntitySyncStatus), {
          useNative: true,
          enumName: 'entity_sync_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(EntitySyncStatus.NOT_APPLICABLE)
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.string('reporting_currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('exchange_rate', 18, 8).notNullable().defaultTo(1.0)
      table.decimal('subtotal_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('discount_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('tax_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('shipping_charged_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('total_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('marketplace_fees_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('payment_processing_fees_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('shipping_cost_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('cogs_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('refunded_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('net_proceeds_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('gross_profit_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('net_profit_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('reporting_total_amount', 14, 2).notNullable().defaultTo(0)
      table.jsonb('shipping_address_snapshot').nullable()
      table.timestamp('delivery_notification_sent_at', { useTz: true }).nullable()
      table.text('buyer_notes').nullable()
      table.text('internal_notes').nullable()
      table.timestamp('ordered_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('confirmed_at', { useTz: true }).nullable()
      table.timestamp('shipped_at', { useTz: true }).nullable()
      table.timestamp('delivered_at', { useTz: true }).nullable()
      table.timestamp('cancelled_at', { useTz: true }).nullable()
      table.timestamp('source_created_at', { useTz: true }).nullable()
      table.timestamp('source_updated_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'order_number'], { indexName: 'uq_orders_user_order_number' })
      table.unique(['seller_account_id', 'external_order_id'], {
        indexName: 'uq_orders_seller_external_id',
      })
      table.index(['user_id', 'status'], 'idx_orders_user_status')
      table.index(['user_id', 'ordered_at'], 'idx_orders_user_ordered_at')
      table.index(['customer_id'], 'idx_orders_customer')
      table.check(
        'exchange_rate > 0 AND subtotal_amount >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND shipping_charged_amount >= 0 AND total_amount >= 0 AND refunded_amount >= 0',
        [],
        'chk_orders_monetary_invariants'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS order_source_type;')
      await db.rawQuery('DROP TYPE IF EXISTS order_status;')
      await db.rawQuery('DROP TYPE IF EXISTS order_payment_status;')
      await db.rawQuery('DROP TYPE IF EXISTS fulfillment_status;')
    })
  }
}
