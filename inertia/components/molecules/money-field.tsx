import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { AppInput, AppSelect } from '../atoms/input'
import { MoneyDisplay } from '../atoms/money-display'

/** Currencies the app can book an amount in (matches the DB currency coverage). */
export const MONEY_FIELD_CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'INR', 'MXN'] as const

/** Description/error line shared by every form field. */
export function FieldHint({ description, error }: { description?: string; error?: string }) {
  if (error) {
    return (
      <Text as="p" size="2xs" weight="medium" color="accent">
        {error}
      </Text>
    )
  }
  if (!description) return null
  return (
    <Text as="p" size="2xs" color="secondary">
      {description}
    </Text>
  )
}

/**
 * One amount together with its own currency selector.
 *
 * Every monetary input is a `PriceMoney` in the making: the number and the ISO code
 * travel together, so `shipping_cost_total` can be booked in CAD on a USD order
 * without a tenant-wide default deciding for it. The badge shows exactly what will be
 * stored; `SmartForm` turns the pair into `{ amount, currencyCode }` on submit.
 */
export function MoneyField({
  label,
  name,
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  required,
  placeholder,
  description,
  error,
  currencies = MONEY_FIELD_CURRENCIES,
}: {
  label: string
  name: string
  amount: string
  currency: string
  onAmountChange: (next: string) => void
  onCurrencyChange: (next: string) => void
  required?: boolean
  placeholder?: string
  description?: string
  error?: string
  currencies?: readonly string[]
}) {
  const numeric = Number(amount)
  const preview = {
    currency_code: (currency || 'USD').toUpperCase(),
    amount: Number.isFinite(numeric) ? numeric : 0,
  }

  return (
    <Stack gap={1.5} className="w-full">
      <Text as="span" size="xsm" weight="semibold">
        {label}
        {required ? (
          <Text as="span" size="xsm" color="accent">
            {' '}
            *
          </Text>
        ) : null}
      </Text>

      <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
        <AppSelect
          aria-label={`${label} currency`}
          value={preview.currency_code}
          onChange={(event) => onCurrencyChange(event.target.value)}
          options={currencies.map((code) => ({ value: code, label: code }))}
          fullWidth={false}
          className="w-24 font-mono font-bold"
        />
        <AppInput
          id={`field-${name}`}
          name={`${name}__amount`}
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          required={required}
          placeholder={placeholder ?? '0.00'}
          error={error}
          fullWidth={false}
          className="w-40 tabular-nums"
        />
        <MoneyDisplay value={preview} showCode />
      </Stack>

      <FieldHint description={description} error={error} />
    </Stack>
  )
}
