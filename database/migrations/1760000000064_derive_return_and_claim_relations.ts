import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — returns and claims reach the customer (and the marketplace) strictly
 * through their order.
 *
 * `return_requests.customer_id`, `marketplace_claims.customer_id` and
 * `marketplace_claims.seller_account_id` duplicated
 * `orders.customer_id` / `orders.seller_account_id`. They could drift — a merged
 * customer kept the stale id — so they are dropped and every reader joins the
 * order instead.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.raw('ALTER TABLE return_requests DROP COLUMN IF EXISTS customer_id')
    this.schema.raw('ALTER TABLE marketplace_claims DROP COLUMN IF EXISTS customer_id')
    this.schema.raw('ALTER TABLE marketplace_claims DROP COLUMN IF EXISTS seller_account_id')
    this.schema.raw('ALTER TABLE marketplace_claims DROP COLUMN IF EXISTS currency_code')
  }

  async down() {
    this.schema.alterTable('return_requests', (table) => {
      table
        .string('customer_id', 64)
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('RESTRICT')
    })
    this.schema.alterTable('marketplace_claims', (table) => {
      table
        .string('seller_account_id', 64)
        .nullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('SET NULL')
      table
        .string('customer_id', 64)
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
    })
    this.schema.raw(
      `UPDATE return_requests AS r
          SET customer_id = o.customer_id
         FROM orders AS o
        WHERE o.id = r.order_id AND r.customer_id IS NULL`
    )
    this.schema.raw(
      `UPDATE marketplace_claims AS c
          SET customer_id = o.customer_id, seller_account_id = o.seller_account_id
         FROM orders AS o
        WHERE o.id = c.order_id`
    )
  }
}
