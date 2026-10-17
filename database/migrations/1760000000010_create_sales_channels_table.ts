import { BaseSchema } from '@adonisjs/lucid/schema'
import { ChannelType } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'sales_channels'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE channel_type AS ENUM ('marketplace', 'webstore', 'shopping_feed', 'custom');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('code', 50).notNullable().unique()
      table.string('name', 150).notNullable()
      table
        .enu('channel_type', Object.values(ChannelType), {
          useNative: true,
          enumName: 'channel_type',
          existingType: true,
        })
        .notNullable()
        .defaultTo(ChannelType.MARKETPLACE)
      table.text('logo_url').nullable()
      table.boolean('supports_oauth').notNullable().defaultTo(true)
      table.jsonb('default_config').notNullable().defaultTo('{}')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS channel_type;')
    })
  }
}
