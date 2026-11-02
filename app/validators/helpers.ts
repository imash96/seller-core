import vine from '@vinejs/vine'
import { ENTITY_ID_PATTERN } from '../utils/generate_entity_id.js'

/**
 * Validates an entity identifier: an optionally prefixed ULID
 * (e.g. `01J8ZK9V3Q0M8ZK5N7YQ2W4X6B` or `ord_01J8ZK9V3Q0M8ZK5N7YQ2W4X6B`).
 */
export function objectId() {
  return vine.string().trim().regex(ENTITY_ID_PATTERN)
}

/**
 * Validates a monetary value.
 *
 * A money field is self-contained: it is either a `{ currency_code, amount }`
 * PriceMoney object or a bare number whose currency comes from a sibling input
 * (e.g. the order `currencyCode`). The validator enforces the lower bound on the
 * amount; services coerce the result with `normalizePriceMoney()`, which is the
 * single authority for money semantics (2dp rounding, currency normalization).
 */
export function priceMoney(options: { min?: number } = {}) {
  const min = options.min ?? 0
  return vine.union([
    vine.union.if((value: unknown) => typeof value === 'number', vine.number().min(min)),
    vine.union.else(
      vine.object({
        currency_code: vine.string().trim().fixedLength(3).toUpperCase(),
        amount: vine.number().min(min),
      })
    ),
  ])
}

/** Validates a MedusaJS v2 / multi-currency price array or its JSON string form. */
export function priceArrayJson() {
  return vine.union([
    vine.union.if((value: unknown) => typeof value === 'string', vine.string().trim()),
    vine.union.else(vine.array(vine.any())),
  ])
}
