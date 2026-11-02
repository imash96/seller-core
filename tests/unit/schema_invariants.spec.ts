import { test } from '@japa/runner'
import { readFile } from 'node:fs/promises'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import { generateEntityId } from '../../app/utils/generate_entity_id.js'

/**
 * Phase 4 database invariants: single-column `is_valid_price_money` CHECKs are not
 * enough — amounts can be individually valid and still contradict each other, so the
 * cross-field invariants below are enforced by PostgreSQL, not by application code.
 */
test.group('Schema invariants: money, quantities and tenant indexes', () => {
  async function seedOrder(email: string) {
    const user = await User.create({
      email,
      fullName: 'Invariant Owner',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: false,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const customerId = generateEntityId('cust')
    await db.rawQuery('INSERT INTO customers (id, user_id, full_name) VALUES (?, ?, ?)', [
      customerId,
      user.id,
      'Invariant Customer',
    ])
    const orderId = generateEntityId('ord')
    await db.rawQuery(
      `INSERT INTO orders (id, user_id, customer_id, order_number, grand_total, refunded_total)
       VALUES (?, ?, ?, ?, ?::jsonb, ?::jsonb)`,
      [
        orderId,
        user.id,
        customerId,
        `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        JSON.stringify({ currency_code: 'USD', amount: 100 }),
        JSON.stringify({ currency_code: 'USD', amount: 0 }),
      ]
    )
    return { user, orderId }
  }

  test('refunded_total can never exceed grand_total nor drift into another currency', async ({
    assert,
  }) => {
    const { orderId } = await seedOrder(`inv-money-${Date.now()}@example.com`)

    await db.rawQuery('UPDATE orders SET refunded_total = ?::jsonb WHERE id = ?', [
      JSON.stringify({ currency_code: 'USD', amount: 100 }),
      orderId,
    ])
    await assert.rejects(
      () =>
        db.rawQuery('UPDATE orders SET refunded_total = ?::jsonb WHERE id = ?', [
          JSON.stringify({ currency_code: 'USD', amount: 100.01 }),
          orderId,
        ]),
      /chk_orders_refund_within_total/
    )
    await assert.rejects(
      () =>
        db.rawQuery('UPDATE orders SET refunded_total = ?::jsonb WHERE id = ?', [
          JSON.stringify({ currency_code: 'INR', amount: 10 }),
          orderId,
        ]),
      /chk_orders_refund_within_total/
    )
  })

  test('fulfilled + cancelled can never exceed the ordered quantity', async ({ assert }) => {
    const { user, orderId } = await seedOrder(`inv-qty-${Date.now()}@example.com`)
    const lineId = generateEntityId('olin')
    await db.rawQuery(
      `INSERT INTO order_line_items
         (id, user_id, order_id, sku, title, quantity_ordered, quantity_fulfilled, quantity_cancelled,
          unit_price, subtotal, grand_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?::jsonb)`,
      [
        lineId,
        user.id,
        orderId,
        'SKU-INV-1',
        'Invariant line',
        2,
        1,
        1,
        JSON.stringify({ currency_code: 'USD', amount: 50 }),
        JSON.stringify({ currency_code: 'USD', amount: 100 }),
        JSON.stringify({ currency_code: 'USD', amount: 100 }),
      ]
    )

    await assert.rejects(
      () =>
        db.rawQuery('UPDATE order_line_items SET quantity_cancelled = 2 WHERE id = ?', [lineId]),
      /chk_order_line_items_qty_bounds/
    )
    await assert.rejects(
      () =>
        db.rawQuery('UPDATE order_line_items SET quantity_fulfilled = 3 WHERE id = ?', [lineId]),
      /chk_order_line_items_qty_bounds/
    )
  })

  test('schema_rules.ts maps every PostgreSQL enum and jsonb column', async ({ assert }) => {
    const rules = await readFile(new URL('../../database/schema_rules.ts', import.meta.url), 'utf8')
    const { rows: enums } = await db.rawQuery<{ rows: { typname: string }[] }>(
      `SELECT t.typname FROM pg_type t
         JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typtype = 'e' AND n.nspname = 'public'`
    )
    assert.isAbove(enums.length, 0)
    const unmapped = enums
      .map((row) => row.typname)
      .filter((name) => !rules.includes(`'${name}':`) && !rules.includes(`"${name}":`))
    assert.deepEqual(unmapped, [], `schema_rules.ts is missing enum rules: ${unmapped.join(', ')}`)

    // Every jsonb model property is generated with the shared JSON serialiser.
    assert.include(rules, "'jsonb': jsonbRule")
    assert.include(rules, "'json': jsonbRule")
    const { rows: jsonbColumns } = await db.rawQuery<{ rows: { total: string }[] }>(
      `SELECT count(*)::text AS total FROM information_schema.columns
        WHERE table_schema = 'public' AND data_type = 'jsonb'`
    )
    assert.isAbove(Number(jsonbColumns[0].total), 100)
  })

  test('tenant-prefixed composite and JSONB GIN indexes exist', async ({ assert }) => {
    const expected = [
      'idx_orders_user_seller_ordered',
      'idx_orders_user_status_payment_fulfillment',
      'idx_order_line_items_user_order',
      'idx_product_variants_user_product_status',
      'idx_channel_listings_user_seller_status',
      'idx_financial_transactions_user_account_date',
      'idx_product_variants_prices_gin',
      'idx_products_prices_gin',
    ]
    const { rows } = await db.rawQuery<{ rows: { indexname: string; indexdef: string }[] }>(
      `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname = ANY(?)`,
      [expected]
    )
    assert.deepEqual(rows.map((row) => row.indexname).sort(), [...expected].sort())
    const gin = rows.filter((row) => row.indexname.endsWith('_prices_gin'))
    assert.lengthOf(gin, 2)
    for (const index of gin) assert.match(index.indexdef, /USING gin \(prices jsonb_path_ops\)/)
  })
})
