/**
 * Shared utility functions used across pages and components.
 * Pure helpers only — no React or Astryx imports.
 */

export interface PriceMoney {
  currency_code: string
  amount: number
}

export type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

// export const isObject = (input: any): boolean => input instanceof Object && !Array.isArray(input);
function isObject(value: any) {
  const type = typeof value
  return value !== null && value !== undefined && (type === 'object' || type === 'function')
}

export const isArray = Array.isArray

export const isEmpty = (input: any): boolean => {
  if (input === null || input === undefined) return true
  if (isObject(input)) return Object.keys(input as object).length === 0
  if (isArray(input)) return (input as unknown[]).length === 0
  if (typeof input === 'string') return input.trim().length === 0
  return false
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  locale = 'en-US',
}: ConvertToLocaleParams): string => {
  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency_code,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount)
  } catch (error) {
    console.error(`convertToLocale: invalid currency code "${currency_code}"`, error)
    return `${amount.toFixed(maximumFractionDigits ?? 2)} ${currency_code.toUpperCase()}`
  }
}

/**
 * Resolves any price input — a PriceMoney object `{ currency_code, amount }`,
 * an array of PriceMoney `[{ currency_code, amount }]`, or a scalar number/string
 * with a fallback currency code — into a canonical `{ currency_code, amount }` object.
 */
export function resolvePriceMoney(
  input: unknown,
  fallbackCurrencyCode: string = 'USD',
  preferredCurrencyCode?: string
): PriceMoney {
  if (isArray(input) && input.length > 0) {
    const targetCur = (preferredCurrencyCode || fallbackCurrencyCode || 'USD').toUpperCase()
    const match =
      (input as any[]).find(
        (p) =>
          p &&
          typeof p === 'object' &&
          String(p.currency_code || p.currencyCode || '').toUpperCase() === targetCur
      ) ?? input[0]
    if (match && typeof match === 'object') {
      return {
        currency_code: String(match.currency_code || match.currencyCode || targetCur).toUpperCase(),
        amount: Number(match.amount ?? match.price ?? 0) || 0,
      }
    }
  }

  if (input && typeof input === 'object' && !isArray(input)) {
    const obj = input as Record<string, any>
    if ('amount' in obj || 'currency_code' in obj || 'currencyCode' in obj || 'price' in obj) {
      return {
        currency_code: String(
          obj.currency_code || obj.currencyCode || fallbackCurrencyCode || 'USD'
        ).toUpperCase(),
        amount: Number(obj.amount ?? obj.price ?? 0) || 0,
      }
    }
  }

  return {
    currency_code: (fallbackCurrencyCode || 'USD').toUpperCase(),
    amount: Number(input ?? 0) || 0,
  }
}

/**
 * Formats a currency amount using `convertToLocale`.
 * Supports:
 * - `formatMoney({ currency_code: 'INR', amount: 6449.99 })`
 * - `formatMoney([{ currency_code: 'USD', amount: 149.99 }, { currency_code: 'INR', amount: 6449.99 }])`
 * - `formatMoney('INR', 6449.99)`
 * - `formatMoney('USD', { currency_code: 'EUR', amount: 129.99 })`
 */
export function formatMoney(
  currencyOrPrice: string | PriceMoney | PriceMoney[] | undefined,
  amountOrUndefined?: unknown,
  locale = 'en-US'
): string {
  if (currencyOrPrice && typeof currencyOrPrice === 'object' && amountOrUndefined === undefined) {
    const resolved = resolvePriceMoney(currencyOrPrice, 'USD')
    return convertToLocale({
      amount: resolved.amount,
      currency_code: resolved.currency_code,
      locale,
    })
  }

  if (amountOrUndefined && typeof amountOrUndefined === 'object') {
    const fallback =
      typeof currencyOrPrice === 'string' && !isEmpty(currencyOrPrice)
        ? currencyOrPrice.toUpperCase()
        : 'USD'
    const resolved = resolvePriceMoney(amountOrUndefined, fallback, fallback)
    return convertToLocale({
      amount: resolved.amount,
      currency_code: resolved.currency_code,
      locale,
    })
  }

  const currencyCode =
    typeof currencyOrPrice === 'string' && !isEmpty(currencyOrPrice)
      ? currencyOrPrice.toUpperCase()
      : 'USD'
  const amount = Number(amountOrUndefined ?? 0) || 0
  return convertToLocale({ amount, currency_code: currencyCode, locale })
}

/**
 * Formats a multi-currency price array `[{ currency_code: 'USD', amount: 149.99 }, ...]`
 * using `convertToLocale`.
 */
/**
 * Amount of a serialized `PriceMoney` as a plain string, for prefilling form inputs.
 * Accepts the canonical object, the aliased `{ amount, currencyCode }` shape, or a
 * bare scalar (legacy rows), and always returns `''` for missing values so an empty
 * field stays empty instead of becoming `NaN`.
 */
export function moneyAmountString(input: unknown): string {
  if (input === null || input === undefined || input === '') return ''
  const value = resolvePriceMoney(input, 'USD')
  if (!Number.isFinite(value.amount)) return ''
  return String(value.amount)
}

/** ISO code of a serialized `PriceMoney`, uppercased, defaulting to USD. */
export function moneyCurrencyCode(input: unknown, fallback = 'USD'): string {
  return resolvePriceMoney(input, fallback).currency_code
}

export function formatPriceArray(
  prices: unknown,
  locale = 'en-US'
): Array<{ currency_code: string; amount: number; formatted: string }> {
  if (!isArray(prices)) return []
  return prices
    .filter((p) => p && typeof p === 'object')
    .map((p: any) => {
      const currencyCode = String(p.currency_code || p.currencyCode || 'USD').toUpperCase()
      const amount = Number(p.amount ?? p.price ?? 0) || 0
      return {
        currency_code: currencyCode,
        amount,
        formatted: convertToLocale({ amount, currency_code: currencyCode, locale }),
      }
    })
}

/** Format a date value to locale string, returns '—' for falsy/invalid */
export function formatDate(value: unknown): string {
  if (!value) return '—'
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString()
}

/** Relative time string (e.g. "2 min ago", "3 hours ago") */
export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return formatDate(date)
}

/** Shorten a long ID string for display (e.g. "abc123…ef89") */
export function shortId(id: unknown): string {
  const s = String(id ?? '')
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s
}

/** Capitalize the first letter of a string */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** Convert snake_case or kebab-case to Title Case */
export function humanize(str: string): string {
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Generate user initials from first/last name */
export function getUserInitials(firstName?: string, lastName?: string): string {
  if (!firstName) return '?'
  const firstInitial = firstName[0] || ''
  const lastInitial = lastName?.[0] || ''
  return (firstInitial + lastInitial).toUpperCase()
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Safe percentage calculation, returns 0 if denominator is 0 */
export function percentage(numerator: number, denominator: number, decimals = 1): number {
  if (denominator === 0) return 0
  return Number(((numerator / denominator) * 100).toFixed(decimals))
}
