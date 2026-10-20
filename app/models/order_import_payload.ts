/**
 * OrderImportPayload — maps to "order_import_payloads".
 * Raw marketplace payloads isolated from normalized order data, with size cap (256 KB), SHA-256 hash and PII/secret redaction metadata.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Order from './order.js'
import SellerAccount from './seller_account.js'
import SyncJob from './sync_job.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class OrderImportPayload extends AppBaseModel {
  static readonly table = 'order_import_payloads'
  static readonly idPrefix = 'opay'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'order_id' })
  declare public orderId: string

  @column({ columnName: 'sync_job_id' })
  declare public syncJobId: string | null

  @column({ columnName: 'seller_account_id' })
  declare public sellerAccountId: string | null

  @column({ columnName: 'payload_hash' })
  declare public payloadHash: string

  @column({ columnName: 'payload_size_bytes' })
  declare public payloadSizeBytes: number

  @column({ columnName: 'raw_payload', prepare: prepareJson })
  declare public rawPayload: any

  @column({ columnName: 'redacted_fields', prepare: prepareJson })
  declare public redactedFields: any

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare public order: BelongsTo<typeof Order>

  @belongsTo(() => SyncJob, { foreignKey: 'syncJobId' })
  declare public syncJob: BelongsTo<typeof SyncJob>

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare public sellerAccount: BelongsTo<typeof SellerAccount>
}
