import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipment_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('shipment_id')
        .notNullable()
        .references('id')
        .inTable('shipments')
        .onDelete('CASCADE')
      table
        .uuid('order_line_item_id')
        .notNullable()
        .references('id')
        .inTable('order_line_items')
        .onDelete('RESTRICT')
      table.integer('quantity_shipped').notNullable()
      table.jsonb('serial_numbers').notNullable().defaultTo('[]')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['shipment_id', 'order_line_item_id'], {
        indexName: 'uq_shipment_items_shipment_line',
      })
      table.index(['order_line_item_id'], 'idx_shipment_items_order_line')
      table.check('quantity_shipped > 0', [], 'chk_shipment_items_qty_positive')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
