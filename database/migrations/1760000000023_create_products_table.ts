import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

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
        .string('brand_id', 64)
        .nullable()
        .references('id')
        .inTable('brands')
        .onDelete('SET NULL')
      table
        .string('category_id', 64)
        .nullable()
        .references('id')
        .inTable('product_categories')
        .onDelete('SET NULL')
      table.string('title', 255).notNullable()
      table.string('title_75', 255).nullable()
      table.string('title_80', 255).nullable()
      table.string('sub_title', 255).nullable()
      table.string('sub_title_125', 255).nullable()
      table.string('slug', 255).notNullable()
      table.string('sku_prefix', 100).nullable()
      table.jsonb('list_price').notNullable().defaultTo('[]')
      table.jsonb('sale_price').notNullable().defaultTo('[]')
      table.string('collection_name', 100).nullable()
      table.text('description').nullable()
      table.text('extended_description').nullable()
      table.text('short_description').nullable()
      table
        .enum('status', ['draft', 'active', 'archived', 'discontinued'], {
          enumName: 'product_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('draft')
      table.boolean('has_variants').notNullable().defaultTo(false)
      table.jsonb('variation_dimensions').notNullable().defaultTo('[]')
      table.decimal('weight_grams', 14, 2).nullable()
      table.jsonb('dimensions_cm').notNullable().defaultTo('{}')
      table.jsonb('images').notNullable().defaultTo('[]')
      table.string('type', 100).nullable()
      table.jsonb('tags').notNullable().defaultTo('[]')
      table.jsonb('metadata').notNullable().defaultTo('{}')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw('CREATE UNIQUE INDEX uq_products_user_slug ON products (user_id, slug)')
    this.schema.raw('CREATE INDEX idx_products_user_status ON products (user_id, status)')
    this.schema.raw('CREATE INDEX idx_products_brand ON products (brand_id)')
    this.schema.raw('CREATE INDEX idx_products_category ON products (category_id)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
