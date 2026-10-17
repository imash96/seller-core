import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'module_entitlements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('module_key', 100).notNullable()
      table.boolean('is_enabled').notNullable().defaultTo(true)
      table.string('plan_tier', 64).notNullable().defaultTo('enterprise')
      table.jsonb('limits').notNullable().defaultTo('{}')
      table.timestamp('expires_at', { useTz: true }).nullable()
      table
        .uuid('updated_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'module_key'], { indexName: 'uq_module_entitlements_user_module' })
      table.index(['user_id'], 'idx_module_entitlements_user')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
