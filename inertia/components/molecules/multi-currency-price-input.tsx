import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { convertToLocale, type PriceMoney } from '~/lib/utils'
import { SUPPORTED_CURRENCIES, expandUsdPrice, roundRetail } from '~/lib/currency'

export function MultiCurrencyPriceInput({
  label = 'Multi-Currency Prices ({ currency_code, amount })',
  name = 'pricesJson',
  value,
  onChange,
  defaultUsdAmount = 149.99,
  description,
  error,
}: {
  label?: string
  name?: string
  value?: string | PriceMoney[]
  onChange?: (parsed: PriceMoney[], jsonString: string) => void
  defaultUsdAmount?: number
  description?: string
  error?: string
}) {
  const parseInitial = useCallback(
    (raw: string | PriceMoney[] | undefined): PriceMoney[] => {
      if (Array.isArray(raw) && raw.length > 0) return raw
      if (typeof raw === 'string' && raw.trim()) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const valid = parsed
              .filter((p: any) => p && typeof p === 'object')
              .map((p: any) => ({
                currency_code: String(p.currency_code || p.currencyCode || 'USD').toUpperCase(),
                amount: Number(p.amount ?? p.price ?? 0) || 0,
              }))
            if (valid.length > 0) return valid
          }
        } catch {
          // Fallback below
        }
      }
      return expandUsdPrice(defaultUsdAmount)
    },
    [defaultUsdAmount]
  )

  const [entries, setEntries] = useState<PriceMoney[]>(() => parseInitial(value))

  const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)

  useEffect(() => {
    if (value !== undefined) {
      setEntries(parseInitial(value))
    }
  }, [serializedValue, value, parseInitial])

  const emit = (next: PriceMoney[]) => {
    setEntries(next)
    onChange?.(next, JSON.stringify(next))
  }

  const handleCurrencyChange = (idx: number, nextCode: string) => {
    const next = entries.map((item, i) =>
      i === idx ? { ...item, currency_code: nextCode.toUpperCase() } : item
    )
    emit(next)
  }

  const handleAmountChange = (idx: number, nextAmtStr: string) => {
    const num = Number(nextAmtStr)
    const next = entries.map((item, i) =>
      i === idx ? { ...item, amount: Number.isNaN(num) ? 0 : num } : item
    )
    emit(next)
  }

  const handleAddCurrency = () => {
    const used = new Set(entries.map((e) => e.currency_code))
    const nextCur = SUPPORTED_CURRENCIES.find((c) => !used.has(c)) || 'USD'
    const baseUsd =
      entries.find((e) => e.currency_code === 'USD')?.amount ??
      entries[0]?.amount ??
      defaultUsdAmount
    emit([...entries, { currency_code: nextCur, amount: roundRetail(baseUsd, nextCur) }])
  }

  const handleRemove = (idx: number) => {
    if (entries.length <= 1) return
    emit(entries.filter((_, i) => i !== idx))
  }

  const handleAutoConvertFromUsd = () => {
    const baseUsd =
      entries.find((e) => e.currency_code === 'USD')?.amount ??
      entries[0]?.amount ??
      defaultUsdAmount
    // Auto-fill is deliberately destructive: it re-derives every expansion currency from
    // the USD anchor, discarding manual overrides the seller may have set earlier.
    emit(expandUsdPrice(baseUsd))
  }

  const jsonValue = JSON.stringify(entries)

  return (
    <div className="flex flex-col gap-2 w-full">
      <input type="hidden" name={name} value={jsonValue} />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleAutoConvertFromUsd}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-subtle text-primary hover:opacity-90 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            Auto-Fill Currencies from USD
          </button>
          <button
            type="button"
            onClick={handleAddCurrency}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Add Currency
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-sunken/50 p-3 space-y-2">
        {entries.map((entry, idx) => (
          <div
            key={`${entry.currency_code}-${idx}`}
            className="grid grid-cols-12 gap-2 items-center"
          >
            <div className="col-span-4 sm:col-span-3">
              <select
                value={entry.currency_code}
                onChange={(e) => handleCurrencyChange(idx, e.target.value)}
                aria-label="Currency code"
                className="w-full h-9 px-2.5 rounded-xl border border-input-border bg-input-background text-input-text text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SUPPORTED_CURRENCIES.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-5 sm:col-span-5">
              <input
                type="number"
                step="0.01"
                min="0"
                value={entry.amount}
                onChange={(e) => handleAmountChange(idx, e.target.value)}
                placeholder="149.99"
                aria-label={`${entry.currency_code} amount`}
                className="w-full h-9 px-3 rounded-xl border border-input-border bg-input-background text-input-text text-xs font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="col-span-2 sm:col-span-3 text-right">
              <span className="inline-block px-2 py-1 rounded-lg bg-card border border-border-subtle text-xs font-mono font-bold text-price-current tabular-nums truncate max-w-full">
                {convertToLocale({
                  amount: Number(entry.amount || 0),
                  currency_code: entry.currency_code,
                })}
              </span>
            </div>
            <div className="col-span-1 flex justify-end">
              <button
                type="button"
                disabled={entries.length <= 1}
                onClick={() => handleRemove(idx)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-subtle disabled:opacity-30 transition-colors cursor-pointer"
                aria-label="Remove currency row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {description && !error && (
        <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
      )}
      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  )
}
