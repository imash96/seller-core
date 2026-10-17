import { BaseSchema } from '@adonisjs/lucid/schema'
import { ProductStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived', 'discontinued');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('brand_id').nullable().references('id').inTable('brands').onDelete('SET NULL')
      table
        .uuid('category_id')
        .nullable()
        .references('id')
        .inTable('product_categories')
        .onDelete('SET NULL')
      table.string('title', 255).notNullable()
      table.string('slug', 255).notNullable()
      table.string('sku_prefix', 100).nullable()
      table.text('description').nullable()
      table.text('short_description').nullable()
      table
        .enu('status', Object.values(ProductStatus), {
          useNative: true,
          enumName: 'product_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(ProductStatus.DRAFT)
      table.boolean('has_variants').notNullable().defaultTo(false)
      table.jsonb('variation_dimensions').notNullable().defaultTo('[]')
      table.decimal('weight_grams', 10, 2).nullable()
      table.jsonb('dimensions_cm').notNullable().defaultTo('{}')
      table.jsonb('images').notNullable().defaultTo('[]')
      table.jsonb('tags').notNullable().defaultTo('[]')
      table.jsonb('metadata').notNullable().defaultTo('{}')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'slug'], { indexName: 'uq_products_user_slug' })
      table.index(['user_id', 'status'], 'idx_products_user_status')
      table.index(['brand_id'], 'idx_products_brand')
      table.index(['category_id'], 'idx_products_category')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS product_status;')
    })
  }
}
