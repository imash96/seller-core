import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — billable weights are derived, not typed in.
 *
 * `volumetric_weight_grams` and `billed_weight_grams` used to be calculated in
 * `FulfillmentAndReturnsService.createShipment`, which meant any other writer
 * (imports, fixtures, SQL backfills) could persist a value that disagreed with
 * the dimensions. Both are now `GENERATED ALWAYS AS (...) STORED` using the IATA
 * volumetric divisor (5000 cm³/kg) that the shipping domain already documents:
 *
 *   volumetric = round(length_cm × width_cm × height_cm / 5, 2)   (cm³ → grams)
 *   billed     = greatest(dead_weight_grams, volumetric)
 */
export default class extends BaseSchema {
  protected tableName = 'shipments'

  async up() {
    this.schema.raw('ALTER TABLE shipments DROP COLUMN IF EXISTS volumetric_weight_grams')
    this.schema.raw('ALTER TABLE shipments DROP COLUMN IF EXISTS billed_weight_grams')

    this.schema.raw(
      `ALTER TABLE shipments
         ADD COLUMN volumetric_weight_grams numeric(14,2)
         GENERATED ALWAYS AS (
           CASE
             WHEN length_cm IS NOT NULL AND width_cm IS NOT NULL AND height_cm IS NOT NULL
               THEN ROUND((length_cm * width_cm * height_cm) / 5, 2)
           END
         ) STORED`
    )
    this.schema.raw(
      `ALTER TABLE shipments
         ADD COLUMN billed_weight_grams numeric(14,2)
         GENERATED ALWAYS AS (
           GREATEST(
             dead_weight_grams,
             CASE
               WHEN length_cm IS NOT NULL AND width_cm IS NOT NULL AND height_cm IS NOT NULL
                 THEN ROUND((length_cm * width_cm * height_cm) / 5, 2)
             END
           )
         ) STORED`
    )

    this.schema.raw(
      `ALTER TABLE shipments ADD CONSTRAINT chk_shipments_dimensions_nonneg
         CHECK (
           (length_cm IS NULL OR length_cm >= 0)
           AND (width_cm IS NULL OR width_cm >= 0)
           AND (height_cm IS NULL OR height_cm >= 0)
           AND (dead_weight_grams IS NULL OR dead_weight_grams >= 0)
         )`
    )
  }

  async down() {
    this.schema.raw(
      'ALTER TABLE shipments DROP CONSTRAINT IF EXISTS chk_shipments_dimensions_nonneg'
    )
    this.schema.raw('ALTER TABLE shipments DROP COLUMN IF EXISTS volumetric_weight_grams')
    this.schema.raw('ALTER TABLE shipments DROP COLUMN IF EXISTS billed_weight_grams')
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('volumetric_weight_grams', 14, 2).nullable()
      table.decimal('billed_weight_grams', 14, 2).nullable()
    })
  }
}
