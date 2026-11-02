/**
 * Canonical monetary value objects.
 *
 * Every monetary amount anywhere in the application — database columns, service
 * inputs, serialized payloads and UI props — is a self-contained `PriceMoney`:
 *
 *     { currency_code: 'INR', amount: 1450.0 }
 *
 * A bare number can never be stored as money: an amount without its own
 * `currency_code` cannot survive a cross-border order where the marketplace
 * settles in USD, the carrier invoices in INR and COGS is booked in INR.
 *
 * Catalog prices are MedusaJS v2 style multi-currency arrays on products,
 * product variants and channel listings. `catalog_items` stays USD-only and is
 * expanded through `buildMultiCurrencyPriceArray()` when a product is created.
 */

/** ISO-4217 uppercase 3-letter code, e.g. 'USD', 'INR', 'EUR', 'GBP', 'CAD', 'MXN'. */
export type CurrencyCode =
  'USD' | 'INR' | 'EUR' | 'GBP' | 'CAD' | 'MXN' | 'AED' | 'JPY' | 'AUD' | (string & {})

/** A self-contained monetary amount. `amount` is rounded to 2 decimal places. */
export interface PriceMoney {
  /** ISO-4217 uppercase 3-letter code, e.g. 'USD', 'INR', 'EUR', 'GBP', 'CAD', 'MXN' */
  currency_code: string
  /** Rounded to 2 decimal places (numeric) */
  amount: number
}

/**
 * MedusaJS v2 `ProductVariant.prices` entry.
 * @see https://docs.medusajs.com/resources/references/pricing/models/Price
 */
export interface MedusaVariantPrice extends PriceMoney {
  compare_at_amount?: number | null
  min_quantity?: number | null
  max_quantity?: number | null
  rules?: Record<string, string>
}

/**
 * Default exchange rates relative to 1.00 USD, used to derive the multi-currency
 * price array from the USD-only catalog price.
 */
export const DEFAULT_CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  MXN: 17.15,
  AED: 3.67,
  JPY: 152.0,
}

/** Currencies every product/variant/listing price array carries by default. */
export const DEFAULT_MULTI_CURRENCIES: string[] = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'MXN']

/** `compare_at_amount` is derived at this markup over the sale price. */
export const DEFAULT_COMPARE_AT_MARKUP = 1.18

const ISO_CURRENCY = /^[A-Z]{3}$/

/** Parses any numeric-ish input into a finite 2-decimal number (0 when unusable). */
export function roundMoney(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(String(value ?? '').trim() || 0)
  if (!Number.isFinite(num)) return 0
  return Math.round((num + Number.EPSILON) * 100) / 100
}

/** Normalizes a currency code to uppercase ISO-4217, falling back to USD. */
export function normalizeCurrencyCode(code: unknown, fallback: string = 'USD'): string {
  const value = String(code ?? '')
    .trim()
    .toUpperCase()
  if (ISO_CURRENCY.test(value)) return value
  const fallbackValue = String(fallback ?? 'USD')
    .trim()
    .toUpperCase()
  return ISO_CURRENCY.test(fallbackValue) ? fallbackValue : 'USD'
}

/** Builds a PriceMoney with the amount rounded to 2 decimals. */
export function money(amount: unknown, currencyCode: string = 'USD'): PriceMoney {
  return {
    currency_code: normalizeCurrencyCode(currencyCode),
    amount: roundMoney(amount),
  }
}

/** Zero amount in the given currency. */
export function zeroMoney(currencyCode: string = 'USD'): PriceMoney {
  return money(0, currencyCode)
}

/** True when `value` is a well-formed `{ currency_code, amount }` object. */
export function isPriceMoney(value: unknown): value is PriceMoney {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.currency_code === 'string' &&
    ISO_CURRENCY.test(candidate.currency_code) &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount)
  )
}

/**
 * Reads the numeric amount from any money-ish value: PriceMoney, numeric string,
 * plain number, or a JSON string containing a PriceMoney object.
 */
export function amountOf(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'number') return Number.isFinite(value) ? roundMoney(value) : fallback
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return fallback
    if (trimmed.startsWith('{')) {
      try {
        return amountOf(JSON.parse(trimmed), fallback)
      } catch {
        return fallback
      }
    }
    return roundMoney(trimmed)
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return roundMoney((value as Record<string, unknown>).amount ?? fallback)
  }
  return fallback
}

