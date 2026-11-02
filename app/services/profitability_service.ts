import {
  type PriceMoney,
  DEFAULT_CURRENCY_RATES,
  amountOf,
  currencyOf,
  exchangeRateBetween,
  money,
  normalizeCurrencyCode,
  roundMoney,
} from '../types/price.js'
import { TaxCollectionModel, type TaxCollectionModelValue } from '../enums/index.js'

/**
 * Every monetary input of an order's P&L, in whatever currency each one was booked.
 *
 * The amounts are *not* required to share a currency: a USD order can carry an INR
 * warehouse cost, a MXN carrier cost and a CAD refund. `ProfitabilityService` converts
 * each one into the order currency with explicit FX rates and reports the rates it used.
 */
export interface ProfitabilityInput {
  /** Currency the P&L is expressed in (normally `orders.currency_code`). */
  currency: string
  subtotal?: unknown
  discountTotal?: unknown
  promotionTotal?: unknown
  shippingTotal?: unknown
  shippingDiscountTotal?: unknown
  taxTotal?: unknown
  shippingTaxTotal?: unknown
  grandTotal?: unknown
  marketplaceFeesTotal?: unknown
  paymentProcessingFeesTotal?: unknown
  refundedTotal?: unknown
  cogsTotal?: unknown
  shippingCostTotal?: unknown
  /**
   * Tax the marketplace collected from the buyer *and* remitted on the seller's
   * behalf (Marketplace Facilitator Tax). It is withheld from the payout, so it is
   * never seller revenue.
   */
  marketplaceWithheldTaxTotal?: unknown
  /** `marketplace_facilitator | seller | none`. */
  taxCollectionModel?: TaxCollectionModelValue | string | null
  /**
   * Explicit FX overrides quoted against USD (`{ INR: 84.1 }`). Order-level rates
   * recorded during import (`channel_metadata.fxConversions`) are passed here so a
   * recompute never drifts from the rates the order was created with.
   */
  exchangeRates?: Record<string, number>
}

export interface ProfitabilityResult {
  netSales: PriceMoney
  netProceeds: PriceMoney
  grossProfit: PriceMoney
  netProfit: PriceMoney
  /** Tax withheld by the marketplace and therefore never received by the seller. */
  withheldTax: PriceMoney
  /** Tax the seller actually owes the tax authority (zero for facilitator orders). */
  remittedTax: PriceMoney
  /** `source->target` rates used while converting, ready to be stored for audit. */
  fxApplied: Record<string, number>
}

/**
 * Single implementation of seller-side P&L.
 *
 * The formulas are deliberately conservative:
 *
 *  - `netSales`   = subtotal − discount − promotion + shipping − shipping discount
 *  - `netProceeds`= grand_total − withheld marketplace tax − marketplace fees
 *                   − payment processing fees − refunds
 *  - `grossProfit`= netSales − COGS − shipping cost
 *  - `netProfit`  = netProceeds − COGS − shipping cost − tax the seller remits
 *
 * Marketplace Facilitator Tax is the subtle part. When Amazon/eBay/Etsy collect the
 * buyer's tax and remit it themselves, `grand_total` still contains that tax (the buyer
 * paid it) but the seller never receives it. It is therefore removed from
 * `netProceeds` exactly once and is **never** deducted again as a seller liability —
 * double counting it used to understate profit by the whole tax amount.
 */
