/**
 * OrderSyncNormalizerService — deterministic normalizers that translate raw
 * marketplace order payloads into the canonical `CreateOrderInput` consumed by
 * `OrderService.createOrder()`.
 *
 * Supported sources:
 *  - Amazon SP-API `Orders` + `OrderItems` (MFN/AFN, Marketplace Facilitator Tax,
 *    Earliest/LatestShipDate, ItemTax / ShippingTax / PromotionDiscount /
 *    ShippingDiscount)
 *  - eBay Fulfillment API `getOrders` (pricingSummary, lineItems, taxes,
 *    eBay Collect & Remit taxes, appliedPromotions, delivery discount)
 *  - Etsy Open API v3 `getShopReceipt` (integer amounts + divisor, transactions,
 *    variations, gift wrap, VAT, coupon discounts)
 *  - MedusaJS v2 `Order` (display_id, region, sales channel, adjustments and
 *    tax_lines per line item)
 *  - Seller Core canonical JSON (already-normalized `CreateOrderInput`)
 *
 * Every monetary value becomes a self-contained `PriceMoney` object, so a USD
 * marketplace order can still carry an INR carrier cost or INR COGS. Normalizers
 * are pure functions: the same payload always yields the same output, which is
 * what makes the imports unit-testable and idempotent.
 */
import type SellerAccount from '#models/seller_account'
import {
  FulfillmentChannel,
  type FulfillmentChannelValue,
  OrderPaymentStatus,
  OrderSourceType,
  OrderStatus,
  TaxCollectionModel,
  type TaxCollectionModelValue,
} from '../enums/index.js'
import {
  type AdjustmentEntry,
  type PriceMoney,
  type TaxLineEntry,
  money,
  normalizeCurrencyCode,
  normalizePriceMoney,
  roundMoney,
} from '../types/price.js'
import type { CreateOrderInput, OrderLineInput } from './order_service.js'

/** Marketplaces with a dedicated normalizer. */
export type MarketplacePlatform = 'amazon' | 'ebay' | 'etsy' | 'medusa' | 'seller_core'

/** The currency/metadata contract every normalizer must satisfy. */
export interface NormalizedOrder {
  platform: MarketplacePlatform
  marketplaceCode: string
  /** Amazon AmazonOrderId / eBay orderId / Etsy receipt_id / Medusa order.id. */
  externalOrderId: string
  /** Human-facing number (Medusa display_id, eBay legacyOrderId, Etsy receipt #). */
  externalDisplayId: string | null
  /** Internal unique order number for `orders.order_number`. */
  orderNumber: string
  /** Amazon MarketplaceId / eBay marketplace id / Etsy shop_id / Medusa region. */
  marketplaceSiteId: string | null
  currencyCode: string
  reportingCurrencyCode: string
  exchangeRate: number
  fulfillmentChannel: FulfillmentChannelValue
  taxCollectionModel: TaxCollectionModelValue
  channelMetadata: Record<string, any>
  status: string
  paymentStatus: string
  orderedAt: string | null
  earliestShipAt: string | null
  latestShipAt: string | null
  earliestDeliveryAt: string | null
  latestDeliveryAt: string | null
  /** Marketplace-authoritative order totals. */
  subtotal: PriceMoney
  discountTotal: PriceMoney
  promotionTotal: PriceMoney
  shippingTotal: PriceMoney
  shippingDiscountTotal: PriceMoney
  taxTotal: PriceMoney
  shippingTaxTotal: PriceMoney
  marketplaceWithheldTaxTotal: PriceMoney
  grandTotal: PriceMoney
  marketplaceFeesTotal: PriceMoney
  paymentProcessingFeesTotal: PriceMoney
  shippingCostTotal: PriceMoney
  cogsTotal: PriceMoney
  customer: {
    externalCustomerId: string | null
    fullName: string
    email: string | null
    proxyEmail: string | null
    phone: string | null
  }
  shippingAddress: {
    recipientName: string
    line1: string
    line2?: string | null
    city: string
    stateProvince?: string | null
    postalCode: string
    countryCode: string
    phone?: string | null
  } | null
  lines: OrderLineInput[]
  buyerNotes: string | null
  internalNotes: string | null
}

/** Thrown when a payload cannot be normalized; carries the offending platform. */
export class OrderSyncNormalizationError extends Error {
  constructor(
    message: string,
    public readonly platform: MarketplacePlatform | 'unknown',
    public readonly code: string = 'INVALID_MARKETPLACE_PAYLOAD'
  ) {
    super(message)
    this.name = 'OrderSyncNormalizationError'
  }
}

/** Context resolved from the owning seller account. */
export interface NormalizerContext {
  sellerAccount?: Pick<
    SellerAccount,
    'id' | 'defaultCurrency' | 'marketplaceRegion' | 'externalSellerId'
  > | null
  reportingCurrencyCode?: string
  exchangeRate?: number
}

type Json = Record<string, any>

const SENSITIVE_DEFAULT_LIMIT = 262144

function asObject(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function firstObject(value: unknown): Json {
  return asObject(asArray(value)[0])
}

/**
 * Parses a platform decimal amount. Etsy sends integer minor units plus a
 * divisor, Amazon/eBay send decimal strings, Medusa sends plain numbers.
 */
export function parsePlatformAmount(value: unknown, divisor: number = 1): number {
  if (value === null || value === undefined || value === '') return 0
  const numeric = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(numeric)) return 0
  const safeDivisor = Number.isFinite(divisor) && divisor > 0 ? divisor : 1
  return roundMoney(numeric / safeDivisor)
}

/**
 * Reads any of the platform money representations into a PriceMoney:
 *  - Etsy `{ amount, divisor, currency_code }`
 *  - Amazon `{ Amount, CurrencyCode }`
 *  - eBay `{ value, currency }`
 *  - Medusa `{ amount, currency_code }` or a bare number
 */
export function readMoney(value: unknown, fallbackCurrency: string): PriceMoney {
  if (value === null || value === undefined || value === '') return money(0, fallbackCurrency)
  if (typeof value === 'number' || (typeof value === 'string' && !value.trim().startsWith('{'))) {
    return money(parsePlatformAmount(value), fallbackCurrency)
  }
  if (typeof value === 'string') {
    try {
      return readMoney(JSON.parse(value), fallbackCurrency)
    } catch {
      return money(0, fallbackCurrency)
    }
  }
  const obj = asObject(value)
  const currency = normalizeCurrencyCode(
    obj.currency_code ?? obj.CurrencyCode ?? obj.currency ?? fallbackCurrency,
    fallbackCurrency
  )
  const divisor = Number(obj.divisor ?? 1) || 1
  const amount = obj.amount ?? obj.Amount ?? obj.value ?? obj.Value ?? obj.total ?? 0
  return money(parsePlatformAmount(amount, divisor), currency)
}

/** Reads a whole-currency amount (Etsy divisor style) from a money object. */
function amountOfMoney(value: PriceMoney): number {
  return value.amount
}

function sumOfMoney(values: PriceMoney[], currency: string): PriceMoney {
  return money(
    values.reduce((total, value) => total + value.amount, 0),
    currency
  )
}

/** ISO timestamp or null; tolerates epoch millis, epoch seconds and ISO strings. */
export function toIsoOrNull(value: unknown, unit: 'ms' | 's' | 'auto' = 'auto'): string | null {
  if (value === null || value === undefined || value === '') return null
  let date: Date
  if (value instanceof Date) {
    date = value
  } else if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
    const numeric = Number(value)
    // Etsy timestamps are epoch seconds; 13-digit values are already millis.
    const millis = unit === 'ms' || (unit === 'auto' && numeric > 1e11) ? numeric : numeric * 1000
    date = new Date(millis)
  } else {
    date = new Date(String(value))
  }
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function nonEmptyString(value: unknown): string | null {
  const text = String(value ?? '').trim()
  return text ? text : null
}

function joinAddress(...parts: Array<unknown>): string {
  return parts
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ')
}

