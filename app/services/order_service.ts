import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import Order from '#models/order'
import OrderLineItem from '#models/order_line_item'
import OrderImportPayload from '#models/order_import_payload'
import Customer from '#models/customer'
import CustomerAddress from '#models/customer_address'
import ProductVariant from '#models/product_variant'
import SyncJob from '#models/sync_job'
import SyncJobError from '#models/sync_job_error'
import OutboxEvent from '#models/outbox_event'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { AuditContext } from './audit_context.js'
import { RiskSignalService } from './risk_signal_service.js'
import { ProfitabilityService } from './profitability_service.js'
import {
  OrderSourceType,
  OrderStatus,
  OrderPaymentStatus,
  FulfillmentStatus,
  EntitySyncStatus,
  SyncJobType,
  SyncJobStatus,
  OutboxEventStatus,
  FulfillmentChannel,
  type FulfillmentChannelValue,
  TaxCollectionModel,
  type TaxCollectionModelValue,
} from '../enums/index.js'
import { generateEntityId } from '../utils/generate_entity_id.js'
import RiskSignalFlagged from '#events/risk_signal_flagged'
import {
  OrderSyncNormalizerService,
  OrderSyncNormalizationError,
  assertPayloadSize,
  type MarketplacePlatform,
} from './order_sync_normalizer_service.js'
import { normalizeEmail, normalizePhone, computeAddressFingerprint } from '../utils/identity.js'
import {
  type AdjustmentEntry,
  type PriceMoney,
  type TaxLineEntry,
  amountOf,
  currencyOf,
  money,
  exchangeRateBetween,
  DEFAULT_CURRENCY_RATES,
  normalizeCurrencyCode,
  normalizeMoneyEntryArray,
  normalizePriceMoney,
  roundMoney,
  sumMoney,
  sumMoneyConverted,
  sumMoneyEntries,
} from '../types/price.js'

/** Money-ish input: a self-contained PriceMoney object or a number + currency. */
export type MoneyLike = PriceMoney | number | string | null | undefined

/** Coerces any money-ish input into a PriceMoney in `fallbackCurrency`. */
function toMoney(value: MoneyLike, fallbackCurrency: string): PriceMoney {
  return normalizePriceMoney(value ?? 0, fallbackCurrency)
}

/** Parses an ISO timestamp from a platform payload, tolerating invalid values. */
function toDateTimeOrNull(value: string | null | undefined): DateTime | null {
  if (!value) return null
  const parsed = DateTime.fromISO(String(value))
  return parsed.isValid ? parsed : null
}

export type FulfillmentChannelCode = FulfillmentChannelValue

/** A tax line as accepted on input: the total may be a bare number in order currency. */
export type TaxLineInput = Omit<TaxLineEntry, 'total'> & { total: MoneyLike }

/** An adjustment as accepted on input: the amount may be a bare number. */
export type AdjustmentInput = Omit<AdjustmentEntry, 'amount'> & { amount: MoneyLike }

/** A raw marketplace payload queued for import; the platform is auto-detected. */
export interface BulkImportPayload {
  /** Omit to let the normalizer detect Amazon / eBay / Etsy / MedusaJS. */
  platform?: MarketplacePlatform | 'unknown'
  payload: unknown
  /** Amazon SP-API `getOrderItems` response (taxes/prices live per line item). */
  orderItemsPayload?: unknown
  sellerAccountId?: string | null
  sellerAccount?: {
    id: string
    defaultCurrency: string
    marketplaceRegion: string
    externalSellerId: string
  } | null
}

type NormalizedImportOrder = Omit<CreateOrderInput, 'userId' | 'syncJobId' | 'actorUserId'>

/** One importable record after normalization (or straight from canonical JSON). */
interface ImportEntry {
  index: number
  platform: MarketplacePlatform | 'seller_core' | 'unknown'
  externalRecordId: string | null
  rawExcerpt: Record<string, unknown>
  payload?: unknown
  order?: NormalizedImportOrder
}

/** Best-effort external identity used for `sync_job_errors.external_record_id`. */
function extractExternalRecordId(payload: unknown): string | null {
  const body = payload as Record<string, any> | null
  if (!body || typeof body !== 'object') return null
  const order = (body.payload?.Orders?.[0] ??
    body.orders?.[0] ??
    body.receipt ??
    body.order ??
    body) as Record<string, any>
  return (
    order?.AmazonOrderId ??
    order?.amazonOrderId ??
    order?.orderId ??
    order?.receipt_id ??
    order?.receiptId ??
    order?.id ??
    order?.externalOrderId ??
    null
  )
}

