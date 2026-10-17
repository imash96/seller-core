import { BaseSchema } from '@adonisjs/lucid/schema'
import { VariantStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'product_variants'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE variant_status AS ENUM ('active', 'inactive', 'out_of_stock', 'discontinued');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('product_id')
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
      table.decimal('weight_grams', 10, 2).nullable()
      table.jsonb('dimensions_cm').notNullable().defaultTo('{}')
      table.jsonb('images').notNullable().defaultTo('[]')
      table
        .enu('status', Object.values(VariantStatus), {
          useNative: true,
          enumName: 'variant_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(VariantStatus.ACTIVE)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'sku'], { indexName: 'uq_product_variants_user_sku' })
      table.index(['product_id'], 'idx_product_variants_product')
      table.index(['user_id', 'asin'], 'idx_product_variants_user_asin')
      table.check(
        'stock_on_hand >= 0 AND stock_reserved >= 0 AND retail_price >= 0 AND cost_price >= 0 AND manufacturing_cost >= 0 AND packaging_cost >= 0',
        [],
        'chk_product_variants_non_neg_inventory_and_prices'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS variant_status;')
    })
  }
}
