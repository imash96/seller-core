/**
 * Variant dimension attributes.
 *
 * `product_variant_attributes` is the relational source of truth for a variant's
 * dimensions; `product_variants.attributes` is a denormalised
 * `{ [dimension]: value }` map of the same data that exists for filtering and for
 * marketplace payloads. Both must always describe the same dimensions.
 *
 * Legacy documents carried derived copies (`color_name`, `color_code`,
 * `color_map`, `size_key`, `size_value`, `size_code`) and a nested `prices`
 * array. Those are rejected everywhere (`is_valid_variant_attributes_map` in the
 * database, this helper in the application) so the duplication cannot return.
 */

/** Keys that duplicate a first-class column or another attribute. */
export const DERIVED_VARIANT_ATTRIBUTE_KEYS = [
  'prices',
  'color_name',
  'color_code',
  'color_map',
  'size_key',
  'size_value',
  'size_code',
] as const

/** Attribute names must be lowercase snake_case dimension names. */
export const VARIANT_ATTRIBUTE_KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/

const DERIVED = new Set<string>(DERIVED_VARIANT_ATTRIBUTE_KEYS)

/**
 * Produces the clean `{ [dimension]: value }` map written to
 * `product_variants.attributes`.
 *
 * Keys are lowercased/trimmed, derived duplicates and empty values are dropped,
 * and every value is coerced to a trimmed string so the column never carries
 * nested objects.
 */
export function normalizeVariantAttributes(
  attributes: Record<string, unknown> | null | undefined
): Record<string, string> {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) return {}
  const result: Record<string, string> = {}
  for (const [rawKey, rawValue] of Object.entries(attributes)) {
    if (rawValue === undefined || rawValue === null) continue
    const key = String(rawKey).trim().toLowerCase()
    if (!key || DERIVED.has(key) || !VARIANT_ATTRIBUTE_KEY_PATTERN.test(key)) continue
    if (typeof rawValue === 'object') continue
    const value = String(rawValue).trim()
    if (!value) continue
    result[key] = value
  }
  return result
}

/** Relational rows (name/value pairs) for a normalised dimension map. */
export function variantAttributePairs(
  attributes: Record<string, unknown> | null | undefined
): Array<{ name: string; value: string }> {
  return Object.entries(normalizeVariantAttributes(attributes)).map(([name, value]) => ({
    name,
    value,
  }))
}
