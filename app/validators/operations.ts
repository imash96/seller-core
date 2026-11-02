import vine from '@vinejs/vine'
import { objectId, priceArrayJson, priceMoney } from './helpers.js'

export const createSellerAccountValidator = vine.create({
  salesChannelId: objectId(),
  accountName: vine.string().trim().minLength(2).maxLength(150),
  externalSellerId: vine.string().trim().minLength(2).maxLength(150),
  marketplaceRegion: vine.string().trim().minLength(2).maxLength(32),
  defaultCurrency: vine.string().fixedLength(3).toUpperCase(),
  rateLimitRpm: vine.number().min(1).max(10000).optional(),
  apiKey: vine.string().trim().optional(),
  apiSecret: vine.string().trim().optional(),
})

export const createCustomerValidator = vine.create({
  fullName: vine.string().trim().minLength(2).maxLength(255),
  email: vine.string().email().trim().optional().nullable(),
  proxyEmail: vine.string().email().trim().optional().nullable(),
  phone: vine.string().trim().optional().nullable(),
  riskLevel: vine.enum(['low', 'medium', 'high', 'under_review', 'cleared'] as const).optional(),
  line1: vine.string().trim().optional(),
  city: vine.string().trim().optional(),
  stateProvince: vine.string().trim().optional(),
  postalCode: vine.string().trim().optional(),
  countryCode: vine.string().fixedLength(2).toUpperCase().optional(),
})

export const createProductValidator = vine.create({
  title: vine.string().trim().minLength(2).maxLength(255),
  brandId: objectId().optional().nullable(),
  categoryId: objectId().optional().nullable(),
  sku: vine.string().trim().minLength(2).maxLength(120),
  skuPrefix: vine.string().trim().maxLength(20).optional(),
  asin: vine.string().trim().maxLength(20).optional().nullable(),
  /** USD base price; the multi-currency array is derived from it. */
  priceUsd: vine.number().min(0),
  costPrice: priceMoney().optional(),
  manufacturingCost: priceMoney().optional(),
  packagingCost: priceMoney().optional(),
  stockOnHand: vine.number().min(0).optional(),
  hasVariants: vine.string().trim().optional(),
  variationDimensions: vine.string().trim().optional(),
  description: vine.string().trim().optional().nullable(),
  pricesJson: priceArrayJson().optional(),
})

// Canonical fulfilment channels and tax collection models (mirrors the DB CHECKs).
const FULFILLMENT_CHANNELS = ['MFN', 'AFN', 'FBA', 'FBM', '3PL', 'direct'] as const
const TAX_COLLECTION_MODELS = ['marketplace_facilitator', 'seller', 'none'] as const

export const createOrderValidator = vine.create({
  orderNumber: vine.string().trim().minLength(2).maxLength(100),
  externalOrderId: vine.string().trim().maxLength(150).optional().nullable(),
  externalDisplayId: vine.string().trim().maxLength(150).optional().nullable(),
  sellerAccountId: objectId().optional().nullable(),
  marketplaceCode: vine.string().trim().maxLength(50).optional(),
  marketplaceSiteId: vine.string().trim().maxLength(64).optional().nullable(),
  fulfillmentChannel: vine.enum(FULFILLMENT_CHANNELS).optional(),
  taxCollectionModel: vine.enum(TAX_COLLECTION_MODELS).optional(),
  earliestShipAt: vine.string().trim().optional().nullable(),
  latestShipAt: vine.string().trim().optional().nullable(),
  earliestDeliveryAt: vine.string().trim().optional().nullable(),
  latestDeliveryAt: vine.string().trim().optional().nullable(),
  currencyCode: vine.string().fixedLength(3).toUpperCase().optional(),
  reportingCurrencyCode: vine.string().fixedLength(3).toUpperCase().optional(),
  exchangeRate: vine.number().min(0.0001).optional(),
  shippingCostTotal: priceMoney().optional(),
  shippingCostCurrencyCode: vine.string().fixedLength(3).toUpperCase().optional(),
  paymentProcessingFeesTotal: priceMoney().optional(),
  marketplaceFeesTotal: priceMoney().optional(),
  customerFullName: vine.string().trim().minLength(2).maxLength(255),
  customerEmail: vine.string().email().trim().optional().nullable(),
  customerPhone: vine.string().trim().optional().nullable(),
  shippingLine1: vine.string().trim().optional(),
  shippingCity: vine.string().trim().optional(),
  shippingPostalCode: vine.string().trim().optional(),
  shippingCountryCode: vine.string().fixedLength(2).toUpperCase().optional(),
  sku: vine.string().trim().minLength(1).maxLength(120),
  itemTitle: vine.string().trim().minLength(1).maxLength(255),
  quantityOrdered: vine.number().withoutDecimals().min(1),
  unitPrice: priceMoney(),
  unitCost: priceMoney().optional(),
  taxTotal: priceMoney().optional(),
  discountTotal: priceMoney().optional(),
  promotionTotal: priceMoney().optional(),
  shippingTotal: priceMoney().optional(),
  shippingDiscountTotal: priceMoney().optional(),
  shippingTaxTotal: priceMoney().optional(),
})

