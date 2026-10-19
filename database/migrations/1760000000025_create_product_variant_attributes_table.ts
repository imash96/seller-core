import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variant_attributes'

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
        .string('product_variant_id', 64)
        .notNullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('CASCADE')
      table.string('attribute_name', 100).notNullable()
      table.string('attribute_value', 255).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX uq_variant_attributes_variant_name ON product_variant_attributes (product_variant_id, attribute_name)'
    )
    this.schema.raw(
      'CREATE INDEX idx_variant_attributes_lookup ON product_variant_attributes (user_id, attribute_name, attribute_value)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