/** Collapses a platform order status into the Seller Core status vocabulary. */
export function normalizeStatus(
  platform: MarketplacePlatform,
  rawStatus: unknown,
  options: { isPaid?: boolean; isCancelled?: boolean } = {}
): { status: string; paymentStatus: string } {
  const value = String(rawStatus ?? '')
    .trim()
    .toLowerCase()
  const cancelled = ['canceled', 'cancelled', 'cancel', 'voided', 'unfulfillable']
  const fulfilled = ['fulfilled', 'complete', 'completed', 'shipped', 'delivered']
  const processing = ['processing', 'in_progress', 'unshipped', 'partiallyshipped', 'partial']

  if (options.isCancelled || cancelled.includes(value)) {
    return { status: OrderStatus.CANCELLED, paymentStatus: OrderPaymentStatus.REFUNDED }
  }
  if (fulfilled.includes(value)) {
    return { status: OrderStatus.FULFILLED, paymentStatus: OrderPaymentStatus.PAID }
  }
  if (processing.includes(value)) {
    const status =
      value === 'partiallyshipped' || value === 'partial'
        ? OrderStatus.PARTIALLY_FULFILLED
        : OrderStatus.PROCESSING
    return { status, paymentStatus: OrderPaymentStatus.PAID }
  }
  if (value === 'pending' || value === 'open') {
    return {
      status: OrderStatus.PENDING,
      paymentStatus: options.isPaid ? OrderPaymentStatus.PAID : OrderPaymentStatus.UNPAID,
    }
  }
  if (platform === 'etsy' && options.isPaid) {
    return { status: OrderStatus.CONFIRMED, paymentStatus: OrderPaymentStatus.PAID }
  }
  return {
    status: OrderStatus.CONFIRMED,
    paymentStatus: options.isPaid === false ? OrderPaymentStatus.UNPAID : OrderPaymentStatus.PAID,
  }
}

/**
 * Maps a platform fulfilment channel onto the canonical set. Amazon `AFN`
 * means Amazon ships it, `MFN` means the merchant does; eBay/Etsy/Medusa are
 * merchant fulfilled unless the account is configured as 3PL.
 */
export function normalizeFulfillmentChannel(
  platform: MarketplacePlatform,
  rawChannel: unknown
): FulfillmentChannelValue {
  const value = String(rawChannel ?? '')
    .trim()
    .toUpperCase()
  const known: string[] = Object.values(FulfillmentChannel)
  const match = known.find((channel) => channel.toUpperCase() === value)
  if (match) return match as FulfillmentChannelValue
  if (value === 'AMAZON' || value === 'AMAZON_FULFILLED') return FulfillmentChannel.AFN
  if (value === 'MERCHANT' || value === 'SELLER_FULFILLED') return FulfillmentChannel.MFN
  if (platform === 'amazon') return FulfillmentChannel.MFN
  if (platform === 'medusa') return FulfillmentChannel.DIRECT
  return FulfillmentChannel.MFN
}

/** Empty totals helper so every normalized order has the full money surface. */
function totals(currency: string, values: Partial<Record<string, PriceMoney>> = {}) {
  const zero = () => money(0, currency)
  return {
    subtotal: values.subtotal ?? zero(),
    discountTotal: values.discountTotal ?? zero(),
    promotionTotal: values.promotionTotal ?? zero(),
    shippingTotal: values.shippingTotal ?? zero(),
    shippingDiscountTotal: values.shippingDiscountTotal ?? zero(),
    taxTotal: values.taxTotal ?? zero(),
    shippingTaxTotal: values.shippingTaxTotal ?? zero(),
    marketplaceWithheldTaxTotal: values.marketplaceWithheldTaxTotal ?? zero(),
    grandTotal: values.grandTotal ?? zero(),
    marketplaceFeesTotal: values.marketplaceFeesTotal ?? zero(),
    paymentProcessingFeesTotal: values.paymentProcessingFeesTotal ?? zero(),
    shippingCostTotal: values.shippingCostTotal ?? zero(),
    cogsTotal: values.cogsTotal ?? zero(),
  }
}

/** Builds the normalizer context from an optional seller account row. */
function contextCurrency(context: NormalizerContext, fallback = 'USD') {
  return {
    reportingCurrencyCode: normalizeCurrencyCode(context.reportingCurrencyCode, 'USD'),
    exchangeRate:
      Number.isFinite(Number(context.exchangeRate)) && Number(context.exchangeRate) > 0
        ? Number(context.exchangeRate)
        : 1,
    defaultCurrency: normalizeCurrencyCode(context.sellerAccount?.defaultCurrency, fallback),
  }
}

const ISO2 = /^[A-Z]{2}$/

function normalizeCountryCode(value: unknown, fallback: string): string {
  const code = String(value ?? '')
    .trim()
    .toUpperCase()
  if (ISO2.test(code)) return code
  if (code === 'USA' || code === 'US') return 'US'
  if (code === 'GB' || code === 'UK' || code === 'GBR') return 'GB'
  if (code === 'IND' || code === 'IN') return 'IN'
  if (code === 'CAN' || code === 'CA') return 'CA'
  if (code === 'MEX' || code === 'MX') return 'MX'
  return fallback
}

/* ==========================================================================
 * Amazon SP-API
 * ========================================================================== */

/**
 * Normalizes an Amazon SP-API order plus its `getOrderItems` response.
 *
 * @see https://developer-docs.amazon.com/sp-api/docs/orders-api-v0-reference
 */
