import { defineConfig, drivers } from '@adonisjs/queue'

/**
 * Queue — powered by @boringnode/queue.
 *
 * Three adapters keep this SaaS runnable without extra infra:
 *  - `database`  — primary. Persists jobs in Postgres via Lucid/knex.
 *                  Run `node ace queue:table` + `node ace migration:run`
 *                  once to create queue_jobs / queue_schedules.
 *  - `sync`      — fallback for tests and local dev without a worker.
 *                  Executes jobs inline so request handlers still behave.
 *  - `redis`     — optional high-throughput driver. Enable by setting
 *                  REDIS_URL and uncommenting the entry below.
 *
 * The worker is started separately with `node ace queue:work`.
 * See app/jobs/* for job definitions and docs/QUEUE.md for ops notes.
 */
const queueConfig = defineConfig({
  default: 'database',

  adapters: {
    /**
     * Primary: durable Postgres queue. Survives restarts, honours
     * retries, and supports cron schedules without Redis.
     */
    database: drivers.database({
      connectionName: undefined, // primary Lucid connection
      tableName: 'queue_jobs',
    }),

    /**
     * Synchronous: useful in tests and when queue worker is not running.
     * Jobs run immediately in the request cycle.
     */
    sync: drivers.sync(),

    /**
     * Uncomment when a Redis instance is available for higher throughput.
     * Requires `@adonisjs/redis` and `REDIS_URL` in env.
     *
     * redis: drivers.redis({
     *   connectionName: 'main',
     * }),
     */
  },

  /**
   * Worker tuning — applies when `node ace queue:work` is running.
   * Conservative defaults keep a single-process dev machine healthy.
   */
  worker: {
    concurrency: 10,
    // Poll interval when no jobs are available
    idleDelay: '500ms',
    // How often to renew `acquiredAt` for long-running jobs
    stalledInterval: '30s',
    // After this duration without a heartbeat, a job is considered stalled
    stalledThreshold: '5m',
    maxStalledCount: 1,
    gracefulShutdown: true,
  },

  // Schedules table for `queue.schedule().every(...)` is `queue_schedules`
  // (handled by the database driver via createSchedulesTable); boringnode
  // stores it automatically when a schedule is created — no config key needed.
})

export default queueConfig
