import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales_channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table.string('code', 50).notNullable()
      table.string('name', 150).notNullable()
      table
        .enum('channel_type', ['marketplace', 'webstore', 'shopping_feed', 'custom'], {
          enumName: 'channel_type',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('marketplace')
      table.text('logo_url').nullable()
      table.boolean('supports_oauth').notNullable().defaultTo(true)
      table.jsonb('default_config').notNullable().defaultTo('{}')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
