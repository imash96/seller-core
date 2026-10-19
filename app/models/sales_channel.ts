/**
 * SalesChannel — maps to "sales_channels".
 * System catalog of supported marketplaces and sales channels (amazon, ebay, etsy, website, google_shopping, ...).
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import SellerAccount from './seller_account.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

export default class SalesChannel extends AppBaseModel {
  static readonly table = 'sales_channels'
  static readonly idPrefix = 'sch'

  @column({ columnName: 'code' })
  declare public code: string

  @column({ columnName: 'name' })
  declare public name: string

  @column({ columnName: 'channel_type' })
  declare public channelType: string

  @column({ columnName: 'logo_url' })
  declare public logoUrl: string | null

  @column({ columnName: 'supports_oauth' })
  declare public supportsOauth: boolean

  @column({ columnName: 'default_config', prepare: prepareJson })
  declare public defaultConfig: any

  @column({ columnName: 'is_active' })
  declare public isActive: boolean

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @hasMany(() => SellerAccount, { foreignKey: 'salesChannelId' })
  declare public sellerAccounts: HasMany<typeof SellerAccount>
}
