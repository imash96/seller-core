/**
 * Pure helpers behind the per-amount currency form fields.
 *
 * Monetary inputs on the frontend submit a pair — `<name>__amount` plus
 * `<name>__currency` — because every stored amount is a self-contained
 * `{ currency_code, amount }`. These functions are the single place where that pair
 * becomes (and comes back from) the `{ amount, currencyCode }` shape the validators accept.
 */

export type MoneyPairFormValues = Record<string, string>

/** Minimal shape of the form field definitions these helpers understand. */
export type MoneyAwareField = {
  name: string
  kind?: string
  default?: string
  defaultCurrency?: string
  currencyFrom?: string
}

/**
 * Field defaults plus the ISO code each money field starts on.
 *
 * The currency lives in form state rather than the DOM, so an untouched selector still
 * submits its default. `currencyFrom` lets one money field inherit the order/return
 * currency chosen elsewhere in the same form.
 */
export function moneyAwareDefaults(fields: MoneyAwareField[]): MoneyPairFormValues {
  const out: MoneyPairFormValues = {}
  for (const field of fields) {
    out[field.name] = field.default ?? ''
  }
  for (const field of fields) {
    if (field.kind !== 'money') continue
    const inherited = field.currencyFrom ? out[field.currencyFrom]?.toUpperCase() : ''
    out[`${field.name}__currency`] = inherited || field.defaultCurrency || 'USD'
  }
  return out
}

/**
 * Collapses `<name>__amount` + `<name>__currency` pairs into a single
 * `name: { amount, currencyCode }`, the shape every money validator accepts.
 *
 * Empty amounts are dropped entirely so partial updates stay partial, non-numeric
 * amounts are dropped rather than silently becoming `0`, and the transient pair keys
 * never reach the server.
 */
export function withMoneyPairs(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...data }
  for (const key of Object.keys(out)) {
    if (!key.endsWith('__amount')) continue
    const base = key.slice(0, -'__amount'.length)
    const value = out[key]
    const currency = String(out[`${base}__currency`] || 'USD').toUpperCase()
    delete out[key]
    delete out[`${base}__currency`]
    if (value === '' || value === null || value === undefined) {
      delete out[base]
      continue
    }
    const amount = Number(value)
    if (!Number.isFinite(amount)) continue
    out[base] = { amount, currencyCode: currency }
  }
  for (const key of Object.keys(out)) {
    if (key.endsWith('__currency')) delete out[key]
  }
  return out
}
