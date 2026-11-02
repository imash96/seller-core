import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — `catalog_items` keeps a single title/description pair, points at the
 * taxonomy relationally and stores free-form domain attributes as JSONB.
 *
 * Removed duplicates:
 *  - `title_75`, `title_80`, `sub_title_125`, `short_description`,
 *    `extended_description` → derived caps belong to the publish pipeline, the
 *    canonical text is `title` / `sub_title` / `description`.
 *  - `category_code`, `category_name`, `category_handle` → the taxonomy lives in
 *    `product_categories` (`resolved_category_id`); unmatched legacy values are
 *    preserved inside `attributes` so nothing is lost.
 *  - `product_code`, `material_code`, `fit_code` → moved into `attributes` as
 *    domain attributes (catalog pricing stays USD-only: `price_tier` +
 *    `base_price_usd`).
 */
export default class extends BaseSchema {
  protected tableName = 'catalog_items'

  async up() {
    // 1. Fill the taxonomy relation from the legacy free-text category.
    this.schema.raw(
      `UPDATE catalog_items AS c
          SET resolved_category_id = pc.id
         FROM product_categories AS pc
        WHERE c.resolved_category_id IS NULL
          AND pc.user_id = c.user_id
          AND (
            lower(pc.name) = lower(COALESCE(NULLIF(c.category_name, ''), '~~none~~'))
            OR (c.category_handle IS NOT NULL AND lower(pc.slug) = lower(c.category_handle))
          )`
    )

    // 2. Preserve the domain attributes that lose their dedicated column.
    this.schema.raw(
      `UPDATE catalog_items
          SET attributes = COALESCE(attributes, '{}'::jsonb)
            || jsonb_strip_nulls(jsonb_build_object(
                 'product_code', NULLIF(product_code, ''),
                 'material_code', NULLIF(material_code, ''),
                 'fit_code', NULLIF(fit_code, ''),
                 'category_code', NULLIF(category_code, ''),
                 'category_name', NULLIF(category_name, ''),
                 'category_handle', NULLIF(category_handle, '')
               ))`
    )

    // 3. Description is canonical.
    this.schema.raw(
      `UPDATE catalog_items
          SET description = COALESCE(NULLIF(short_description, ''), NULLIF(extended_description, ''))
        WHERE description IS NULL AND (short_description IS NOT NULL OR extended_description IS NOT NULL)`
    )

    this.schema.raw('ALTER TABLE catalog_items DROP COLUMN IF EXISTS title_75')
    this.schema.raw('ALTER TABLE catalog_items DROP COLUMN IF EXISTS title_80')
    this.schema.raw('ALTER TABLE catalog_items DROP COLUMN IF EXISTS sub_title_125')
    this.schema.raw('ALTER TABLE catalog_items DROP COLUMN IF EXISTS short_description')
    this.schema.raw('ALTER TABLE catalog_items DROP COLUMN IF EXISTS extended_description')
    this.schema.raw('ALTER TABLE catalog_items DROP COLUMN IF EXISTS category_code')
    this.schema.raw('ALTER TABLE catalog_items DROP COLUMN IF EXISTS category_name')
    this.schema.raw('ALTER TABLE catalog_items DROP COLUMN IF EXISTS product_code')
    this.schema.raw('ALTER TABLE catalog_items DROP COLUMN IF EXISTS category_handle')
    this.schema.raw('ALTER TABLE catalog_items DROP COLUMN IF EXISTS material_code')
    this.schema.raw('ALTER TABLE catalog_items DROP COLUMN IF EXISTS fit_code')

    this.schema.raw(
      `ALTER TABLE catalog_items ADD CONSTRAINT chk_catalog_items_attributes_object
         CHECK (jsonb_typeof(attributes) = 'object')`
    )
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_catalog_items_resolved_category ON catalog_items (resolved_category_id)'
    )
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS idx_catalog_items_resolved_category')
    this.schema.raw(
      'ALTER TABLE catalog_items DROP CONSTRAINT IF EXISTS chk_catalog_items_attributes_object'
    )
    this.schema.alterTable(this.tableName, (table) => {
      table.string('title_75', 255).nullable()
      table.string('title_80', 255).nullable()
      table.string('sub_title_125', 255).nullable()
      table.text('short_description').nullable()
      table.text('extended_description').nullable()
      table.string('category_code', 20).notNullable().defaultTo('CT')
      table.string('category_name', 100).notNullable().defaultTo('Coat')
      table.string('product_code', 20).notNullable().defaultTo('DC')
      table.string('category_handle', 500).nullable()
      table.string('material_code', 20).notNullable().defaultTo('NP')
      table.string('fit_code', 20).notNullable().defaultTo('RG')
    })
    this.schema.raw(
      `UPDATE catalog_items
          SET category_name = COALESCE(attributes->>'category_name', category_name),
              material_code = COALESCE(attributes->>'material_code', material_code),
              fit_code = COALESCE(attributes->>'fit_code', fit_code),
              product_code = COALESCE(attributes->>'product_code', product_code),
              category_code = COALESCE(attributes->>'category_code', category_code),
              category_handle = COALESCE(attributes->>'category_handle', category_handle)`
    )
  }
}