export function normalizeAmazonOrder(
  payload: unknown,
  orderItemsPayload: unknown,
  context: NormalizerContext = {}
): NormalizedOrder {
  const body = asObject(payload)
  const order = asObject(body.payload?.Orders?.[0] ?? body.Orders?.[0] ?? body.order ?? body)
  const amazonOrderId = nonEmptyString(order.AmazonOrderId ?? order.amazonOrderId)
  if (!amazonOrderId) {
    throw new OrderSyncNormalizationError(
      'Amazon payload is missing payload.Orders[].AmazonOrderId',
      'amazon'
    )
  }

  const contextValues = contextCurrency(context)
  const currency = normalizeCurrencyCode(
    asObject(order.OrderTotal).CurrencyCode ??
      asObject(order.SalesChannel).CurrencyCode ??
      contextValues.defaultCurrency
  )

  const itemsBody = asObject(orderItemsPayload)
  const rawItems =
    asArray(itemsBody.payload?.OrderItems).length > 0
      ? asArray(itemsBody.payload?.OrderItems)
      : asArray(itemsBody.OrderItems).length > 0
        ? asArray(itemsBody.OrderItems)
        : asArray(body.payload?.OrderItems).length > 0
          ? asArray(body.payload?.OrderItems)
          : asArray(body.OrderItems).length > 0
            ? asArray(body.OrderItems)
            : asArray(order.OrderItems)

  if (rawItems.length === 0) {
    throw new OrderSyncNormalizationError(
      `Amazon order ${amazonOrderId} has no OrderItems; pass the getOrderItems payload`,
      'amazon'
    )
  }

  const fulfillmentChannel = normalizeFulfillmentChannel('amazon', order.FulfillmentChannel)
  const taxCollectionModel: TaxCollectionModelValue =
    String(order.TaxCollection?.Model ?? '').toLowerCase() === 'marketplacefacilitator'
      ? TaxCollectionModel.MARKETPLACE_FACILITATOR
      : String(order.TaxCollection?.ResponsibleParty ?? '').toLowerCase() === 'marketplace'
        ? TaxCollectionModel.MARKETPLACE_FACILITATOR
        : TaxCollectionModel.SELLER

  const lines: OrderLineInput[] = rawItems.map((rawItem) => {
    const item = asObject(rawItem)
    const quantity = Math.max(1, Number(item.QuantityOrdered ?? item.QuantityShipped ?? 1) || 1)
    const itemPrice = readMoney(item.ItemPrice, currency)
    const itemTax = readMoney(item.ItemTax, currency)
    const shippingPrice = readMoney(item.ShippingPrice, currency)
    const shippingTax = readMoney(item.ShippingTax, currency)
    const promotion = readMoney(item.PromotionDiscount, currency)
    const shippingDiscount = readMoney(item.ShippingDiscount, currency)
    const itemTaxCurrency = itemTax.currency_code

    // Amazon reports item + shipping tax separately; keep the jurisdiction
    // breakdown when Amazon supplies its own tax lines.
    const taxLines: TaxLineEntry[] = []
    if (itemTax.amount > 0) {
      taxLines.push({ code: 'ITEM_TAX', description: 'Amazon item tax', total: itemTax })
    }
    if (shippingTax.amount > 0) {
      taxLines.push({
        code: 'SHIPPING_TAX',
        description: 'Amazon shipping tax',
        total: shippingTax,
      })
    }

    const adjustments: AdjustmentEntry[] = []
    if (promotion.amount > 0) {
      adjustments.push({
        code: 'PromotionDiscount',
        description:
          nonEmptyString(item.PromotionDiscountOptions?.[0]?.PromotionType) ?? 'Promotion',
        amount: promotion,
      })
    }
    if (shippingDiscount.amount > 0) {
      adjustments.push({
        code: 'ShippingDiscount',
        description: 'Shipping promotion',
        amount: shippingDiscount,
      })
    }

    const unitPrice = money(roundMoney(itemPrice.amount / quantity), itemPrice.currency_code)

    return {
      externalOrderLineId: nonEmptyString(item.OrderItemId),
      // ASIN is Amazon's listing identity; the SKU can differ per fulfilment channel.
      externalListingId: nonEmptyString(item.ASIN),
      externalVariantId: nonEmptyString(item.SellerSKU),
      sku: nonEmptyString(item.SellerSKU) ?? nonEmptyString(item.ASIN) ?? 'UNKNOWN-SKU',
      title: nonEmptyString(item.Title) ?? nonEmptyString(item.SellerSKU) ?? 'Amazon item',
      quantityOrdered: quantity,
      unitPrice,
      taxTotal: money(itemTax.amount + shippingTax.amount, itemTaxCurrency),
      shippingTotal: shippingPrice,
      shippingTaxTotal: shippingTax,
      promotionTotal: promotion,
      shippingDiscountTotal: shippingDiscount,
      taxLines,
      adjustments,
      customAttributes: {
        asin: nonEmptyString(item.ASIN),
        orderItemId: nonEmptyString(item.OrderItemId),
        conditionId: nonEmptyString(item.ConditionId),
        giftWrapLevel: nonEmptyString(item.GiftWrapLevel),
        giftMessageText: nonEmptyString(item.GiftMessageText),
        buyerCustomizedInfo: asObject(item.BuyerInfo?.BuyerCustomizedInfo),
        isGift: Boolean(item.IsGift),
        conditionSubtypeId: nonEmptyString(item.ConditionSubtypeId),
      },
      fulfillmentChannel:
        nonEmptyString(item.FulfillmentChannel) !== null
          ? normalizeFulfillmentChannel('amazon', item.FulfillmentChannel)
          : fulfillmentChannel,
    }
  })

  const subtotal = sumOfMoney(
    lines.map((line) =>
      money(amountOfMoney(line.unitPrice as PriceMoney) * line.quantityOrdered, currency)
    ),
    currency
  )
  const shippingTotal = sumOfMoney(
    lines.map((line) => line.shippingTotal as PriceMoney),
    currency
  )
  const shippingTaxTotal = sumOfMoney(
    lines.map((line) => (line.shippingTaxTotal as PriceMoney) ?? money(0, currency)),
    currency
  )
  // Line totals include the shipping tax; the order-level item tax must not.
  const lineTotalTax = sumOfMoney(
    lines.map((line) => (line.taxTotal as PriceMoney) ?? money(0, currency)),
    currency
  )
  const taxTotal = money(roundMoney(lineTotalTax.amount - shippingTaxTotal.amount), currency)
  const promotionTotal = sumOfMoney(
    lines.map((line) => (line.promotionTotal as PriceMoney) ?? money(0, currency)),
    currency
  )
  const shippingDiscountTotal = sumOfMoney(
    lines.map((line) => (line.shippingDiscountTotal as PriceMoney) ?? money(0, currency)),
    currency
  )

  const orderTotal = readMoney(order.OrderTotal, currency)
  const grandTotal =
    orderTotal.amount > 0
      ? orderTotal
      : money(
          roundMoney(
            subtotal.amount -
              promotionTotal.amount +
              shippingTotal.amount -
              shippingDiscountTotal.amount +
              taxTotal.amount +
              shippingTaxTotal.amount
          ),
          currency
        )

  const status = normalizeStatus('amazon', order.OrderStatus, {
    isPaid: ['shipped', 'unshipped', 'partiallyshipped', 'invoiceunconfirmed'].includes(
      String(order.OrderStatus ?? '').toLowerCase()
    ),
    isCancelled: String(order.OrderStatus ?? '').toLowerCase() === 'canceled',
  })

  const address = asObject(order.ShippingAddress)
  const buyer = asObject(order.BuyerInfo)

  return {
    platform: 'amazon',
    marketplaceCode: 'amazon',
    externalOrderId: amazonOrderId,
    externalDisplayId: nonEmptyString(order.SellerOrderId),
    orderNumber: amazonOrderId,
    marketplaceSiteId: nonEmptyString(order.MarketplaceId),
    currencyCode: currency,
    reportingCurrencyCode: contextValues.reportingCurrencyCode,
    exchangeRate: contextValues.exchangeRate,
    fulfillmentChannel,
    taxCollectionModel,
    channelMetadata: {
      amazonOrderId,
      salesChannel: nonEmptyString(order.SalesChannel) ?? 'Amazon',
      isPrime: Boolean(order.IsPrime),
      isBusinessOrder: Boolean(order.IsBusinessOrder),
      isPremiumOrder: Boolean(order.IsPremiumOrder),
      isGlobalExpressEnabled: Boolean(order.IsGlobalExpressEnabled),
      isSoldByAB: Boolean(order.IsSoldByAB),
      isIBA: Boolean(order.IsIBA),
      isAccessPointOrder: Boolean(order.IsAccessPointOrder),
      fulfillmentSupplySourceId: nonEmptyString(order.FulfillmentSupplySourceId),
      paymentMethodSummary: nonEmptyString(order.PaymentMethod) ?? 'Amazon',
      buyerInvoicePreference: nonEmptyString(order.BuyerInvoicePreference),
      taxCollection: asObject(order.TaxCollection),
      itemCount: lines.length,
    },
    status: status.status,
    paymentStatus: status.paymentStatus,
    orderedAt: toIsoOrNull(order.PurchaseDate),
    earliestShipAt: toIsoOrNull(order.EarliestShipDate),
    latestShipAt: toIsoOrNull(order.LatestShipDate),
    earliestDeliveryAt: toIsoOrNull(order.EarliestDeliveryDate),
    latestDeliveryAt: toIsoOrNull(order.LatestDeliveryDate),
    ...totals(currency, {
      subtotal,
      promotionTotal,
      shippingTotal,
      shippingDiscountTotal,
      taxTotal,
      shippingTaxTotal,
      marketplaceWithheldTaxTotal:
        taxCollectionModel === TaxCollectionModel.MARKETPLACE_FACILITATOR
          ? money(taxTotal.amount + shippingTaxTotal.amount, currency)
          : money(0, currency),
      grandTotal,
    }),
    customer: {
      externalCustomerId: nonEmptyString(buyer.BuyerEmail) ?? nonEmptyString(order.BuyerEmail),
      fullName: nonEmptyString(address.Name) ?? nonEmptyString(buyer.BuyerName) ?? 'Amazon Buyer',
      email: nonEmptyString(buyer.BuyerEmail) ?? nonEmptyString(order.BuyerEmail),
      proxyEmail: nonEmptyString(order.BuyerEmail)?.includes('marketplace.amazon')
        ? nonEmptyString(order.BuyerEmail)
        : null,
      phone: nonEmptyString(address.Phone),
    },
    shippingAddress: nonEmptyString(address.AddressLine1)
      ? {
          recipientName: nonEmptyString(address.Name) ?? 'Amazon Buyer',
          line1: String(address.AddressLine1),
          line2: nonEmptyString(address.AddressLine2),
          city: String(address.City ?? ''),
          stateProvince: nonEmptyString(address.StateOrRegion),
          postalCode: String(address.PostalCode ?? ''),
          countryCode: normalizeCountryCode(address.CountryCode, 'US'),
          phone: nonEmptyString(address.Phone),
        }
      : null,
    lines,
    buyerNotes: nonEmptyString(order.BuyerNotes) ?? nonEmptyString(buyer.BuyerComments),
    internalNotes: nonEmptyString(order.SellerNote),
  }
}

/* ==========================================================================
 * eBay Fulfillment API
 * ========================================================================== */

/**
 * Normalizes an eBay Fulfillment API `getOrders` order.
 *
 * eBay reports tax in `pricingSummary.tax`, collects & remits marketplace tax in
 * `ebayCollectAndRemitTaxes`, and expresses promotions through `appliedPromotions`.
 *
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/methods/getOrders
 */