/** Trimmed raw payload stored on `sync_job_errors` for replay/debugging. */
function buildRawExcerpt(payload: unknown): Record<string, unknown> {
  const json = JSON.stringify(asRecord(payload) ?? {})
  return { excerpt: json.length > 2000 ? `${json.slice(0, 2000)}…` : json }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export interface OrderLineInput {
  productVariantId?: string | null
  channelListingId?: string | null
  /** Amazon OrderItemId / eBay lineItemId / Etsy transaction_id / Medusa LineItem.id */
  externalOrderLineId?: string | null
  /** Amazon ASIN / eBay legacyItemId / Etsy listing_id / Medusa product_id */
  externalListingId?: string | null
  /** Etsy product_id or offering_id / Medusa variant_id / eBay SKU */
  externalVariantId?: string | null
  sku: string
  title: string
  variantTitle?: string | null
  quantityOrdered: number
  /** Item unit price. A bare number is denominated in the order currency. */
  unitPrice: MoneyLike
  /** Order-level discount applied to this line (not a promotion). */
  discountTotal?: MoneyLike
  /** Marketing promotion / coupon total for this line. */
  promotionTotal?: MoneyLike
  /** Item tax for this line. */
  taxTotal?: MoneyLike
  /** Shipping charged to the buyer for this line. */
  shippingTotal?: MoneyLike
  /** Shipping discount applied to this line. */
  shippingDiscountTotal?: MoneyLike
  /** Tax charged on shipping for this line. */
  shippingTaxTotal?: MoneyLike
  /** Unit landed cost (COGS). May be booked in a different currency. */
  unitCost?: MoneyLike
  marketplaceFee?: MoneyLike
  fulfillmentChannel?: FulfillmentChannelCode
  /** Jurisdiction tax breakdown; its total becomes `tax_total` when omitted. */
  taxLines?: TaxLineInput[]
  /** Promotion / coupon breakdown; its total becomes `promotion_total` when omitted. */
  adjustments?: AdjustmentInput[]
  /** Etsy personalization, Amazon GiftWrapLevel, Medusa metadata, … */
  customAttributes?: Record<string, any>
  /** Per-field currency overrides, e.g. `{ unit_cost: 'INR' }` (snake_case keys). */
  fieldCurrencyOverrides?: Record<string, string>
}

export interface CreateOrderInput {
  userId: string
  actorUserId?: string
  /** Propagated to the audit trigger (`app.request_id` / `app.correlation_id`). */
  requestId?: string | null
  correlationId?: string | null
  sellerAccountId?: string | null
  orderNumber: string
  /** Amazon AmazonOrderId / eBay orderId / Etsy receipt_id / Medusa order.id. */
  externalOrderId?: string | null
  /** Human-facing platform number (Medusa display_id, eBay legacyOrderId…). */
  externalDisplayId?: string | null
  sourceType?: string
  /**
   * Detected marketplace/platform (amazon, ebay, etsy, medusa, website…).
   *
   * Orders have no `marketplace_code` column — the channel is derived through
   * `seller_account_id → sales_channels.code`. The detected platform is kept in
   * `channel_metadata.platform` so imports without a seller account stay traceable.
   */
  marketplaceCode?: string
  status?: string
  paymentStatus?: string
  /** Currency of the marketplace transaction (revenue-side fields). */
  currencyCode?: string
  /** Currency used for the `reporting_total` P&L roll-up. */
  reportingCurrencyCode?: string
  exchangeRate?: number
  /**
   * FX overrides merged over `DEFAULT_CURRENCY_RATES`, keyed by ISO currency and
   * quoted against USD (e.g. `{ INR: 84.1 }`). Used when neither an explicit
   * `exchangeRate` nor a stored rate is available.
   */
  exchangeRates?: Record<string, number>
  fulfillmentChannel?: FulfillmentChannelCode
  /** Amazon MarketplaceId / eBay marketplace id / Etsy shop_id / Medusa region_id. */
  marketplaceSiteId?: string | null
  /** marketplace_facilitator | seller | none — inferred when omitted. */
  taxCollectionModel?: TaxCollectionModelValue
  /** Platform flags: isPrime, isBusinessOrder, etsyIsGift, medusaRegionId, … */
  channelMetadata?: Record<string, any>
  /** Platform-authoritative order totals (fall back to the line sums). */
  subtotal?: MoneyLike
  discountTotal?: MoneyLike
  taxTotal?: MoneyLike
  shippingTotal?: MoneyLike
  shippingTaxTotal?: MoneyLike
  grandTotal?: MoneyLike
  cogsTotal?: MoneyLike
  /** Shipping cost paid to the carrier; may be in a different currency. */
  shippingCostTotal?: MoneyLike
  shippingCostCurrencyCode?: string
  paymentProcessingFeesTotal?: MoneyLike
  marketplaceFeesTotal?: MoneyLike
  promotionsTotal?: MoneyLike
  shippingDiscountTotal?: MoneyLike
  /**
   * Allows reserving more units than are on hand (a deliberate backorder). Defaults to
   * `false`: a tracked variant that cannot cover the ordered quantity rejects the whole
   * order with `INSUFFICIENT_STOCK` instead of driving `stock_available` negative.
   */
  allowOversell?: boolean
  /** Tax withheld and remitted by the marketplace (facilitator tax). */
  marketplaceWithheldTaxTotal?: MoneyLike
  /** Only the seller collects tax; marketplaces may remit on the seller's behalf. */
  taxCollectedByMarketplace?: boolean
  /** Promised ship window (Amazon Earliest/LatestShipDate, Etsy estimated_ship_on). */
  earliestShipAt?: string | null
  latestShipAt?: string | null
  /** Promised delivery window (Amazon LatestDeliveryDate, eBay estimated delivery). */
  earliestDeliveryAt?: string | null
  latestDeliveryAt?: string | null
  fieldCurrencyOverrides?: Record<string, string>
  buyerNotes?: string | null
  internalNotes?: string | null
  orderedAt?: string
  customer: {
    id?: string
    externalCustomerId?: string | null
    fullName: string
    email?: string | null
    proxyEmail?: string | null
    phone?: string | null
  }
  shippingAddress?: {
    recipientName: string
    line1: string
    line2?: string | null
    city: string
    stateProvince?: string | null
    postalCode: string
    countryCode: string
    phone?: string | null
  }
  lines: OrderLineInput[]
  rawPayload?: Record<string, unknown> | null
  syncJobId?: string | null
}

/** Redact credentials at every depth before the payload reaches storage or audit triggers. */
function redactPayload(value: unknown, fields: string[], path = ''): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) => redactPayload(item, fields, `${path}[${index}]`))
  }
  if (value && typeof value === 'object') {
    const sensitiveKeys = new Set([
      'cardnumber',
      'cvv',
      'cvc',
      'accesstoken',
      'refreshtoken',
      'clientsecret',
      'password',
      'apikey',
      'apisecret',
      'authorization',
    ])
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        const field = path ? `${path}.${key}` : key
        if (sensitiveKeys.has(key.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
          fields.push(field)
          return [key, '[REDACTED]']
        }
        return [key, redactPayload(item, fields, field)]
      })
    )
  }
  return value
}

export class OrderService {
  /**
   * Creates a normalized order with line items, customer identity resolution,
   * repeat-customer detection, inventory reservation, P&L calculation and
   * self-contained `PriceMoney` objects on every monetary column.
   *
   * Every amount keeps its own currency code, so a USD marketplace order can
   * carry an INR carrier cost and INR COGS without lossy conversion.
   */
  static async createOrder(input: CreateOrderInput): Promise<Order> {
    if (!input.lines || input.lines.length === 0) {
      throw new Error('VALIDATION_ERROR: An order must contain at least one line item.')
    }
    if (!input.orderNumber || !input.orderNumber.trim()) {
      throw new Error('VALIDATION_ERROR: An order number is required.')
    }

    const currency = normalizeCurrencyCode(input.currencyCode, 'USD')
    const reportingCurrency = normalizeCurrencyCode(input.reportingCurrencyCode, 'USD')
    // A marketplace supplies its settlement rate; without one the reporting rate is
    // derived from the FX table instead of silently assuming 1:1.
    const fxRates: Record<string, number> = {
      ...DEFAULT_CURRENCY_RATES,
      ...(input.exchangeRates ?? {}),
    }
    const exchangeRate = Number(
      input.exchangeRate ?? exchangeRateBetween(currency, reportingCurrency, fxRates)
    )
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      throw new Error(
        `VALIDATION_ERROR: no exchange rate available for ${currency} -> ${reportingCurrency}.`
      )
    }
    const fieldOverrides = input.fieldCurrencyOverrides ?? {}
    const currencyFor = (field: string, fallback = currency) =>
      normalizeCurrencyCode(fieldOverrides[field], fallback)
    const shippingCostCurrency = normalizeCurrencyCode(
      input.shippingCostCurrencyCode ?? fieldOverrides.shipping_cost_total,
      currency
    )

