import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

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
        .string('seller_account_id', 64)
        .nullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('SET NULL')
      table
        .string('customer_id', 64)
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('RESTRICT')
      table
        .string('shipping_address_id', 64)
        .nullable()
        .references('id')
        .inTable('customer_addresses')
        .onDelete('SET NULL')
      table
        .string('billing_address_id', 64)
        .nullable()
        .references('id')
        .inTable('customer_addresses')
        .onDelete('SET NULL')
      table
        .string('sync_job_id', 64)
        .nullable()
        .references('id')
        .inTable('sync_jobs')
        .onDelete('SET NULL')
      table.string('order_number', 100).notNullable()
      table.string('external_order_id', 150).nullable()
      table
        .enum(
          'source_type',
          ['manual', 'marketplace_import', 'api_bulk', 'webstore', 'replacement'],
          { enumName: 'order_source_type', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('manual')
      table.string('marketplace_code', 50).notNullable().defaultTo('direct')
      table
        .enum(
          'status',
          [
            'draft',
            'pending',
            'confirmed',
            'processing',
            'partially_fulfilled',
            'fulfilled',
            'delivered',
            'cancelled',
            'on_hold',
          ],
          { enumName: 'order_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('pending')
      table
        .enum(
          'payment_status',
          [
            'unpaid',
            'authorized',
            'paid',
            'partially_refunded',
            'refunded',
            'chargeback',
            'voided',
          ],
          { enumName: 'order_payment_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('unpaid')
      table
        .enum(
          'fulfillment_status',
          ['unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled', 'returned'],
          { enumName: 'fulfillment_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('unfulfilled')
      table
        .enum('sync_status', ['not_applicable', 'synced', 'pending', 'error', 'stale'], {
          enumName: 'entity_sync_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('not_applicable')
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.string('reporting_currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('exchange_rate', 18, 8).notNullable().defaultTo(1)
      table.decimal('subtotal_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('tax_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('discount_amount', 14, 2).notNullable().defaultTo(0)
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
      table.text('buyer_notes').nullable()
      table.text('internal_notes').nullable()
      table.timestamp('ordered_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('confirmed_at', { useTz: true }).nullable()
      table.timestamp('shipped_at', { useTz: true }).nullable()
      table.timestamp('delivered_at', { useTz: true }).nullable()
      table.timestamp('cancelled_at', { useTz: true }).nullable()
      table.timestamp('delivery_notification_sent_at', { useTz: true }).nullable()
      table.timestamp('source_created_at', { useTz: true }).nullable()
      table.timestamp('source_updated_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE orders ADD CONSTRAINT chk_orders_amounts_nonneg CHECK (subtotal_amount >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND shipping_charged_amount >= 0 AND total_amount >= 0 AND marketplace_fees_amount >= 0 AND payment_processing_fees_amount >= 0 AND shipping_cost_amount >= 0 AND cogs_amount >= 0 AND refunded_amount >= 0 AND reporting_total_amount >= 0)'
    )
    this.schema.raw(
      'ALTER TABLE orders ADD CONSTRAINT chk_orders_refund_within_total CHECK (refunded_amount <= total_amount)'
    )
    this.schema.raw(
      'ALTER TABLE orders ADD CONSTRAINT chk_orders_exchange_rate_positive CHECK (exchange_rate > 0)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_orders_user_order_number ON orders (user_id, order_number)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_orders_seller_external_id ON orders (seller_account_id, external_order_id) WHERE external_order_id IS NOT NULL'
    )
    this.schema.raw('CREATE INDEX idx_orders_user_status ON orders (user_id, status)')
    this.schema.raw('CREATE INDEX idx_orders_user_ordered_at ON orders (user_id, ordered_at)')
    this.schema.raw('CREATE INDEX idx_orders_customer ON orders (customer_id)')
    this.schema.raw('CREATE INDEX idx_orders_sync_job ON orders (sync_job_id)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
