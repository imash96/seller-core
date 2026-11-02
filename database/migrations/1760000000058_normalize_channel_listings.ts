import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — `channel_listings` hangs off the variant only.
 *
 *  - `product_id` is derivable (`product_variant_id → product_variants.product_id`)
 *    and was a second, potentially divergent source of truth.
 *  - `asin` duplicates `product_variants.asin` / `external_listing_id`; the
 *    identifier is migrated onto the variant (the marketplace catalog identity of
 *    the sellable unit) and removed from the listing.
 */
export default class extends BaseSchema {
  protected tableName = 'channel_listings'

  async up() {
    this.schema.raw(
      `UPDATE product_variants AS v
          SET asin = src.asin
         FROM (
           SELECT DISTINCT ON (product_variant_id) product_variant_id, asin
             FROM channel_listings
            WHERE asin IS NOT NULL AND asin <> ''
            ORDER BY product_variant_id, updated_at DESC
         ) AS src
        WHERE src.product_variant_id = v.id AND (v.asin IS NULL OR v.asin = '')`
    )

    this.schema.raw('ALTER TABLE channel_listings DROP COLUMN IF EXISTS asin')
    this.schema.raw('ALTER TABLE channel_listings DROP COLUMN IF EXISTS product_id')
    this.schema.raw('ALTER TABLE channel_listings DROP COLUMN IF EXISTS currency_code')
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('asin', 20).nullable()
      table.string('product_id', 64).nullable()
    })
    this.schema.raw(
      `UPDATE channel_listings AS l
          SET product_id = v.product_id, asin = COALESCE(l.asin, v.asin)
         FROM product_variants AS v
        WHERE v.id = l.product_variant_id`
    )
  }
}
