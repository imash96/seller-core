import { column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'
import { moneyColumn } from './json_helpers.js'
import AppBaseModel from './base_model.js'
import type { PriceMoney } from '../types/price.js'

export default class ManualReconciliation extends AppBaseModel {
  static readonly table = 'manual_reconciliations'
  static readonly idPrefix = 'mrec'

  @column({ columnName: 'user_id' }) declare userId: string
  @column({ columnName: 'financial_transaction_id' }) declare financialTransactionId: string
  @column({ columnName: 'source_reference' }) declare sourceReference: string
  @moneyColumn({ columnName: 'observed_amount' })
  declare public observedAmount: PriceMoney
  @column() declare notes: string | null
  @column({ columnName: 'previous_status' }) declare previousStatus: string
  @column({ columnName: 'reconciled_by_user_id' }) declare reconciledByUserId: string
  @column.dateTime({ columnName: 'reconciled_at' }) declare reconciledAt: DateTime
  @column.dateTime({ columnName: 'reversed_at' }) declare reversedAt: DateTime | null
  @column({ columnName: 'reversed_by_user_id' }) declare reversedByUserId: string | null
  @column({ columnName: 'reversal_reason' }) declare reversalReason: string | null
}
