import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table.string('email', 255).notNullable()
      table.string('full_name', 255).notNullable()
      table.string('company_name', 255).nullable()
      table.string('phone', 50).nullable()
      table.string('password', 255).notNullable()
      table
        .enum('status', ['pending_activation', 'active', 'suspended', 'locked', 'deactivated'], {
          enumName: 'user_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('pending_activation')
      table.boolean('is_super_admin').notNullable().defaultTo(false)
      table.integer('failed_login_attempts').notNullable().defaultTo(0)
      table.timestamp('locked_until', { useTz: true }).nullable()
      table.timestamp('password_changed_at', { useTz: true }).nullable()
      table.timestamp('last_login_at', { useTz: true }).nullable()
      table.string('last_login_ip', 64).nullable()
      table.string('default_currency', 3).notNullable().defaultTo('USD')
      table.string('timezone', 64).notNullable().defaultTo('UTC')
      table.jsonb('preferences').notNullable().defaultTo('{}')
      table
        .string('created_by_user_id', 64)
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE users ADD CONSTRAINT chk_users_email_lower CHECK (email = lower(email))'
    )
    this.schema.raw(
      'ALTER TABLE users ADD CONSTRAINT chk_users_failed_login_nonneg CHECK (failed_login_attempts >= 0)'
    )
    this.schema.raw(
      "ALTER TABLE users ADD CONSTRAINT chk_users_currency_code CHECK (default_currency ~ '^[A-Z]{3}$')"
    )
    this.schema.raw('CREATE INDEX idx_users_status ON users (status)')
    this.schema.raw('CREATE INDEX idx_users_created_by ON users (created_by_user_id)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