export const bulkOrderImportValidator = vine.create({
  idempotencyKey: vine.string().trim().minLength(3).maxLength(150).optional(),
  sellerAccountId: objectId().optional().nullable(),
  ordersJson: vine.string().trim().minLength(2).optional(),
  jsonPayload: vine.string().trim().minLength(2).optional(),
})

export const createShipmentValidator = vine.create({
  orderId: objectId(),
  orderLineItemId: objectId(),
  shipmentNumber: vine.string().trim().minLength(2).maxLength(100),
  carrierCode: vine.string().trim().minLength(2).maxLength(50),
  carrierName: vine.string().trim().minLength(2).maxLength(150),
  serviceLevel: vine.string().trim().optional(),
  trackingNumber: vine.string().trim().optional(),
  quantityShipped: vine.number().withoutDecimals().min(1),
  lengthCm: vine.number().min(1).optional(),
  widthCm: vine.number().min(1).optional(),
  heightCm: vine.number().min(1).optional(),
  deadWeightGrams: vine.number().min(1).optional(),
  estimatedShippingCost: priceMoney().optional(),
  estimatedShippingCostCurrencyCode: vine.string().fixedLength(3).toUpperCase().optional(),
  insuranceCost: priceMoney().optional(),
  status: vine
    .enum([
      'pending',
      'label_created',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'delayed',
      'exception',
      'failed',
      'returned_to_sender',
    ] as const)
    .optional(),
})

export const createShippingInvoiceValidator = vine.create({
  carrierCode: vine.string().trim().minLength(2).maxLength(50),
  carrierName: vine.string().trim().minLength(2).maxLength(150),
  invoiceNumber: vine.string().trim().minLength(2).maxLength(100),
  currencyCode: vine.string().fixedLength(3).toUpperCase().optional(),
  invoiceDate: vine.string().trim(),
  dueDate: vine.string().trim().optional(),
  shipmentId: objectId().optional().nullable(),
  chargeType: vine.enum([
    'base_freight',
    'fuel_surcharge',
    'residential_fee',
    'remote_area_surcharge',
    'customs_duty',
    'tax',
    'signature_fee',
    'dimensional_weight_adjustment',
    'address_correction',
    'return_shipping',
    'other',
  ] as const),
  expectedAmount: priceMoney().optional(),
  billedAmount: priceMoney(),
  taxAmount: priceMoney().optional(),
})

