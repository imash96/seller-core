import vine from '@vinejs/vine'
import { ENTITY_ID_PATTERN } from '../utils/generate_entity_id.js'
import {
  type PriceMoney,
  normalizeCurrencyCode,
  normalizePriceMoneyArray,
  roundMoney,
} from '../types/price.js'

/**
 * Validates an entity identifier: an optionally prefixed ULID
 * (e.g. `01J8ZK9V3Q0M8ZK5N7YQ2W4X6B` or `ord_01J8ZK9V3Q0M8ZK5N7YQ2W4X6B`).
 */
export function objectId() {
  return vine.string().trim().regex(ENTITY_ID_PATTERN)
}

interface PriceMoneySchemaOptions {
  /** Lower bound for `amount` (default 0; use 0.01 for strictly positive money). */
  min?: number
}

const ISO_CURRENCY = vine.string().trim().fixedLength(3).toUpperCase()

/**
 * A single money object, canonicalized before validation.
 *
 * `parse()` runs before any rule, which is where the flat `{ amount, currencyCode }`
 * shape that HTML forms submit is rewritten into `{ currency_code, amount }`. Both
 * shapes therefore produce the exact same validated value and there is no second
 * money representation to reason about downstream.
 */
function canonicalMoneyObject(
  min: number,
  extraProperties: Record<string, any> = {},
  extraAliases: Record<string, string> = {}
) {
  return vine
    .object({
      currency_code: ISO_CURRENCY,
      amount: vine.number().min(min),
      ...extraProperties,
    })
    .parse((value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return value
      const source = value as Record<string, unknown>
      const normalized: Record<string, unknown> = { ...source }
      if (normalized.currency_code === undefined && source.currencyCode !== undefined) {
        normalized.currency_code = source.currencyCode
        delete normalized.currencyCode
      }
      for (const [alias, canonical] of Object.entries(extraAliases)) {
        if (normalized[canonical] === undefined && source[alias] !== undefined) {
          normalized[canonical] = source[alias]
          delete normalized[alias]
        }
      }
      return normalized
    })
}

/**
 * Canonicalizes an already-validated money input.
 *
 * Money reaches the API in three shapes and all of them must end up as the same
 * value object, so services call this (or `normalizePriceMoney`) rather than
 * reading `amount`/`currency_code` off the payload:
 *
 *  - `{ currency_code, amount }` — API clients and the MedusaJS vocabulary;
 *  - `{ amount, currencyCode }`  — flat HTML form fields;
 *  - a bare number or numeric string — a line-level amount that inherits the order
 *    currency (e.g. `unitPrice` inside an order that already has `currencyCode`).
 */
export function normalizeMoneyInput(
  value: unknown,
  fallbackCurrencyCode: string = 'USD'
): PriceMoney {
  const fallback = normalizeCurrencyCode(fallbackCurrencyCode)
  if (value === null || value === undefined) {
    return { currency_code: fallback, amount: 0 }
  }
  if (typeof value === 'number') {
    return { currency_code: fallback, amount: roundMoney(value) }
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('{')) {
      try {
        return normalizeMoneyInput(JSON.parse(trimmed), fallback)
      } catch {
        return { currency_code: fallback, amount: 0 }
      }
    }
    return { currency_code: fallback, amount: roundMoney(trimmed) }
  }
  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>
    return {
      currency_code: normalizeCurrencyCode(
        candidate.currency_code ?? candidate.currencyCode,
        fallback
      ),
      amount: roundMoney(candidate.amount),
    }
  }
  return { currency_code: fallback, amount: 0 }
}

/**
 * Reusable `PriceMoney` schema for a single monetary field.
 *
 * Object inputs are validated strictly (`amount` must be a number ≥ `min` and the
 * currency a 3-letter code) and returned in canonical `{ currency_code, amount }`
 * form, so flat `{ amount, currencyCode }` form fields never leak into services.
 * A bare number stays a number: the payload's sibling `currencyCode` supplies the
 * currency, and `normalizeMoneyInput()` performs that merge.
 */
export function priceMoneySchema(options: PriceMoneySchemaOptions = {}) {
  const min = options.min ?? 0
  return vine.union([
    vine.union.if((value: unknown) => typeof value === 'number', vine.number().min(min)),
    vine.union.else(canonicalMoneyObject(min)),
  ])
}

/** A single entry of a MedusaJS v2 price array (snake_case or flat form). */
function medusaPriceEntry() {
  return canonicalMoneyObject(
    0,
    {
      compare_at_amount: vine.number().min(0).optional().nullable(),
      min_quantity: vine.number().min(1).optional().nullable(),
      max_quantity: vine.number().min(1).optional().nullable(),
      rules: vine.record(vine.string()).optional(),
    },
    {
      compareAtAmount: 'compare_at_amount',
      minQuantity: 'min_quantity',
      maxQuantity: 'max_quantity',
    }
  )
}

/**
 * Reusable MedusaJS v2 price-array schema.
 *
 * Accepts the array itself, its JSON-string form (HTML forms submit textareas) or
 * flat `{ currencyCode, amount }` entries. Output is a plain array of price objects
 * with `currency_code`/`amount`, already deduplicated per currency; an empty array
 * means "derive the array from `priceUsd`" downstream.
 */
export function medusaPricesArraySchema() {
  return vine.union([
    vine.union.if(
      (value: unknown) => typeof value === 'string',
      vine
        .string()
        .trim()
        .transform((value, field) => {
          try {
            const parsed = JSON.parse(value)
            if (!Array.isArray(parsed)) {
              field.report('Price array must be a JSON array of price objects', 'priceArray', field)
              return []
            }
            return normalizePriceMoneyArray(parsed)
          } catch {
            field.report('Price array must be valid JSON', 'priceArray', field)
            return []
          }
        })
    ),
    vine.union.else(vine.array(medusaPriceEntry())),
  ])
}
