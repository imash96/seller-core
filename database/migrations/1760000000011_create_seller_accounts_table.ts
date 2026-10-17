import { BaseSchema } from '@adonisjs/lucid/schema'
import { SellerAccountStatus, HealthStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'seller_accounts'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE seller_account_status AS ENUM ('pending_setup', 'active', 'auth_expired', 'rate_limited', 'suspended', 'disconnected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE health_status AS ENUM ('healthy', 'warning', 'critical', 'unknown');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('sales_channel_id')
        .notNullable()
        .references('id')
        .inTable('sales_channels')
        .onDelete('RESTRICT')
      table.string('account_name', 150).notNullable()
      table.string('external_seller_id', 150).notNullable()
      table.string('marketplace_region', 32).notNullable().defaultTo('US')
      table.string('default_currency', 3).notNullable().defaultTo('USD')
      table
        .enu('status', Object.values(SellerAccountStatus), {
          useNative: true,
          enumName: 'seller_account_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(SellerAccountStatus.ACTIVE)
      table
        .enu('health_status', Object.values(HealthStatus), {
          useNative: true,
          enumName: 'health_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(HealthStatus.HEALTHY)
      table.text('encrypted_credentials').nullable()
      table.string('credential_vault_ref', 255).nullable()
      table.text('oauth_scopes').nullable()
      table.timestamp('token_expires_at', { useTz: true }).nullable()
      table.timestamp('last_credential_rotated_at', { useTz: true }).nullable()
      table.integer('rate_limit_rpm').notNullable().defaultTo(60)
      table.jsonb('retry_policy').notNullable().defaultTo('{"maxRetries":3,"backoffMs":1000}')
      table.jsonb('sync_checkpoint').notNullable().defaultTo('{}')
      table.jsonb('sync_config').notNullable().defaultTo('{}')
      table.timestamp('last_synced_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'sales_channel_id', 'external_seller_id', 'marketplace_region'], {
        indexName: 'uq_seller_accounts_identity',
      })
      table.index(['user_id'], 'idx_seller_accounts_user')
      table.index(['status'], 'idx_seller_accounts_status')
      table.check('rate_limit_rpm > 0', [], 'chk_seller_accounts_rpm_positive')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS seller_account_status;')
      await db.rawQuery('DROP TYPE IF EXISTS health_status;')
    })
  }
}
