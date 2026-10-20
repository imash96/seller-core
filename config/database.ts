import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

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
      /**
       * In the test environment, swap the database name to `seller_core_test`
       * so the suite never migrates/rolls back the dev database.
       */
      connection: app.inTest
        ? env.get('DATABASE_URL').replace(/\/[^/?]+(\?.*)?$/, '/seller_core_test$1')
        : env.get('DATABASE_URL'),
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