    return await AuditContext.transaction(async (trx) => {
      // Every row written below (customer, order, lines, payload, outbox) is audited
      // by the trg_audit_capture trigger with this actor/request context.
      await AuditContext.apply(trx, {
        actorUserId: input.actorUserId ?? input.userId,
        requestId: input.requestId ?? null,
        correlationId: input.correlationId ?? null,
        reason: 'order.created',
      })
      // 1. Resolve or create customer scoped to user_id
      let customer: Customer | null = null
      const normEmail = normalizeEmail(input.customer.email)
      const normPhone = normalizePhone(input.customer.phone)

      if (input.customer.id) {
        customer = await Customer.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('id', input.customer.id)
          .first()
      }

      if (!customer && normEmail) {
        customer = await Customer.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('normalizedEmail', normEmail)
          .whereNull('mergedIntoCustomerId')
          .first()
      }

      if (!customer && input.customer.externalCustomerId) {
        customer = await Customer.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('externalCustomerId', input.customer.externalCustomerId)
          .whereNull('mergedIntoCustomerId')
          .first()
      }

      if (!customer && normPhone) {
        customer = await Customer.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('normalizedPhone', normPhone)
          .whereNull('mergedIntoCustomerId')
          .first()
      }

      if (!customer) {
        customer = new Customer()
        customer.useTransaction(trx)
        customer.userId = input.userId
        customer.externalCustomerId = input.customer.externalCustomerId ?? null
        customer.fullName = input.customer.fullName.trim()
        customer.email = input.customer.email ?? null
        customer.normalizedEmail = normEmail
        customer.proxyEmail = input.customer.proxyEmail ?? null
        customer.phone = input.customer.phone ?? null
        customer.normalizedPhone = normPhone
        customer.ordersCount = 0
        customer.totalSpent = money(0, reportingCurrency)
        customer.riskLevel = 'low'
        customer.riskScore = 0
        customer.metadata = {}
        await customer.save()
      }

      // 2. Resolve or create shipping address
      let shippingAddressId: string | null = null
      if (input.shippingAddress) {
        const fingerprint = computeAddressFingerprint(input.shippingAddress)
        let address = await CustomerAddress.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('customerId', customer.id)
          .andWhere('addressFingerprint', fingerprint)
          .first()

        if (!address) {
          address = new CustomerAddress()
          address.useTransaction(trx)
          address.userId = input.userId
          address.customerId = customer.id
          address.addressType = 'both'
          address.recipientName = input.shippingAddress.recipientName
          address.line1 = input.shippingAddress.line1
          address.line2 = input.shippingAddress.line2 ?? null
          address.city = input.shippingAddress.city
          address.stateProvince = input.shippingAddress.stateProvince ?? null
          address.postalCode = input.shippingAddress.postalCode
          address.countryCode = input.shippingAddress.countryCode.toUpperCase()
          address.phone = input.shippingAddress.phone ?? null
          address.addressFingerprint = fingerprint
          address.isDefault = true
          address.isVerified = true
          await address.save()
        }
        shippingAddressId = address.id
      }

      // 3. Calculate line-item and order-level financials
      const preparedLines: Array<{
        lineModel: OrderLineItem
        variantToReserve: ProductVariant | null
      }> = []

      // 3a. Lock every referenced variant in a deterministic order before pricing.
      //
      // Two concurrent orders that mention the same variants in opposite order would
      // otherwise take the row locks in opposite order and deadlock. The lock pass is
      // sorted by variant id and runs before any pricing read, so every transaction
      // acquires variant locks in exactly the same sequence.
      const sortedVariantIds = [
        ...new Set(
          input.lines
            .map((line) => line.productVariantId)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        ),
      ].sort()
      const variantsById = new Map<string, ProductVariant>()
      if (sortedVariantIds.length > 0) {
        const locked = await ProductVariant.query({ client: trx })
          .where('userId', input.userId)
          .whereIn('id', sortedVariantIds)
          .orderBy('id')
          .forUpdate()
        for (const variant of locked) variantsById.set(variant.id, variant)
      }
      let subtotal = money(0, currency)
      let lineDiscounts = money(0, currency)
      let linePromotions = money(0, currency)
      let lineTaxes = money(0, currency)
      let lineShipping = money(0, currency)
      let lineShippingDiscounts = money(0, currency)
      let lineShippingTaxes = money(0, currency)
      let lineBreakdown: Array<{
        tax: PriceMoney
        shippingTax: PriceMoney
        cogs: PriceMoney
        marketplaceFee: PriceMoney
      }> = []

      for (const lineInput of input.lines) {
        if (!Number.isInteger(lineInput.quantityOrdered) || lineInput.quantityOrdered <= 0) {
          throw new Error(
            `VALIDATION_ERROR: Line SKU ${lineInput.sku} must have quantityOrdered > 0`
          )
        }
        const unitPrice = toMoney(lineInput.unitPrice, currency)
        if (amountOf(unitPrice) < 0) {
          throw new Error(
            `VALIDATION_ERROR: Line SKU ${lineInput.sku} cannot have negative unitPrice`
          )
        }

        // Variants referenced by id were already locked in step 3a; a SKU lookup is
        // the only case that needs a fresh (locking) read.
        let variant: ProductVariant | null = lineInput.productVariantId
          ? (variantsById.get(lineInput.productVariantId) ?? null)
          : null
        if (!lineInput.productVariantId && lineInput.sku) {
          variant = await ProductVariant.query({ client: trx })
            .where('userId', input.userId)
            .andWhere('sku', lineInput.sku)
            .forUpdate()
            .first()
        }

        if (lineInput.productVariantId && !variant) {
          throw new Error('INVALID_PRODUCT_VARIANT: Product variant not found for this user.')
        }
        if (variant) {
          const cached = variantsById.get(variant.id)
          if (cached) variant = cached
          else variantsById.set(variant.id, variant)
        }

        const qty = Number(lineInput.quantityOrdered)
        // Platform breakdowns are stored verbatim; their totals feed the money
        // columns unless the payload already supplied an explicit total.
        const taxLines = normalizeMoneyEntryArray<TaxLineEntry>(
          lineInput.taxLines,
          'total',
          currency
        )
        const adjustments = normalizeMoneyEntryArray<AdjustmentEntry>(
          lineInput.adjustments,
          'amount',
          currency
        )
        const lineDiscount = toMoney(lineInput.discountTotal ?? 0, currency)
        const linePromotion = toMoney(
          lineInput.promotionTotal ?? sumMoneyEntries(adjustments, 'amount', currency),
          currency
        )
        const lineTax = toMoney(
          lineInput.taxTotal ?? sumMoneyEntries(taxLines, 'total', currency),
          currency
        )
        const lineShippingAmount = toMoney(lineInput.shippingTotal ?? 0, currency)
        const lineShippingDiscount = toMoney(lineInput.shippingDiscountTotal ?? 0, currency)
        const lineShippingTax = toMoney(lineInput.shippingTaxTotal ?? 0, currency)
        const lineSubtotalAmount = roundMoney(qty * amountOf(unitPrice))
        const lineSubtotal = money(lineSubtotalAmount, unitPrice.currency_code)
        const lineGrand = money(
          lineSubtotalAmount -
            amountOf(lineDiscount) -
            amountOf(linePromotion) +
            amountOf(lineTax) +
            amountOf(lineShippingAmount) -
            amountOf(lineShippingDiscount) +
            amountOf(lineShippingTax),
          unitPrice.currency_code
        )

        // COGS may be booked in a different currency (e.g. INR warehouse cost).
        const fallbackUnitCost = variant ? variant.landedUnitCostAmount : 0
        const unitCost =
          lineInput.unitCost !== undefined && lineInput.unitCost !== null
            ? toMoney(lineInput.unitCost, currencyFor('unit_cost'))
            : money(fallbackUnitCost, variant?.costPrice?.currency_code ?? currency)
        const marketplaceFee =
          lineInput.marketplaceFee !== undefined && lineInput.marketplaceFee !== null
            ? toMoney(lineInput.marketplaceFee, currencyFor('marketplace_fee'))
            : money(lineSubtotalAmount * 0.12, unitPrice.currency_code)

        subtotal = money(amountOf(subtotal) + lineSubtotalAmount, subtotal.currency_code)
        lineDiscounts = money(
          amountOf(lineDiscounts) + amountOf(lineDiscount),
          lineDiscounts.currency_code
        )
        linePromotions = money(
          amountOf(linePromotions) + amountOf(linePromotion),
          linePromotions.currency_code
        )
        lineTaxes = money(amountOf(lineTaxes) + amountOf(lineTax), lineTaxes.currency_code)
        lineShipping = money(
          amountOf(lineShipping) + amountOf(lineShippingAmount),
          lineShipping.currency_code
        )
        lineShippingDiscounts = money(
          amountOf(lineShippingDiscounts) + amountOf(lineShippingDiscount),
          lineShippingDiscounts.currency_code
        )
        lineShippingTaxes = money(
          amountOf(lineShippingTaxes) + amountOf(lineShippingTax),
          lineShippingTaxes.currency_code
        )
        lineBreakdown.push({
          tax: lineTax,
          shippingTax: lineShippingTax,
          cogs: money(amountOf(unitCost) * qty, unitCost.currency_code),
          marketplaceFee,
        })

        const lineModel = new OrderLineItem()
        lineModel.userId = input.userId
        lineModel.productVariantId = variant?.id ?? null
        lineModel.channelListingId = lineInput.channelListingId ?? null
        lineModel.externalOrderLineId = lineInput.externalOrderLineId ?? null
        // ASIN doubles as the Amazon external listing id when no explicit value is sent.
        lineModel.externalListingId = lineInput.externalListingId ?? variant?.asin ?? null
        lineModel.externalVariantId = lineInput.externalVariantId ?? null
        lineModel.sku = lineInput.sku
        lineModel.title = lineInput.title
        lineModel.variantTitle = lineInput.variantTitle ?? variant?.title ?? null
        lineModel.quantityOrdered = qty
        lineModel.quantityFulfilled = 0
        lineModel.quantityReturned = 0
        lineModel.quantityCancelled = 0
        lineModel.fulfillmentChannel =
          lineInput.fulfillmentChannel ?? input.fulfillmentChannel ?? FulfillmentChannel.MFN
        lineModel.taxLines = taxLines
        lineModel.adjustments = adjustments
        lineModel.customAttributes = lineInput.customAttributes ?? {}
        lineModel.unitPrice = unitPrice
        lineModel.subtotal = lineSubtotal
        lineModel.discountTotal = lineDiscount
        lineModel.promotionTotal = linePromotion
        lineModel.taxTotal = lineTax
        lineModel.shippingTotal = lineShippingAmount
        lineModel.shippingDiscountTotal = lineShippingDiscount
        lineModel.shippingTaxTotal = lineShippingTax
        lineModel.grandTotal = lineGrand
        lineModel.unitCost = unitCost
        lineModel.marketplaceFee = marketplaceFee
        lineModel.refundedTotal = money(0, unitPrice.currency_code)
        lineModel.fulfillmentStatus = FulfillmentStatus.UNFULFILLED

        preparedLines.push({ lineModel, variantToReserve: variant })
      }

      // 3b. Availability guard. The variants above were locked, so the numbers read
      // here cannot move underneath us. A variant is inventory-tracked once it has any
      // stock history (`stock_on_hand` or `stock_reserved` above zero); zero-stock rows
      // are treated as untracked placeholders so historical marketplace imports keep
      // working. Demand is aggregated per variant because the same variant may appear
      // on several lines of one order.
      if (!input.allowOversell) {
        const demandByVariant = new Map<string, number>()
        for (const { lineModel } of preparedLines) {
          if (!lineModel.productVariantId) continue
          const current = demandByVariant.get(lineModel.productVariantId) ?? 0
          demandByVariant.set(
            lineModel.productVariantId,
            current + Number(lineModel.quantityOrdered)
          )
        }
        for (const [variantId, demand] of demandByVariant) {
          const variant = variantsById.get(variantId)
          if (!variant) continue
          const onHand = Number(variant.stockOnHand ?? 0)
          const reserved = Number(variant.stockReserved ?? 0)
          const tracked = onHand > 0 || reserved > 0
          if (!tracked) continue
          const available = onHand - reserved
          if (demand > available) {
            throw new Error(
              `INSUFFICIENT_STOCK: SKU ${variant.sku} needs ${demand} unit(s) but only ${Math.max(0, available)} are available.`
            )
          }
        }
      }

      // Order-level totals: a marketplace payload is authoritative for what the
      // buyer was charged; the line sums are the fallback for manual orders.
      const pick = (value: MoneyLike | undefined, fallback: PriceMoney) =>
        value === undefined || value === null ? fallback : toMoney(value, fallback.currency_code)

      const subtotalMoney = pick(input.subtotal, subtotal)
      const discountMoney = pick(input.discountTotal, lineDiscounts)
      const promotionMoney = pick(input.promotionsTotal, linePromotions)
      const shippingMoney = pick(input.shippingTotal, lineShipping)
      const shippingDiscountMoney = pick(input.shippingDiscountTotal, lineShippingDiscounts)
      const taxMoney = pick(input.taxTotal, lineTaxes)
      const shippingTaxMoney = pick(input.shippingTaxTotal, lineShippingTaxes)
      // P&L is expressed in the order currency. Values booked in another currency
      // (INR warehouse cost, CAD carrier cost, …) are FX-converted instead of being
      // dropped, and every applied rate is recorded on the order for auditability.
      const fxApplied: Record<string, number> = {}
      const noteConversion = (source: string): number => {
        if (source === currency) return 1
        const rate = exchangeRateBetween(source, currency, fxRates)
        if (rate > 0) {
          fxApplied[`${source}->${currency}`] = rate
          // Also record the USD quote: `ProfitabilityService.ratesFromMetadata`
          // rebuilds the USD-quoted FX table from it on every recompute, so the
          // order keeps the rates it was priced with forever.
          const usdRate = exchangeRateBetween(source, 'USD', fxRates)
          if (usdRate > 0) fxApplied[`${source}->USD`] = usdRate
        }
        return rate
      }
      // COGS may be booked per line in a different currency (e.g. INR warehouse
      // cost on a USD order), so each entry is converted before summing.
      for (const line of lineBreakdown) noteConversion(line.cogs.currency_code)
      const cogsTotal = pick(
        input.cogsTotal,
        sumMoneyConverted(
          lineBreakdown.map((line) => line.cogs),
          currency
        )
      )

      // grand_total = subtotal - discount - promotion + shipping - shipping_discount + tax + shipping_tax
      const formulaGrandTotal = money(
        amountOf(subtotalMoney) -
          amountOf(discountMoney) -
          amountOf(promotionMoney) +
          amountOf(shippingMoney) -
          amountOf(shippingDiscountMoney) +
          amountOf(taxMoney) +
          amountOf(shippingTaxMoney),
        currency
      )
      const grandTotal = pick(input.grandTotal, formulaGrandTotal)

      const shippingCostTotal = toMoney(input.shippingCostTotal ?? 0, shippingCostCurrency)
      const marketplaceFeesTotal = toMoney(
        input.marketplaceFeesTotal ??
          sumMoneyConverted(
            lineBreakdown.map((line) => line.marketplaceFee),
            currency
          ),
        currency
      )
      const paymentProcessingFeesTotal = toMoney(
        input.paymentProcessingFeesTotal ?? roundMoney(amountOf(grandTotal) * 0.029),
        currency
      )

      // Marketplace Facilitator Tax: Amazon/eBay/Etsy collect and remit the tax and
      // withhold it from the payout, so it is booked as withheld, not as income.
      const taxCollectionModel: TaxCollectionModelValue =
        input.taxCollectionModel ??
        (input.taxCollectedByMarketplace
          ? TaxCollectionModel.MARKETPLACE_FACILITATOR
          : TaxCollectionModel.SELLER)
      const withheldTaxFallback =
        taxCollectionModel === TaxCollectionModel.MARKETPLACE_FACILITATOR
          ? money(amountOf(taxMoney) + amountOf(shippingTaxMoney), currency)
          : money(0, currency)
      const marketplaceWithheldTaxTotal = pick(
        input.marketplaceWithheldTaxTotal,
        withheldTaxFallback
      )

      // Keep the platform total and any formula drift auditable instead of losing it.
      const channelMetadata: Record<string, any> = { ...(input.channelMetadata ?? {}) }
      const detectedPlatform = input.marketplaceCode?.trim()
      // With a seller account the channel is derived from it; only a direct import
      // without one needs the detected platform recorded for traceability.
      if (
        detectedPlatform &&
        detectedPlatform !== 'direct' &&
        !input.sellerAccountId &&
        !channelMetadata.platform
      ) {
        channelMetadata.platform = detectedPlatform
      }
      if (input.grandTotal !== undefined && input.grandTotal !== null) {
        const difference = roundMoney(amountOf(grandTotal) - amountOf(formulaGrandTotal))
        channelMetadata.platformGrandTotal = grandTotal
        if (Math.abs(difference) > 0.01) {
          channelMetadata.totalsMismatch = {
            formulaGrandTotal,
            platformGrandTotal: grandTotal,
            difference: money(difference, currency),
          }
        }
      }

      // A fresh order starts with no refunds. The P&L itself lives in exactly one
      // place (ProfitabilityService) so create-time and recompute-time figures can
      // never diverge, and Marketplace Facilitator Tax is never deducted twice.
      const refundedTotal = money(0, currency)
      const profitability = ProfitabilityService.compute({
        currency,
        subtotal: subtotalMoney,
        discountTotal: discountMoney,
        promotionTotal: promotionMoney,
        shippingTotal: shippingMoney,
        shippingDiscountTotal: shippingDiscountMoney,
        taxTotal: taxMoney,
        shippingTaxTotal: shippingTaxMoney,
        grandTotal,
        marketplaceFeesTotal,
        paymentProcessingFeesTotal,
        refundedTotal,
        cogsTotal,
        shippingCostTotal,
        marketplaceWithheldTaxTotal,
        taxCollectionModel,
        exchangeRates: fxRates,
      })
      const { netProceeds, grossProfit, netProfit } = {
        netProceeds: roundMoney(amountOf(profitability.netProceeds)),
        grossProfit: roundMoney(amountOf(profitability.grossProfit)),
        netProfit: roundMoney(amountOf(profitability.netProfit)),
      }
      const reportingTotal = money(amountOf(grandTotal) * exchangeRate, reportingCurrency)
      const appliedRates = { ...fxApplied, ...profitability.fxApplied }
      if (Object.keys(appliedRates).length > 0) {
        channelMetadata.fxConversions = { ...appliedRates, reporting: exchangeRate }
      }

      // 4. Create Order header
      const order = new Order()
      order.useTransaction(trx)
      order.userId = input.userId
      order.sellerAccountId = input.sellerAccountId ?? null
      order.customerId = customer.id
      order.shippingAddressId = shippingAddressId
      order.billingAddressId = shippingAddressId
      order.syncJobId = input.syncJobId ?? null
      order.orderNumber = input.orderNumber
      order.externalOrderId = input.externalOrderId ?? null
      order.externalDisplayId = input.externalDisplayId ?? null
      order.marketplaceSiteId = input.marketplaceSiteId ?? null
      order.sourceType = input.sourceType || OrderSourceType.MANUAL
      order.status = input.status || OrderStatus.CONFIRMED
      order.paymentStatus = input.paymentStatus || OrderPaymentStatus.PAID
      order.fulfillmentStatus = FulfillmentStatus.UNFULFILLED
      order.syncStatus = input.externalOrderId
        ? EntitySyncStatus.SYNCED
        : EntitySyncStatus.NOT_APPLICABLE
      // Default to MFN (merchant fulfilled); a platform AFN/FBA line overrides it.
      const derivedChannel =
        input.fulfillmentChannel ??
        (preparedLines.some(
          (line) =>
            line.lineModel.fulfillmentChannel === FulfillmentChannel.AFN ||
            line.lineModel.fulfillmentChannel === FulfillmentChannel.FBA
        )
          ? FulfillmentChannel.AFN
          : FulfillmentChannel.MFN)
      order.fulfillmentChannel = derivedChannel
      order.taxCollectionModel = taxCollectionModel
      order.channelMetadata = channelMetadata
      order.exchangeRate = exchangeRate.toFixed(8)
      order.subtotal = subtotalMoney
      order.discountTotal = discountMoney
      order.promotionTotal = promotionMoney
      order.shippingTotal = shippingMoney
      order.shippingDiscountTotal = shippingDiscountMoney
      order.taxTotal = taxMoney
      order.shippingTaxTotal = shippingTaxMoney
      order.marketplaceWithheldTaxTotal = marketplaceWithheldTaxTotal
      order.grandTotal = grandTotal
      order.marketplaceFeesTotal = marketplaceFeesTotal
      order.paymentProcessingFeesTotal = paymentProcessingFeesTotal
      order.shippingCostTotal = shippingCostTotal
      order.cogsTotal = cogsTotal
      order.refundedTotal = refundedTotal
      order.netProceeds = money(netProceeds, currency)
      order.grossProfit = money(grossProfit, currency)
      order.netProfit = money(netProfit, currency)
      order.reportingTotal = reportingTotal
      order.shippingAddressSnapshot = input.shippingAddress ?? null
      order.buyerNotes = input.buyerNotes ?? null
      order.internalNotes = input.internalNotes ?? null
      order.orderedAt = input.orderedAt ? DateTime.fromISO(input.orderedAt) : DateTime.now()
      order.confirmedAt = DateTime.now()
      order.earliestShipAt = toDateTimeOrNull(input.earliestShipAt)
      order.latestShipAt = toDateTimeOrNull(input.latestShipAt)
      order.earliestDeliveryAt = toDateTimeOrNull(input.earliestDeliveryAt)
      order.latestDeliveryAt = toDateTimeOrNull(input.latestDeliveryAt)
      await order.save()

      // 5. Save OrderLineItems and reserve stock on ProductVariant
      for (const { lineModel, variantToReserve } of preparedLines) {
        lineModel.useTransaction(trx)
        lineModel.orderId = order.id
        await lineModel.save()

        if (variantToReserve) {
          variantToReserve.useTransaction(trx)
          variantToReserve.stockReserved =
            (variantToReserve.stockReserved || 0) + lineModel.quantityOrdered
          await variantToReserve.save()
        }
      }

      // 6. Store isolated raw marketplace payload if provided
      if (input.rawPayload) {
        const serialized = JSON.stringify(input.rawPayload)
        const byteLength = Buffer.byteLength(serialized, 'utf8')
        if (byteLength > 262144) {
          throw new Error('PAYLOAD_TOO_LARGE: Raw marketplace order payload exceeds 256 KB limit.')
        }
        const redactedFields: string[] = []
        const sanitized = redactPayload(input.rawPayload, redactedFields) as Record<string, unknown>
        const payloadRecord = new OrderImportPayload()
        payloadRecord.useTransaction(trx)
        payloadRecord.userId = input.userId
        payloadRecord.orderId = order.id
        payloadRecord.payloadHash = crypto.createHash('sha256').update(serialized).digest('hex')
        payloadRecord.payloadSizeBytes = byteLength
        payloadRecord.rawPayload = sanitized
        payloadRecord.redactedFields = redactedFields
        await payloadRecord.save()
      }

      // 7. Update customer repeat-purchase stats (reporting currency)
      const newOrdersCount = (customer.ordersCount || 0) + 1
      const previousSpent = normalizePriceMoney(customer.totalSpent, reportingCurrency)
      customer.ordersCount = newOrdersCount
      customer.totalSpent = sumMoney([previousSpent, reportingTotal], reportingCurrency)
      if (!customer.firstOrderAt) {
        customer.firstOrderAt = order.orderedAt
      }
      customer.lastOrderAt = order.orderedAt
      await customer.save()

      // 8. Transactional outbox event & audit log
      const outbox = new OutboxEvent()
      outbox.useTransaction(trx)
      outbox.userId = input.userId
      outbox.aggregateType = 'orders'
      outbox.aggregateId = order.id
      outbox.eventType = 'order.created'
      outbox.idempotencyKey = `order.created:${order.id}`
      outbox.payload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        externalOrderId: order.externalOrderId,
        grandTotal: order.grandTotal,
        fulfillmentChannel: order.fulfillmentChannel,
        taxCollectionModel: order.taxCollectionModel,
      }
      outbox.status = OutboxEventStatus.PENDING
      await outbox.save()

      // 9. Explainable risk signals for this order (never an automatic block).
      const riskSignals = await this.collectRiskSignals(order, trx)

      return { order, riskSignals }
    }).then(async ({ order, riskSignals }) => {
      // Events fire after the transaction commits so listeners never read
      // half-written rows; a listener failure cannot roll the order back.
      for (const signal of riskSignals) {
        try {
          await RiskSignalFlagged.dispatch({
            signalId: signal.id,
            customerId: signal.customerId,
            userId: signal.userId,
            reason: signal.reason ?? '',
            severity: signal.severity,
            requestId: input.requestId ?? undefined,
          })
        } catch {
          // The signal is already persisted; the notification/task is best-effort.
        }
      }
      return order
    })
  }

  /** Persists the risk signals the rules detected (empty when the order is clean). */
  private static async collectRiskSignals(order: Order, trx: TransactionClientContract) {
    try {
      return await RiskSignalService.evaluateOrder({ order, trx })
    } catch {
      // Risk evaluation must never block a legitimate order from being recorded.
      return []
    }
  }

  /**
   * Cancels an order and releases the inventory it was holding.
   *
   * Cancellation is a domain transition, not a status write: units that were
   * reserved at order creation but never shipped go back to `stockAvailable`
   * (`stock_reserved` is decremented, `stock_on_hand` is untouched because those
   * units never left the warehouse), and every line records how many units were
   * cancelled. Already-shipped units are *not* released — they are returned
   * through an RMA, which restocks them.
   *
   * Idempotent: cancelling an already-cancelled order is a no-op.
   */
  static async cancelOrder(input: {
    userId: string
    orderId: string
    reason?: string | null
    actorUserId?: string
    requestId?: string | null
  }): Promise<{ order: Order; releasedUnits: number }> {
    return await AuditContext.run(
      {
        actorUserId: input.actorUserId ?? input.userId,
        requestId: input.requestId ?? null,
        reason: 'order.cancelled',
      },
      async (trx) => {
        const order = await Order.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('id', input.orderId)
          .preload('lineItems')
          .forUpdate()
          .firstOrFail()

        if (order.status === OrderStatus.CANCELLED) return { order, releasedUnits: 0 }

        // Money already went back to the buyer, so the sale is settled: cancelling it
        // would strand those refunds and re-open stock that a return may have restocked.
        // Refunded lines are handled through a return request or a claim instead.
        const alreadyRefunded = roundMoney(amountOf(order.refundedTotal))
        if (alreadyRefunded > 0) {
          throw new Error(
            `ALREADY_REFUNDED: order ${order.orderNumber} has ${alreadyRefunded} ${currencyOf(order.refundedTotal)} refunded; record a return/claim instead of cancelling.`
          )
        }

        let releasedUnits = 0
        for (const line of order.lineItems) {
          const releasable =
            Number(line.quantityOrdered ?? 0) -
            Number(line.quantityFulfilled ?? 0) -
            Number(line.quantityCancelled ?? 0)
          if (releasable <= 0) continue

          line.useTransaction(trx)
          line.quantityCancelled = Number(line.quantityCancelled ?? 0) + releasable
          line.fulfillmentStatus =
            Number(line.quantityFulfilled ?? 0) > 0
              ? FulfillmentStatus.PARTIALLY_FULFILLED
              : FulfillmentStatus.CANCELLED
          await line.save()

          if (line.productVariantId) {
            const variant = await ProductVariant.query({ client: trx })
              .where('userId', input.userId)
              .andWhere('id', line.productVariantId)
              .forUpdate()
              .first()
            if (variant) {
              variant.stockReserved = Math.max(0, Number(variant.stockReserved ?? 0) - releasable)
              await variant.save()
            }
          }
          releasedUnits += releasable
        }

        order.useTransaction(trx)
        order.status = OrderStatus.CANCELLED
        order.cancelledAt = DateTime.now()
        order.fulfillmentStatus = order.lineItems.some(
          (line) => Number(line.quantityFulfilled ?? 0) > 0
        )
          ? FulfillmentStatus.PARTIALLY_FULFILLED
          : FulfillmentStatus.CANCELLED
        if (input.reason) {
          order.internalNotes = [order.internalNotes, `Cancelled: ${input.reason}`]
            .filter(Boolean)
            .join('\n')
            .slice(0, 4000)
        }
        await order.save()

        return { order, releasedUnits }
      }
    )
  }

  /**
   * Recomputes `net_proceeds`, `gross_profit` and `net_profit` from the order's
   * stored PriceMoney columns. Used after refunds, shipments and invoice lines so
   * profitability can never drift from the recorded amounts.
   */
  static recomputeProfitability(order: Order): Order {
    // Reuse the FX rates recorded at import time so a recompute (after a refund, a
    // shipment or an invoice line) can never drift from the rates the order was
    // priced with; a currency without a recorded rate falls back to the FX table.
    const rates = ProfitabilityService.ratesFromMetadata(order.channelMetadata)
    const currency = currencyOf(order.grandTotal)
    const result = ProfitabilityService.compute({
      currency,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      promotionTotal: order.promotionTotal,
      shippingTotal: order.shippingTotal,
      shippingDiscountTotal: order.shippingDiscountTotal,
      taxTotal: order.taxTotal,
      shippingTaxTotal: order.shippingTaxTotal,
      grandTotal: order.grandTotal,
      marketplaceFeesTotal: order.marketplaceFeesTotal,
      paymentProcessingFeesTotal: order.paymentProcessingFeesTotal,
      refundedTotal: order.refundedTotal,
      cogsTotal: order.cogsTotal,
      shippingCostTotal: order.shippingCostTotal,
      marketplaceWithheldTaxTotal: order.marketplaceWithheldTaxTotal,
      taxCollectionModel: order.taxCollectionModel,
      exchangeRates: rates,
    })
    order.netProceeds = result.netProceeds
    order.grossProfit = result.grossProfit
    order.netProfit = result.netProfit
    const exchangeRate = Number(order.exchangeRate || 1) || 1
    order.reportingTotal = money(
      amountOf(order.grandTotal) * exchangeRate,
      currencyOf(order.reportingTotal, currency)
    )
    return order
  }

  /**
   * Bulk import entry point for both canonical Seller Core JSON and raw
   * marketplace payloads.
   *
   * Each entry in `payloads` has its platform auto-detected
   * (Amazon SP-API / eBay Fulfillment / Etsy v3 / MedusaJS v2) and is normalized
   * through `OrderSyncNormalizerService`; entries in `orders` are treated as
   * already-canonical. Per-record failures are captured in `sync_job_errors`
   * instead of aborting the batch, and the whole batch is idempotent per
   * `(userId, idempotencyKey)`.
   */
  static async importBulkOrders(input: {
    userId: string
    actorUserId?: string
    sellerAccountId?: string | null
    idempotencyKey: string
    correlationId?: string
    reportingCurrencyCode?: string
    exchangeRate?: number
    /** Already-canonical orders (Seller Core JSON shape). */
    orders?: Array<Omit<CreateOrderInput, 'userId' | 'syncJobId'>>
    /** Raw marketplace payloads; the platform is auto-detected when not supplied. */
    payloads?: BulkImportPayload[]
  }): Promise<{
    job: SyncJob
    createdOrderIds: string[]
    duplicateOrderNumbers: string[]
    errors: SyncJobError[]
  }> {
    const canonicalOrders = input.orders ?? []
    const rawPayloads = input.payloads ?? []
    const totalRecords = canonicalOrders.length + rawPayloads.length

    if (totalRecords === 0) {
      throw new Error('VALIDATION_ERROR: Bulk import requires at least one order or payload.')
    }
    if (totalRecords > 500) {
      throw new Error('BATCH_LIMIT_EXCEEDED: Bulk import supports at most 500 orders per batch.')
    }

    const existingJob = await SyncJob.query()
      .where('userId', input.userId)
      .andWhere('idempotencyKey', input.idempotencyKey)
      .preload('errors')
      .first()

    if (existingJob) {
      const existingOrders = await Order.query()
        .where('userId', input.userId)
        .andWhere('syncJobId', existingJob.id)
      return {
        job: existingJob,
        createdOrderIds: existingOrders.map((o) => o.id),
        duplicateOrderNumbers: [],
        errors: existingJob.errors ?? [],
      }
    }

    const job = await SyncJob.create({
      userId: input.userId,
      sellerAccountId: input.sellerAccountId ?? null,
      jobType: SyncJobType.MANUAL_BULK_IMPORT,
      status: SyncJobStatus.RUNNING,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId ?? generateEntityId(),
      totalRecords,
      processedRecords: 0,
      succeededRecords: 0,
      failedRecords: 0,
      skippedDuplicates: 0,
      errorSummary: {},
      startedAt: DateTime.now(),
    })

    const createdOrderIds: string[] = []
    const duplicateOrderNumbers: string[] = []
    const recordedErrors: SyncJobError[] = []

    /** Records a per-record failure without aborting the batch. */
    const recordFailure = async (entry: ImportEntry, err: unknown) => {
      job.failedRecords += 1
      job.processedRecords += 1
      const message = err instanceof Error ? err.message : 'Unknown import error'
      const code =
        err instanceof OrderSyncNormalizationError
          ? err.code
          : err instanceof Error && err.message.startsWith('VALIDATION_ERROR')
            ? 'IMPORT_VALIDATION_ERROR'
            : 'IMPORT_VALIDATION_OR_CONSTRAINT_ERROR'
      const jobErr = await SyncJobError.create({
        syncJobId: job.id,
        userId: input.userId,
        recordIndex: entry.index,
        externalRecordId: entry.externalRecordId,
        errorCode: code,
        errorMessage: message,
        fieldErrors: [],
        rawExcerpt: entry.rawExcerpt,
        isResolved: false,
      })
      recordedErrors.push(jobErr)
    }

    // Normalize every raw payload up-front so detection/normalization failures are
    // reported against their own record index rather than the first insert error.
    const entries: ImportEntry[] = []
    const normalizationFailures: Array<{ entry: ImportEntry; error: unknown }> = []

    for (const [index, raw] of rawPayloads.entries()) {
      const detection =
        raw.platform ?? OrderSyncNormalizerService.detectPayloadPlatform(raw.payload)
      const entry: ImportEntry = {
        index,
        platform: detection,
        externalRecordId: extractExternalRecordId(raw.payload) ?? `payload-index-${index}`,
        rawExcerpt: buildRawExcerpt(raw.payload),
        payload: raw.payload,
      }
      entries.push(entry)
      // Canonical Seller Core JSON needs no normalization; it is already typed.
      if (detection === 'seller_core') {
        entry.order = raw.payload as NormalizedImportOrder
        continue
      }
      try {
        assertPayloadSize(raw.payload)
        const normalized = OrderSyncNormalizerService.normalizeOrderPayload(raw.payload, {
          platform: detection,
          orderItemsPayload: raw.orderItemsPayload,
          context: {
            sellerAccount: raw.sellerAccount ?? null,
            reportingCurrencyCode: input.reportingCurrencyCode,
            exchangeRate: input.exchangeRate,
          },
        })
        entry.order = OrderSyncNormalizerService.toCreateOrderInput(normalized, {
          userId: input.userId,
          actorUserId: input.actorUserId ?? input.userId,
          sellerAccountId: raw.sellerAccountId ?? input.sellerAccountId ?? null,
          reportingCurrencyCode: input.reportingCurrencyCode,
          exchangeRate: input.exchangeRate,
          rawPayload: asRecord(raw.payload),
        })
      } catch (err) {
        normalizationFailures.push({ entry, error: err })
      }
    }

    for (const [offset, canonical] of canonicalOrders.entries()) {
      entries.push({
        index: rawPayloads.length + offset,
        platform: 'seller_core',
        externalRecordId: canonical.externalOrderId ?? canonical.orderNumber ?? null,
        rawExcerpt: {
          orderNumber: canonical.orderNumber ?? null,
          externalOrderId: canonical.externalOrderId ?? null,
        },
        order: canonical as NormalizedImportOrder,
      })
    }

    for (const failure of normalizationFailures) {
      await recordFailure(failure.entry, failure.error)
    }

    for (const entry of entries) {
      if (!entry.order) continue
      const orderInput = entry.order
      job.processedRecords += 1

      try {
        const effectiveSellerAccountId = orderInput.sellerAccountId ?? input.sellerAccountId ?? null

        // Idempotency: the marketplace identity wins over the local order number,
        // so re-importing the same Amazon order never creates a duplicate.
        if (effectiveSellerAccountId && orderInput.externalOrderId) {
          const duplicateExternal = await Order.query()
            .where('userId', input.userId)
            .andWhere('sellerAccountId', effectiveSellerAccountId)
            .andWhere('externalOrderId', orderInput.externalOrderId)
            .first()
          if (duplicateExternal) {
            job.skippedDuplicates += 1
            duplicateOrderNumbers.push(duplicateExternal.orderNumber)
            continue
          }
        }

        if (orderInput.orderNumber) {
          const duplicateOrderNum = await Order.query()
            .where('userId', input.userId)
            .andWhere('orderNumber', orderInput.orderNumber)
            .first()
          if (duplicateOrderNum) {
            job.skippedDuplicates += 1
            duplicateOrderNumbers.push(duplicateOrderNum.orderNumber)
            continue
          }
        }

        const created = await this.createOrder({
          ...orderInput,
          userId: input.userId,
          actorUserId: input.actorUserId ?? input.userId,
          sellerAccountId: effectiveSellerAccountId,
          sourceType: orderInput.sourceType || OrderSourceType.MARKETPLACE_IMPORT,
          reportingCurrencyCode: orderInput.reportingCurrencyCode ?? input.reportingCurrencyCode,
          exchangeRate: orderInput.exchangeRate ?? input.exchangeRate,
          syncJobId: job.id,
          rawPayload: orderInput.rawPayload ?? entry.rawExcerpt,
        })

        createdOrderIds.push(created.id)
        job.succeededRecords += 1
      } catch (err) {
        await recordFailure(entry, err)
      }
    }

    job.status =
      job.failedRecords > 0
        ? job.succeededRecords > 0 || job.skippedDuplicates > 0
          ? SyncJobStatus.COMPLETED_WITH_ERRORS
          : SyncJobStatus.FAILED
        : SyncJobStatus.COMPLETED
    job.completedAt = DateTime.now()
    job.errorSummary = {
      failedCount: job.failedRecords,
      skippedDuplicatesCount: job.skippedDuplicates,
      normalizationFailures: normalizationFailures.length,
    }
    await job.save()

    return {
      job,
      createdOrderIds,
      duplicateOrderNumbers,
      errors: recordedErrors,
    }
  }
}
