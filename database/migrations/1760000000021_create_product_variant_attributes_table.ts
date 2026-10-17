import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variant_attributes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('product_variant_id')
        .notNullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('CASCADE')
      table.string('attribute_name', 100).notNullable()
      table.string('attribute_value', 255).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['product_variant_id', 'attribute_name'], {
        indexName: 'uq_variant_attributes_variant_name',
      })
      table.index(['user_id', 'attribute_name', 'attribute_value'], 'idx_variant_attributes_lookup')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
