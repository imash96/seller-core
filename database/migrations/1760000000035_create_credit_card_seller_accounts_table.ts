import { BaseSchema } from '@adonisjs/lucid/schema'
import { CardChannelUsage } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'credit_card_seller_accounts'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE card_channel_usage AS ENUM ('ad_spend', 'subscription_fee', 'chargeback_backup', 'shipping_labels', 'primary_billing');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('credit_card_id')
        .notNullable()
        .references('id')
        .inTable('credit_cards')
        .onDelete('CASCADE')
      table
        .uuid('seller_account_id')
        .notNullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('CASCADE')
      table
        .enu('usage_purpose', Object.values(CardChannelUsage), {
          useNative: true,
          enumName: 'card_channel_usage',
          existingType: true,
        })
        .notNullable()
        .defaultTo(CardChannelUsage.PRIMARY_BILLING)
      table.boolean('is_primary').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['credit_card_id', 'seller_account_id', 'usage_purpose'], {
        indexName: 'uq_card_seller_accounts_purpose',
      })
      table.index(['seller_account_id'], 'idx_card_seller_accounts_seller')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS card_channel_usage;')
    })
  }
}
