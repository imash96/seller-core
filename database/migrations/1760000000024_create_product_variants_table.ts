import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variants'

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
        .string('product_id', 64)
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table.string('sku', 120).notNullable()
      table.string('title', 255).notNullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.string('barcode_upc_ean', 64).nullable()
      table.string('mpn', 100).nullable()
      table.string('asin', 20).nullable()
      table.jsonb('attributes').notNullable().defaultTo('{}')
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('retail_price', 14, 2).notNullable().defaultTo(0)
      table.decimal('compare_at_price', 14, 2).nullable()
      table.decimal('cost_price', 14, 2).notNullable().defaultTo(0)
      table.decimal('manufacturing_cost', 14, 2).notNullable().defaultTo(0)
      table.decimal('packaging_cost', 14, 2).notNullable().defaultTo(0)
      table.integer('stock_on_hand').notNullable().defaultTo(0)
      table.integer('stock_reserved').notNullable().defaultTo(0)
      table.integer('reorder_point').notNullable().defaultTo(5)
      table.decimal('weight_grams', 14, 2).nullable()
      table.jsonb('dimensions_cm').notNullable().defaultTo('{}')
      table.jsonb('images').notNullable().defaultTo('[]')
      table
        .enum('status', ['active', 'inactive', 'out_of_stock', 'discontinued'], {
          enumName: 'variant_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('active')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      `ALTER TABLE product_variants ADD COLUMN stock_available integer GENERATED ALWAYS AS (stock_on_hand - stock_reserved) STORED`
    )

    this.schema.raw(
      'ALTER TABLE product_variants ADD CONSTRAINT chk_product_variants_qty_nonneg CHECK (stock_on_hand >= 0 AND stock_reserved >= 0 AND reorder_point >= 0)'
    )
    this.schema.raw(
      'ALTER TABLE product_variants ADD CONSTRAINT chk_product_variants_prices_nonneg CHECK (retail_price >= 0 AND cost_price >= 0 AND manufacturing_cost >= 0 AND packaging_cost >= 0 AND (compare_at_price IS NULL OR compare_at_price >= 0))'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_product_variants_user_sku ON product_variants (user_id, sku)'
    )
    this.schema.raw('CREATE INDEX idx_product_variants_product ON product_variants (product_id)')
    this.schema.raw(
      'CREATE INDEX idx_product_variants_user_asin ON product_variants (user_id, asin)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
