import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'outbox_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table.string('user_id', 64).nullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('aggregate_type', 100).notNullable()
      table.string('aggregate_id', 64).notNullable()
      table.string('event_type', 150).notNullable()
      table.string('idempotency_key', 150).notNullable()
      table.string('correlation_id', 100).nullable()
      table.jsonb('payload').notNullable()
      table
        .enum('status', ['pending', 'processing', 'published', 'failed', 'dead_letter'], {
          enumName: 'outbox_event_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('pending')
      table.integer('retry_count').notNullable().defaultTo(0)
      table.integer('max_retries').notNullable().defaultTo(5)
      table.timestamp('next_retry_at', { useTz: true }).nullable()
      table.text('last_error').nullable()
      table.timestamp('processed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE outbox_events ADD CONSTRAINT chk_outbox_events_retries_nonneg CHECK (retry_count >= 0 AND max_retries >= 0)'
    )
    this.schema.raw(
      'CREATE INDEX idx_outbox_events_status_retry ON outbox_events (status, next_retry_at)'
    )
    this.schema.raw(
      'CREATE INDEX idx_outbox_events_aggregate ON outbox_events (aggregate_type, aggregate_id)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
