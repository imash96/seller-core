import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shipping_invoice_lines'

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
        .string('shipping_invoice_id', 64)
        .notNullable()
        .references('id')
        .inTable('shipping_invoices')
        .onDelete('CASCADE')
      table
        .string('shipment_id', 64)
        .nullable()
        .references('id')
        .inTable('shipments')
        .onDelete('RESTRICT')
      table.string('tracking_number', 150).nullable()
      table
        .enum(
          'charge_type',
          [
            'base_freight',
            'fuel_surcharge',
            'residential_fee',
            'remote_area_surcharge',
            'customs_duty',
            'tax',
            'signature_fee',
            'dimensional_weight_adjustment',
            'address_correction',
            'return_shipping',
            'other',
          ],
          { enumName: 'shipping_charge_type', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('base_freight')
      table.string('description', 255).nullable()
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('expected_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('billed_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('variance_amount', 14, 2).notNullable().defaultTo(0)
      table.boolean('allow_duplicate_charge').notNullable().defaultTo(false)
      table.text('reconciliation_notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX idx_shipping_invoice_lines_invoice ON shipping_invoice_lines (shipping_invoice_id)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_shipping_invoice_lines_shipment_charge ON shipping_invoice_lines (shipment_id, charge_type) WHERE shipment_id IS NOT NULL AND allow_duplicate_charge = false'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
