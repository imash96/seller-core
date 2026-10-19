/**
 * SellerAccount — maps to "seller_accounts".
 * User-owned marketplace seller accounts. Credentials stored AES-256-GCM encrypted (encrypted_credentials) or via external vault reference — never plaintext.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import ChannelListing from './channel_listing.js'
import CreditCardSellerAccount from './credit_card_seller_account.js'
import Order from './order.js'
import SalesChannel from './sales_channel.js'
import User from './user.js'
import { prepareJson } from './json_helpers.js'
import { decryptJson, encryptJson } from '../utils/secret_box.js'
import AppBaseModel from './base_model.js'

export default class SellerAccount extends AppBaseModel {
  static readonly table = 'seller_accounts'
  static readonly idPrefix = 'sacc'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'sales_channel_id' })
  declare public salesChannelId: string

  @column({ columnName: 'account_name' })
  declare public accountName: string

  @column({ columnName: 'account_email' })
  declare public accountEmail: string | null

  @column({ columnName: 'account_phone' })
  declare public accountPhone: string | null

  @column({ columnName: 'account_code' })
  declare public accountCode: string | null

  @column({ columnName: 'external_seller_id' })
  declare public externalSellerId: string

  @column({ columnName: 'marketplace_region' })
  declare public marketplaceRegion: string

  @column({ columnName: 'default_currency' })
  declare public defaultCurrency: string

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'health_status' })
  declare public healthStatus: string

  @column({ columnName: 'encrypted_credentials' })
  declare public encryptedCredentials: string | null

  @column({ columnName: 'credential_vault_ref' })
  declare public credentialVaultRef: string | null

  @column({ columnName: 'oauth_scopes' })
  declare public oauthScopes: string | null

  @column.dateTime({ columnName: 'token_expires_at' })
  declare public tokenExpiresAt: DateTime | null

  @column.dateTime({ columnName: 'last_credential_rotated_at' })
  declare public lastCredentialRotatedAt: DateTime | null

  @column({ columnName: 'rate_limit_rpm' })
  declare public rateLimitRpm: number

  @column({ columnName: 'retry_policy', prepare: prepareJson })
  declare public retryPolicy: any

  @column({ columnName: 'sync_checkpoint', prepare: prepareJson })
  declare public syncCheckpoint: any

  @column({ columnName: 'sync_config', prepare: prepareJson })
  declare public syncConfig: any

  @column.dateTime({ columnName: 'last_synced_at' })
  declare public lastSyncedAt: DateTime | null

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare public user: BelongsTo<typeof User>

  @belongsTo(() => SalesChannel, { foreignKey: 'salesChannelId' })
  declare public salesChannel: BelongsTo<typeof SalesChannel>

  @hasMany(() => Order, { foreignKey: 'sellerAccountId' })
  declare public orders: HasMany<typeof Order>

  @hasMany(() => ChannelListing, { foreignKey: 'sellerAccountId' })
  declare public listings: HasMany<typeof ChannelListing>

  @hasMany(() => CreditCardSellerAccount, { foreignKey: 'sellerAccountId' })
  declare public creditCardLinks: HasMany<typeof CreditCardSellerAccount>

  /**
   * Encrypts structured marketplace credentials (AES-256-GCM) before persisting.
   * Credential shapes differ per marketplace, so the payload stays flexible JSON —
   * but it is only ever stored as ciphertext in encrypted_credentials.
   */
  setPlainCredentials(credentials: Record<string, unknown>): void {
    this.encryptedCredentials = encryptJson(credentials)
  }

  /** Decrypts and returns the structured credential payload (or null). */
  getDecryptedCredentials<T = Record<string, unknown>>(): T | null {
    return decryptJson<T>(this.encryptedCredentials)
  }
}