export function normalizeEbayOrder(
  payload: unknown,
  context: NormalizerContext = {}
): NormalizedOrder {
  const body = asObject(payload)
  const order = asObject(asArray(body.orders)[0] ?? body.order ?? body)
  const orderId = nonEmptyString(order.orderId)
  if (!orderId) {
    throw new OrderSyncNormalizationError('eBay payload is missing orders[].orderId', 'ebay')
  }
  const contextValues = contextCurrency(context)
  const summary = asObject(order.pricingSummary)
  const currency = normalizeCurrencyCode(
    asObject(summary.total).currency ??
      asObject(summary.priceSubtotal).currency ??
      contextValues.defaultCurrency
  )

  const fulfillmentStep = firstObject(order.fulfillmentStartInstructions)
  const shippingStep = asObject(fulfillmentStep.shippingStep)
  const shipTo = asObject(shippingStep.shipTo)
  const shipToAddress = asObject(shipTo.contactAddress)
  const buyer = asObject(order.buyer)

  const rawLines = asArray(order.lineItems)
  if (rawLines.length === 0) {
    throw new OrderSyncNormalizationError(`eBay order ${orderId} has no lineItems`, 'ebay')
  }

  const lines: OrderLineInput[] = rawLines.map((rawLine) => {
    const line = asObject(rawLine)
    const quantity = Math.max(1, Number(line.quantity ?? 1) || 1)
    const lineCost = readMoney(line.lineItemCost, currency)
    const discountedCost = readMoney(line.discountedLineItemCost, currency)
    // eBay's discountedLineItemCost already includes the discount, so the delta
    // is the applied seller discount for this line.
    const discountAmount =
      discountedCost.amount > 0 && lineCost.amount > discountedCost.amount
        ? roundMoney(lineCost.amount - discountedCost.amount)
        : 0

    const rawTaxes = asArray(line.taxes)
    const collectAndRemit = asArray(line.ebayCollectAndRemitTaxes)
    const taxTotal = money(
      rawTaxes.reduce<number>(
        (total, tax) => total + readMoney(asObject(tax).amount, currency).amount,
        0
      ) +
        collectAndRemit.reduce<number>(
          (total, tax) => total + readMoney(asObject(tax).amount, currency).amount,
          0
        ),
      currency
    )
    const taxLines: TaxLineEntry[] = [
      ...rawTaxes.map((tax) => {
        const entry = asObject(tax)
        return {
          code: String(entry.taxType ?? 'SALES_TAX'),
          rate: Number(entry.taxJurisdiction?.taxRate ?? 0) || null,
          description:
            nonEmptyString(entry.taxJurisdiction?.region) ?? String(entry.taxType ?? 'Tax'),
          total: readMoney(entry.amount, currency),
        } satisfies TaxLineEntry
      }),
      ...collectAndRemit.map((tax) => {
        const entry = asObject(tax)
        return {
          code: 'EBAY_COLLECT_AND_REMIT',
          rate: null,
          description:
            nonEmptyString(entry.collectionMethod) ??
            nonEmptyString(entry.taxType) ??
            'eBay Collect & Remit',
          total: readMoney(entry.amount, currency),
        } satisfies TaxLineEntry
      }),
    ]

    const promotions = asArray(line.appliedPromotions)
    const promotionTotal = money(
      promotions.reduce<number>((total, promo) => {
        const entry = asObject(promo)
        return total + readMoney(entry.amount, currency).amount
      }, 0),
      currency
    )
    const adjustments: AdjustmentEntry[] = promotions.map((promo) => {
      const entry = asObject(promo)
      return {
        code: nonEmptyString(entry.promotionType) ?? 'PROMOTION',
        promotion_id: nonEmptyString(entry.promotionId),
        description: nonEmptyString(entry.description) ?? 'eBay promotion',
        amount: readMoney(entry.amount, currency),
      }
    })

    return {
      externalOrderLineId: nonEmptyString(line.lineItemId),
      externalListingId: nonEmptyString(line.legacyItemId),
      externalVariantId: nonEmptyString(line.sku),
      sku: nonEmptyString(line.sku) ?? nonEmptyString(line.legacyItemId) ?? 'UNKNOWN-SKU',
      title: nonEmptyString(line.title) ?? 'eBay item',
      quantityOrdered: quantity,
      unitPrice: money(roundMoney(lineCost.amount / quantity), lineCost.currency_code),
      discountTotal: money(discountAmount, currency),
      promotionTotal,
      taxTotal,
      shippingTotal: readMoney(line.deliveryCost, currency),
      taxLines,
      adjustments,
      customAttributes: {
        legacyItemId: nonEmptyString(line.legacyItemId),
        lineItemId: nonEmptyString(line.lineItemId),
        itemLocation: asObject(line.itemLocation),
        lineItemFulfillmentStatus: nonEmptyString(line.lineItemFulfillmentStatus),
        listingMarketplaceId: nonEmptyString(line.listingMarketplaceId),
        purchaseMarketplaceId: nonEmptyString(line.purchaseMarketplaceId),
        sku: nonEmptyString(line.sku),
      },
    }
  })

  const priceSubtotal = readMoney(summary.priceSubtotal, currency)
  const deliveryCost = readMoney(summary.deliveryCost, currency)
  const deliveryDiscount = readMoney(summary.deliveryDiscount, currency)
  const taxTotal = readMoney(summary.tax, currency)
  const priceDiscount = readMoney(summary.priceDiscount, currency)
  const grandTotalFromSummary = readMoney(summary.total, currency)

  const subtotal =
    priceSubtotal.amount > 0
      ? priceSubtotal
      : sumOfMoney(
          lines.map((line) =>
            money(amountOfMoney(line.unitPrice as PriceMoney) * line.quantityOrdered, currency)
          ),
          currency
        )
  const shippingTotal =
    deliveryCost.amount > 0
      ? deliveryCost
      : sumOfMoney(
          lines.map((line) => (line.shippingTotal as PriceMoney) ?? money(0, currency)),
          currency
        )
  const promotionTotal = sumOfMoney(
    lines.map((line) => (line.promotionTotal as PriceMoney) ?? money(0, currency)),
    currency
  )
  const shippingDiscountTotal = money(
    Math.max(
      deliveryDiscount.amount,
      sumOfMoney(
        lines.map((line) => (line.shippingDiscountTotal as PriceMoney) ?? money(0, currency)),
        currency
      ).amount
    ),
    currency
  )
  const lineTaxTotal = sumOfMoney(
    lines.map((line) => (line.taxTotal as PriceMoney) ?? money(0, currency)),
    currency
  )
  const effectiveTaxTotal = taxTotal.amount > 0 ? taxTotal : lineTaxTotal

  const hasCollectAndRemit = lines.some((line) =>
    (line.taxLines ?? []).some((taxLine) => taxLine.code === 'EBAY_COLLECT_AND_REMIT')
  )
  const taxCollectionModel = hasCollectAndRemit
    ? TaxCollectionModel.MARKETPLACE_FACILITATOR
    : TaxCollectionModel.SELLER

  const grandTotal =
    grandTotalFromSummary.amount > 0
      ? grandTotalFromSummary
      : money(
          roundMoney(
            subtotal.amount -
              priceDiscount.amount -
              promotionTotal.amount +
              shippingTotal.amount -
              shippingDiscountTotal.amount +
              effectiveTaxTotal.amount
          ),
          currency
        )

  const status = normalizeStatus('ebay', order.orderFulfillmentStatus ?? order.orderPaymentStatus, {
    isPaid: String(order.orderPaymentStatus ?? '').toUpperCase() === 'PAID',
    isCancelled: String(order.cancelStatus?.cancelState ?? '').toUpperCase() === 'CANCELED',
  })

  return {
    platform: 'ebay',
    marketplaceCode: 'ebay',
    externalOrderId: orderId,
    externalDisplayId: nonEmptyString(order.legacyOrderId),
    orderNumber: orderId,
    marketplaceSiteId:
      nonEmptyString(order.creationMarketplaceId) ??
      nonEmptyString(lines[0]?.customAttributes?.purchaseMarketplaceId) ??
      nonEmptyString(context.sellerAccount?.marketplaceRegion),
    currencyCode: currency,
    reportingCurrencyCode: contextValues.reportingCurrencyCode,
    exchangeRate: contextValues.exchangeRate,
    fulfillmentChannel: normalizeFulfillmentChannel('ebay', order.fulfillmentChannel),
    taxCollectionModel,
    channelMetadata: {
      eBayOrderId: orderId,
      legacyOrderId: nonEmptyString(order.legacyOrderId),
      creationMarketplaceId: nonEmptyString(order.creationMarketplaceId),
      salesRecordReference: nonEmptyString(order.salesRecordReference),
      soldDate: toIsoOrNull(order.soldDate),
      isGlobalShippingProgram: Boolean(order.isGlobalShippingProgram),
      shippingProgram: asObject(shippingStep.shippingProgram),
      buyerCheckoutNotes: nonEmptyString(order.buyerCheckoutNotes),
      paymentMethodSummary: nonEmptyString(order.paymentSummary?.paymentMethod) ?? 'eBay',
      totalFeeBasisAmount: readMoney(order.totalFeeBasisAmount, currency),
      ebayCollectAndRemitTax: Boolean(order.ebayCollectAndRemitTax),
      itemCount: lines.length,
    },
    status: status.status,
    paymentStatus: status.paymentStatus,
    orderedAt: toIsoOrNull(order.creationDate ?? order.soldDate),
    earliestShipAt: null,
    latestShipAt: toIsoOrNull(
      fulfillmentStep.shipByDate ?? fulfillmentStep.minEstimatedDeliveryDate
    ),
    earliestDeliveryAt: toIsoOrNull(fulfillmentStep.minEstimatedDeliveryDate),
    latestDeliveryAt: toIsoOrNull(fulfillmentStep.maxEstimatedDeliveryDate),
    ...totals(currency, {
      subtotal,
      discountTotal: priceDiscount,
      promotionTotal,
      shippingTotal,
      shippingDiscountTotal,
      taxTotal: effectiveTaxTotal,
      shippingTaxTotal: money(0, currency),
      marketplaceWithheldTaxTotal:
        taxCollectionModel === TaxCollectionModel.MARKETPLACE_FACILITATOR
          ? effectiveTaxTotal
          : money(0, currency),
      grandTotal,
    }),
    customer: {
      externalCustomerId: nonEmptyString(buyer.username),
      fullName: nonEmptyString(shipTo.fullName) ?? nonEmptyString(buyer.username) ?? 'eBay Buyer',
      email: nonEmptyString(shipTo.email),
      proxyEmail: null,
      phone: nonEmptyString(shipTo.primaryPhone),
    },
    shippingAddress: nonEmptyString(shipToAddress.addressLine1)
      ? {
          recipientName: nonEmptyString(shipTo.fullName) ?? 'eBay Buyer',
          line1: joinAddress(shipToAddress.addressLine1),
          line2: nonEmptyString(shipToAddress.addressLine2),
          city: String(shipToAddress.city ?? ''),
          stateProvince: nonEmptyString(shipToAddress.stateOrProvince),
          postalCode: String(shipToAddress.postalCode ?? ''),
          countryCode: normalizeCountryCode(shipToAddress.countryCode, 'US'),
          phone: nonEmptyString(shipTo.primaryPhone),
        }
      : null,
    lines,
    buyerNotes: nonEmptyString(order.buyerCheckoutNotes),
    internalNotes: null,
  }
}

