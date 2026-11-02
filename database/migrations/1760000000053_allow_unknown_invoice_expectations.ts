import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(
      'ALTER TABLE shipping_invoice_lines ALTER COLUMN expected_amount DROP NOT NULL, ALTER COLUMN variance_amount DROP NOT NULL'
    )
  }
  async down() {
    // Older schema cannot represent unknown expectations.
    this.schema.raw(
      // Money columns are PriceMoney JSONB: derive the zero variance in the billed currency.
      `UPDATE shipping_invoice_lines SET expected_amount = billed_amount, variance_amount = jsonb_build_object('currency_code', billed_amount -> 'currency_code', 'amount', 0) WHERE expected_amount IS NULL OR variance_amount IS NULL`
    )
    this.schema.raw(
      'ALTER TABLE shipping_invoice_lines ALTER COLUMN expected_amount SET NOT NULL, ALTER COLUMN variance_amount SET NOT NULL'
    )
  }
}
