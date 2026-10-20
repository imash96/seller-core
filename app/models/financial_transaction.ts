/**
 * FinancialTransaction — maps to "financial_transactions".
 * Multi-currency journal/ledger entries. Original amount + exchange rate + reporting amount are stored together to prevent rounding drift; entries reference orders/cards/invoices so settlements are never double-counted as income.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import CreditCard from './credit_card.js'
import FinanceCategory from './finance_category.js'
import FinancialAccount from './financial_account.js'
import Order from './order.js'
import ProductVariant from './product_variant.js'
import SellerAccount from './seller_account.js'
import ShippingInvoice from './shipping_invoice.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class FinancialTransaction extends AppBaseModel {
  static readonly table = 'financial_transactions'
  static readonly idPrefix = 'ftx'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'financial_account_id' })
  declare public financialAccountId: string | null

  @column({ columnName: 'credit_card_id' })
  declare public creditCardId: string | null

  @column({ columnName: 'finance_category_id' })
  declare public financeCategoryId: string | null

  @column({ columnName: 'seller_account_id' })
  declare public sellerAccountId: string | null

  @column({ columnName: 'order_id' })
  declare public orderId: string | null

  @column({ columnName: 'product_variant_id' })
  declare public productVariantId: string | null

  @column({ columnName: 'shipping_invoice_id' })
  declare public shippingInvoiceId: string | null

  @column({ columnName: 'reference_number' })
  declare public referenceNumber: string

  @column({ columnName: 'transaction_type' })
  declare public transactionType: string

  @column({ columnName: 'data_classification' })
  declare public dataClassification: string

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'description' })
  declare public description: string

  @column({ columnName: 'vendor_or_payer' })
  declare public vendorOrPayer: string | null

  @column({ columnName: 'original_currency_code' })
  declare public originalCurrencyCode: string

  @column({ columnName: 'original_amount' })
  declare public originalAmount: string

  @column({ columnName: 'exchange_rate' })
  declare public exchangeRate: string

  @column({ columnName: 'reporting_currency_code' })
  declare public reportingCurrencyCode: string

  @column({ columnName: 'reporting_amount' })
  declare public reportingAmount: string

  @column({ columnName: 'tax_amount' })
  declare public taxAmount: string

  @column.date({ columnName: 'transaction_date' })
  declare public transactionDate: DateTime

  @column.date({ columnName: 'conversion_date' })
  declare public conversionDate: DateTime | null

  @column.date({ columnName: 'due_date' })
  declare public dueDate: DateTime | null

  @column.dateTime({ columnName: 'settled_at' })
  declare public settledAt: DateTime | null

  @column.dateTime({ columnName: 'reconciled_at' })
  declare public reconciledAt: DateTime | null

  @column({ columnName: 'receipt_url' })
  declare public receiptUrl: string | null

  @column({ columnName: 'notes' })
  declare public notes: string | null

  @column({ columnName: 'metadata', prepare: prepareJson })
  declare public metadata: any

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => FinancialAccount, { foreignKey: 'financialAccountId' })
  declare public financialAccount: BelongsTo<typeof FinancialAccount>

  @belongsTo(() => CreditCard, { foreignKey: 'creditCardId' })
  declare public creditCard: BelongsTo<typeof CreditCard>

  @belongsTo(() => FinanceCategory, { foreignKey: 'financeCategoryId' })
  declare public category: BelongsTo<typeof FinanceCategory>

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare public sellerAccount: BelongsTo<typeof SellerAccount>

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare public order: BelongsTo<typeof Order>

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare public productVariant: BelongsTo<typeof ProductVariant>

  @belongsTo(() => ShippingInvoice, { foreignKey: 'shippingInvoiceId' })
  declare public shippingInvoice: BelongsTo<typeof ShippingInvoice>
}