/* ==========================================================================
 * Etsy Open API v3
 * ========================================================================== */

/** Etsy 3-letter currency codes are ISO-4217, so no mapping is needed. */
function etsyMoney(value: unknown, fallbackCurrency: string): PriceMoney {
  return readMoney(value, fallbackCurrency)
}

/**
 * Normalizes an Etsy Open API v3 shop receipt.
 *
 * Etsy money objects are `{ amount, divisor, currency_code }` where amount is an
 * integer in minor units; `readMoney` applies the divisor.
 *
 * @see https://developers.etsy.com/documentation/reference/#operation/getShopReceipt
 */
export function normalizeEtsyReceipt(
  payload: unknown,
  context: NormalizerContext = {}
): NormalizedOrder {
  const body = asObject(payload)
  const receipt = asObject(body.receipt ?? body)
  const receiptId = nonEmptyString(receipt.receipt_id ?? receipt.receiptId)
  if (!receiptId) {
    throw new OrderSyncNormalizationError('Etsy payload is missing receipt_id', 'etsy')
  }
  const contextValues = contextCurrency(context)
  const currency = normalizeCurrencyCode(
    asObject(receipt.grandtotal).currency_code ??
      asObject(receipt.subtotal).currency_code ??
      contextValues.defaultCurrency
  )

  const rawTransactions = asArray(receipt.transactions)
  if (rawTransactions.length === 0) {
    throw new OrderSyncNormalizationError(`Etsy receipt ${receiptId} has no transactions`, 'etsy')
  }

  const lines: OrderLineInput[] = rawTransactions.map((rawTransaction) => {
    const transaction = asObject(rawTransaction)
    const quantity = Math.max(1, Number(transaction.quantity ?? 1) || 1)
    const price = etsyMoney(transaction.price, currency)
    // Etsy reports the pre-discount price in `price` and the charged value in
    // `price.amount` after shop coupons, so the difference is a promotion.
    const variations = asArray(transaction.variations)
    const variationMap: Record<string, string> = {}
    for (const variation of variations) {
      const entry = asObject(variation)
      const propertyName = nonEmptyString(entry.formatted_name) ?? nonEmptyString(entry.property_id)
      const value = nonEmptyString(entry.formatted_value) ?? nonEmptyString(entry.value)
      if (propertyName && value) variationMap[propertyName] = value
    }
    const personalization = asArray(transaction.personalization)
      .map((entry) => {
        const item = asObject(entry)
        return {
          name: nonEmptyString(item.formatted_name) ?? null,
          value: nonEmptyString(item.formatted_value) ?? null,
        }
      })
      .filter((entry) => entry.name || entry.value)

    return {
      externalOrderLineId: nonEmptyString(transaction.transaction_id),
      externalListingId: nonEmptyString(transaction.listing_id),
      externalVariantId: nonEmptyString(transaction.product_id ?? transaction.offering_id),
      sku:
        nonEmptyString(transaction.sku) ??
        nonEmptyString(transaction.product_data?.sku) ??
        'UNKNOWN-SKU',
      title: nonEmptyString(transaction.title) ?? 'Etsy item',
      variantTitle: nonEmptyString(
        transaction.variations?.length ? Object.values(variationMap).join(' / ') : null
      ),
      quantityOrdered: quantity,
      unitPrice: price,
      shippingTotal: etsyMoney(transaction.shipping_cost, currency),
      taxLines: [],
      customAttributes: {
        listing_id: nonEmptyString(transaction.listing_id),
        product_id: nonEmptyString(transaction.product_id),
        offering_id: nonEmptyString(transaction.offering_id),
        variations: variationMap,
        personalization,
        is_personalizable: Boolean(transaction.is_personalizable),
        is_customizable: Boolean(transaction.is_customizable),
        is_gift: Boolean(receipt.is_gift),
        gift_message: nonEmptyString(receipt.gift_message),
        gift_wrap_price: etsyMoney(receipt.gift_wrap_price, currency),
      },
    }
  })

  const subtotal = readMoney(receipt.subtotal, currency)
  const totalPrice = readMoney(receipt.total_price, currency)
  const shippingTotal = readMoney(receipt.total_shipping_cost, currency)
  const taxTotal = readMoney(receipt.total_tax_cost, currency)
  const vatTotal = readMoney(receipt.total_vat_cost, currency)
  const discountAmount = readMoney(receipt.discount_amt, currency)
  const giftWrapPrice = readMoney(receipt.gift_wrap_price, currency)
  const grandTotalFromReceipt = readMoney(receipt.grandtotal, currency)

  const effectiveSubtotal =
    subtotal.amount > 0
      ? subtotal
      : sumOfMoney(
          lines.map((line) =>
            money(amountOfMoney(line.unitPrice as PriceMoney) * line.quantityOrdered, currency)
          ),
          currency
        )
  // `total_price` is what the buyer paid for items before shipping/tax; the gap
  // against subtotal is the shop coupon discount.
  const couponDiscount =
    totalPrice.amount > 0 && effectiveSubtotal.amount > totalPrice.amount
      ? money(roundMoney(effectiveSubtotal.amount - totalPrice.amount), currency)
      : discountAmount
  const effectiveTaxTotal = money(taxTotal.amount + vatTotal.amount, currency)
  const taxCollectedByMarketplace = Boolean(receipt.is_tax_collected_by_marketplace)
  const taxCollectionModel = taxCollectedByMarketplace
    ? TaxCollectionModel.MARKETPLACE_FACILITATOR
    : effectiveTaxTotal.amount > 0
      ? TaxCollectionModel.SELLER
      : TaxCollectionModel.NONE

  const grandTotal =
    grandTotalFromReceipt.amount > 0
      ? grandTotalFromReceipt
      : money(
          roundMoney(
            (totalPrice.amount > 0 ? totalPrice.amount : effectiveSubtotal.amount) +
              shippingTotal.amount +
              giftWrapPrice.amount +
              effectiveTaxTotal.amount
          ),
          currency
        )

  const status = normalizeStatus(
    'etsy',
    receipt.status ?? (receipt.is_shipped ? 'shipped' : undefined),
    {
      isPaid: Boolean(receipt.is_paid),
      isCancelled:
        Boolean(receipt.is_canceled) || String(receipt.status).toLowerCase() === 'canceled',
    }
  )

  return {
    platform: 'etsy',
    marketplaceCode: 'etsy',
    externalOrderId: receiptId,
    externalDisplayId: nonEmptyString(receipt.receipt_id)
      ? `#${String(receipt.receipt_id).padStart(9, '0')}`
      : null,
    orderNumber: receiptId,
    marketplaceSiteId: nonEmptyString(receipt.shop_id),
    currencyCode: currency,
    reportingCurrencyCode: contextValues.reportingCurrencyCode,
    exchangeRate: contextValues.exchangeRate,
    fulfillmentChannel: normalizeFulfillmentChannel('etsy', receipt.fulfillment_channel),
    taxCollectionModel,
    channelMetadata: {
      etsyReceiptId: receiptId,
      shopId: nonEmptyString(receipt.shop_id),
      isGift: Boolean(receipt.is_gift),
      giftMessage: nonEmptyString(receipt.gift_message),
      giftWrapPrice,
      messageFromBuyer: nonEmptyString(receipt.message_from_buyer),
      messageFromSeller: nonEmptyString(receipt.message_from_seller),
      isTaxCollectedByMarketplace: taxCollectedByMarketplace,
      wasShipped: Boolean(receipt.was_shipped),
      wasPaid: Boolean(receipt.was_paid),
      paymentMethodSummary: nonEmptyString(receipt.payment_method) ?? 'Etsy Payments',
      buyerUserId: nonEmptyString(receipt.buyer_user_id),
      couponCode: nonEmptyString(receipt.coupon_code),
      itemCount: lines.length,
    },
    status: status.status,
    paymentStatus: status.paymentStatus,
    orderedAt: toIsoOrNull(receipt.created_timestamp ?? receipt.created_at, 's'),
    earliestShipAt: null,
    latestShipAt: toIsoOrNull(receipt.estimated_ship_on ?? receipt.estimated_ship_date, 's'),
    earliestDeliveryAt: null,
    latestDeliveryAt: toIsoOrNull(
      receipt.estimated_delivery_on ?? receipt.estimated_delivery_date,
      's'
    ),
    ...totals(currency, {
      subtotal: effectiveSubtotal,
      promotionTotal: couponDiscount,
      shippingTotal,
      taxTotal: effectiveTaxTotal,
      marketplaceWithheldTaxTotal: taxCollectedByMarketplace
        ? effectiveTaxTotal
        : money(0, currency),
      grandTotal,
    }),
    customer: {
      externalCustomerId: nonEmptyString(receipt.buyer_user_id),
      fullName: nonEmptyString(receipt.name) ?? 'Etsy Buyer',
      email: nonEmptyString(receipt.buyer_email),
      proxyEmail: null,
      phone: null,
    },
    shippingAddress: nonEmptyString(receipt.first_line)
      ? {
          recipientName: nonEmptyString(receipt.name) ?? 'Etsy Buyer',
          line1: String(receipt.first_line),
          line2: nonEmptyString(receipt.second_line),
          city: String(receipt.city ?? ''),
          stateProvince: nonEmptyString(receipt.state),
          postalCode: String(receipt.zip ?? ''),
          countryCode: normalizeCountryCode(receipt.country_iso, 'US'),
          phone: null,
        }
      : null,
    lines,
    buyerNotes: nonEmptyString(receipt.message_from_buyer),
    internalNotes: nonEmptyString(receipt.message_from_seller),
  }
}