export const createReturnRequestValidator = vine.create({
  orderId: objectId(),
  orderLineItemId: objectId(),
  rmaNumber: vine.string().trim().minLength(2).maxLength(100),
  returnReason: vine.enum([
    'defective',
    'wrong_item',
    'damaged_in_transit',
    'not_as_described',
    'changed_mind',
    'size_fit_issue',
    'late_delivery',
    'other',
  ] as const),
  resolutionType: vine
    .enum(['refund', 'partial_refund', 'replacement', 'store_credit', 'rejected'] as const)
    .optional(),
  quantityRequested: vine.number().withoutDecimals().min(1),
  restockingFeeTotal: priceMoney().optional(),
  returnShippingCost: priceMoney().optional(),
  returnCostCurrencyCode: vine.string().fixedLength(3).toUpperCase().optional(),
  customerComments: vine.string().trim().optional(),
})

export const createRefundValidator = vine.create({
  orderId: objectId(),
  returnRequestId: objectId().optional().nullable(),
  refundNumber: vine.string().trim().minLength(2).maxLength(100),
  itemsRefundTotal: priceMoney(),
  shippingRefundTotal: priceMoney().optional(),
  taxRefundTotal: priceMoney().optional(),
  restockingFeeTotal: priceMoney().optional(),
  reason: vine.string().trim().optional(),
})

export const createCreditCardValidator = vine.create({
  cardLabel: vine.string().trim().minLength(2).maxLength(150),
  brandName: vine.string().trim().minLength(2).maxLength(64),
  issuerBank: vine.string().trim().optional(),
  cardholderName: vine.string().trim().minLength(2).maxLength(150),
  last4Digits: vine.string().regex(/^\d{4}$/),
  expMonth: vine.number().withoutDecimals().min(1).max(12),
  expYear: vine.number().withoutDecimals().min(2000).max(2100),
  currencyCode: vine.string().fixedLength(3).toUpperCase().optional(),
  creditLimit: priceMoney().optional(),
  currentBalance: priceMoney().optional(),
  minimumPaymentDue: priceMoney().optional(),
  nextPaymentDueDate: vine.string().trim().optional(),
  sellerAccountId: objectId().optional().nullable(),
  usagePurpose: vine
    .enum([
      'ad_spend',
      'subscription_fee',
      'chargeback_backup',
      'shipping_labels',
      'primary_billing',
    ] as const)
    .optional(),
  dataClassification: vine.enum(['business', 'household_personal'] as const).optional(),
})

export const createFinancialTransactionValidator = vine.create({
  referenceNumber: vine.string().trim().minLength(2).maxLength(100),
  transactionType: vine.enum([
    'income',
    'expense',
    'transfer',
    'credit_card_payment',
    'refund_payout',
    'marketplace_settlement',
  ] as const),
  dataClassification: vine.enum(['business', 'household_personal'] as const).optional(),
  description: vine.string().trim().minLength(2).maxLength(255),
  vendorOrPayer: vine.string().trim().optional(),
  originalCurrencyCode: vine.string().fixedLength(3).toUpperCase().optional(),
  originalAmount: priceMoney({ min: 0.01 }),
  exchangeRate: vine.number().min(0.0001).optional(),
  reportingCurrencyCode: vine.string().fixedLength(3).toUpperCase().optional(),
  taxTotal: priceMoney().optional(),
  transactionDate: vine.string().trim(),
  financialAccountId: objectId().optional().nullable(),
  financeCategoryId: objectId().optional().nullable(),
  creditCardId: objectId().optional().nullable(),
  sellerAccountId: objectId().optional().nullable(),
  orderId: objectId().optional().nullable(),
})

/* ------------------------------------------------------------------ */
/* Update + supporting validators for complete CRUD flows               */
/* ------------------------------------------------------------------ */

export const updateBrandValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(150).optional(),
  slug: vine.string().trim().minLength(2).maxLength(150).optional(),
  websiteUrl: vine.string().trim().maxLength(500).optional().nullable(),
  isActive: vine.boolean().optional(),
})

export const updateCategoryValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(150).optional(),
  slug: vine.string().trim().minLength(2).maxLength(150).optional(),
  description: vine.string().trim().optional().nullable(),
  sortOrder: vine.number().min(0).optional(),
  isActive: vine.boolean().optional(),
})

