import { BaseSchema } from '@adonisjs/lucid/schema'
import { FulfillmentStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'order_line_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table
        .uuid('product_variant_id')
        .nullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('SET NULL')
      table
        .uuid('channel_listing_id')
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
        .enu('fulfillment_status', Object.values(FulfillmentStatus), {
          useNative: true,
          enumName: 'fulfillment_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(FulfillmentStatus.UNFULFILLED)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['order_id', 'external_order_line_id'], {
        indexName: 'uq_order_line_items_ext_id',
      })
      table.index(['order_id'], 'idx_order_line_items_order')
      table.index(['product_variant_id'], 'idx_order_line_items_variant')
      table.check(
        'quantity_ordered > 0 AND quantity_fulfilled >= 0 AND quantity_fulfilled <= quantity_ordered AND quantity_returned >= 0 AND quantity_returned <= quantity_ordered AND quantity_cancelled >= 0 AND quantity_cancelled <= quantity_ordered AND unit_price >= 0 AND line_total_amount >= 0',
        [],
        'chk_order_line_items_quantities_and_totals'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
