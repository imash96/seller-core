/**
 * Regenerates `database/supabase_schema.sql` from the live PostgreSQL schema.
 *
 * `pg_dump` is not available in this environment, so this script emits the same
 * content in a deterministic, dependency-safe order:
 *   enums → functions → tables → unique/check constraints → indexes → FKs → triggers
 *
 * Framework/infrastructure tables (adonis_schema*, queue_*) are excluded; AdonisJS
 * recreates them via `node ace migration:run` and the deploy notes seed
 * `adonis_schema` afterwards.
 *
 * Usage: node ./scripts/sync_supabase_schema.mjs [--check]
 */
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import pg from 'pg'

/**
 * AdonisJS loads `.env` for `node ace …`, but these scripts are plain node entry
 * points: without this they would silently fall back to the `postgres` maintenance
 * database and report every table as stale (destructive in write mode).
 * `process.loadEnvFile` never overrides an already-exported variable.
 */
const envFile = new URL('../.env', import.meta.url)
if (!process.env.DATABASE_URL && existsSync(envFile)) {
  process.loadEnvFile(envFile)
}

const CONNECTION =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:5432/postgres'
const FILE = new URL('../database/supabase_schema.sql', import.meta.url)
const check = process.argv.includes('--check')

const EXCLUDED_TABLES = new Set(['adonis_schema', 'adonis_schema_versions'])

const client = new pg.Client({ connectionString: CONNECTION })
await client.connect()

const enums = (
  await client.query(`
  SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
   WHERE n.nspname = 'public'
   ORDER BY t.typname, e.enumsortorder`)
).rows

const tables = (
  await client.query(`
  SELECT c.relname AS table_name
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r'
   ORDER BY c.relname`)
).rows

const columns = (
  await client.query(`
  SELECT c.table_name, c.column_name, c.data_type, c.udt_name, c.is_nullable,
         c.column_default, c.character_maximum_length, c.numeric_precision, c.numeric_scale
    FROM information_schema.columns c
   WHERE c.table_schema = 'public'
   ORDER BY c.table_name, c.ordinal_position`)
).rows

const primaryKeys = (
  await client.query(`
  SELECT rel.relname AS table_name, pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
   WHERE n.nspname = 'public' AND con.contype = 'p'
   ORDER BY rel.relname`)
).rows

const constraints = (
  await client.query(`
  SELECT rel.relname AS table_name, con.conname AS constraint_name, con.contype AS kind,
         pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
   WHERE n.nspname = 'public' AND con.contype IN ('u', 'c', 'f')
   ORDER BY rel.relname, con.conname`)
).rows

const indexes = (
  await client.query(`
  SELECT t.relname AS table_name, i.relname AS index_name, pg_get_indexdef(ix.indexrelid) AS definition
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
   WHERE n.nspname = 'public' AND t.relkind = 'r'
     AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = ix.indexrelid)
   ORDER BY t.relname, i.relname`)
).rows

const functions = (
  await client.query(`
  SELECT p.proname, pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
   ORDER BY p.proname`)
).rows

const triggers = (
  await client.query(`
  SELECT t.relname AS table_name, tg.tgname,
         pg_get_triggerdef(tg.oid) AS definition
    FROM pg_trigger tg
    JOIN pg_class t ON t.oid = tg.tgrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
   WHERE n.nspname = 'public' AND NOT tg.tgisinternal
   ORDER BY t.relname, tg.tgname`)
).rows

await client.end()

function sqlType(col) {
  const { data_type: type, udt_name: udt } = col
  if (type === 'character varying') {
    return col.character_maximum_length ? `varchar(${col.character_maximum_length})` : 'varchar'
  }
  if (type === 'numeric') {
    return col.numeric_precision
      ? `numeric(${col.numeric_precision},${col.numeric_scale ?? 0})`
      : 'numeric'
  }
  if (type === 'timestamp with time zone') return 'timestamptz'
  if (type === 'timestamp without time zone') return 'timestamp'
  if (type === 'USER-DEFINED') return `"${udt}"`
  if (type === 'ARRAY') return `${udt.replace(/^_/, '')}[]`
  return type
}

