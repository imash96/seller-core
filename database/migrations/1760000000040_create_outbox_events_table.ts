import { BaseSchema } from '@adonisjs/lucid/schema'
import { OutboxEventStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'outbox_events'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE outbox_event_status AS ENUM ('pending', 'processing', 'published', 'failed', 'dead_letter');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('aggregate_type', 100).notNullable()
      table.uuid('aggregate_id').notNullable()
      table.string('event_type', 150).notNullable()
      table.string('idempotency_key', 150).notNullable().unique()
      table.string('correlation_id', 100).nullable()
      table.jsonb('payload').notNullable()
      table
        .enu('status', Object.values(OutboxEventStatus), {
          useNative: true,
          enumName: 'outbox_event_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(OutboxEventStatus.PENDING)
      table.integer('retry_count').notNullable().defaultTo(0)
      table.integer('max_retries').notNullable().defaultTo(5)
      table.timestamp('next_retry_at', { useTz: true }).nullable()
      table.text('last_error').nullable()
      table.timestamp('processed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['status', 'next_retry_at'], 'idx_outbox_events_status_retry')
      table.index(['aggregate_type', 'aggregate_id'], 'idx_outbox_events_aggregate')
      table.check('retry_count >= 0 AND max_retries >= 0', [], 'chk_outbox_events_retries_non_neg')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS outbox_event_status;')
    })
  }
}
