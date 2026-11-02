import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — carrier invoice lines stop duplicating tracking data.
 *
 * `shipping_invoice_lines.tracking_number` shadowed
 * `shipments.tracking_number` and disagreed with it whenever a carrier
 * re-issued a label. The line now derives tracking through `shipment_id`.
 */
export default class extends BaseSchema {
  protected tableName = 'shipping_invoice_lines'

  async up() {
    this.schema.raw('ALTER TABLE shipping_invoice_lines DROP COLUMN IF EXISTS tracking_number')
    this.schema.raw('ALTER TABLE shipping_invoice_lines DROP COLUMN IF EXISTS currency_code')
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_shipping_invoice_lines_shipment ON shipping_invoice_lines (shipment_id)'
    )
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('tracking_number', 150).nullable()
    })
    this.schema.raw(
      `UPDATE shipping_invoice_lines AS l
          SET tracking_number = s.tracking_number
         FROM shipments AS s
        WHERE s.id = l.shipment_id`
    )
    this.schema.raw('DROP INDEX IF EXISTS idx_shipping_invoice_lines_shipment')
  }
}
