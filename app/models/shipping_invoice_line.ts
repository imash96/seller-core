/**
 * ShippingInvoiceLine — maps to "shipping_invoice_lines".
 * Charge lines (freight, fuel, duties, signature, ...) linked to shipments. Partial unique index prevents double-billing the same (shipment, charge_type) unless allow_duplicate_charge = true.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Shipment from './shipment.js'
import ShippingInvoice from './shipping_invoice.js'
import AppBaseModel from './base_model.js'

export default class ShippingInvoiceLine extends AppBaseModel {
  static readonly table = 'shipping_invoice_lines'
  static readonly idPrefix = 'sinvl'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'shipping_invoice_id' })
  declare public shippingInvoiceId: string

  @column({ columnName: 'shipment_id' })
  declare public shipmentId: string | null

  @column({ columnName: 'tracking_number' })
  declare public trackingNumber: string | null

  @column({ columnName: 'charge_type' })
  declare public chargeType: string

  @column({ columnName: 'description' })
  declare public description: string | null

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({ columnName: 'expected_amount' })
  declare public expectedAmount: string

  @column({ columnName: 'billed_amount' })
  declare public billedAmount: string

  @column({ columnName: 'variance_amount' })
  declare public varianceAmount: string

  @column({ columnName: 'allow_duplicate_charge' })
  declare public allowDuplicateCharge: boolean

  @column({ columnName: 'reconciliation_notes' })
  declare public reconciliationNotes: string | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => ShippingInvoice, { foreignKey: 'shippingInvoiceId' })
  declare public shippingInvoice: BelongsTo<typeof ShippingInvoice>

  @belongsTo(() => Shipment, { foreignKey: 'shipmentId' })
  declare public shipment: BelongsTo<typeof Shipment>
}
