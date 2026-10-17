import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_import_payloads'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table
        .uuid('sync_job_id')
        .nullable()
        .references('id')
        .inTable('sync_jobs')
        .onDelete('SET NULL')
      table
        .uuid('seller_account_id')
        .nullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('SET NULL')
      table.string('payload_hash', 64).notNullable()
      table.integer('payload_size_bytes').notNullable()
      table.jsonb('raw_payload').notNullable()
      table.jsonb('redacted_fields').notNullable().defaultTo('[]')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['order_id'], 'idx_order_import_payloads_order')
      table.index(['user_id', 'payload_hash'], 'idx_order_import_payloads_hash')
      table.check(
        'payload_size_bytes > 0 AND payload_size_bytes <= 262144',
        [],
        'chk_order_import_payloads_size_limit'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
