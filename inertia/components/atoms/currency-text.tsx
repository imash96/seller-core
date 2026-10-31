import { convertToLocale, resolvePriceMoney, formatPriceArray, type PriceMoney } from '~/lib/utils'

export function CurrencyText({
  amount,
  currencyCode = 'USD',
  price,
  colored = false,
  className = '',
}: {
  amount?: unknown
  currencyCode?: string
  price?: PriceMoney | PriceMoney[] | unknown
  colored?: boolean
  className?: string
}) {
  const resolved =
    price !== undefined
      ? resolvePriceMoney(price, currencyCode)
      : resolvePriceMoney(amount, currencyCode)

  const num = Number(resolved.amount ?? 0)
  const toneClass = !colored
    ? 'text-foreground'
    : num > 0
      ? 'text-success'
      : num < 0
        ? 'text-error'
        : 'text-muted-foreground'

  return (
    <span className={`tabular-nums font-semibold ${toneClass} ${className}`}>
      {convertToLocale({ amount: num, currency_code: resolved.currency_code })}
    </span>
  )
}

/**
 * Displays a multi-currency price array:
 * `prices: [{ currency_code: 'USD', amount: 149.99 }, { currency_code: 'INR', amount: 6449.99 }, { currency_code: 'EUR', amount: 129.99 }]`
 * formatted via `convertToLocale`.
 */
export function MultiCurrencyPriceStack({
  prices,
  fallbackAmount = 0,
  fallbackCurrencyCode = 'USD',
  primaryCurrency,
  maxPills = 4,
  maxBadges,
  compact = false,
}: {
  prices?: unknown
  fallbackAmount?: unknown
  fallbackCurrencyCode?: string
  primaryCurrency?: string
  maxPills?: number
  maxBadges?: number
  compact?: boolean
}) {
  const targetCurrency = (primaryCurrency ?? fallbackCurrencyCode).toUpperCase()
  const effectiveMaxPills = maxBadges ?? maxPills
  let formattedList = formatPriceArray(prices)
  if (primaryCurrency && formattedList.length > 1) {
    const idx = formattedList.findIndex((p) => p.currency_code === targetCurrency)
    if (idx > 0) {
      const [matched] = formattedList.splice(idx, 1)
      formattedList = [matched, ...formattedList]
    }
  }

  if (formattedList.length === 0) {
    const fallbackResolved = resolvePriceMoney(fallbackAmount, fallbackCurrencyCode)
    return (
      <span className="font-mono font-bold text-price-current tabular-nums">
        {convertToLocale({
          amount: fallbackResolved.amount,
          currency_code: fallbackResolved.currency_code,
        })}
      </span>
    )
  }

  const primary = formattedList[0]
  const rest = formattedList.slice(1, effectiveMaxPills)
  const extraCount = Math.max(0, formattedList.length - 1 - rest.length)

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <span className="font-mono font-bold text-price-current tabular-nums text-xs sm:text-sm">
          {primary.formatted}
        </span>
        {rest.slice(0, 2).map((p) => (
          <span
            key={p.currency_code}
            className="px-1.5 py-0.5 rounded-md bg-muted border border-border-subtle text-[10px] font-mono text-muted-foreground tabular-nums"
            title={`${p.currency_code}: ${p.formatted}`}
          >
            {p.formatted}
          </span>
        ))}
        {formattedList.length > 3 && (
          <span
            className="px-1.5 py-0.5 rounded-md bg-primary-subtle text-primary text-[10px] font-mono font-semibold"
            title={formattedList.map((f) => `${f.currency_code}: ${f.formatted}`).join(' · ')}
          >
            +{formattedList.length - 3} curr
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono font-extrabold text-price-current tabular-nums text-sm">
          {primary.formatted}
        </span>
        <span className="text-[10px] font-mono font-semibold uppercase text-muted-foreground">
          {primary.currency_code}
        </span>
      </div>
      {rest.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {rest.map((p) => (
            <span
              key={p.currency_code}
              className="px-1.5 py-0.5 rounded-md bg-muted/70 border border-border-subtle text-[10px] font-mono text-muted-foreground tabular-nums"
            >
              {p.formatted} <span className="opacity-75">{p.currency_code}</span>
            </span>
          ))}
          {extraCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-md bg-primary-subtle text-primary text-[10px] font-mono font-semibold cursor-help"
              title={formattedList.map((f) => `${f.currency_code}: ${f.formatted}`).join(' · ')}
            >
              +{extraCount} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