function sqlDefault(col) {
  return col.column_default ? ` DEFAULT ${col.column_default}` : ''
}

const active = new Set(tables.map((t) => t.table_name))
const isActive = (name) => active.has(name)

const out = []
out.push('-- Seller Core schema — generated from the applied migrations (local PostgreSQL).')
out.push('-- Target: Supabase (PostgreSQL 17+). Apply in order; then run `node ace migration:run`.')
out.push('-- Regenerate with: node ./scripts/sync_supabase_schema.mjs')
out.push('-- Money is PriceMoney JSONB {currency_code, amount} validated by is_valid_price_money.')
out.push('')

out.push('-- ---------- ENUM TYPES ----------')
const enumNames = [...new Set(enums.map((e) => e.typname))]
for (const name of enumNames) {
  const values = enums.filter((e) => e.typname === name).map((e) => `'${e.enumlabel}'`)
  out.push(`CREATE TYPE ${name} AS ENUM (${values.join(', ')});`)
}
out.push('')

out.push('-- ---------- FUNCTIONS ----------')
// SQL-language helpers are validated at creation time, so the PriceMoney
// predicate must be defined before the array helpers that call it.
const functionOrder = (name) =>
  name === 'is_valid_price_money' ? 0 : name.startsWith('is_valid_') ? 1 : 2
for (const fn of [...functions].sort(
  (a, b) =>
    functionOrder(a.proname) - functionOrder(b.proname) || a.proname.localeCompare(b.proname)
)) {
  out.push(`${fn.definition.trim()};`)
  out.push('')
}

out.push('-- ---------- TABLES ----------')
for (const { table_name: table } of tables) {
  if (EXCLUDED_TABLES.has(table)) continue
  out.push(`CREATE TABLE "${table}" (`)
  const cols = columns.filter((c) => c.table_name === table)
  const lines = cols.map((col) => {
    const notNull = col.is_nullable === 'NO' ? ' NOT NULL' : ''
    return `  "${col.column_name}" ${sqlType(col)}${sqlDefault(col)}${notNull}`
  })
  const pk = primaryKeys.find((p) => p.table_name === table)
  if (pk) lines.push(`  ${pk.definition.replace(/^PRIMARY KEY /, 'PRIMARY KEY ')}`)
  out.push(lines.join(',\n'))
  out.push(');')
  out.push('')
}

out.push('-- ---------- UNIQUE & CHECK CONSTRAINTS ----------')
for (const c of constraints.filter((x) => x.kind !== 'f' && isActive(x.table_name))) {
  out.push(`ALTER TABLE "${c.table_name}" ADD CONSTRAINT "${c.constraint_name}" ${c.definition};`)
}
out.push('')

out.push('-- ---------- INDEXES ----------')
for (const idx of indexes.filter((x) => isActive(x.table_name))) {
  out.push(`${idx.definition};`)
}
out.push('')

out.push('-- ---------- FOREIGN KEYS ----------')
for (const c of constraints.filter((x) => x.kind === 'f' && isActive(x.table_name))) {
  out.push(`ALTER TABLE "${c.table_name}" ADD CONSTRAINT "${c.constraint_name}" ${c.definition};`)
}
out.push('')

out.push('-- ---------- TRIGGERS ----------')
for (const t of triggers.filter((x) => isActive(x.table_name))) {
  out.push(`${t.definition};`)
}
out.push('')

const rendered = `${out.join('\n').replace(/\n{3,}/g, '\n\n')}`
const current = await readFile(FILE, 'utf8').catch(() => '')

if (check) {
  if (current !== rendered) {
    console.error(
      'database/supabase_schema.sql is out of sync with the database. Run: node ./scripts/sync_supabase_schema.mjs'
    )
    process.exitCode = 1
  } else {
    console.log('database/supabase_schema.sql is in sync with the database.')
  }
} else {
  await writeFile(FILE, rendered)
  console.log(
    `Wrote ${enumNames.length} enums, ${functions.length} functions, ${[...active].filter((t) => !EXCLUDED_TABLES.has(t)).length} tables, ${indexes.length} indexes, ${triggers.length} triggers`
  )
}
