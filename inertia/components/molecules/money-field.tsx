import { AppInput, AppSelect } from '../atoms/input'
import { MoneyDisplay } from '../atoms/money-display'

/** Currencies the app can book an amount in (matches the DB currency coverage). */
export const MONEY_FIELD_CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'INR', 'MXN'] as const

/** Description/error line shared by every form field. */
export function FieldHint({ description, error }: { description?: string; error?: string }) {
  if (error) {
    return <p className="text-[11px] font-medium text-error mt-0.5">{error}</p>
  }
  if (!description) return null
  return <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
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
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`field-${name}`}
          className="text-xs font-semibold text-foreground-secondary tracking-wide truncate"
        >
          {label}
          {required ? <span className="text-error ml-0.5">*</span> : null}
        </label>
        <span className="px-2 py-0.5 rounded-md bg-muted border border-border-subtle text-[11px] font-mono text-foreground shrink-0">
          <MoneyDisplay value={preview} size="2xs" weight="semibold" />
        </span>
      </div>

      <div className="flex items-center gap-2 w-full">
        <div className="w-24 shrink-0">
          <AppSelect
            aria-label={`${label} currency`}
            value={preview.currency_code}
            onChange={(event) => onCurrencyChange(event.target.value)}
            options={currencies.map((code) => ({ value: code, label: code }))}
            fullWidth
            className="font-mono font-bold"
          />
        </div>
        <div className="flex-1 min-w-0">
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
            fullWidth
            className="tabular-nums font-mono"
          />
        </div>
      </div>

      <FieldHint description={description} error={error} />
    </div>
  )
}
