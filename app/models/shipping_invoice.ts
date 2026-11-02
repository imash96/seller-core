/**
 * ShippingInvoice — maps to "shipping_invoices".
 * Carrier billing invoices; payment + reconciliation status with due dates and payment references.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import FinancialAccount from './financial_account.js'
import FinancialTransaction from './financial_transaction.js'
import ShippingInvoiceLine from './shipping_invoice_line.js'
import { moneyColumn } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import type { PriceMoney } from '../types/price.js'

export default class ShippingInvoice extends AppBaseModel {
  static readonly table = 'shipping_invoices'
  static readonly idPrefix = 'sinv'

  /** Money attribute that carries this row's currency (serialized as `currencyCode`). */
  static readonly currencyAttribute = 'totalAmount'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'financial_account_id' })
  declare public financialAccountId: string | null

  @column({ columnName: 'carrier_code' })
  declare public carrierCode: string

  @column({ columnName: 'carrier_name' })
  declare public carrierName: string

  @column({ columnName: 'invoice_number' })
  declare public invoiceNumber: string

  @moneyColumn({ columnName: 'subtotal_total' })
  declare public subtotalTotal: PriceMoney

  @moneyColumn({ columnName: 'discount_total' })
  declare public discountTotal: PriceMoney

  @moneyColumn({ columnName: 'tax_total' })
  declare public taxTotal: PriceMoney

  @moneyColumn({ columnName: 'grand_total' })
  declare public grandTotal: PriceMoney

  @moneyColumn({ columnName: 'paid_total' })
  declare public paidTotal: PriceMoney

  @moneyColumn({ columnName: 'variance_total' })
  declare public varianceTotal: PriceMoney

  @column({ columnName: 'payment_status' })
  declare public paymentStatus: string

  @column({ columnName: 'reconciliation_status' })
  declare public reconciliationStatus: string

  @column.date({ columnName: 'invoice_date' })
  declare public invoiceDate: DateTime

  @column.date({ columnName: 'due_date' })
  declare public dueDate: DateTime | null

  @column.dateTime({ columnName: 'paid_at' })
  declare public paidAt: DateTime | null

  @column({ columnName: 'payment_reference' })
  declare public paymentReference: string | null

  @column({ columnName: 'notes' })
  declare public notes: string | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => FinancialAccount, { foreignKey: 'financialAccountId' })
  declare public financialAccount: BelongsTo<typeof FinancialAccount>

  @hasMany(() => ShippingInvoiceLine, { foreignKey: 'shippingInvoiceId' })
  declare public lines: HasMany<typeof ShippingInvoiceLine>

  @hasMany(() => FinancialTransaction, { foreignKey: 'shippingInvoiceId' })
  declare public financialTransactions: HasMany<typeof FinancialTransaction>
}
