import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_listings'

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
        .string('seller_account_id', 64)
        .notNullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('CASCADE')
      table
        .string('product_id', 64)
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table
        .string('product_variant_id', 64)
        .notNullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('CASCADE')
      table.string('external_listing_id', 150).notNullable()
      table.string('external_variant_id', 150).nullable()
      table.string('external_sku', 150).nullable()
      table.string('asin', 20).nullable()
      table.string('channel_title', 500).nullable()
      table.text('channel_description').nullable()
      table.string('channel_category_id', 150).nullable()
      // Multi-currency listing prices plus the primary listed amount as a
      // self-contained PriceMoney object.
      table.jsonb('prices').notNullable().defaultTo('[]')
      table.jsonb('listed_price').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.integer('allocated_quantity').notNullable().defaultTo(0)
      table
        .enum('listing_status', ['draft', 'active', 'paused', 'suppressed', 'ended', 'error'], {
          enumName: 'listing_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('active')
      table
        .enum('publication_status', ['unpublished', 'queued', 'published', 'failed'], {
          enumName: 'publication_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('published')
      table
        .enum('sync_status', ['not_applicable', 'synced', 'pending', 'error', 'stale'], {
          enumName: 'entity_sync_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('synced')
      table.text('last_sync_error').nullable()
      table.jsonb('channel_attributes').notNullable().defaultTo('{}')
      table.timestamp('last_synced_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE channel_listings ADD CONSTRAINT chk_channel_listings_prices_medusa CHECK (is_valid_medusa_prices_array(prices))'
    )
    this.schema.raw(
      'ALTER TABLE channel_listings ADD CONSTRAINT chk_channel_listings_listed_price_money CHECK (is_valid_price_money(listed_price, false))'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_channel_listings_account_ext_variant ON channel_listings (seller_account_id, external_listing_id, product_variant_id)'
    )
    this.schema.raw('CREATE INDEX idx_channel_listings_user ON channel_listings (user_id)')
    this.schema.raw(
      'CREATE INDEX idx_channel_listings_variant ON channel_listings (product_variant_id)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
