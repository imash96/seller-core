import db from '@adonisjs/lucid/services/db'

/**
 * Shared helpers for the structural money contract.
 *
 * Every business table stores amounts as self-contained `{ currency_code, amount }`
 * JSONB objects, so a money column can be identified across the whole schema by
 * name instead of being enumerated by hand — a new column cannot slip through.
 */

/**
 * Column-name suffixes that identify a monetary jsonb column across the schema.
 * `base_price_usd` is deliberately excluded: `catalog_items` stores USD-only pricing.
 */
export const MONEY_COLUMN_PATTERN =
  /(_total|_amount|_price|_cost|_fee|_fees|_balance|_spent|_proceeds|_profit|_limit)$/

/** Exact column names that are monetary without matching a suffix rule. */
export const MONEY_COLUMN_NAMES = new Set(['subtotal', 'amount', 'price'])

/** Tables whose money contract is asserted. */
export const MONEY_TABLES = [
  'orders',
  'order_line_items',
  'shipments',
  'shipping_invoices',
  'shipping_invoice_lines',
  'return_requests',
  'refund_transactions',
  'marketplace_claims',
  'financial_accounts',
  'credit_cards',
  'financial_transactions',
] as const

/** Tables that must not reintroduce a standalone currency column. */
export const NO_CURRENCY_COLUMN_TABLES = [
  ...MONEY_TABLES,
  'products',
  'product_variants',
  'channel_listings',
  'catalog_items',
  'customers',
] as const

export interface TableColumn {
  column_name: string
  data_type: string
}

/** Columns of one public table, as reported by `information_schema`. */
export async function columnsOf(table: string): Promise<TableColumn[]> {
  const rows = await db.rawQuery(
    `select column_name, data_type from information_schema.columns
      where table_schema = 'public' and table_name = ?`,
    [table]
  )
  return rows.rows as TableColumn[]
}

/** True when a column name carries a money amount. */
export function isMoneyColumn(name: string): boolean {
  if (name === 'base_price_usd') return false
  return MONEY_COLUMN_NAMES.has(name) || MONEY_COLUMN_PATTERN.test(name)
}

/** Money columns of one table. */
export async function moneyColumnsOf(table: string): Promise<string[]> {
  const columns = await columnsOf(table)
  return columns.map((column) => column.column_name).filter(isMoneyColumn)
}

/**
 * CHECK constraints per table whose definition mentions `is_valid_price_money`,
 * keyed by table name. Used to prove that no money column escapes validation.
 */
export async function moneyChecksOf(
  tables: readonly string[]
): Promise<Map<string, Array<{ name: string; definition: string }>>> {
  const rows = await db.rawQuery(
    `select c.relname as table_name, con.conname as constraint_name, pg_get_constraintdef(con.oid) as definition
       from pg_constraint con
       join pg_class c on c.oid = con.conrelid
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and con.contype = 'c'
        and pg_get_constraintdef(con.oid) like '%is_valid_price_money%'
        and c.relname = ANY(?)
      order by c.relname, con.conname`,
    [tables as unknown as string[]]
  )
  const byTable = new Map<string, Array<{ name: string; definition: string }>>()
  for (const row of rows.rows as Array<{
    table_name: string
    constraint_name: string
    definition: string
  }>) {
    const list = byTable.get(row.table_name) ?? []
    list.push({ name: row.constraint_name, definition: row.definition })
    byTable.set(row.table_name, list)
  }
  return byTable
}
