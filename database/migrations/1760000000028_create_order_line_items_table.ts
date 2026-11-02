import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Order lines are marketplace-shaped (Amazon SP-API / eBay Fulfillment / Etsy
 * Open API v3 / MedusaJS v2): item tax and shipping tax are tracked separately,
 * discounts and promotions are distinct totals, and each monetary column is a
 * self-contained PriceMoney object with its own currency code.
 *
 * External identity per line:
 *  - `external_order_line_id` — Amazon OrderItemId, eBay lineItemId,
 *    Etsy transaction_id, Medusa LineItem.id
 *  - `external_listing_id`   — Amazon ASIN, eBay legacyItemId, Etsy listing_id,
 *    Medusa product_id
 *  - `external_variant_id`   — Etsy product_id / offering_id, Medusa variant_id,
 *    eBay SKU
 *
 * Jurisdiction-level tax (`tax_lines`) and promotion/coupon (`adjustments`)
 * breakdowns are kept verbatim so a raw marketplace payload round-trips without
 * losing the audit trail; their money values are validated as PriceMoney.
 */
export default class extends BaseSchema {
  protected tableName = 'order_line_items'

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
        .string('product_variant_id', 64)
        .nullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('SET NULL')
      table
        .string('channel_listing_id', 64)
        .nullable()
        .references('id')
        .inTable('channel_listings')
        .onDelete('SET NULL')
      table.string('external_order_line_id', 150).nullable()
      table.string('external_listing_id', 150).nullable()
      table.string('external_variant_id', 150).nullable()
      table.string('sku', 120).notNullable()
      table.string('title', 255).notNullable()
      table.string('variant_title', 255).nullable()
      table.integer('quantity_ordered').notNullable()
      table.integer('quantity_fulfilled').notNullable().defaultTo(0)
      table.integer('quantity_returned').notNullable().defaultTo(0)
      table.integer('quantity_cancelled').notNullable().defaultTo(0)

      // Per-line fulfilment channel: a single order can mix FBA and MFN lines.
      table.string('fulfillment_channel', 32).notNullable().defaultTo('MFN')

      // Jurisdiction tax breakdown: [{ code, rate, description, total: PriceMoney }]
      table.jsonb('tax_lines').notNullable().defaultTo('[]')
      // Promotions / coupons: [{ code, promotion_id, description, amount: PriceMoney }]
      table.jsonb('adjustments').notNullable().defaultTo('[]')
      // Platform extras: Etsy personalization/variations, Amazon GiftWrapLevel /
      // BuyerCustomizedInfo, Medusa metadata.
      table.jsonb('custom_attributes').notNullable().defaultTo('{}')

      table.jsonb('unit_price').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('subtotal').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('discount_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('promotion_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('tax_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('shipping_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table
        .jsonb('shipping_discount_total')
        .notNullable()
        .defaultTo('{"currency_code":"USD","amount":0}')
      table
        .jsonb('shipping_tax_total')
        .notNullable()
        .defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('grand_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('unit_cost').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('marketplace_fee').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('refunded_total').notNullable().defaultTo('{"currency_code":"USD","amount":0}')

      table
        .enum(
          'fulfillment_status',
          ['unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled', 'returned'],
          { enumName: 'fulfillment_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('unfulfilled')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    const moneyColumns: Array<[string, boolean]> = [
      ['unit_price', false],
      ['subtotal', false],
      ['discount_total', false],
      ['promotion_total', false],
      ['tax_total', false],
      ['shipping_total', false],
      ['shipping_discount_total', false],
      ['shipping_tax_total', false],
      ['grand_total', false],
      ['unit_cost', false],
      ['marketplace_fee', false],
      ['refunded_total', false],
    ]
    for (const [column, allowNegative] of moneyColumns) {
      this.schema.raw(
        `ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_${column}_price_money CHECK (is_valid_price_money(${column}, ${allowNegative}))`
      )
    }
    this.schema.raw(
      `ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_fulfillment_channel CHECK (fulfillment_channel IN ('MFN', 'AFN', 'FBA', 'FBM', '3PL', 'direct'))`
    )
    this.schema.raw(
      "ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_tax_lines_money CHECK (is_valid_money_entry_array(tax_lines, 'total'))"
    )
    this.schema.raw(
      "ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_adjustments_money CHECK (is_valid_money_entry_array(adjustments, 'amount'))"
    )
    this.schema.raw(
      "ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_custom_attributes_object CHECK (jsonb_typeof(custom_attributes) = 'object')"
    )
    this.schema.raw(
      'ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_qty_ordered_positive CHECK (quantity_ordered > 0)'
    )
    this.schema.raw(
      'ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_qty_bounds CHECK (quantity_fulfilled >= 0 AND quantity_returned >= 0 AND quantity_cancelled >= 0 AND quantity_fulfilled <= quantity_ordered AND quantity_returned <= quantity_ordered AND quantity_cancelled <= quantity_ordered)'
    )
    this.schema.raw('CREATE INDEX idx_order_line_items_order ON order_line_items (order_id)')
    this.schema.raw(
      'CREATE INDEX idx_order_line_items_variant ON order_line_items (product_variant_id)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_order_line_items_ext_id ON order_line_items (order_id, external_order_line_id) WHERE external_order_line_id IS NOT NULL'
    )
    this.schema.raw(
      'CREATE INDEX idx_order_line_items_external_listing ON order_line_items (user_id, external_listing_id) WHERE external_listing_id IS NOT NULL'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
