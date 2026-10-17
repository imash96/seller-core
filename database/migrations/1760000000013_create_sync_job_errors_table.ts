import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sync_job_errors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('sync_job_id')
        .notNullable()
        .references('id')
        .inTable('sync_jobs')
        .onDelete('CASCADE')
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('record_index').notNullable().defaultTo(0)
      table.string('external_record_id', 150).nullable()
      table.string('error_code', 100).notNullable()
      table.text('error_message').notNullable()
      table.jsonb('field_errors').notNullable().defaultTo('{}')
      table.jsonb('raw_excerpt').nullable()
      table.boolean('is_resolved').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['sync_job_id'], 'idx_sync_job_errors_job')
      table.index(['user_id'], 'idx_sync_job_errors_user')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
