import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'

const databaseDir = '/tmp/pgdata'
const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'postgres',
  password: 'postgres',
  port: 5432,
  persistent: true,
})

if (!existsSync(`${databaseDir}/PG_VERSION`)) {
  await pg.initialise()
}
await pg.start()
console.log('postgres ready on 5432')
setInterval(() => {}, 1 << 30)
