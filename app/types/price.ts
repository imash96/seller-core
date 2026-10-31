/**
 * Shared Monetary Value-Object & Multi-Currency Price Types
 * Canonical structure: { currency_code: string, amount: number }
 */

export type CurrencyCode =
  'USD' | 'INR' | 'EUR' | 'CAD' | 'MXN' | 'GBP' | 'AED' | 'JPY' | 'AUD' | string

export interface PriceMoney {
  currency_code: string
  amount: number
}

export interface MultiCurrencyPriceEntry extends PriceMoney {
  id?: string
  price_type?: string
  size_value?: string | null
  compare_at_amount?: number | null
}

/**
 * Default exchange rates & psychological retail rounding relative to 1.00 USD
 * so every catalog tier, product, variant, inventory item, and listing can automatically
 * generate multi-currency price arrays when only a USD base price is provided.
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

export const DEFAULT_MULTI_CURRENCIES: string[] = ['USD', 'INR', 'EUR', 'GBP', 'CAD', 'MXN']

export function roundRetailCurrencyAmount(amountInUsd: number, currencyCode: string): number {
  const code = (currencyCode || 'USD').toUpperCase()
  const rate = DEFAULT_CURRENCY_RATES[code] ?? 1.0
  const raw = amountInUsd * rate
  if (raw <= 0) return 0
  if (code === 'USD') {
    return Number(amountInUsd.toFixed(2))
  }
  if (code === 'INR' || code === 'MXN') {
    // Psychological .99 or whole-99 rounding for high-denomination currencies
    const base = Math.max(99, Math.round(raw / 50) * 50 - 0.01)
    return Number(base.toFixed(2))
  }
  if (code === 'JPY') {
    return Math.round(raw / 100) * 100
  }
  // EUR, GBP, CAD, AED: clean .99 psychological retail price
  const whole = Math.max(1, Math.round(raw))
  return Number((whole - 0.01).toFixed(2))
}

export function buildMultiCurrencyPriceArray(
  baseUsdAmount: number,
  currencies: string[] = DEFAULT_MULTI_CURRENCIES
): PriceMoney[] {
  const safeBase = Math.max(0, Number(baseUsdAmount || 0))
  return currencies.map((code) => {
    const cleanCode = code.toUpperCase()
    return {
      currency_code: cleanCode,
      amount: roundRetailCurrencyAmount(safeBase, cleanCode),
    }
  })
}

export function normalizePriceMoney(amount: unknown, currencyCode: string = 'USD'): PriceMoney {
  if (amount && typeof amount === 'object' && !Array.isArray(amount)) {
    const obj = amount as Record<string, any>
    return {
      currency_code: String(obj.currency_code || obj.currencyCode || currencyCode || 'USD')
        .trim()
        .toUpperCase(),
      amount: Number(Number(obj.amount ?? obj.price ?? 0).toFixed(2)),
    }
  }
  return {
    currency_code: (currencyCode || 'USD').trim().toUpperCase(),
    amount: Number(Number(amount ?? 0).toFixed(2)),
  }
}

export function normalizePriceMoneyArray(
  rawPrices: unknown,
  fallbackUsdAmount: number = 0,
  fallbackCurrencyCode: string = 'USD'
): PriceMoney[] {
  if (typeof rawPrices === 'string' && rawPrices.trim()) {
    try {
      const parsed = JSON.parse(rawPrices)
      if (Array.isArray(parsed)) {
        rawPrices = parsed
      }
    } catch {
      // Ignore invalid JSON string
    }
  }

  if (Array.isArray(rawPrices) && rawPrices.length > 0) {
    const seen = new Map<string, PriceMoney>()
    for (const entry of rawPrices) {
      if (!entry || typeof entry !== 'object') continue
      const obj = entry as Record<string, any>
      const code = String(obj.currency_code || obj.currencyCode || fallbackCurrencyCode || 'USD')
        .trim()
        .toUpperCase()
      const amt = Number(obj.amount ?? obj.price ?? 0)
      if (!code || Number.isNaN(amt) || amt < 0) continue
      seen.set(code, {
        currency_code: code,
        amount: Number(amt.toFixed(2)),
      })
    }
    if (seen.size > 0) {
      return Array.from(seen.values())
    }
  }

  return buildMultiCurrencyPriceArray(fallbackUsdAmount)
}
