import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('actor_user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('action', 150).notNullable()
      table.string('entity_type', 100).notNullable()
      table.uuid('entity_id').nullable()
      table.string('request_id', 100).nullable()
      table.string('correlation_id', 100).nullable()
      table.string('ip_address', 64).nullable()
      table.text('user_agent').nullable()
      table.jsonb('before_state').nullable()
      table.jsonb('after_state').nullable()
      table.jsonb('metadata').notNullable().defaultTo('{}')
      table.string('checksum', 64).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id'], 'idx_audit_logs_user')
      table.index(['actor_user_id'], 'idx_audit_logs_actor')
      table.index(['entity_type', 'entity_id'], 'idx_audit_logs_entity')
      table.index(['correlation_id'], 'idx_audit_logs_correlation')
      table.index(['created_at'], 'idx_audit_logs_created_at')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