/** Reads the currency code from a money-ish value, falling back to `USD`. */
export function currencyOf(value: unknown, fallback: string = 'USD'): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return normalizeCurrencyCode((value as Record<string, unknown>).currency_code, fallback)
  }
  return normalizeCurrencyCode(fallback)
}

/** Adds `delta` to a PriceMoney, keeping the receiver's currency. */
export function addMoney(base: PriceMoney | null | undefined, delta: unknown): PriceMoney {
  const currency = currencyOf(base)
  return money(amountOf(base) + amountOf(delta), currency)
}

/** Subtracts `delta` from a PriceMoney, keeping the receiver's currency. */
export function subtractMoney(base: PriceMoney | null | undefined, delta: unknown): PriceMoney {
  const currency = currencyOf(base)
  return money(amountOf(base) - amountOf(delta), currency)
}

/** Multiplies a PriceMoney amount, keeping its currency. */
export function multiplyMoney(base: unknown, factor: number): PriceMoney {
  const safeFactor = Number.isFinite(factor) ? factor : 0
  return money(amountOf(base) * safeFactor, currencyOf(base))
}

/** Sums money values; the first non-empty value's currency wins (defaults to USD). */
export function sumMoney(values: Array<unknown>, currencyCode: string = 'USD'): PriceMoney {
  const currency =
    values.map((value) => currencyOf(value, currencyCode)).find(Boolean) ?? currencyCode
  return money(
    values.reduce<number>((total, value) => total + amountOf(value), 0),
    currency
  )
}

/**
 * Converts any stored value into a valid PriceMoney. Objects keep their own
 * currency; scalars adopt `fallbackCurrencyCode`.
 */
export function normalizePriceMoney(amount: unknown, currencyCode: string = 'USD'): PriceMoney {
  if (amount && typeof amount === 'object' && !Array.isArray(amount)) {
    const obj = amount as Record<string, any>
    return {
      currency_code: normalizeCurrencyCode(obj.currency_code || obj.currencyCode, currencyCode),
      amount: roundMoney(obj.amount ?? obj.price),
    }
  }
  return {
    currency_code: normalizeCurrencyCode(currencyCode),
    amount: roundMoney(amount),
  }
}

/** Normalizes a money column that is allowed to be empty. */
export function normalizeNullablePriceMoney(
  amount: unknown,
  currencyCode: string = 'USD'
): PriceMoney | null {
  if (amount === null || amount === undefined || amount === '') return null
  return normalizePriceMoney(amount, currencyCode)
}

/**
 * Psychological retail rounding for a derived currency amount.
 * Keeps `.99` endings and whole-100 JPY prices so derived price arrays look
 * like hand-set retail prices rather than raw FX conversions.
 */
export function roundRetailCurrencyAmount(amountInUsd: number, currencyCode: string): number {
  const code = normalizeCurrencyCode(currencyCode)
  const rate = DEFAULT_CURRENCY_RATES[code] ?? 1.0
  const raw = Number(amountInUsd) * rate
  if (!Number.isFinite(raw) || raw <= 0) return 0
  if (code === 'USD') {
    return roundMoney(amountInUsd)
  }
  if (code === 'INR' || code === 'MXN') {
    // Psychological .99 boundary for high-denomination currencies
    const base = Math.max(99, Math.round(raw / 50) * 50 - 0.01)
    return roundMoney(base)
  }
  if (code === 'JPY') {
    return Math.round(raw / 100) * 100
  }
  // EUR, GBP, CAD, AED: clean .99 psychological retail price
  const whole = Math.max(1, Math.round(raw))
  return roundMoney(whole - 0.01)
}

export interface MultiCurrencyPriceOptions {
  /** Currencies to emit (defaults to DEFAULT_MULTI_CURRENCIES). */
  currencies?: string[]
  /** compare_at_amount markup over `amount`; pass 0 to omit compare-at prices. */
  compareAtMarkup?: number
  /** Per-currency overrides, e.g. `{ INR: { amount: 19999.99 } }`. */
  overrides?: Record<string, Partial<MedusaVariantPrice>>
  /** Quantity tier carried on every derived entry. */
  minQuantity?: number | null
  maxQuantity?: number | null
  rules?: Record<string, string>
}

