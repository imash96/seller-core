import { BaseSchema } from '@adonisjs/lucid/schema'
import { ShipmentStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'shipments'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE shipment_status AS ENUM ('pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'delayed', 'exception', 'failed', 'returned_to_sender');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table.string('shipment_number', 100).notNullable()
      table.string('carrier_code', 50).notNullable()
      table.string('carrier_name', 150).notNullable()
      table.string('service_level', 100).nullable()
      table.string('tracking_number', 150).nullable()
      table.text('tracking_url').nullable()
      table
        .enu('status', Object.values(ShipmentStatus), {
          useNative: true,
          enumName: 'shipment_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(ShipmentStatus.PENDING)
      table.string('packaging_type', 100).nullable()
      table.decimal('length_cm', 10, 2).nullable()
      table.decimal('width_cm', 10, 2).nullable()
      table.decimal('height_cm', 10, 2).nullable()
      table.decimal('dead_weight_grams', 10, 2).nullable()
      table.decimal('volumetric_weight_grams', 10, 2).nullable()
      table.decimal('billed_weight_grams', 10, 2).nullable()
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

      table.unique(['user_id', 'shipment_number'], { indexName: 'uq_shipments_user_number' })
      table.index(['order_id'], 'idx_shipments_order')
      table.index(['user_id', 'status'], 'idx_shipments_user_status')
      table.index(['tracking_number'], 'idx_shipments_tracking')
      table.check(
        'estimated_shipping_cost >= 0 AND actual_invoiced_cost >= 0',
        [],
        'chk_shipments_costs_non_neg'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS shipment_status;')
    })
  }
}
