import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'saved_views'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('module_key', 100).notNullable()
      table.string('name', 150).notNullable()
      table.jsonb('filters').notNullable().defaultTo('{}')
      table.jsonb('sort_config').notNullable().defaultTo('{}')
      table.jsonb('columns_config').notNullable().defaultTo('[]')
      table.boolean('is_default').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX uq_saved_views_user_module_name ON saved_views (user_id, module_key, name)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
