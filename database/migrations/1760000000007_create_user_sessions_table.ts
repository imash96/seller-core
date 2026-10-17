import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('session_token_hash', 128).notNullable().unique()
      table.string('ip_address', 64).nullable()
      table.text('user_agent').nullable()
      table.boolean('is_revoked').notNullable().defaultTo(false)
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('last_active_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id'], 'idx_user_sessions_user')
      table.index(['user_id', 'is_revoked'], 'idx_user_sessions_active')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
