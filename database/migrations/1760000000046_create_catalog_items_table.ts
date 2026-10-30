import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'catalog_items'

  async up() {
    const hasTable = await this.schema.hasTable(this.tableName)
    if (hasTable) return

    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('catalog_key', 100).notNullable()
      table.string('structured_code', 100).nullable()
      table.string('file_name', 255).nullable()
      table.string('title', 255).notNullable()
      table.string('title_75', 255).nullable()
      table.string('title_80', 255).nullable()
      table.string('sub_title', 255).nullable()
      table.string('sub_title_125', 255).nullable()
      table.string('type', 100).nullable()
      table.string('gender', 50).notNullable().defaultTo('Men')
      table.string('category_code', 20).notNullable().defaultTo('CT')
      table.string('category_name', 100).notNullable().defaultTo('Coat')
      table.string('product_code', 20).notNullable().defaultTo('DC')
      table.string('category_handle', 500).nullable()
      table
        .string('resolved_category_id', 64)
        .nullable()
        .references('id')
        .inTable('product_categories')
        .onDelete('SET NULL')
      table.text('description').nullable()
      table.text('short_description').nullable()
      table.text('extended_description').nullable()
      table.string('pattern', 100).nullable().defaultTo('Solid')
      table.string('material_code', 20).notNullable().defaultTo('NP')
      table.string('fit_code', 20).notNullable().defaultTo('RG')
      table.string('price_tier', 10).notNullable().defaultTo('01')
      table.jsonb('attributes').notNullable().defaultTo('{}')
      table.jsonb('images').notNullable().defaultTo('[]')
      table.jsonb('tags').notNullable().defaultTo('[]')
      table.jsonb('variants_spec').notNullable().defaultTo('{}')
      table.string('status', 50).notNullable().defaultTo('draft')
      table
        .string('converted_product_id', 64)
        .nullable()
        .references('id')
        .inTable('products')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_items_user_key ON catalog_items (user_id, catalog_key)'
    )
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_catalog_items_user_filters ON catalog_items (user_id, gender, category_name, type, status)'
    )
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