/* ==========================================================================
 * MedusaJS v2
 * ========================================================================== */

/**
 * Normalizes a MedusaJS v2 order (`/admin/orders/:id` shape).
 *
 * Medusa lines carry `adjustments[]` (discounts) and `tax_lines[]`
 * (jurisdiction tax) which map directly onto the canonical breakdowns.
 *
 * @see https://docs.medusajs.com/api/admin#orders_getordersid
 */
export function normalizeMedusaOrder(
  payload: unknown,
  context: NormalizerContext = {}
): NormalizedOrder {
  const body = asObject(payload)
  const order = asObject(body.order ?? body)
  const orderId = nonEmptyString(order.id)
  if (!orderId) {
    throw new OrderSyncNormalizationError('Medusa payload is missing order.id', 'medusa')
  }
  const contextValues = contextCurrency(context)
  const currency = normalizeCurrencyCode(order.currency_code ?? contextValues.defaultCurrency)

  const rawItems = asArray(order.items)
  if (rawItems.length === 0) {
    throw new OrderSyncNormalizationError(`Medusa order ${orderId} has no items`, 'medusa')
  }

  const lines: OrderLineInput[] = rawItems.map((rawItem) => {
    const item = asObject(rawItem)
    const quantity = Math.max(1, Number(item.quantity ?? 1) || 1)
    const unitPrice = readMoney(item.unit_price, currency)

    const adjustments: AdjustmentEntry[] = asArray(item.adjustments).map((rawAdjustment) => {
      const adjustment = asObject(rawAdjustment)
      return {
        code: nonEmptyString(adjustment.code) ?? 'discount',
        promotion_id: nonEmptyString(adjustment.promotion_id),
        description: nonEmptyString(adjustment.description) ?? 'Medusa adjustment',
        amount: readMoney(adjustment.amount, currency),
      }
    })
    const taxLines: TaxLineEntry[] = asArray(item.tax_lines).map((rawTaxLine) => {
      const taxLine = asObject(rawTaxLine)
      return {
        code: nonEmptyString(taxLine.code) ?? 'tax',
        rate: Number(taxLine.rate ?? 0) || null,
        description: nonEmptyString(taxLine.description) ?? nonEmptyString(taxLine.code) ?? 'Tax',
        total: readMoney(taxLine.total ?? taxLine.amount, currency),
      }
    })

    const adjustmentsTotal = money(
      adjustments.reduce((total, adjustment) => total + adjustment.amount.amount, 0),
      currency
    )
    const taxLinesTotal = money(
      taxLines.reduce((total, taxLine) => total + taxLine.total.amount, 0),
      currency
    )

    return {
      externalOrderLineId: nonEmptyString(item.id),
      externalListingId: nonEmptyString(item.product_id),
      externalVariantId: nonEmptyString(item.variant_id),
      sku: nonEmptyString(item.variant_sku) ?? nonEmptyString(item.variant?.sku) ?? 'UNKNOWN-SKU',
      title: nonEmptyString(item.title) ?? nonEmptyString(item.product_title) ?? 'Medusa item',
      variantTitle: nonEmptyString(item.variant_title) ?? nonEmptyString(item.variant?.title),
      quantityOrdered: quantity,
      unitPrice,
      // `subtotal` is not part of OrderLineInput; the line subtotal is derived.

      discountTotal: adjustmentsTotal,
      promotionTotal: adjustmentsTotal,
      taxTotal: readMoney(item.tax_total ?? taxLinesTotal, currency),
      shippingTotal: readMoney(item.shipping_total, currency),
      taxLines,
      adjustments,
      customAttributes: {
        product_id: nonEmptyString(item.product_id),
        variant_id: nonEmptyString(item.variant_id),
        variant_sku: nonEmptyString(item.variant_sku),
        is_discountable: item.is_discountable ?? null,
        is_tax_inclusive: item.is_tax_inclusive ?? null,
        metadata: asObject(item.metadata),
      },
      fulfillmentChannel: normalizeFulfillmentChannel('medusa', item.fulfillment_status)
        ? FulfillmentChannel.DIRECT
        : FulfillmentChannel.DIRECT,
    }
  })

  const subtotal = readMoney(order.subtotal, currency)
  const discountTotal = readMoney(order.discount_total, currency)
  const shippingTotal = readMoney(order.shipping_total, currency)
  const taxTotal = readMoney(order.tax_total, currency)
  const grandTotalFromOrder = readMoney(order.total, currency)
  const giftCardTotal = readMoney(order.gift_card_total, currency)
  const refundedTotal = readMoney(order.refunded_total, currency)

  const effectiveSubtotal =
    subtotal.amount > 0
      ? subtotal
      : sumOfMoney(
          lines.map((line) =>
            money(((line.unitPrice as PriceMoney)?.amount ?? 0) * line.quantityOrdered, currency)
          ),
          currency
        )
  const lineTaxTotal = sumOfMoney(
    lines.map((line) => (line.taxTotal as PriceMoney) ?? money(0, currency)),
    currency
  )
  const effectiveTaxTotal = taxTotal.amount > 0 ? taxTotal : lineTaxTotal
  const grandTotal =
    grandTotalFromOrder.amount > 0
      ? grandTotalFromOrder
      : money(
          roundMoney(
            effectiveSubtotal.amount -
              discountTotal.amount +
              shippingTotal.amount +
              effectiveTaxTotal.amount -
              giftCardTotal.amount
          ),
          currency
        )

  const status = normalizeStatus('medusa', order.status ?? order.fulfillment_status, {
    isPaid: String(order.payment_status ?? '') === 'captured' || Boolean(order.paid_at),
    isCancelled: Boolean(order.canceled_at),
  })
  const paymentStatus =
    String(order.payment_status ?? '') === 'captured' || Boolean(order.paid_at)
      ? OrderPaymentStatus.PAID
      : String(order.payment_status ?? '') === 'awaiting'
        ? OrderPaymentStatus.UNPAID
        : status.paymentStatus

  const address = asObject(order.shipping_address)
  const billingAddress = asObject(order.billing_address)

  return {
    platform: 'medusa',
    marketplaceCode: 'medusa',
    externalOrderId: orderId,
    externalDisplayId: order.display_id ? String(order.display_id) : null,
    orderNumber: order.display_id ? `MEDUSA-${order.display_id}` : orderId,
    marketplaceSiteId: nonEmptyString(order.region_id) ?? nonEmptyString(order.sales_channel_id),
    currencyCode: currency,
    reportingCurrencyCode: contextValues.reportingCurrencyCode,
    exchangeRate: contextValues.exchangeRate,
    fulfillmentChannel: FulfillmentChannel.DIRECT,
    taxCollectionModel:
      effectiveTaxTotal.amount > 0 ? TaxCollectionModel.SELLER : TaxCollectionModel.NONE,
    channelMetadata: {
      medusaOrderId: orderId,
      displayId: order.display_id ? String(order.display_id) : null,
      regionId: nonEmptyString(order.region_id),
      salesChannelId: nonEmptyString(order.sales_channel_id),
      cartId: nonEmptyString(order.cart_id),
      customerId: nonEmptyString(order.customer_id),
      paymentMethodSummary: nonEmptyString(order.payment_method) ?? 'Medusa',
      giftCardTotal,
      refundedTotal,
      billingAddress: Object.keys(billingAddress).length > 0 ? billingAddress : null,
      metadata: asObject(order.metadata),
      itemCount: lines.length,
    },
    status: status.status,
    paymentStatus,
    orderedAt: toIsoOrNull(order.created_at),
    earliestShipAt: null,
    latestShipAt: null,
    earliestDeliveryAt: null,
    latestDeliveryAt: null,
    ...totals(currency, {
      subtotal: effectiveSubtotal,
      discountTotal,
      promotionTotal: sumOfMoney(
        lines.map((line) => (line.promotionTotal as PriceMoney) ?? money(0, currency)),
        currency
      ),
      shippingTotal,
      taxTotal: effectiveTaxTotal,
      grandTotal,
      marketplaceFeesTotal: money(0, currency),
    }),
    customer: {
      externalCustomerId: nonEmptyString(order.customer_id),
      fullName:
        nonEmptyString(address.full_name) ??
        joinAddress(asObject(order.customer).first_name, asObject(order.customer).last_name) ??
        'Medusa Customer',
      email: nonEmptyString(order.email) ?? nonEmptyString(order.customer?.email),
      proxyEmail: null,
      phone: nonEmptyString(address.phone) ?? nonEmptyString(order.customer?.phone),
    },
    shippingAddress: nonEmptyString(address.address_1)
      ? {
          recipientName: nonEmptyString(address.full_name) ?? 'Medusa Customer',
          line1: String(address.address_1),
          line2: nonEmptyString(address.address_2),
          city: String(address.city ?? ''),
          stateProvince: nonEmptyString(address.province),
          postalCode: String(address.postal_code ?? ''),
          countryCode: normalizeCountryCode(address.country_code, 'US'),
          phone: nonEmptyString(address.phone),
        }
      : null,
    lines,
    buyerNotes: null,
    internalNotes: nonEmptyString(order.metadata?.notes),
  }
}