/**
 * Converts a single USD amount into a MedusaJS v2 multi-currency price array
 * (USD, INR, EUR, GBP, CAD, MXN) with optional per-currency overrides.
 */
export function buildMultiCurrencyPriceArray(
  baseUsdAmount: number,
  options: MultiCurrencyPriceOptions = {}
): MedusaVariantPrice[] {
  const safeBase = Math.max(0, roundMoney(baseUsdAmount || 0))
  const currencies = options.currencies?.length ? options.currencies : DEFAULT_MULTI_CURRENCIES
  const markup = options.compareAtMarkup ?? DEFAULT_COMPARE_AT_MARKUP

  return currencies.map((rawCode) => {
    const code = normalizeCurrencyCode(rawCode)
    const override = options.overrides?.[code] ?? {}
    const amount =
      override.amount !== undefined
        ? roundMoney(override.amount)
        : roundRetailCurrencyAmount(safeBase, code)
    const compareAt = override.compare_at_amount

    const entry: MedusaVariantPrice = {
      currency_code: code,
      amount,
      compare_at_amount:
        compareAt === undefined || compareAt === null
          ? markup > 0 && amount > 0
            ? roundRetailCurrencyAmount(safeBase * markup, code)
            : null
          : roundMoney(compareAt),
    }
    if (options.minQuantity !== undefined) entry.min_quantity = options.minQuantity
    if (options.maxQuantity !== undefined) entry.max_quantity = options.maxQuantity
    if (options.rules && Object.keys(options.rules).length > 0) entry.rules = options.rules
    return entry
  })
}

/**
 * A jurisdiction-level tax breakdown entry as sent by Amazon SP-API, eBay,
 * Etsy and MedusaJS v2 (`tax_lines`). The `total` is a self-contained PriceMoney
 * so multi-jurisdiction tax never loses its currency.
 */
export interface TaxLineEntry {
  /** Jurisdiction / tax code, e.g. 'WA_STATE_SALES_TAX', 'VAT', 'GST'. */
  code: string
  /** Percentage rate as reported by the platform, when available. */
  rate?: number | null
  description?: string | null
  /** Tax amount for this jurisdiction. */
  total: PriceMoney
}

/**
 * A promotion / coupon / discount adjustment entry (`adjustments`) as sent by
 * MedusaJS v2, Amazon, eBay and Etsy. The `amount` is a self-contained PriceMoney.
 */
export interface AdjustmentEntry {
  /** Platform adjustment code, e.g. 'promotion', 'coupon', 'SellerDiscount'. */
  code?: string | null
  promotion_id?: string | null
  description?: string | null
  /** Value of the adjustment. */
  amount: PriceMoney
  /** Percent value for percentage-based promotions, when supplied. */
  rate?: number | null
}

/**
 * Normalizes a money-bearing breakdown array (`tax_lines` keyed by `total`,
 * `adjustments` keyed by `amount`) into storable entries whose money property is
 * a validated PriceMoney. Non-monetary keys are preserved verbatim so the
 * platform breakdown round-trips; entries without a usable money value are
 * dropped rather than persisted as invalid JSON.
 */
export function normalizeMoneyEntryArray<T extends TaxLineEntry | AdjustmentEntry>(
  entries: unknown,
  amountKey: 'total' | 'amount',
  fallbackCurrencyCode: string = 'USD'
): T[] {
  let raw: unknown = entries
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []
    try {
      raw = JSON.parse(trimmed)
    } catch {
      return []
    }
  }
  if (!Array.isArray(raw)) return []

  const normalized: T[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const source = entry as Record<string, any>
    const moneyValue = source[amountKey] ?? source.amount ?? source.total
    if (moneyValue === undefined || moneyValue === null || moneyValue === '') continue
    const amount = normalizePriceMoney(moneyValue, fallbackCurrencyCode)

    const preserved: Record<string, any> = {}
    for (const [key, value] of Object.entries(source)) {
      if (key === 'amount' || key === 'total') continue
      if (value === null || value === undefined) {
        preserved[key] = null
        continue
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        preserved[key] = value
      }
    }
    normalized.push({ ...preserved, [amountKey]: amount } as unknown as T)
  }
  return normalized
}

