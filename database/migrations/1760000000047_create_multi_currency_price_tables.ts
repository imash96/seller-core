import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateMultiCurrencyPriceTables extends BaseSchema {
  async up() {
    // 1. product_prices — multi-currency price rows attached to a Product
    await this.db.rawQuery(`
      CREATE TABLE IF NOT EXISTS product_prices (
        id varchar(64) NOT NULL PRIMARY KEY,
        user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id varchar(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        price_type varchar(50) NOT NULL DEFAULT 'retail',
        size_value varchar(32) NULL,
        currency_code varchar(10) NOT NULL DEFAULT 'USD',
        amount numeric(14, 2) NOT NULL DEFAULT 0.00,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_product_prices_product ON product_prices (product_id, currency_code);
    `)

    // 2. product_variant_prices — multi-currency price array rows attached to a ProductVariant (Inventory SKU)
    await this.db.rawQuery(`
      CREATE TABLE IF NOT EXISTS product_variant_prices (
        id varchar(64) NOT NULL PRIMARY KEY,
        user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id varchar(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        product_variant_id varchar(64) NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
        price_type varchar(50) NOT NULL DEFAULT 'retail',
        currency_code varchar(10) NOT NULL DEFAULT 'USD',
        amount numeric(14, 2) NOT NULL DEFAULT 0.00,
        compare_at_amount numeric(14, 2) NULL,
        cost_amount numeric(14, 2) NULL,
        manufacturing_cost_amount numeric(14, 2) NULL,
        packaging_cost_amount numeric(14, 2) NULL,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_variant_prices_var_type_curr ON product_variant_prices (product_variant_id, price_type, currency_code);
    `)

    // 3. channel_listing_prices — multi-currency price array rows attached to a ChannelListing
    await this.db.rawQuery(`
      CREATE TABLE IF NOT EXISTS channel_listing_prices (
        id varchar(64) NOT NULL PRIMARY KEY,
        user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_listing_id varchar(64) NOT NULL REFERENCES channel_listings(id) ON DELETE CASCADE,
        product_variant_id varchar(64) NULL REFERENCES product_variants(id) ON DELETE SET NULL,
        price_type varchar(50) NOT NULL DEFAULT 'listed',
        currency_code varchar(10) NOT NULL DEFAULT 'USD',
        amount numeric(14, 2) NOT NULL DEFAULT 0.00,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_listing_prices_lst_type_curr ON channel_listing_prices (channel_listing_id, price_type, currency_code);
    `)

    // 4. order_prices — per-field { currency_code, amount } records attached to every amount field of an Order
    await this.db.rawQuery(`
      CREATE TABLE IF NOT EXISTS order_prices (
        id varchar(64) NOT NULL PRIMARY KEY,
        user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id varchar(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        field_key varchar(64) NOT NULL,
        currency_code varchar(10) NOT NULL DEFAULT 'USD',
        amount numeric(14, 2) NOT NULL DEFAULT 0.00,
        reporting_currency_code varchar(10) NULL DEFAULT 'USD',
        reporting_amount numeric(14, 2) NULL,
        exchange_rate numeric(18, 8) NOT NULL DEFAULT 1.00000000,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_order_prices_ord_field_curr ON order_prices (order_id, field_key, currency_code);
    `)

    // 5. order_line_item_prices — per-field { currency_code, amount } records attached to every amount field of an OrderLineItem
    await this.db.rawQuery(`
      CREATE TABLE IF NOT EXISTS order_line_item_prices (
        id varchar(64) NOT NULL PRIMARY KEY,
        user_id varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id varchar(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        order_line_item_id varchar(64) NOT NULL REFERENCES order_line_items(id) ON DELETE CASCADE,
        field_key varchar(64) NOT NULL,
        currency_code varchar(10) NOT NULL DEFAULT 'USD',
        amount numeric(14, 2) NOT NULL DEFAULT 0.00,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_order_line_prices_line_field_curr ON order_line_item_prices (order_line_item_id, field_key, currency_code);
    `)
  }

  async down() {
    await this.db.rawQuery(`DROP TABLE IF EXISTS order_line_item_prices CASCADE;`)
    await this.db.rawQuery(`DROP TABLE IF EXISTS order_prices CASCADE;`)
    await this.db.rawQuery(`DROP TABLE IF EXISTS channel_listing_prices CASCADE;`)
    await this.db.rawQuery(`DROP TABLE IF EXISTS product_variant_prices CASCADE;`)
    await this.db.rawQuery(`DROP TABLE IF EXISTS product_prices CASCADE;`)
  }
}
