import { formatMoney } from '~/lib/utils'

export function CurrencyText({
  amount,
  currencyCode = 'USD',
  colored = false,
  className = '',
}: {
  amount: unknown
  currencyCode?: string
  colored?: boolean
  className?: string
}) {
  const num = Number(amount ?? 0)
  const toneClass = !colored
    ? 'text-foreground'
    : num > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : num < 0
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-muted-foreground'

  return (
    <span className={`tabular-nums font-semibold ${toneClass} ${className}`}>
      {formatMoney(currencyCode, num)}
    </span>
  )
}