/** Sums the money values of breakdown entries (`tax_lines` / `adjustments`). */
export function sumMoneyEntries(
  entries: unknown,
  amountKey: 'total' | 'amount',
  currencyCode: string = 'USD'
): PriceMoney {
  if (!Array.isArray(entries)) return money(0, currencyCode)
  return money(
    entries.reduce<number>((total, entry) => {
      if (!entry || typeof entry !== 'object') return total
      const value = (entry as Record<string, unknown>)[amountKey]
      return value === undefined ? total : total + amountOf(value)
    }, 0),
    currencyCode
  )
}

/**
 * Normalizes any price-array input (JSON string, array of objects, array of
 * numbers) into a MedusaJS v2 price array. Duplicate currencies keep the last
 * valid entry. Falls back to the derived multi-currency array when empty.
 */
export function normalizePriceMoneyArray(
  rawPrices: unknown,
  fallbackUsdAmount: number = 0,
  fallbackCurrencyCode: string = 'USD'
): MedusaVariantPrice[] {
  if (typeof rawPrices === 'string' && rawPrices.trim()) {
    try {
      const parsed = JSON.parse(rawPrices)
      if (Array.isArray(parsed)) rawPrices = parsed
    } catch {
      // Ignore invalid JSON string
    }
  }

  if (Array.isArray(rawPrices) && rawPrices.length > 0) {
    const seen = new Map<string, MedusaVariantPrice>()
    for (const entry of rawPrices) {
      if (!entry || typeof entry !== 'object') continue
      const obj = entry as Record<string, any>
      const code = normalizeCurrencyCode(
        obj.currency_code || obj.currencyCode,
        fallbackCurrencyCode
      )
      const rawAmount = obj.amount ?? obj.price
      const amount = roundMoney(rawAmount)
      if (!Number.isFinite(Number(rawAmount)) || amount < 0) continue

      const price: MedusaVariantPrice = { currency_code: code, amount }
      const compareAt = obj.compare_at_amount ?? obj.compareAtAmount ?? obj.compare_at_price
      if (compareAt !== undefined && compareAt !== null && Number.isFinite(Number(compareAt))) {
        price.compare_at_amount = roundMoney(compareAt)
      }
      const minQuantity = obj.min_quantity ?? obj.minQuantity
      if (
        minQuantity !== undefined &&
        minQuantity !== null &&
        Number.isFinite(Number(minQuantity))
      ) {
        price.min_quantity = Number(minQuantity)
      }
      const maxQuantity = obj.max_quantity ?? obj.maxQuantity
      if (
        maxQuantity !== undefined &&
        maxQuantity !== null &&
        Number.isFinite(Number(maxQuantity))
      ) {
        price.max_quantity = Number(maxQuantity)
      }
      if (obj.rules && typeof obj.rules === 'object' && !Array.isArray(obj.rules)) {
        price.rules = obj.rules as Record<string, string>
      }
      seen.set(code, price)
    }
    if (seen.size > 0) return Array.from(seen.values())
  }

  return buildMultiCurrencyPriceArray(fallbackUsdAmount)
}

/** Finds the entry for `currencyCode` in a price array, falling back to the first. */
export function resolvePriceForCurrency(
  prices: unknown,
  currencyCode: string = 'USD'
): MedusaVariantPrice | null {
  if (!Array.isArray(prices) || prices.length === 0) return null
  const target = normalizeCurrencyCode(currencyCode)
  const normalized = normalizePriceMoneyArray(prices, 0, target)
  return (
    normalized.find((price) => price.currency_code === target) ??
    normalized.find((price) => price.currency_code === 'USD') ??
    normalized[0] ??
    null
  )
}

/**
 * Applies per-currency overrides onto a derived multi-currency price array while
 * keeping currencies that were not overridden.
 */
export function applyCurrencyOverrides(
  prices: MedusaVariantPrice[],
  overrides: Record<string, Partial<MedusaVariantPrice>> | undefined
): MedusaVariantPrice[] {
  if (!overrides || Object.keys(overrides).length === 0) return prices
  const byCurrency = new Map(prices.map((price) => [price.currency_code, { ...price }] as const))
  for (const [code, override] of Object.entries(overrides)) {
    const currency = normalizeCurrencyCode(code)
    const existing = byCurrency.get(currency)
    byCurrency.set(currency, {
      currency_code: currency,
      amount: override.amount !== undefined ? roundMoney(override.amount) : (existing?.amount ?? 0),
      compare_at_amount:
        override.compare_at_amount !== undefined
          ? roundMoney(override.compare_at_amount)
          : (existing?.compare_at_amount ?? null),
      ...(existing?.min_quantity !== undefined ? { min_quantity: existing.min_quantity } : {}),
      ...(existing?.max_quantity !== undefined ? { max_quantity: existing.max_quantity } : {}),
      ...(existing?.rules ? { rules: existing.rules } : {}),
    })
  }
  return Array.from(byCurrency.values())
}