/* ==========================================================================
 * Detection & dispatch
 * ========================================================================== */

/**
 * Detects which platform produced a raw payload.
 *
 * Detection is structural (never based on a caller-supplied hint) so webhooks and
 * bulk imports can post raw marketplace JSON without extra configuration:
 *  - Amazon: `payload.Orders[]` / `AmazonOrderId` / `payload.OrderItems[]`
 *  - eBay: `orders[].orderId`, `pricingSummary`, `legacyOrderId`
 *  - Etsy: `receipt_id`, `receipt.receipt_id`, `transactions[]` with `listing_id`
 *  - Medusa: `display_id`, `items[].variant_id`, `currency_code` + `region_id`
 *  - Seller Core: already-normalized `orderNumber` + `lines[]`
 */
export function detectPayloadPlatform(payload: unknown): MarketplacePlatform | 'unknown' {
  const body = asObject(payload)
  if (body.payload && typeof body.payload === 'object') {
    const inner = asObject(body.payload)
    if (asArray(inner.Orders).length > 0) return 'amazon'
    if (asArray(inner.OrderItems).length > 0) return 'amazon'
  }
  // A bare SP-API `getOrders` response ({ Orders: [...] }) carries no wrapper.
  if (asArray(body.Orders).length > 0) return 'amazon'
  if (body.AmazonOrderId || body.amazonOrderId) return 'amazon'
  if (asArray(body.orders).length > 0 || asObject(body.orders?.[0]).orderId) return 'ebay'
  if (body.orderId && (body.pricingSummary || body.lineItems)) return 'ebay'
  if (body.receipt_id || asObject(body.receipt).receipt_id) return 'etsy'
  if (asArray(body.transactions).length > 0 && !asArray(body.items).length) return 'etsy'
  if (
    body.display_id ||
    body.region_id ||
    asArray(body.items).some((item) => asObject(item).variant_id)
  ) {
    return 'medusa'
  }
  if (asObject(body.order).id) return 'medusa'
  if (body.orderNumber && asArray(body.lines).length > 0) return 'seller_core'
  return 'unknown'
}

/**
 * Auto-detects the payload format and routes it to the matching normalizer.
 * Amazon requires the separate `getOrderItems` response because taxes, shipping
 * and promotions live on the order items, not on the order header.
 */
export function normalizeOrderPayload(
  payload: unknown,
  options: {
    platform?: MarketplacePlatform | 'unknown'
    orderItemsPayload?: unknown
    context?: NormalizerContext
  } = {}
): NormalizedOrder {
  const platform = options.platform ?? detectPayloadPlatform(payload)
  const context = options.context ?? {}
  switch (platform) {
    case 'amazon':
      return normalizeAmazonOrder(payload, options.orderItemsPayload, context)
    case 'ebay':
      return normalizeEbayOrder(payload, context)
    case 'etsy':
      return normalizeEtsyReceipt(payload, context)
    case 'medusa':
      return normalizeMedusaOrder(payload, context)
    default:
      throw new OrderSyncNormalizationError(
        'Unrecognized marketplace order payload. Expected Amazon SP-API, eBay Fulfillment, Etsy Open API v3, MedusaJS v2 or canonical Seller Core JSON.',
        'unknown',
        'UNSUPPORTED_PLATFORM'
      )
  }
}

/**
 * Maps a normalized marketplace order onto `OrderService.createOrder()` input.
 * The platform totals are passed through so `createOrder` can keep the buyer-paid
 * amounts and record any formula drift in `channel_metadata`.
 */
