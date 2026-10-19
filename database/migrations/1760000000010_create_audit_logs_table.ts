import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('actor_user_id', 64)
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.string('user_id', 64).nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('action', 150).notNullable()
      table.string('entity_type', 100).notNullable()
      table.string('entity_id', 64).nullable()
      table.string('request_id', 100).nullable()
      table.string('correlation_id', 100).nullable()
      table.string('ip_address', 64).nullable()
      table.text('user_agent').nullable()
      table.jsonb('before_state').nullable()
      table.jsonb('after_state').nullable()
      table.jsonb('metadata').notNullable().defaultTo('{}')
      table.string('checksum', 64).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw('CREATE INDEX idx_audit_logs_user ON audit_logs (user_id)')
    this.schema.raw('CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_user_id)')
    this.schema.raw('CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id)')
    this.schema.raw('CREATE INDEX idx_audit_logs_correlation ON audit_logs (correlation_id)')
    this.schema.raw('CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
