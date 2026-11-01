import { assert } from '@japa/assert'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import { dbAssertions } from '@adonisjs/lucid/plugins/db'
import testUtils from '@adonisjs/core/services/test_utils'
import { browserClient } from '@japa/browser-client'
import { chromium } from 'playwright'
import { authBrowserClient } from '@adonisjs/auth/plugins/browser_client'
import { sessionBrowserClient } from '@adonisjs/session/plugins/browser_client'

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  dbAssertions(app),
  browserClient({
    runInSuites: ['browser'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? {
          launcher: (options) =>
            chromium.launch({
              ...options,
              executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
              args: ['--no-sandbox'],
            }),
        }
      : {}),
  }),
  sessionBrowserClient(app),
  authBrowserClient(app),
]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    async () => {
      const rollback = await testUtils.db().migrate()
      return async () => {
        // Release pooled application connections before the migration runner acquires
        // its session-scoped advisory lock, so lock and unlock use the same session.
        await db.manager.closeAll()
        await rollback()
      }
    },
  ],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