export function toCreateOrderInput(
  normalized: NormalizedOrder,
  context: {
    userId: string
    actorUserId?: string
    sellerAccountId?: string | null
    sourceType?: string
    reportingCurrencyCode?: string
    exchangeRate?: number
    syncJobId?: string | null
    rawPayload?: Record<string, unknown> | null
  }
): CreateOrderInput {
  return {
    userId: context.userId,
    actorUserId: context.actorUserId ?? context.userId,
    sellerAccountId: context.sellerAccountId ?? null,
    orderNumber: normalized.orderNumber,
    externalOrderId: normalized.externalOrderId,
    externalDisplayId: normalized.externalDisplayId,
    sourceType: context.sourceType ?? OrderSourceType.MARKETPLACE_IMPORT,
    marketplaceCode: normalized.marketplaceCode,
    status: normalized.status,
    paymentStatus: normalized.paymentStatus,
    currencyCode: normalized.currencyCode,
    reportingCurrencyCode: context.reportingCurrencyCode ?? normalized.reportingCurrencyCode,
    exchangeRate: context.exchangeRate ?? normalized.exchangeRate,
    fulfillmentChannel: normalized.fulfillmentChannel,
    marketplaceSiteId: normalized.marketplaceSiteId,
    taxCollectionModel: normalized.taxCollectionModel,
    channelMetadata: normalized.channelMetadata,
    subtotal: normalized.subtotal,
    discountTotal: normalized.discountTotal,
    promotionsTotal: normalized.promotionTotal,
    shippingTotal: normalized.shippingTotal,
    shippingDiscountTotal: normalized.shippingDiscountTotal,
    taxTotal: normalized.taxTotal,
    shippingTaxTotal: normalized.shippingTaxTotal,
    marketplaceWithheldTaxTotal: normalized.marketplaceWithheldTaxTotal,
    grandTotal: normalized.grandTotal,
    marketplaceFeesTotal: normalized.marketplaceFeesTotal,
    paymentProcessingFeesTotal: normalized.paymentProcessingFeesTotal,
    shippingCostTotal: normalized.shippingCostTotal,
    cogsTotal: normalized.cogsTotal,
    taxCollectedByMarketplace:
      normalized.taxCollectionModel === TaxCollectionModel.MARKETPLACE_FACILITATOR,
    earliestShipAt: normalized.earliestShipAt,
    latestShipAt: normalized.latestShipAt,
    earliestDeliveryAt: normalized.earliestDeliveryAt,
    latestDeliveryAt: normalized.latestDeliveryAt,
    orderedAt: normalized.orderedAt ?? undefined,
    buyerNotes: normalized.buyerNotes,
    internalNotes: normalized.internalNotes,
    customer: {
      externalCustomerId: normalized.customer.externalCustomerId,
      fullName: normalized.customer.fullName,
      email: normalized.customer.email,
      proxyEmail: normalized.customer.proxyEmail,
      phone: normalized.customer.phone,
    },
    shippingAddress: normalized.shippingAddress ?? undefined,
    lines: normalized.lines,
    syncJobId: context.syncJobId ?? null,
    rawPayload: context.rawPayload ?? null,
  }
}

/**
 * Serializes a local order back into a MedusaJS v2 compatible shape for outbound
 * synchronization. Money stays self-contained PriceMoney so the receiver can
 * persist it without a currency column.
 */
export function toMedusaOrderPayload(order: {
  id: string
  orderNumber: string
  externalOrderId: string | null
  externalDisplayId?: string | null
  status: string
  paymentStatus: string
  fulfillmentStatus: string
  fulfillmentChannel?: string
  marketplaceSiteId?: string | null
  orderedAt?: Date | string | null
  subtotal: PriceMoney
  discountTotal: PriceMoney
  promotionTotal: PriceMoney
  shippingTotal: PriceMoney
  taxTotal: PriceMoney
  shippingTaxTotal: PriceMoney
  grandTotal: PriceMoney
  reportingTotal: PriceMoney
  lineItems?: Array<{
    externalOrderLineId?: string | null
    externalVariantId?: string | null
    sku: string
    title: string
    quantityOrdered: number
    quantityFulfilled?: number
    unitPrice: PriceMoney
    subtotal: PriceMoney
    discountTotal: PriceMoney
    promotionTotal: PriceMoney
    taxTotal: PriceMoney
    shippingTotal: PriceMoney
    grandTotal: PriceMoney
    fulfillmentChannel?: string
    taxLines?: TaxLineEntry[]
    adjustments?: AdjustmentEntry[]
  }>
}) {
  const currency = order.grandTotal?.currency_code ?? 'USD'
  return {
    id: order.externalOrderId ?? order.id,
    display_id: order.externalDisplayId ?? order.orderNumber,
    status: order.status,
    payment_status: order.paymentStatus,
    fulfillment_status: order.fulfillmentStatus,
    region_id: order.marketplaceSiteId ?? null,
    currency_code: currency,
    created_at: order.orderedAt ?? null,
    metadata: {
      sellerCoreId: order.id,
      fulfillment_channel: order.fulfillmentChannel ?? FulfillmentChannel.MFN,
      reporting_total: order.reportingTotal,
    },
    subtotal: order.subtotal,
    discount_total: order.discountTotal,
    promotion_total: order.promotionTotal,
    shipping_total: order.shippingTotal,
    tax_total: order.taxTotal,
    shipping_tax_total: order.shippingTaxTotal,
    total: order.grandTotal,
    items: (order.lineItems ?? []).map((line) => ({
      id: line.externalOrderLineId ?? `${order.id}:${line.sku}`,
      product_variant_id: line.externalVariantId ?? null,
      variant_sku: line.sku,
      title: line.title,
      quantity: line.quantityOrdered,
      fulfilled_quantity: line.quantityFulfilled ?? 0,
      unit_price: line.unitPrice,
      subtotal: line.subtotal,
      discount_total: line.discountTotal,
      promotion_total: line.promotionTotal,
      tax_total: line.taxTotal,
      shipping_total: line.shippingTotal,
      total: line.grandTotal,
      adjustments: line.adjustments ?? [],
      tax_lines: line.taxLines ?? [],
      metadata: {
        fulfillment_channel:
          line.fulfillmentChannel ?? order.fulfillmentChannel ?? FulfillmentChannel.MFN,
      },
    })),
  }
}

/** Guards the raw-payload size limit so imports cannot be used to exhaust storage. */
export function assertPayloadSize(payload: unknown, limit = SENSITIVE_DEFAULT_LIMIT): number {
  const bytes = Buffer.byteLength(JSON.stringify(payload ?? {}), 'utf8')
  if (bytes > limit) {
    throw new OrderSyncNormalizationError(
      `Marketplace payload is ${bytes} bytes, exceeding the ${limit} byte limit.`,
      'unknown',
      'PAYLOAD_TOO_LARGE'
    )
  }
  return bytes
}

/** Coerces an already-canonical Seller Core order payload into `CreateOrderInput`. */
export function fromCanonicalPayload(
  payload: unknown,
  context: {
    userId: string
    actorUserId?: string
    sellerAccountId?: string | null
    reportingCurrencyCode?: string
    exchangeRate?: number
    syncJobId?: string | null
  }
): CreateOrderInput {
  const body = asObject(payload)
  const currency = normalizeCurrencyCode(body.currencyCode ?? body.currency_code, 'USD')
  const lines = asArray(body.lines).map((rawLine) => {
    const line = asObject(rawLine)
    return {
      ...line,
      unitPrice: normalizePriceMoney(line.unitPrice ?? line.unit_price ?? 0, currency),
    } as OrderLineInput
  })
  if (lines.length === 0) {
    throw new OrderSyncNormalizationError(
      'Canonical order payload must contain at least one line.',
      'seller_core',
      'EMPTY_ORDER'
    )
  }
  return {
    ...(body as unknown as CreateOrderInput),
    userId: context.userId,
    actorUserId: context.actorUserId ?? context.userId,
    sellerAccountId: context.sellerAccountId ?? body.sellerAccountId ?? null,
    reportingCurrencyCode: context.reportingCurrencyCode ?? body.reportingCurrencyCode ?? 'USD',
    exchangeRate: context.exchangeRate ?? body.exchangeRate ?? 1,
    currencyCode: currency,
    lines,
    syncJobId: context.syncJobId ?? null,
  }
}

/**
 * Namespace facade so callers can either import the individual deterministic
 * functions or the whole service (`OrderSyncNormalizerService.normalize...`).
 */
export const OrderSyncNormalizerService = {
  normalizeAmazonOrder,
  normalizeEbayOrder,
  normalizeEtsyReceipt,
  normalizeMedusaOrder,
  normalizeOrderPayload,
  detectPayloadPlatform,
  toCreateOrderInput,
  toMedusaOrderPayload,
  fromCanonicalPayload,
  parsePlatformAmount,
  readMoney,
  toIsoOrNull,
  normalizeStatus,
  normalizeFulfillmentChannel,
}

export default OrderSyncNormalizerService
