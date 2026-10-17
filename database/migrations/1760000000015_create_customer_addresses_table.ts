import { BaseSchema } from '@adonisjs/lucid/schema'
import { AddressType } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'customer_addresses'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE address_type AS ENUM ('shipping', 'billing', 'both');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('customer_id')
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('CASCADE')
      table
        .enu('address_type', Object.values(AddressType), {
          useNative: true,
          enumName: 'address_type',
          existingType: true,
        })
        .notNullable()
        .defaultTo(AddressType.BOTH)
      table.string('label', 100).nullable()
      table.string('recipient_name', 255).notNullable()
      table.string('company_name', 200).nullable()
      table.string('phone', 50).nullable()
      table.string('line_1', 255).notNullable()
      table.string('line_2', 255).nullable()
      table.string('city', 150).notNullable()
      table.string('state_province', 150).nullable()
      table.string('postal_code', 50).notNullable()
      table.string('country_code', 2).notNullable().defaultTo('US')
      table.string('address_fingerprint', 64).nullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.boolean('is_verified').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['customer_id'], 'idx_customer_addresses_customer')
      table.index(['user_id', 'address_fingerprint'], 'idx_customer_addresses_fingerprint')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS address_type;')
    })
  }
}
