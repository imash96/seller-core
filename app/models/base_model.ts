import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { generateEntityId } from '../utils/generate_entity_id.js'
import { normalizePriceMoney } from '../types/price.js'

const MONETARY_KEYS = [
  'subtotalAmount',
  'taxAmount',
  'discountAmount',
  'shippingChargedAmount',
  'totalAmount',
  'marketplaceFeesAmount',
  'paymentProcessingFeesAmount',
  'shippingCostAmount',
  'cogsAmount',
  'refundedAmount',
  'netProceedsAmount',
  'grossProfitAmount',
  'netProfitAmount',
  'reportingTotalAmount',
  'unitPrice',
  'shippingAmount',
  'lineTotalAmount',
  'unitCostAmount',
  'marketplaceFeeAmount',
  'retailPrice',
  'compareAtPrice',
  'costPrice',
  'manufacturingCost',
  'packagingCost',
  'listedPrice',
  'estimatedShippingCost',
  'actualShippingCost',
  'declaredValue',
  'expectedAmount',
  'varianceAmount',
  'paidAmount',
  'billedAmount',
  'refundAmount',
  'restockingFeeAmount',
  'returnShippingCost',
  'itemsRefundAmount',
  'shippingRefundAmount',
  'taxRefundAmount',
  'restockingFeeDeducted',
  'totalRefundAmount',
  'reportingTotalRefund',
  'disputedAmount',
  'sellerLiabilityAmount',
  'currentBalance',
  'availableBalance',
  'creditLimit',
  'statementBalance',
  'minimumPaymentDue',
  'originalAmount',
  'reportingAmount',
  'totalSpent',
]

/**
 * Application base model.
 *
 * Every table uses string ULID primary keys generated application-side with
 * `generateEntityId()` (see app/utils/generate_entity_id.ts). Subclasses set
 * `static readonly idPrefix` (e.g. 'usr') so ids are self-describing in URLs,
 * logs and error messages.
 *
 * `serialize()` automatically attaches `{ currency_code: string, amount: number }`
 * objects (`<field>Money`) for every monetary field on the serialized model.
 */
export default class AppBaseModel extends BaseModel {
  /** Entity prefix used when generating the ULID primary key (e.g. 'usr'). */
  static readonly idPrefix: string = ''

  /** ULID primary key (varchar(64), may include an entity prefix). */
  @column({ isPrimary: true, columnName: 'id' })
  declare public id: string

  @beforeCreate()
  static generateId(model: AppBaseModel) {
    if (!model.id) {
      const prefix = (model.constructor as typeof AppBaseModel).idPrefix
      model.id = generateEntityId(prefix || undefined)
    }
  }

  override serialize(cherryPick?: any): Record<string, any> {
    const raw = super.serialize(cherryPick) as Record<string, any>
    const baseCur = String(
      raw.currencyCode || raw.originalCurrencyCode || raw.preferredCurrency || 'USD'
    ).toUpperCase()
    const repCur = String(raw.reportingCurrencyCode || baseCur).toUpperCase()

    for (const key of MONETARY_KEYS) {
      if (key in raw && raw[key] !== undefined && raw[key] !== null) {
        const moneyKey = key.endsWith('Amount') ? `${key.slice(0, -6)}Money` : `${key}Money`
        const cur = key.startsWith('reporting') ? repCur : baseCur
        if (!(moneyKey in raw)) {
          raw[moneyKey] = normalizePriceMoney(raw[key], cur)
        }
        const exactMoneyKey = `${key}Money`
        if (!(exactMoneyKey in raw)) {
          raw[exactMoneyKey] = normalizePriceMoney(raw[key], cur)
        }
      }
    }

    return raw
  }
}
