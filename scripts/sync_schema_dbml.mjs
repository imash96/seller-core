/**
 * Regenerates `database/schema.dbml` column, index and CHECK blocks from the live
 * PostgreSQL schema, preserving hand-written notes, refs and table commentary.
 *
 * `psql`/`pg_dump` are not available in this environment, so the DBML is the
 * hand-maintained artifact and this script keeps it honest against the migrations.
 *
 * Usage: node ./scripts/sync_schema_dbml.mjs [--check]
 */
import { readFile, writeFile } from 'node:fs/promises'
import pg from 'pg'
import { Parser, exporter } from '@dbml/core'

const CONNECTION =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:5432/postgres'
const FILE = new URL('../database/schema.dbml', import.meta.url)
const check = process.argv.includes('--check')

const client = new pg.Client({ connectionString: CONNECTION })
await client.connect()

const columns = (
  await client.query(`
  SELECT c.table_name, c.column_name, c.data_type, c.udt_name, c.is_nullable,
         c.column_default, c.character_maximum_length, c.numeric_precision, c.numeric_scale,
         c.is_identity, c.identity_generation,
         (SELECT true FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
           WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
             AND tc.table_name = c.table_name AND kcu.column_name = c.column_name) AS is_pk
    FROM information_schema.columns c
   WHERE c.table_schema = 'public'
   ORDER BY c.table_name, c.ordinal_position`)
).rows

const indexes = (
  await client.query(`
  SELECT t.relname AS table_name,
         i.relname AS index_name,
         ix.indisunique AS is_unique,
         ix.indisprimary AS is_primary,
         pg_get_indexdef(ix.indexrelid) AS definition,
         pg_get_expr(ix.indpred, ix.indrelid) AS predicate,
         (SELECT array_agg(a.attname ORDER BY k.ord)
            FROM unnest(ix.indkey::int[]) WITH ORDINALITY AS k(attnum, ord)
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
           WHERE k.attnum > 0) AS columns
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
   WHERE n.nspname = 'public' AND t.relkind = 'r'
   ORDER BY t.relname, i.relname`)
).rows

const checks = (
  await client.query(`
  SELECT rel.relname AS table_name, con.conname AS constraint_name,
         pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
   WHERE n.nspname = 'public' AND con.contype = 'c'
   ORDER BY rel.relname, con.conname`)
).rows

/** Formats a PostgreSQL column as a DBML column line (type + attributes). */
function formatType(col) {
  const { data_type: type, udt_name: udt } = col
  if (type === 'character varying') {
    return col.character_maximum_length ? `varchar(${col.character_maximum_length})` : 'varchar'
  }
  if (type === 'numeric') {
    return col.numeric_precision
      ? `decimal(${col.numeric_precision},${col.numeric_scale ?? 0})`
      : 'decimal'
  }
  if (type === 'timestamp with time zone') return 'timestamptz'
  if (type === 'timestamp without time zone') return 'timestamp'
  if (type === 'USER-DEFINED') return udt
  if (type === 'ARRAY') return 'jsonb'
  return type
}

/** Normalises a pg default expression into a DBML default literal. */
function formatDefault(value) {
  if (value === null) return null
  let text = String(value).trim()
  if (/^'.*'::[a-z_ ]+(\(\d+(,\d+)?\))?$/i.test(text)) {
    text = text.replace(/::[a-z_ ()0-9,]+$/i, '')
  }
  if (/^nextval\(/i.test(text)) return null
  if (/^now\(\)$/i.test(text)) return '`now()`'
  if (/^CURRENT_TIMESTAMP$/i.test(text)) return '`now()`'
  if (/^true$/i.test(text)) return 'true'
  if (/^false$/i.test(text)) return 'false'
  if (/^-?\d+(\.\d+)?$/.test(text)) return text
  if (text.startsWith('ARRAY')) return null
  return text.length > 60 ? `${text.slice(0, 57)}...` : text
}

const byTable = new Map()
for (const col of columns) {
  if (!byTable.has(col.table_name)) byTable.set(col.table_name, [])
  byTable.get(col.table_name).push(col)
}

const file = await readFile(FILE, 'utf8')
const lines = file.split('\n')

/** Extracts `[note: '...']` and `[ref: > x.y]` style attributes from an existing line. */
function existingAttributes(line) {
  const notes = line.match(/note: '(?:[^'\\]|\\.)*'/g) ?? []
  const refs = line.match(/ref: [<>-] \w+\.\w+/g) ?? []
  return { notes, refs }
}

