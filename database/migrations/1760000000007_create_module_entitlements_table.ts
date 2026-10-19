import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'module_entitlements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('module_key', 100).notNullable()
      table.boolean('is_enabled').notNullable().defaultTo(true)
      table.string('plan_tier', 64).notNullable().defaultTo('enterprise')
      table.jsonb('limits').notNullable().defaultTo('{}')
      table.timestamp('expires_at', { useTz: true }).nullable()
      table
        .string('updated_by_user_id', 64)
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX uq_module_entitlements_user_module ON module_entitlements (user_id, module_key)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
