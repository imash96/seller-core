import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — `customers` keeps one canonical name and a derived repeat flag.
 *
 *  - `full_name` is the only name field. `first_name` / `last_name` were a lossy
 *    split (mononyms, prefixes, CJK names) and are folded into `full_name`.
 *  - `is_repeat_customer` was written by hand in three different services and
 *    drifted. It is now `GENERATED ALWAYS AS (orders_count > 1) STORED`.
 *  - `preferred_currency` (when present in an older database) is dropped: the
 *    currency of every monetary value is carried by its PriceMoney object.
 */
export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.raw(
      `UPDATE customers
          SET full_name = LEFT(
                CASE
                  WHEN full_name IS NULL OR TRIM(full_name) = ''
                    THEN TRIM(CONCAT_WS(' ', NULLIF(TRIM(first_name), ''), NULLIF(TRIM(last_name), '')))
                  ELSE full_name
                END, 255)
        WHERE first_name IS NOT NULL OR last_name IS NOT NULL`
    )
    this.schema.raw(
      `UPDATE customers SET full_name = 'Unnamed customer' WHERE full_name IS NULL OR TRIM(full_name) = ''`
    )

    this.schema.raw('ALTER TABLE customers DROP COLUMN IF EXISTS first_name')
    this.schema.raw('ALTER TABLE customers DROP COLUMN IF EXISTS last_name')
    this.schema.raw('ALTER TABLE customers DROP COLUMN IF EXISTS preferred_currency')

    this.schema.raw('ALTER TABLE customers DROP COLUMN IF EXISTS is_repeat_customer')
    this.schema.raw(
      `ALTER TABLE customers
         ADD COLUMN is_repeat_customer boolean
         GENERATED ALWAYS AS (orders_count > 1) STORED`
    )
  }

  async down() {
    this.schema.raw('ALTER TABLE customers DROP COLUMN IF EXISTS is_repeat_customer')
    this.schema.alterTable(this.tableName, (table) => {
      table.string('first_name', 120).nullable()
      table.string('last_name', 120).nullable()
      table.boolean('is_repeat_customer').notNullable().defaultTo(false)
    })
  }
}
