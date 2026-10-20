import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('session_token_hash', 128).notNullable()
      table.string('ip_address', 64).nullable()
      table.text('user_agent').nullable()
      table.boolean('is_revoked').notNullable().defaultTo(false)
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('last_active_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw('CREATE INDEX idx_user_sessions_user ON user_sessions (user_id)')
    this.schema.raw('CREATE INDEX idx_user_sessions_active ON user_sessions (user_id, is_revoked)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
