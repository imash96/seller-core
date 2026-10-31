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
       * In the test environment, swap the database name to `seller-core-test`
       * or use TEST_DATABASE_URL if defined.
       */
      connection: app.inTest
        ? env.get('TEST_DATABASE_URL') ||
          env.get('DATABASE_URL').replace(/\/[^/?]+(\?.*)?$/, '/seller-core-test$1')
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