export const updateProductValidator = vine.create({
  title: vine.string().trim().minLength(2).maxLength(255).optional(),
  brandId: objectId().optional().nullable(),
  categoryId: objectId().optional().nullable(),
  description: vine.string().trim().optional().nullable(),
  status: vine.enum(['draft', 'active', 'archived', 'discontinued'] as const).optional(),
})

export const updateCustomerValidator = vine.create({
  fullName: vine.string().trim().minLength(2).maxLength(255).optional(),
  email: vine.string().email().trim().optional().nullable(),
  phone: vine.string().trim().optional().nullable(),
  riskLevel: vine.enum(['low', 'medium', 'high', 'under_review', 'cleared'] as const).optional(),
  notes: vine.string().trim().optional().nullable(),
})

export const updateSellerAccountValidator = vine.create({
  accountName: vine.string().trim().minLength(2).maxLength(150).optional(),
  status: vine
    .enum([
      'pending_setup',
      'active',
      'auth_expired',
      'rate_limited',
      'suspended',
      'disconnected',
    ] as const)
    .optional(),
  healthStatus: vine.enum(['healthy', 'warning', 'critical', 'unknown'] as const).optional(),
  rateLimitRpm: vine.number().min(1).max(10000).optional(),
})

export const updateFinancialAccountValidator = vine.create({
  accountName: vine.string().trim().minLength(2).maxLength(150).optional(),
  currentBalance: priceMoney().optional(),
  isActive: vine.boolean().optional(),
})

export const updateCreditCardValidator = vine.create({
  cardLabel: vine.string().trim().minLength(2).maxLength(150).optional(),
  currentBalance: priceMoney().optional(),
  creditLimit: priceMoney().optional(),
  minimumPaymentDue: priceMoney().optional(),
  nextPaymentDueDate: vine.string().trim().optional().nullable(),
  status: vine.enum(['active', 'frozen', 'expired', 'cancelled'] as const).optional(),
})

export const createTaskValidator = vine.create({
  title: vine.string().trim().minLength(2).maxLength(255),
  description: vine.string().trim().optional().nullable(),
  taskType: vine
    .enum([
      'credit_card_due',
      'confirm_shipment',
      'message_reply',
      'invoice_due',
      'return_review',
      'fraud_review',
      'restock_alert',
      'claim_deadline',
      'general',
    ] as const)
    .optional(),
  priority: vine.enum(['low', 'medium', 'high', 'urgent'] as const).optional(),
  dueAt: vine.string().trim().optional(),
})

export const updateTaskValidator = vine.create({
  title: vine.string().trim().minLength(2).maxLength(255).optional(),
  description: vine.string().trim().optional().nullable(),
  taskType: vine
    .enum([
      'credit_card_due',
      'confirm_shipment',
      'message_reply',
      'invoice_due',
      'return_review',
      'fraud_review',
      'restock_alert',
      'claim_deadline',
      'general',
    ] as const)
    .optional(),
  priority: vine.enum(['low', 'medium', 'high', 'urgent'] as const).optional(),
  status: vine
    .enum(['pending', 'in_progress', 'completed', 'snoozed', 'dismissed'] as const)
    .optional(),
  dueAt: vine.string().trim().optional(),
})

export const createVariantValidator = vine.create({
  sku: vine.string().trim().minLength(2).maxLength(120),
  title: vine.string().trim().minLength(1).maxLength(255),
  asin: vine.string().trim().maxLength(20).optional().nullable(),
  /** USD base price; the variant price array is derived from it. */
  priceUsd: vine.number().min(0),
  costPrice: priceMoney().optional(),
  manufacturingCost: priceMoney().optional(),
  packagingCost: priceMoney().optional(),
  stockOnHand: vine.number().min(0).optional(),
  attributeName: vine.string().trim().maxLength(100).optional(),
  attributeValue: vine.string().trim().maxLength(255).optional(),
  pricesJson: priceArrayJson().optional(),
})

export const updateVariantStockValidator = vine.create({
  stockOnHand: vine.number().min(0),
  stockReserved: vine.number().min(0).optional(),
})
