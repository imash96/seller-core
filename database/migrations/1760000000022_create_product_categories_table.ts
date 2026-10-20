import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_categories'

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
        .string('parent_category_id', 64)
        .nullable()
        .references('id')
        .inTable('product_categories')
        .onDelete('SET NULL')
      table.string('name', 150).notNullable()
      table.string('slug', 150).notNullable()
      table.string('taxonomy_path', 500).nullable()
      table.jsonb('attributes_schema').notNullable().defaultTo('[]')
      table.text('description').nullable()
      table.integer('sort_order').notNullable().defaultTo(0)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX uq_product_categories_user_slug ON product_categories (user_id, slug)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
