import { Badge } from '@astryxdesign/core/Badge'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { convertToLocale, resolvePriceMoney, formatPriceArray, type PriceMoney } from '~/lib/utils'

/** Formatting presets shared by the money atoms. */
const SIZE_MAP = {
  '3xs': '3xs',
  '2xs': '2xs',
  'xsm': 'xsm',
  'sm': 'sm',
  'base': 'base',
  'lg': 'lg',
} as const

const WEIGHT_MAP = {
  normal: 'normal',
  medium: 'medium',
  semibold: 'semibold',
  bold: 'bold',
} as const

/**
 * Renders one self-contained `{ currency_code, amount }` value.
 *
 * The currency always comes from the value itself — never from a tenant default —
 * so a CAD order renders `CA$1,240.50` and an INR line `₹26,546.46`. Accepts the
 * canonical snake_case object, the flat `{ amount, currencyCode }` form, a MedusaJS
 * v2 price array (first/preferred entry wins) or a bare number plus `fallbackCurrency`.
 */
export function MoneyDisplay({
  value,
  fallbackCurrency = 'USD',
  preferredCurrency,
  size = 'sm',
  weight = 'semibold',
  color,
  hasTabularNumbers = true,
  showCode = false,
  className,
}: {
  value: PriceMoney | PriceMoney[] | Record<string, unknown> | number | string | null | undefined
  fallbackCurrency?: string
  preferredCurrency?: string
  size?: keyof typeof SIZE_MAP
  weight?: keyof typeof WEIGHT_MAP
  color?: 'primary' | 'secondary' | 'disabled' | 'accent' | 'inherit'
  hasTabularNumbers?: boolean
  /** Append the ISO code after the symbol, e.g. `US$120.00 USD`. */
  showCode?: boolean
  className?: string
}) {
  const resolved = resolvePriceMoney(value, fallbackCurrency, preferredCurrency)
  const formatted = convertToLocale({
    amount: resolved.amount,
    currency_code: resolved.currency_code,
  })

  return (
    <Text
      as="span"
      size={SIZE_MAP[size]}
      weight={WEIGHT_MAP[weight]}
      color={color}
      hasTabularNumbers={hasTabularNumbers}
      className={className}
    >
      {formatted}
      {showCode ? (
        <Text as="span" size="3xs" color="secondary" className="ml-1 uppercase">
          {resolved.currency_code}
        </Text>
      ) : null}
    </Text>
  )
}

/**
 * Renders a MedusaJS v2 price array as one badge per currency:
 * `[{currency_code:'USD',amount:149.99}, {currency_code:'INR',amount:6449.99}]`.
 *
 * Every entry keeps its own currency code — the amount is never re-based on the
 * viewer's default. `limit` collapses long arrays into a `+n` badge whose tooltip
 * still lists every currency.
 */
export function MultiCurrencyPriceBadges({
  prices,
  limit = 6,
  primaryCurrency,
  className,
}: {
  prices: unknown
  limit?: number
  primaryCurrency?: string
  className?: string
}) {
  const formatted = formatPriceArray(prices)
  if (formatted.length === 0) {
    return (
      <Text as="span" size="2xs" color="disabled">
        No prices
      </Text>
    )
  }

  const ordered = primaryCurrency
    ? [...formatted].sort((a, b) =>
        a.currency_code === primaryCurrency.toUpperCase()
          ? -1
          : b.currency_code === primaryCurrency.toUpperCase()
            ? 1
            : 0
      )
    : formatted
  const visible = ordered.slice(0, limit)
  const hidden = ordered.slice(limit)

  return (
    <Stack direction="horizontal" gap={1} wrap="wrap" align="center" className={className}>
      {visible.map((price) => (
        <Badge
          key={price.currency_code}
          variant={price.currency_code === primaryCurrency?.toUpperCase() ? 'info' : 'neutral'}
          label={`${price.formatted} ${price.currency_code}`}
        />
      ))}
      {hidden.length > 0 ? (
        <Badge
          variant="neutral"
          label={`+${hidden.length}`}
          icon={
            <Text as="span" size="3xs" color="inherit">
              {hidden.map((price) => price.currency_code).join(' ')}
            </Text>
          }
        />
      ) : null}
    </Stack>
  )
}
