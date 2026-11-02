/**
 * Column helpers for JSONB-backed value objects.
 *
 * node-postgres formats JavaScript arrays as PostgreSQL array literals (`{a,b}`)
 * which jsonb columns reject, so every jsonb column goes through `prepare`.
 *
 * Monetary columns get three cooperating hooks:
 *
 *  - `prepare`  – JSON-encodes the value on INSERT/UPDATE;
 *  - `consume`  – normalizes the value the pg driver returns into a canonical
 *                 `PriceMoney` / `MedusaVariantPrice[]` (pg may hand back a JSON
 *                 string, a numeric or an object, depending on the driver path);
 *  - `serialize` – normalizes a value assigned after hydration (e.g. a raw
 *                 number from a service) so serialized output is always typed.
 *
 * A generated accessor is also installed so plain assignments are normalized at
 * write time — `order.grandTotal = 42` stores `{ currency_code, amount }`, never a
 * bare number. Reads keep returning whatever `$attributes` holds (Lucid's proxy
 * resolves columns from `$attributes`), which `consume` already normalized.
 */
import { column } from '@adonisjs/lucid/orm'
import type { LucidRow, ModelColumnOptions } from '@adonisjs/lucid/types/model'
import {
  type MedusaVariantPrice,
  type PriceMoney,
  normalizeMoneyEntryArray,
  normalizeNullablePriceMoney,
  normalizePriceMoney,
  normalizePriceMoneyArray,
} from '../types/price.js'

/** Serializes any jsonb-bound value; strings pass through untouched. */
export function prepareJson(value: unknown): string | null | undefined {
  if (value === null || value === undefined) {
    return value as null | undefined
  }
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}

/** Parses a jsonb value that may arrive as a JSON string, object or null. */
export function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

/** Consumes a non-nullable money column into a canonical PriceMoney. */
export function consumePriceMoney(value: unknown): PriceMoney {
  return normalizePriceMoney(parseJson(value) ?? value)
}

/** Consumes a nullable money column; empty/invalid values collapse to `null`. */
export function consumeNullablePriceMoney(value: unknown): PriceMoney | null {
  const parsed = parseJson(value)
  return normalizeNullablePriceMoney(parsed ?? value)
}

/** Consumes a MedusaJS v2 price array (or its JSON string form). */
export function consumePriceArray(value: unknown): MedusaVariantPrice[] {
  const parsed = parseJson(value)
  return normalizePriceMoneyArray(parsed ?? value)
}

export type MoneyColumnKind = 'money' | 'nullableMoney' | 'priceArray'

const CONSUMERS: Record<MoneyColumnKind, (value: unknown) => unknown> = {
  money: consumePriceMoney,
  nullableMoney: consumeNullablePriceMoney,
  priceArray: consumePriceArray,
}

const SERIALIZERS: Record<MoneyColumnKind, (value: unknown) => unknown> = {
  money: (value) => normalizePriceMoney(value),
  nullableMoney: (value) => normalizeNullablePriceMoney(value),
  priceArray: (value) => {
    const normalized = normalizePriceMoneyArray(value)
    return Array.isArray(value) && value.length === 0 ? [] : normalized
  },
}

/** Assignment-time normalization for the three money shapes. */
function normalizeAssignment(kind: MoneyColumnKind, value: unknown): unknown {
  if (value === null || value === undefined) return value
  return CONSUMERS[kind](value)
}

/**
 * Defines a "money" column decorator.
 *
 * `prepare`/`consume`/`serialize`/`meta` are wired to the same kind so the base
 * model can normalize attributes without keeping a parallel list of column names.
 */
function moneyDecorator(kind: MoneyColumnKind, options: { columnName?: string } = {}) {
  const definition = column({
    ...options,
    prepare: prepareJson,
    consume: (value: unknown) => CONSUMERS[kind](value),
    serialize: (value: unknown) => SERIALIZERS[kind](value),
    meta: { money: kind },
  }) as (target: any, propertyName: string) => void

  return (target: any, propertyName: string) => {
    definition(target, propertyName)
    // A setter makes Lucid's proxy route assignments through it, so the value
    // stored in `$attributes` is always canonical. Reads still fall through to
    // `$attributes` (no getter), keeping `$dirty` diffs object-based.
    Object.defineProperty(target, propertyName, {
      configurable: true,
      enumerable: false,
      set(this: LucidRow, value: unknown) {
        this.$setAttribute(propertyName, normalizeAssignment(kind, value) as any)
      },
    })
  }
}

/** Non-nullable `PriceMoney` jsonb column (`order.grand_total`, …). */
export function moneyColumn(options: { columnName?: string } = {}) {
  return moneyDecorator('money', options)
}

/** Nullable `PriceMoney` jsonb column (`shipping_invoice_lines.expected_amount`, …). */
export function nullableMoneyColumn(options: { columnName?: string } = {}) {
  return moneyDecorator('nullableMoney', options)
}

/** MedusaJS v2 `MedusaVariantPrice[]` jsonb column (`products.prices`, …). */
export function priceArrayColumn(options: { columnName?: string } = {}) {
  return moneyDecorator('priceArray', options)
}

/**
 * A stored generated column (`GENERATED ALWAYS AS (...) STORED`).
 *
 * PostgreSQL rejects any INSERT/UPDATE that mentions such a column, so it is
 * declared read-only: the base model drops it from write payloads and TypeScript
 * rejects assignments. Keep the runtime value for reads only.
 */
export function generatedColumn(options: {
  columnName: string
  consume?: (value: unknown) => unknown
}) {
  return column({
    columnName: options.columnName,
    consume: (value: unknown) => (options.consume ? options.consume(value) : value),
    meta: { generated: true },
  }) as (target: any, propertyName: string) => void
}

/**
 * A money-bearing breakdown array (`tax_lines` keyed by `total`, `adjustments`
 * keyed by `amount`). Entries keep their non-monetary keys verbatim; only the money
 * property is normalized into a PriceMoney.
 */
export function moneyEntryArrayColumn(options: {
  columnName: string
  amountKey: 'total' | 'amount'
}) {
  const normalize = (value: unknown) =>
    normalizeMoneyEntryArray(parseJson(value) ?? value, options.amountKey)

  return column({
    columnName: options.columnName,
    prepare: prepareJson,
    consume: (value: unknown) => normalize(value),
    serialize: (value: unknown) => normalize(value),
    meta: { money: 'entryArray' },
  }) as (target: any, propertyName: string) => void
}

/** True when the column definition is a money column of the given kind. */
export function moneyKindOf(definition: ModelColumnOptions | undefined): MoneyColumnKind | null {
  const meta = definition?.meta as { money?: MoneyColumnKind } | undefined
  return meta?.money ?? null
}
