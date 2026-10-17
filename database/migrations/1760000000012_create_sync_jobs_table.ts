import { BaseSchema } from '@adonisjs/lucid/schema'
import { SyncJobType, SyncJobStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'sync_jobs'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE sync_job_type AS ENUM ('order_import', 'catalog_sync', 'inventory_sync', 'tracking_push', 'settlement_import', 'manual_bulk_import', 'export');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE sync_job_status AS ENUM ('queued', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('seller_account_id')
        .nullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('SET NULL')
      table
        .enu('job_type', Object.values(SyncJobType), {
          useNative: true,
          enumName: 'sync_job_type',
          existingType: true,
        })
        .notNullable()
      table
        .enu('status', Object.values(SyncJobStatus), {
          useNative: true,
          enumName: 'sync_job_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(SyncJobStatus.QUEUED)
      table.string('idempotency_key', 150).notNullable()
      table.string('correlation_id', 100).nullable()
      table.integer('total_records').notNullable().defaultTo(0)
      table.integer('processed_records').notNullable().defaultTo(0)
      table.integer('succeeded_records').notNullable().defaultTo(0)
      table.integer('failed_records').notNullable().defaultTo(0)
      table.integer('skipped_duplicates').notNullable().defaultTo(0)
      table.string('checkpoint_cursor', 255).nullable()
      table.jsonb('error_summary').notNullable().defaultTo('{}')
      table.timestamp('started_at', { useTz: true }).nullable()
      table.timestamp('completed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'idempotency_key'], { indexName: 'uq_sync_jobs_user_idempotency' })
      table.index(['user_id', 'status'], 'idx_sync_jobs_user_status')
      table.index(['seller_account_id'], 'idx_sync_jobs_seller_account')
      table.check(
        'total_records >= 0 AND processed_records >= 0 AND succeeded_records >= 0 AND failed_records >= 0 AND skipped_duplicates >= 0',
        [],
        'chk_sync_jobs_counters_non_neg'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS sync_job_type;')
      await db.rawQuery('DROP TYPE IF EXISTS sync_job_status;')
    })
  }
}
