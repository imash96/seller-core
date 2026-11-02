/**
 * Retail FX expansion for listings and product variants.
 *
 * The seller always thinks in USD — `catalog_items.base_price_usd` is the single source
 * of truth — while every product/variant/listing stores a MedusaJS v2 price array in
 * USD, INR, EUR, GBP, CAD and MXN. These helpers expand a USD anchor into that array
 * with retail-friendly rounding, and are shared by the price editor and read-only
 * previews so an amount shown in a preview always equals the amount that would be saved.
 */
import type { PriceMoney } from './utils'

/** Expansion set the platform stores for every sellable price. */
export const EXPANSION_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'MXN'] as const

/** Additional codes the editor offers when a seller overrides beyond the default set. */
export const SUPPORTED_CURRENCIES = [...EXPANSION_CURRENCIES, 'AED', 'JPY'] as const

/** Indicative USD→X rates used for the preview only; overrides are always editable. */
export const DEFAULT_RATES: Record<string, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  MXN: 17.15,
  AED: 3.67,
  JPY: 152,
}

/**
 * Rounds a converted amount the way a retail price list would: whole-rupee/whole-peso
 * prices ending in `.99`, whole-dollar prices ending in `.99` for other currencies and
 * whole hundreds for JPY. Returns `0` for non-positive input so an empty base price
 * never produces negative or `-0.01` prices.
 */
export function roundRetail(usd: number, code: string): number {
  const currency = code.toUpperCase()
  const rate = DEFAULT_RATES[currency] ?? 1
  const raw = usd * rate
  if (!Number.isFinite(raw) || raw <= 0) return 0
  if (currency === 'USD') return Number(usd.toFixed(2))
  if (currency === 'INR' || currency === 'MXN') {
    return Number((Math.max(99, Math.round(raw / 50) * 50) - 0.01).toFixed(2))
  }
  if (currency === 'JPY') return Math.round(raw / 100) * 100
  return Number((Math.max(1, Math.round(raw)) - 0.01).toFixed(2))
}

/**
 * Expands one USD amount into the full price array (USD first, then the expansion set
 * in order). `existing` values are preserved when `preserveOverrides` is set, which is
 * how a per-currency override survives an edit of the USD anchor — USD itself is always
 * recomputed, because the USD amount *is* the anchor and can never be an override.
 */
export function expandUsdPrice(
  usd: number,
  options: {
    currencies?: readonly string[]
    existing?: PriceMoney[]
    preserveOverrides?: boolean
  } = {}
): PriceMoney[] {
  const currencies = options.currencies ?? EXPANSION_CURRENCIES
  const overrides = new Map(
    (options.existing ?? []).map((entry) => [entry.currency_code.toUpperCase(), entry.amount])
  )
  return currencies.map((code) => {
    const normalized = code.toUpperCase()
    const override =
      options.preserveOverrides && normalized !== 'USD' ? overrides.get(normalized) : undefined
    return {
      currency_code: normalized,
      amount: override !== undefined ? override : roundRetail(usd, normalized),
    }
  })
}
