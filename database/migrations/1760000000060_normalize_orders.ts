import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — the order channel is derived, never stored twice.
 *
 * `orders.marketplace_code` duplicated
 * `seller_account_id → seller_accounts.sales_channel_id → sales_channels.code`
 * and went stale whenever a seller account was re-pointed at another channel.
 * Before dropping it, orders without a seller account keep their platform in
 * `channel_metadata.platform` (the only case the join cannot answer).
 *
 * `delivery_notification_sent_at` duplicated the delivery state that already
 * lives on `shipments.delivery_notification_sent` and the `notifications` /
 * `outbox_events` audit trail.
 */
export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.raw(
      `UPDATE orders AS o
          SET channel_metadata = COALESCE(o.channel_metadata, '{}'::jsonb) || jsonb_build_object('platform', o.marketplace_code)
        WHERE o.seller_account_id IS NULL
          AND o.marketplace_code IS NOT NULL
          AND o.marketplace_code <> 'direct'
          AND NOT jsonb_exists(COALESCE(o.channel_metadata, '{}'::jsonb), 'platform')`
    )

    this.schema.raw('ALTER TABLE orders DROP COLUMN IF EXISTS marketplace_code')
    this.schema.raw('ALTER TABLE orders DROP COLUMN IF EXISTS delivery_notification_sent_at')
    this.schema.raw('ALTER TABLE orders DROP COLUMN IF EXISTS currency_code')
    this.schema.raw('ALTER TABLE orders DROP COLUMN IF EXISTS reporting_currency_code')

    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_orders_seller_account ON orders (seller_account_id)'
    )
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('marketplace_code', 50).notNullable().defaultTo('direct')
      table.timestamp('delivery_notification_sent_at', { useTz: true }).nullable()
    })
    this.schema.raw(
      `UPDATE orders AS o
          SET marketplace_code = COALESCE(sc.code, 'direct')
         FROM seller_accounts AS sa
         JOIN sales_channels AS sc ON sc.id = sa.sales_channel_id
        WHERE sa.id = o.seller_account_id`
    )
    this.schema.raw('DROP INDEX IF EXISTS idx_orders_seller_account')
  }
}
