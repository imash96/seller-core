import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Order header — omnichannel by design.
 *
 * Every monetary column is a self-contained PriceMoney JSONB object
 * `{ "currency_code": "USD", "amount": 123.45 }` validated by
 * `is_valid_price_money()`. There is deliberately no standalone `currency_code`
 * column: a single cross-border order can carry USD revenue, INR carrier cost
 * and INR COGS at the same time.
 *
 * Compatible with Amazon SP-API, eBay Fulfillment API, Etsy Open API v3 and
 * MedusaJS v2 order payloads:
 *  - `external_order_id` holds AmazonOrderId / eBay orderId / Etsy receipt_id /
 *    Medusa order.id; `external_display_id` holds the human-facing number
 *    (Medusa display_id, eBay legacyOrderId, Etsy formatted receipt number).
 *  - `fulfillment_channel` distinguishes MFN / AFN / FBA / FBM / 3PL / direct.
 *  - `tax_collection_model` records whether the marketplace is the deemed
 *    seller for sales tax (marketplace facilitator), the seller collects it, or
 *    no tax applies.
 *  - `earliest_ship_at` / `latest_ship_at` / `earliest_delivery_at` /
 *    `latest_delivery_at` carry the promised windows used to measure Late
 *    Shipment Rate (LSR) and on-time delivery.
 */
