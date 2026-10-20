import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sync_job_errors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('sync_job_id', 64)
        .notNullable()
        .references('id')
        .inTable('sync_jobs')
        .onDelete('CASCADE')
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.integer('record_index').notNullable().defaultTo(0)
      table.string('external_record_id', 150).nullable()
      table.string('error_code', 100).notNullable()
      table.text('error_message').notNullable()
      table.jsonb('field_errors').notNullable().defaultTo('{}')
      table.jsonb('raw_excerpt').nullable()
      table.boolean('is_resolved').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw('CREATE INDEX idx_sync_job_errors_job ON sync_job_errors (sync_job_id)')
    this.schema.raw('CREATE INDEX idx_sync_job_errors_user ON sync_job_errors (user_id)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
