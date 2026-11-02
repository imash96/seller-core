import pg from 'pg'
const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:5432/postgres' })
await c.connect()
for (const q of process.argv.slice(2)) {
  const r = await c.query(q)
  console.log(JSON.stringify(r.rows, null, 1))
}
await c.end()
