import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_line_items'

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
        .string('product_variant_id', 64)
        .nullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('SET NULL')
      table
        .string('channel_listing_id', 64)
        .nullable()
        .references('id')
        .inTable('channel_listings')
        .onDelete('SET NULL')
      table.string('external_order_line_id', 150).nullable()
      table.string('sku', 120).notNullable()
      table.string('title', 255).notNullable()
      table.string('variant_title', 255).nullable()
      table.string('asin', 20).nullable()
      table.integer('quantity_ordered').notNullable()
      table.integer('quantity_fulfilled').notNullable().defaultTo(0)
      table.integer('quantity_returned').notNullable().defaultTo(0)
      table.integer('quantity_cancelled').notNullable().defaultTo(0)
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('unit_price', 14, 2).notNullable().defaultTo(0)
      table.decimal('discount_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('tax_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('shipping_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('line_total_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('unit_cost_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('marketplace_fee_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('refunded_amount', 14, 2).notNullable().defaultTo(0)
      table
        .enum(
          'fulfillment_status',
          ['unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled', 'returned'],
          { enumName: 'fulfillment_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('unfulfilled')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_qty_ordered_positive CHECK (quantity_ordered > 0)'
    )
    this.schema.raw(
      'ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_qty_bounds CHECK (quantity_fulfilled >= 0 AND quantity_returned >= 0 AND quantity_cancelled >= 0 AND quantity_fulfilled <= quantity_ordered AND quantity_returned <= quantity_ordered AND quantity_cancelled <= quantity_ordered)'
    )
    this.schema.raw(
      'ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_amounts_nonneg CHECK (unit_price >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND shipping_amount >= 0 AND line_total_amount >= 0 AND unit_cost_amount >= 0 AND marketplace_fee_amount >= 0 AND refunded_amount >= 0)'
    )
    this.schema.raw('CREATE INDEX idx_order_line_items_order ON order_line_items (order_id)')
    this.schema.raw(
      'CREATE INDEX idx_order_line_items_variant ON order_line_items (product_variant_id)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_order_line_items_ext_id ON order_line_items (order_id, external_order_line_id) WHERE external_order_line_id IS NOT NULL'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
