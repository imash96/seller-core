/**
 * Shipment — maps to "shipments".
 * Parcel shipments: dimensions, dead/volumetric/billed weight, carrier tracking, delivery timestamps and customer notification flag.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Order from './order.js'
import ShipmentItem from './shipment_item.js'
import ShippingInvoiceLine from './shipping_invoice_line.js'
import AppBaseModel from './base_model.js'

export default class Shipment extends AppBaseModel {
  static readonly table = 'shipments'
  static readonly idPrefix = 'shp'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'order_id' })
  declare public orderId: string

  @column({ columnName: 'shipment_number' })
  declare public shipmentNumber: string

  @column({ columnName: 'carrier_code' })
  declare public carrierCode: string

  @column({ columnName: 'carrier_name' })
  declare public carrierName: string

  @column({ columnName: 'service_level' })
  declare public serviceLevel: string | null

  @column({ columnName: 'tracking_number' })
  declare public trackingNumber: string | null

  @column({ columnName: 'third_party_tracking_number' })
  declare public thirdPartyTrackingNumber: string | null

  @column({ columnName: 'tracking_url' })
  declare public trackingUrl: string | null

  @column({ columnName: 'third_party_tracking_url' })
  declare public thirdPartyTrackingUrl: string | null

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'packaging_type' })
  declare public packagingType: string | null

  @column({ columnName: 'length_cm' })
  declare public lengthCm: string | null

  @column({ columnName: 'width_cm' })
  declare public widthCm: string | null

  @column({ columnName: 'height_cm' })
  declare public heightCm: string | null

  @column({ columnName: 'dead_weight_grams' })
  declare public deadWeightGrams: string | null

  @column({ columnName: 'volumetric_weight_grams' })
  declare public volumetricWeightGrams: string | null

  @column({ columnName: 'billed_weight_grams' })
  declare public billedWeightGrams: string | null

  @column({ columnName: 'currency_code' })
  declare public currencyCode: string

  @column({ columnName: 'estimated_shipping_cost' })
  declare public estimatedShippingCost: string

  @column({ columnName: 'actual_invoiced_cost' })
  declare public actualInvoicedCost: string

  @column.dateTime({ columnName: 'shipped_at' })
  declare public shippedAt: DateTime | null

  @column.dateTime({ columnName: 'estimated_delivery_at' })
  declare public estimatedDeliveryAt: DateTime | null

  @column.dateTime({ columnName: 'delivered_at' })
  declare public deliveredAt: DateTime | null

  @column({ columnName: 'delivery_notification_sent' })
  declare public deliveryNotificationSent: boolean

  @column({ columnName: 'notes' })
  declare public notes: string | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare public order: BelongsTo<typeof Order>

  @hasMany(() => ShipmentItem, { foreignKey: 'shipmentId' })
  declare public shipmentItems: HasMany<typeof ShipmentItem>

  @hasMany(() => ShippingInvoiceLine, { foreignKey: 'shipmentId' })
  declare public invoiceLines: HasMany<typeof ShippingInvoiceLine>
}
