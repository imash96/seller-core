import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — a raw import payload points at its order and nothing else.
 *
 * `order_import_payloads.seller_account_id` and `sync_job_id` were denormalised
 * copies of `orders.seller_account_id` / `orders.sync_job_id` and could disagree
 * with the parent row after a re-sync. Both are dropped; readers join `orders`.
 */
export default class extends BaseSchema {
  protected tableName = 'order_import_payloads'

  async up() {
    this.schema.raw('ALTER TABLE order_import_payloads DROP COLUMN IF EXISTS seller_account_id')
    this.schema.raw('ALTER TABLE order_import_payloads DROP COLUMN IF EXISTS sync_job_id')
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
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
    })
    this.schema.raw(
      `UPDATE order_import_payloads AS p
          SET sync_job_id = o.sync_job_id, seller_account_id = o.seller_account_id
         FROM orders AS o
        WHERE o.id = p.order_id`
    )
  }
}