export class ProfitabilityService {
  /**
   * Rebuilds USD-quoted FX overrides from the `fxConversions` map stored on
   * `orders.channel_metadata` (`{ 'INR->USD': 0.01197, reporting: 1 }`).
   *
   * A rate recorded as `X->USD` converts straight back into the USD-quoted table
   * these helpers expect. Entries quoted against an order currency other than USD
   * are skipped: they cannot be expressed in the USD table without compounding
   * three unknown conversions, and silently guessing is worse than using the
   * published rate.
   */
  static ratesFromMetadata(metadata: unknown): Record<string, number> {
    const source = (metadata ?? {}) as Record<string, any>
    const conversions = source.fxConversions
    if (!conversions || typeof conversions !== 'object') return {}
    const rates: Record<string, number> = {}
    for (const [key, value] of Object.entries(conversions as Record<string, unknown>)) {
      const match = /^([A-Z]{3})->([A-Z]{3})$/.exec(key)
      const rate = Number(value)
      if (!match || !Number.isFinite(rate) || rate <= 0) continue
      const [, from, to] = match
      // `from->USD` at rate R means 1 unit of `from` buys R USD. The FX table is
      // quoted the other way round (units of a currency per 1 USD), so invert it.
      if (to === 'USD' && from !== 'USD') rates[from] = 1 / rate
    }
    return rates
  }

  static compute(input: ProfitabilityInput): ProfitabilityResult {
    const currency = normalizeCurrencyCode(input.currency)
    const rates = { ...DEFAULT_CURRENCY_RATES, ...(input.exchangeRates ?? {}) }
    const fxApplied: Record<string, number> = {}

    /** Amount of `value` expressed in the P&L currency. */
    const toOrderCurrency = (value: unknown): PriceMoney => {
      if (value === null || value === undefined || value === '') return money(0, currency)
      const source = currencyOf(value, currency)
      if (source === currency) return money(amountOf(value), currency)
      const rate = exchangeRateBetween(source, currency, rates)
      if (!(rate > 0)) return money(0, currency)
      fxApplied[`${source}->${currency}`] = rate
      return money(roundMoney(amountOf(value) * rate), currency)
    }
    const amountIn = (value: unknown) => amountOf(toOrderCurrency(value))

    // The order currency is the reporting currency of the P&L; a grand total booked in
    // another currency is converted like every other amount.
    const grand = amountIn(input.grandTotal)

    const netSales = roundMoney(
      amountIn(input.subtotal) -
        amountIn(input.discountTotal) -
        amountIn(input.promotionTotal) +
        amountIn(input.shippingTotal) -
        amountIn(input.shippingDiscountTotal)
    )

    const taxTotal = amountIn(input.taxTotal)
    const shippingTaxTotal = amountIn(input.shippingTaxTotal)
    const isFacilitator = input.taxCollectionModel === TaxCollectionModel.MARKETPLACE_FACILITATOR
    const withheldInput = input.marketplaceWithheldTaxTotal

    // For facilitator orders the marketplace remits the tax. When the platform did not
    // report a withheld total explicitly, the seller's own tax columns are the best
    // available evidence of what was withheld — using them once here is exactly the
    // rule that avoids deducting the same tax again in `netProfit`.
    const withheldTax = isFacilitator
      ? withheldInput === null || withheldInput === undefined || withheldInput === ''
        ? roundMoney(taxTotal + shippingTaxTotal)
        : amountIn(withheldInput)
      : 0
    // A seller-remitting merchant owes the tax authority; a facilitator-settled order
    // is already netted through `withheldTax`, so nothing is deducted twice.
    const remittedTax = isFacilitator ? 0 : roundMoney(taxTotal + shippingTaxTotal)

    const fees = amountIn(input.marketplaceFeesTotal) + amountIn(input.paymentProcessingFeesTotal)
    const refunded = amountIn(input.refundedTotal)
    const cogs = amountIn(input.cogsTotal)
    const shippingCost = amountIn(input.shippingCostTotal)

    const netProceeds = roundMoney(grand - withheldTax - fees - refunded)
    const grossProfit = roundMoney(netSales - cogs - shippingCost)
    const netProfit = roundMoney(netProceeds - cogs - shippingCost - remittedTax)

    return {
      netSales: money(netSales, currency),
      netProceeds: money(netProceeds, currency),
      grossProfit: money(grossProfit, currency),
      netProfit: money(netProfit, currency),
      withheldTax: money(withheldTax, currency),
      remittedTax: money(remittedTax, currency),
      fxApplied,
    }
  }
}
