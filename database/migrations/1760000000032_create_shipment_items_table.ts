import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipment_items'

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
        .string('shipment_id', 64)
        .notNullable()
        .references('id')
        .inTable('shipments')
        .onDelete('CASCADE')
      table
        .string('order_line_item_id', 64)
        .notNullable()
        .references('id')
        .inTable('order_line_items')
        .onDelete('CASCADE')
      table.integer('quantity_shipped').notNullable()
      table.jsonb('serial_numbers').notNullable().defaultTo('[]')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE shipment_items ADD CONSTRAINT chk_shipment_items_qty_positive CHECK (quantity_shipped > 0)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_shipment_items_shipment_line ON shipment_items (shipment_id, order_line_item_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_shipment_items_order_line ON shipment_items (order_line_item_id)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
