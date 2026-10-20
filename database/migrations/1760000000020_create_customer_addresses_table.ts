import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customer_addresses'

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
        .string('customer_id', 64)
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('CASCADE')
      table
        .enum('address_type', ['shipping', 'billing', 'both'], {
          enumName: 'address_type',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('both')
      table.string('label', 100).nullable()
      table.string('recipient_name', 255).notNullable()
      table.string('company_name', 200).nullable()
      table.string('phone', 50).nullable()
      table.string('line_1', 255).notNullable()
      table.string('line_2', 255).nullable()
      table.string('line_3', 255).nullable()
      table.string('city', 150).notNullable()
      table.string('state_province', 150).nullable()
      table.string('postal_code', 50).notNullable()
      table.string('country_code', 2).notNullable().defaultTo('US')
      table.string('address_fingerprint', 64).nullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.boolean('is_verified').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX idx_customer_addresses_customer ON customer_addresses (customer_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_customer_addresses_fingerprint ON customer_addresses (user_id, address_fingerprint)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
