import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'saved_views'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('module_key', 100).notNullable()
      table.string('name', 150).notNullable()
      table.jsonb('filters').notNullable().defaultTo('{}')
      table.jsonb('sort_config').notNullable().defaultTo('{}')
      table.jsonb('columns_config').notNullable().defaultTo('[]')
      table.boolean('is_default').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'module_key', 'name'], {
        indexName: 'uq_saved_views_user_module_name',
      })
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
