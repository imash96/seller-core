import { BaseSchema } from '@adonisjs/lucid/schema'
import { ListingStatus, PublicationStatus, EntitySyncStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'channel_listings'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE listing_status AS ENUM ('draft', 'active', 'paused', 'suppressed', 'ended', 'error');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE publication_status AS ENUM ('unpublished', 'queued', 'published', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE entity_sync_status AS ENUM ('not_applicable', 'synced', 'pending', 'error', 'stale');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('seller_account_id')
        .notNullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('CASCADE')
      table
        .uuid('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table
        .uuid('product_variant_id')
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
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('listed_price', 14, 2).notNullable().defaultTo(0)
      table.integer('allocated_quantity').notNullable().defaultTo(0)
      table
        .enu('listing_status', Object.values(ListingStatus), {
          useNative: true,
          enumName: 'listing_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(ListingStatus.ACTIVE)
      table
        .enu('publication_status', Object.values(PublicationStatus), {
          useNative: true,
          enumName: 'publication_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(PublicationStatus.PUBLISHED)
      table
        .enu('sync_status', Object.values(EntitySyncStatus), {
          useNative: true,
          enumName: 'entity_sync_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(EntitySyncStatus.SYNCED)
      table.text('last_sync_error').nullable()
      table.jsonb('channel_attributes').notNullable().defaultTo('{}')
      table.timestamp('last_synced_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['seller_account_id', 'external_listing_id', 'product_variant_id'], {
        indexName: 'uq_channel_listings_account_ext_variant',
      })
      table.index(['user_id'], 'idx_channel_listings_user')
      table.index(['product_variant_id'], 'idx_channel_listings_variant')
      table.check(
        'listed_price >= 0 AND allocated_quantity >= 0',
        [],
        'chk_channel_listings_non_neg'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS listing_status;')
      await db.rawQuery('DROP TYPE IF EXISTS publication_status;')
      await db.rawQuery('DROP TYPE IF EXISTS entity_sync_status;')
    })
  }
}