export default class extends BaseSchema {
  protected tableName = 'orders'

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
        .string('customer_id', 64)
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('RESTRICT')
      table
        .string('shipping_address_id', 64)
        .nullable()
        .references('id')
        .inTable('customer_addresses')
        .onDelete('SET NULL')
      table
        .string('billing_address_id', 64)
        .nullable()
        .references('id')
        .inTable('customer_addresses')
        .onDelete('SET NULL')
      table
        .string('sync_job_id', 64)
        .nullable()
        .references('id')
        .inTable('sync_jobs')
        .onDelete('SET NULL')
      table.string('order_number', 100).notNullable()
      // Marketplace identity: machine id + human-facing display id.
      table.string('external_order_id', 150).nullable()
      table.string('external_display_id', 150).nullable()
      table
        .enum(
          'source_type',
          ['manual', 'marketplace_import', 'api_bulk', 'webstore', 'replacement'],
          { enumName: 'order_source_type', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('manual')
      table.string('marketplace_code', 50).notNullable().defaultTo('direct')
      table
        .enum(
          'status',
          [
            'draft',
            'pending',
            'confirmed',
            'processing',
            'partially_fulfilled',
            'fulfilled',
            'delivered',
            'cancelled',
            'on_hold',
          ],
          { enumName: 'order_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('pending')
      table
        .enum(
          'payment_status',
          [
            'unpaid',
            'authorized',
            'paid',
            'partially_refunded',
            'refunded',
            'chargeback',
            'voided',
          ],
          { enumName: 'order_payment_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('unpaid')
      table
        .enum(
          'fulfillment_status',
          ['unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled', 'returned'],
          { enumName: 'fulfillment_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('unfulfilled')
      table
        .enum('sync_status', ['not_applicable', 'synced', 'pending', 'error', 'stale'], {
          enumName: 'entity_sync_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('not_applicable')
      // Which party fulfils the order: merchant (MFN), Amazon (AFN/FBA),
      // merchant fulfilled by Amazon (FBM), a 3PL provider or a direct sale.
      table.string('fulfillment_channel', 32).notNullable().defaultTo('MFN')
      // Marketplace site / region that the order belongs to:
      // Amazon MarketplaceId (ATVPDKIKX0DER, A21TJRUUN4KGV), eBay marketplace
      // id (EBAY_US, EBAY_CA), Etsy shop_id, Medusa region_id / sales_channel_id.
      table.string('marketplace_site_id', 64).nullable()
      // 'marketplace_facilitator' | 'seller' | 'none'
      table.string('tax_collection_model', 32).notNullable().defaultTo('seller')
      // Platform-specific flags (isPrime, isBusinessOrder, etsyIsGift, giftMessage,
      // medusaRegionId, medusaCartId, paymentMethodSummary, ...).
      table.jsonb('channel_metadata').notNullable().defaultTo('{}')
      // Promised ship-by and delivery windows (Amazon EarliestShipDate /
      // LatestShipDate / LatestDeliveryDate, eBay estimated delivery, Etsy
      // estimated_ship_on, Medusa fulfillment deadlines).
      table.timestamp('earliest_ship_at', { useTz: true }).nullable()
      table.timestamp('latest_ship_at', { useTz: true }).nullable()
      table.timestamp('earliest_delivery_at', { useTz: true }).nullable()
      table.timestamp('latest_delivery_at', { useTz: true }).nullable()
      table.decimal('exchange_rate', 18, 8).notNullable().defaultTo(1)

      // Self-contained monetary columns (PriceMoney JSONB).
      table.jsonb('subtotal').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('discount_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('promotion_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('shipping_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table
        .jsonb('shipping_discount_total')
        .notNullable()
        .defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('tax_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table
        .jsonb('shipping_tax_total')
        .notNullable()
        .defaultTo('{"currency_code":"USD","amount":0}')
      table
        .jsonb('marketplace_withheld_tax_total')
        .notNullable()
        .defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('grand_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table
        .jsonb('marketplace_fees_total')
        .notNullable()
        .defaultTo('{"currency_code":"USD","amount":0}')
      table
        .jsonb('payment_processing_fees_total')
        .notNullable()
        .defaultTo('{"currency_code":"USD","amount":0}')
      table
        .jsonb('shipping_cost_total')
        .notNullable()
        .defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('cogs_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('refunded_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('net_proceeds').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('gross_profit').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('net_profit').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('reporting_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')

      table.jsonb('shipping_address_snapshot').nullable()
      table.text('buyer_notes').nullable()
      table.text('internal_notes').nullable()
      table.timestamp('ordered_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('confirmed_at', { useTz: true }).nullable()
      table.timestamp('shipped_at', { useTz: true }).nullable()
      table.timestamp('delivered_at', { useTz: true }).nullable()
      table.timestamp('cancelled_at', { useTz: true }).nullable()
      table.timestamp('delivery_notification_sent_at', { useTz: true }).nullable()
      table.timestamp('source_created_at', { useTz: true }).nullable()
      table.timestamp('source_updated_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    const moneyColumns: Array<[string, boolean]> = [
      ['subtotal', false],
      ['discount_total', false],
      ['promotion_total', false],
      ['shipping_total', false],
      ['shipping_discount_total', false],
      ['tax_total', false],
      ['shipping_tax_total', false],
      ['marketplace_withheld_tax_total', false],
      ['grand_total', false],
      ['marketplace_fees_total', false],
      ['payment_processing_fees_total', false],
      ['shipping_cost_total', false],
      ['cogs_total', false],
      ['refunded_total', false],
      ['net_proceeds', true],
      ['gross_profit', true],
      ['net_profit', true],
      ['reporting_total', false],
    ]
    for (const [column, allowNegative] of moneyColumns) {
      this.schema.raw(
        `ALTER TABLE orders ADD CONSTRAINT chk_orders_${column}_price_money CHECK (is_valid_price_money(${column}, ${allowNegative}))`
      )
    }
    this.schema.raw(
      "ALTER TABLE orders ADD CONSTRAINT chk_orders_refund_within_total CHECK ((refunded_total->>'amount')::numeric <= (grand_total->>'amount')::numeric)"
    )
    this.schema.raw(
      'ALTER TABLE orders ADD CONSTRAINT chk_orders_exchange_rate_positive CHECK (exchange_rate > 0)'
    )
    this.schema.raw(
      `ALTER TABLE orders ADD CONSTRAINT chk_orders_fulfillment_channel CHECK (fulfillment_channel IN ('MFN', 'AFN', 'FBA', 'FBM', '3PL', 'direct'))`
    )
    this.schema.raw(
      `ALTER TABLE orders ADD CONSTRAINT chk_orders_tax_collection_model CHECK (tax_collection_model IN ('marketplace_facilitator', 'seller', 'none'))`
    )
    this.schema.raw(
      "ALTER TABLE orders ADD CONSTRAINT chk_orders_channel_metadata_object CHECK (jsonb_typeof(channel_metadata) = 'object')"
    )
    this.schema.raw(
      'ALTER TABLE orders ADD CONSTRAINT chk_orders_ship_window CHECK (latest_ship_at IS NULL OR earliest_ship_at IS NULL OR latest_ship_at >= earliest_ship_at)'
    )
    this.schema.raw(
      'ALTER TABLE orders ADD CONSTRAINT chk_orders_delivery_window CHECK (latest_delivery_at IS NULL OR earliest_delivery_at IS NULL OR latest_delivery_at >= earliest_delivery_at)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_orders_user_order_number ON orders (user_id, order_number)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_orders_seller_external_id ON orders (seller_account_id, external_order_id) WHERE external_order_id IS NOT NULL'
    )
    this.schema.raw('CREATE INDEX idx_orders_user_status ON orders (user_id, status)')
    this.schema.raw('CREATE INDEX idx_orders_user_ordered_at ON orders (user_id, ordered_at)')
    this.schema.raw('CREATE INDEX idx_orders_customer ON orders (customer_id)')
    this.schema.raw('CREATE INDEX idx_orders_sync_job ON orders (sync_job_id)')
    this.schema.raw(
      'CREATE INDEX idx_orders_user_fulfillment_channel ON orders (user_id, fulfillment_channel)'
    )
    this.schema.raw(
      'CREATE INDEX idx_orders_latest_ship_at ON orders (user_id, latest_ship_at) WHERE latest_ship_at IS NOT NULL'
    )
    this.schema.raw(
      'CREATE INDEX idx_orders_marketplace_site ON orders (user_id, marketplace_site_id) WHERE marketplace_site_id IS NOT NULL'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
