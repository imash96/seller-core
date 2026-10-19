import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'brands'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('name', 150).notNullable()
      table.string('reg_no', 150).nullable()
      table.string('serial_no', 150).nullable()
      table.string('slug', 150).notNullable()
      table.text('logo_url').nullable()
      table.text('website_url').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw('CREATE UNIQUE INDEX uq_brands_user_slug ON brands (user_id, slug)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
