import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seller_accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .string('sales_channel_id', 64)
        .notNullable()
        .references('id')
        .inTable('sales_channels')
        .onDelete('RESTRICT')
      table.string('account_name', 150).notNullable()
      table.string('account_email', 150).nullable()
      table.string('account_phone', 150).nullable()
      table.string('account_code', 4).nullable()
      table.string('external_seller_id', 150).notNullable()
      table.string('marketplace_region', 32).notNullable().defaultTo('US')
      table.string('default_currency', 3).notNullable().defaultTo('USD')
      table
        .enum(
          'status',
          ['pending_setup', 'active', 'auth_expired', 'rate_limited', 'suspended', 'disconnected'],
          { enumName: 'seller_account_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('active')
      table
        .enum('health_status', ['healthy', 'warning', 'critical', 'unknown'], {
          enumName: 'health_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('healthy')
      table.text('encrypted_credentials').nullable()
      table.string('credential_vault_ref', 255).nullable()
      table.text('oauth_scopes').nullable()
      table.timestamp('token_expires_at', { useTz: true }).nullable()
      table.timestamp('last_credential_rotated_at', { useTz: true }).nullable()
      table.integer('rate_limit_rpm').notNullable().defaultTo(60)
      table.jsonb('retry_policy').notNullable().defaultTo('{}')
      table.jsonb('sync_checkpoint').notNullable().defaultTo('{}')
      table.jsonb('sync_config').notNullable().defaultTo('{}')
      table.timestamp('last_synced_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE seller_accounts ADD CONSTRAINT chk_seller_accounts_rate_limit CHECK (rate_limit_rpm > 0)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_seller_accounts_identity ON seller_accounts (user_id, sales_channel_id, external_seller_id, marketplace_region)'
    )
    this.schema.raw('CREATE INDEX idx_seller_accounts_user ON seller_accounts (user_id)')
    this.schema.raw('CREATE INDEX idx_seller_accounts_status ON seller_accounts (status)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
