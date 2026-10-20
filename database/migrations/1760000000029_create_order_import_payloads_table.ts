import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_import_payloads'

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
        .string('order_id', 64)
        .notNullable()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
      table
        .string('sync_job_id', 64)
        .nullable()
        .references('id')
        .inTable('sync_jobs')
        .onDelete('SET NULL')
      table
        .string('seller_account_id', 64)
        .nullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('SET NULL')
      table.string('payload_hash', 64).notNullable()
      table.integer('payload_size_bytes').notNullable()
      table.jsonb('raw_payload').notNullable()
      table.jsonb('redacted_fields').notNullable().defaultTo('[]')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE order_import_payloads ADD CONSTRAINT chk_order_import_payloads_size CHECK (payload_size_bytes >= 0 AND payload_size_bytes <= 262144)'
    )
    this.schema.raw(
      'CREATE INDEX idx_order_import_payloads_order ON order_import_payloads (order_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_order_import_payloads_hash ON order_import_payloads (user_id, payload_hash)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
