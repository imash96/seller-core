import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sync_jobs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .string('seller_account_id', 64)
        .nullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('SET NULL')
      table
        .enum(
          'job_type',
          [
            'order_import',
            'catalog_sync',
            'inventory_sync',
            'tracking_push',
            'settlement_import',
            'manual_bulk_import',
            'export',
          ],
          { enumName: 'sync_job_type', useNative: true, existingType: true }
        )
        .notNullable()
      table
        .enum(
          'status',
          ['queued', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled'],
          { enumName: 'sync_job_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('queued')
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
    })

    this.schema.raw(
      'ALTER TABLE sync_jobs ADD CONSTRAINT chk_sync_jobs_counters_nonneg CHECK (total_records >= 0 AND processed_records >= 0 AND succeeded_records >= 0 AND failed_records >= 0 AND skipped_duplicates >= 0)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_sync_jobs_user_idempotency ON sync_jobs (user_id, idempotency_key)'
    )
    this.schema.raw('CREATE INDEX idx_sync_jobs_user_status ON sync_jobs (user_id, status)')
    this.schema.raw('CREATE INDEX idx_sync_jobs_seller_account ON sync_jobs (seller_account_id)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
