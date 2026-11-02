import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — `product_variant_attributes` becomes the single relational source of
 * truth for variant dimensions and `product_variants.attributes` is reduced to a
 * clean `{ [dimension]: value }` map.
 *
 * Legacy rows carried derived, denormalised copies inside the JSON document
 * (`color_name`, `color_code`, `color_map`, `size_key`, `size_value`,
 * `size_code` and a nested `prices` array). Those keys are migrated into the
 * relational table, dropped from the JSONB document and rejected by a CHECK so
 * the duplication cannot come back.
 */
const LEGACY_KEYS_SQL = `ARRAY['prices','color_name','color_code','color_map','size_key','size_value','size_code']`

export default class extends BaseSchema {
  protected tableName = 'product_variants'

  async up() {
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION is_valid_variant_attributes_map(val jsonb)
      RETURNS boolean
      LANGUAGE sql
      IMMUTABLE
      AS $$
        SELECT COALESCE(
          jsonb_typeof(val) = 'object'
          AND NOT jsonb_exists_any(val, ${LEGACY_KEYS_SQL})
          AND NOT EXISTS (
            SELECT 1 FROM jsonb_each(val) AS kv(key, value) WHERE jsonb_typeof(kv.value) <> 'string'
          )
          AND NOT EXISTS (
            SELECT 1 FROM jsonb_object_keys(val) AS key WHERE key !~ '^[a-z][a-z0-9_]{0,63}$'
          ),
          false)
      $$`)

    // 1. Promote every scalar dimension (including color/size) into the relational table.
    this.schema.raw(
      `INSERT INTO product_variant_attributes (id, user_id, product_variant_id, attribute_name, attribute_value, created_at)
       SELECT generate_entity_id('pattr'), v.user_id, v.id, kv.key, kv.value, v.created_at
         FROM product_variants AS v
         CROSS JOIN LATERAL jsonb_each_text(v.attributes) AS kv(key, value)
        WHERE kv.value <> ''
          AND NOT jsonb_exists_any(v.attributes, ARRAY['prices'])
          AND kv.key <> ALL (${LEGACY_KEYS_SQL})
       ON CONFLICT (product_variant_id, attribute_name) DO NOTHING`
    )

    // 2. Rebuild the JSONB map from the relational rows (source of truth).
    this.schema.raw(
      `UPDATE product_variants AS v
          SET attributes = COALESCE(
                (SELECT jsonb_object_agg(a.attribute_name, a.attribute_value)
                   FROM product_variant_attributes AS a
                  WHERE a.product_variant_id = v.id),
                '{}'::jsonb)`
    )

    // 3. Prevent the derived duplicates from returning.
    this.schema.raw(
      `ALTER TABLE product_variants ADD CONSTRAINT chk_product_variants_attributes_map
         CHECK (is_valid_variant_attributes_map(attributes))`
    )
  }

  async down() {
    this.schema.raw(
      'ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS chk_product_variants_attributes_map'
    )
    this.schema.raw('DROP FUNCTION IF EXISTS is_valid_variant_attributes_map(jsonb)')
  }
}