/**
 * FX rate from one currency into another, both quoted against USD.
 *
 * Rates come from `DEFAULT_CURRENCY_RATES` (or an explicit override map), which is
 * good enough for reporting and derived retail prices. Settlement-critical
 * conversions keep using the marketplace's own `exchangeRate` on the order —
 * this helper is the fallback when no explicit rate was supplied.
 */
export function exchangeRateBetween(
  from: unknown,
  to: unknown,
  rates: Record<string, number> = DEFAULT_CURRENCY_RATES
): number {
  const source = normalizeCurrencyCode(from)
  const target = normalizeCurrencyCode(to)
  if (source === target) return 1

  const sourceRate = Number(rates[source])
  const targetRate = Number(rates[target])
  if (
    !Number.isFinite(sourceRate) ||
    !Number.isFinite(targetRate) ||
    sourceRate <= 0 ||
    targetRate <= 0
  ) {
    return 0
  }
  // The rate table is quoted as "units of currency per 1 USD" (INR 83.5 means
  // 1 USD = 83.5 INR), so 1 unit of `source` is 1/sourceRate USD, which is
  // targetRate/sourceRate units of `target`.
  return targetRate / sourceRate
}

/**
 * Converts any money-ish value into `targetCurrency` using the FX table.
 *
 * A value already in the target currency is returned untouched (rate 1), so
 * callers never see a rounding drift on single-currency data.
 */
export function convertMoney(
  value: unknown,
  targetCurrency: string,
  rates: Record<string, number> = DEFAULT_CURRENCY_RATES
): PriceMoney {
  const target = normalizeCurrencyCode(targetCurrency)
  const source = currencyOf(value, target)
  const rate = exchangeRateBetween(source, target, rates)
  return money(roundMoney(amountOf(value) * rate), target)
}

/**
 * Sums money values after converting each one into `targetCurrency`.
 *
 * This is the multi-currency-safe replacement for `sumMoney` when the entries may
 * carry different currencies (e.g. COGS in INR on a USD order): unlike a plain
 * numeric sum it never adds 2 300 INR to 40 USD.
 */
export function sumMoneyConverted(
  values: Array<unknown>,
  targetCurrency: string,
  rates: Record<string, number> = DEFAULT_CURRENCY_RATES
): PriceMoney {
  const target = normalizeCurrencyCode(targetCurrency)
  const total = values.reduce<number>(
    (sum, value) => sum + amountOf(convertMoney(value, target, rates)),
    0
  )
  return money(total, target)
}

/**
 * Expands a (possibly partial) MedusaJS v2 price array so it covers every
 * currency in `DEFAULT_MULTI_CURRENCIES`.
 *
 * Explicit entries always win — a hand-set EUR price is never recalculated — and
 * the missing currencies are derived from the USD base with the same
 * psychological rounding and `compare_at_amount` markup as the catalog pipeline.
 */
export function ensureCurrencyCoverage(
  prices: unknown,
  usdBaseAmount: number,
  options: MultiCurrencyPriceOptions = {}
): MedusaVariantPrice[] {
  const explicit = normalizePriceMoneyArray(prices, usdBaseAmount)
  const derived = buildMultiCurrencyPriceArray(usdBaseAmount, options)
  const byCurrency = new Map(derived.map((price) => [price.currency_code, price] as const))
  for (const price of explicit) byCurrency.set(price.currency_code, price)
  const currencies = options.currencies?.length ? options.currencies : DEFAULT_MULTI_CURRENCIES
  const ordered = currencies
    .map((code) => byCurrency.get(normalizeCurrencyCode(code)))
    .filter((price): price is MedusaVariantPrice => Boolean(price))
  // Any explicit currency outside the default set keeps its place at the end.
  for (const price of explicit) {
    if (!ordered.some((entry) => entry.currency_code === price.currency_code)) ordered.push(price)
  }
  return ordered
}
