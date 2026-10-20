import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipments'

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
      table.string('shipment_number', 100).notNullable()
      table.string('carrier_code', 50).notNullable()
      table.string('carrier_name', 150).notNullable()
      table.string('service_level', 100).nullable()
      table.string('tracking_number', 150).nullable()
      table.string('third_party_tracking_number', 150).nullable()
      table.text('tracking_url').nullable()
      table.text('third_party_tracking_url').nullable()
      table
        .enum(
          'status',
          [
            'pending',
            'label_created',
            'in_transit',
            'out_for_delivery',
            'delivered',
            'delayed',
            'exception',
            'failed',
            'returned_to_sender',
          ],
          { enumName: 'shipment_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('pending')
      table.string('packaging_type', 100).nullable()
      table.decimal('length_cm', 14, 2).nullable()
      table.decimal('width_cm', 14, 2).nullable()
      table.decimal('height_cm', 14, 2).nullable()
      table.decimal('dead_weight_grams', 14, 2).nullable()
      table.decimal('volumetric_weight_grams', 14, 2).nullable()
      table.decimal('billed_weight_grams', 14, 2).nullable()
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('estimated_shipping_cost', 14, 2).notNullable().defaultTo(0)
      table.decimal('actual_invoiced_cost', 14, 2).notNullable().defaultTo(0)
      table.timestamp('shipped_at', { useTz: true }).nullable()
      table.timestamp('estimated_delivery_at', { useTz: true }).nullable()
      table.timestamp('delivered_at', { useTz: true }).nullable()
      table.boolean('delivery_notification_sent').notNullable().defaultTo(false)
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX uq_shipments_user_number ON shipments (user_id, shipment_number)'
    )
    this.schema.raw('CREATE INDEX idx_shipments_order ON shipments (order_id)')
    this.schema.raw('CREATE INDEX idx_shipments_user_status ON shipments (user_id, status)')
    this.schema.raw('CREATE INDEX idx_shipments_tracking ON shipments (tracking_number)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
