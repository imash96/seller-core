import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const testDatabaseUrl = env.get('TEST_DATABASE_URL')
if (app.inTest && !testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL must point to a dedicated test database.')
}

const dbConfig = defineConfig({
  /**
   * Default connection used for all queries.
   */
  connection: 'pg',

  connections: {
    /**
     * PostgreSQL connection.
     */
    pg: {
      client: 'pg',
      // Never derive a test database URL from a potentially production connection.
      connection: app.inTest ? testDatabaseUrl! : env.get('DATABASE_URL'),
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      schemaGeneration: {
        enabled: true,
        rulesPaths: ['./database/schema_rules.js'],
      },
      debug: app.inDev,
    },
  },
})

export default dbConfig
