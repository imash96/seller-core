import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — `products` becomes a single-source catalogue record.
 *
 *  - `title`, `sub_title` and `description` are the only text fields. The
 *    channel-truncated duplicates (`title_75`, `title_80`, `sub_title_125`,
 *    `short_description`, `extended_description`) are redundant: marketplace
 *    caps are applied at publish time and channel-specific copy lives on
 *    `channel_listings.channel_title` / `channel_listings.channel_description`.
 *  - `metadata` must never shadow first-class columns again, so the duplicated
 *    `prices`, `category_handle` and `resolved_category_handle` keys are removed
 *    and rejected by a CHECK constraint.
 *  - `list_price` / `sale_price` (superseded by the MedusaJS v2 `prices` array)
 *    are dropped if an older database still carries them.
 */
export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    // Marketplace-tuned copy is preserved on the listing, never on the product.
    this.schema.raw(
      `UPDATE channel_listings AS l
          SET channel_title = COALESCE(l.channel_title, p.title_80, p.title_75)
         FROM products AS p
        WHERE l.product_id = p.id AND l.channel_title IS NULL`
    )
    this.schema.raw(
      `UPDATE products
          SET description = COALESCE(NULLIF(short_description, ''), NULLIF(extended_description, ''))
        WHERE description IS NULL AND (short_description IS NOT NULL OR extended_description IS NOT NULL)`
    )

    this.schema.raw('ALTER TABLE products DROP COLUMN IF EXISTS title_75')
    this.schema.raw('ALTER TABLE products DROP COLUMN IF EXISTS title_80')
    this.schema.raw('ALTER TABLE products DROP COLUMN IF EXISTS sub_title_125')
    this.schema.raw('ALTER TABLE products DROP COLUMN IF EXISTS short_description')
    this.schema.raw('ALTER TABLE products DROP COLUMN IF EXISTS extended_description')
    this.schema.raw('ALTER TABLE products DROP COLUMN IF EXISTS list_price')
    this.schema.raw('ALTER TABLE products DROP COLUMN IF EXISTS sale_price')

    this.schema.raw(
      `UPDATE products
          SET metadata = metadata - 'prices' - 'category_handle' - 'resolved_category_handle'
        WHERE jsonb_exists_any(metadata, ARRAY['prices','category_handle','resolved_category_handle'])`
    )
    this.schema.raw(
      `ALTER TABLE products ADD CONSTRAINT chk_products_metadata_no_duplicate_keys
         CHECK (NOT jsonb_exists_any(metadata, ARRAY['prices','category_handle','resolved_category_handle']))`
    )
    this.schema.raw(
      `ALTER TABLE products ADD CONSTRAINT chk_products_metadata_object
         CHECK (jsonb_typeof(metadata) = 'object')`
    )
  }

  async down() {
    this.schema.raw(
      'ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_metadata_no_duplicate_keys'
    )
    this.schema.raw('ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_metadata_object')
    this.schema.alterTable(this.tableName, (table) => {
      table.string('title_75', 255).nullable()
      table.string('title_80', 255).nullable()
      table.string('sub_title_125', 255).nullable()
      table.text('short_description').nullable()
      table.text('extended_description').nullable()
    })
  }
}
