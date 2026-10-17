import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('parent_id')
        .nullable()
        .references('id')
        .inTable('product_categories')
        .onDelete('SET NULL')
      table.string('name', 150).notNullable()
      table.string('slug', 150).notNullable()
      table.text('taxonomy_path').nullable()
      table.jsonb('attributes_schema').notNullable().defaultTo('[]')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'slug'], { indexName: 'uq_product_categories_user_slug' })
      table.index(['parent_id'], 'idx_product_categories_parent')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