const out = []
let currentTable = null
let mode = 'body'
let emittedColumns = false
const emittedTables = new Set()

function renderTable(tableName, existingBlock) {
  const cols = byTable.get(tableName) ?? []
  const columnLines = []
  for (const col of cols) {
    const previous = existingBlock.find(
      (line) => line.trim().startsWith(`${col.column_name} `) || line.trim() === col.column_name
    )
    const { notes, refs } = previous ? existingAttributes(previous) : { notes: [], refs: [] }
    const attrs = []
    if (col.is_pk) attrs.push('pk')
    if (col.is_nullable === 'NO' && !col.is_pk) attrs.push('not null')
    else if (col.is_nullable === 'YES') attrs.push('null')
    const def = formatDefault(col.column_default)
    if (def !== null && !col.is_pk) attrs.push(`default: ${def}`)
    attrs.push(...refs, ...notes)
    const suffix = attrs.length ? ` [${attrs.join(', ')}]` : ''
    columnLines.push(`  ${col.column_name} ${formatType(col)}${suffix}`)
  }
  return columnLines
}

function renderIndexes(tableName) {
  const tableIndexes = indexes.filter((idx) => idx.table_name === tableName && !idx.is_primary)
  if (tableIndexes.length === 0) return []
  const result = ['', '  Indexes {']
  for (const idx of tableIndexes) {
    const rawCols = Array.isArray(idx.columns)
      ? idx.columns
      : String(idx.columns ?? '')
          .replace(/^\{|\}$/g, '')
          .split(',')
    const cols = rawCols.map((c) => String(c).replace(/^"|"$/g, '').trim()).filter(Boolean)
    const target = cols.length === 1 ? cols[0] : `(${cols.join(', ')})`
    const attrs = [idx.is_unique ? 'unique' : null, `name: '${idx.index_name}'`].filter(Boolean)
    if (idx.predicate) attrs.push(`note: 'partial: ${idx.predicate}'`)
    result.push(`    ${target} [${attrs.join(', ')}]`)
  }
  result.push('  }')
  return result
}

function renderChecks(tableName) {
  const tableChecks = checks.filter((c) => c.table_name === tableName)
  if (tableChecks.length === 0) return []
  const result = ['']
  for (const c of tableChecks) {
    result.push(
      `  // CHECK ${c.constraint_name}: ${c.definition.replace(/^CHECK \(/, '').replace(/\)$/, '')}`
    )
  }
  return result
}

// Business tables that must be documented. Framework/infrastructure tables
// (adonis_schema*, sessions, queue_*) are intentionally excluded from the DBML.
const IGNORED_TABLES = new Set([
  'adonis_schema',
  'adonis_schema_versions',
  'queue_jobs',
  'queue_schedules',
])

