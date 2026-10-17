import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE')
      table
        .uuid('assigned_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'role_id'], { indexName: 'uq_user_roles_user_role' })
      table.index(['role_id'], 'idx_user_roles_role')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
