import { BaseSchema } from '@adonisjs/lucid/schema'
import { ShippingChargeType } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'shipping_invoice_lines'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE shipping_charge_type AS ENUM ('base_freight', 'fuel_surcharge', 'residential_fee', 'remote_area_surcharge', 'customs_duty', 'tax', 'signature_fee', 'dimensional_weight_adjustment', 'address_correction', 'return_shipping', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('shipping_invoice_id')
        .notNullable()
        .references('id')
        .inTable('shipping_invoices')
        .onDelete('CASCADE')
      table
        .uuid('shipment_id')
        .nullable()
        .references('id')
        .inTable('shipments')
        .onDelete('SET NULL')
      table.string('tracking_number', 150).nullable()
      table
        .enu('charge_type', Object.values(ShippingChargeType), {
          useNative: true,
          enumName: 'shipping_charge_type',
          existingType: true,
        })
        .notNullable()
        .defaultTo(ShippingChargeType.BASE_FREIGHT)
      table.string('description', 255).nullable()
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('expected_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('billed_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('variance_amount', 14, 2).notNullable().defaultTo(0)
      table.boolean('allow_duplicate_charge').notNullable().defaultTo(false)
      table.text('reconciliation_notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['shipping_invoice_id'], 'idx_shipping_invoice_lines_invoice')
      table.index(['shipment_id', 'charge_type'], 'idx_shipping_invoice_lines_shipment_charge')
      table.check('billed_amount >= 0 AND expected_amount >= 0', [], 'chk_invoice_lines_non_neg')
    })

    // Partial unique index preventing accidental double-billing of the same shipment + charge_type
    // unless allow_duplicate_charge is explicitly true
    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE UNIQUE INDEX uq_shipping_invoice_lines_shipment_charge_once
        ON shipping_invoice_lines (shipment_id, charge_type)
        WHERE shipment_id IS NOT NULL AND allow_duplicate_charge = false;
      `)
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS shipping_charge_type;')
    })
  }
}