const droppedTables = []

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const tableMatch = line.match(/^Table (\w+(?:\.\w+)?) \{/)
  if (tableMatch) {
    currentTable = tableMatch[1]
    out.push(line)
    // Collect the whole existing block so notes/refs can be reused.
    const block = []
    let depth = 1
    let j = i + 1
    for (; j < lines.length; j++) {
      const candidate = lines[j]
      if (/\{$/.test(candidate.trim())) depth += 1
      if (candidate.trim() === '}') depth -= 1
      if (depth === 0) break
      block.push(candidate)
    }
    const tailIndex = j
    if (!byTable.has(currentTable) && !IGNORED_TABLES.has(currentTable)) {
      // The table no longer exists in PostgreSQL: drop the stale documentation
      // instead of keeping a block that describes a table the migrations removed.
      out.pop()
      droppedTables.push(currentTable)
      i = tailIndex
      continue
    }
    const columnBlock = []
    let indexBlock = []
    let checkBlock = []
    let section = 'columns'
    const notes = []
    for (const candidate of block) {
      const trimmed = candidate.trim()
      if (trimmed === 'Indexes {') {
        section = 'indexes'
        indexBlock.push(candidate)
        continue
      }
      if (section === 'indexes') {
        indexBlock.push(candidate)
        if (trimmed === '}') section = 'after-indexes'
        continue
      }
      if (trimmed.startsWith('// CHECK')) {
        checkBlock.push(candidate)
        continue
      }
      if (trimmed.startsWith('Note:')) {
        notes.push(candidate)
        continue
      }
      if (trimmed === '') continue
      if (section === 'columns') columnBlock.push(candidate)
    }

    out.push(...renderTable(currentTable, columnBlock))
    out.push(...renderIndexes(currentTable))
    const liveChecks = renderChecks(currentTable)
    // Preserve "Note:" commentary from the previous block, plus any non-CHECK tail notes.
    if (liveChecks.length) out.push(...liveChecks)
    else if (checkBlock.length) out.push('', ...checkBlock)
    if (notes.length) out.push('', ...notes)
    out.push('}')
    emittedTables.add(currentTable)
    i = tailIndex
    continue
  }
  out.push(line)
}

await client.end()

const missing = [...byTable.keys()].filter(
  (table) => !emittedTables.has(table) && !IGNORED_TABLES.has(table)
)
if (missing.length) {
  // Append undocumented tables (e.g. added by a later migration) so the DBML
  // never drifts behind the migrations.
  const appended = []
  for (const table of missing) {
    appended.push('', `Table ${table} {`)
    appended.push(...renderTable(table, []))
    appended.push(...renderIndexes(table))
    appended.push(...renderChecks(table))
    appended.push('}')
    emittedTables.add(table)
  }
  out.push(...appended)
  console.log(`Appended ${missing.length} previously undocumented table(s): ${missing.join(', ')}`)
}

if (droppedTables.length) {
  console.log(`Removed ${droppedTables.length} stale table block(s): ${droppedTables.join(', ')}`)
}

const rendered = out.join('\n')

/**
 * The DBML must be machine-readable, not just human-readable: parse it and export it
 * back to PostgreSQL DDL. Any parse/diagnostic error fails the sync (and therefore
 * `db:schema:check`), so a malformed note or ref can never be committed.
 */
function validateDbml(source) {
  const database = Parser.parse(source, 'dbml')
  const tables = database?.schemas?.flatMap((schema) => schema.tables ?? []) ?? []
  const diagnostics = tables.flatMap((table) =>
    (table.diagnostics ?? []).map((diagnostic) => `${table.name}: ${diagnostic.message}`)
  )
  if (diagnostics.length) {
    throw new Error(`DBML diagnostics:\n${diagnostics.join('\n')}`)
  }
  const ddl = exporter.export(source, 'postgres')
  if (typeof ddl !== 'string' || !ddl.includes('CREATE TABLE')) {
    throw new Error('DBML export produced no PostgreSQL DDL.')
  }
  return { tables: tables.length, ddlLength: ddl.length }
}

if (check) {
  if (rendered !== file) {
    console.error(
      'database/schema.dbml is out of sync with the database. Run: node ./scripts/sync_schema_dbml.mjs'
    )
    process.exitCode = 1
  } else {
    console.log('database/schema.dbml is in sync with the database.')
  }
  const validated = validateDbml(file)
  console.log(`database/schema.dbml parses cleanly (${validated.tables} tables, ${validated.ddlLength} DDL chars).`)
} else {
  await writeFile(FILE, rendered)
  const validated = validateDbml(rendered)
  console.log(`Synced ${emittedTables.size} tables into database/schema.dbml`)
  console.log(`database/schema.dbml parses cleanly (${validated.tables} tables, ${validated.ddlLength} DDL chars).`)
}
