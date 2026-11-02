import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — one session store.
 *
 * The platform carried two disconnected session tables: `sessions` (the
 * `@adonisjs/session` database store, keyed by the cookie session id) and
 * `user_sessions` (a hand-rolled registry keyed by a second random token). They
 * could not be reconciled — expiring one left the other alive, and revocation
 * relied on a `sessionRegistryToken` value duplicated inside the session payload.
 *
 * The registry columns now live on `sessions` itself, keyed by the session id the
 * browser actually presents, so:
 *  - revocation (`is_revoked`) kills the real session,
 *  - `CleanupExpiredSessions` expiry cleanup deletes the real rows,
 *  - active-session auditing reads one table.
 *
 * `user_sessions` rows cannot be mapped onto cookie session ids, so the table is
 * dropped; every client re-authenticates and receives a row in `sessions`.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.raw('ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_foreign')
    this.schema.raw(
      `UPDATE sessions SET user_id = NULL
        WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)`
    )
    this.schema.raw(
      `ALTER TABLE sessions
         ADD CONSTRAINT sessions_user_id_foreign FOREIGN KEY (user_id)
         REFERENCES users (id) ON DELETE CASCADE`
    )

    this.schema.alterTable('sessions', (table) => {
      table.string('ip_address', 64).nullable()
      table.text('user_agent').nullable()
      table.boolean('is_revoked').notNullable().defaultTo(false)
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table.timestamp('last_active_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions (user_id, is_revoked)'
    )
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions (expires_at) WHERE is_revoked = false'
    )

    this.schema.dropTableIfExists('user_sessions')
  }

  async down() {
    this.schema.createTable('user_sessions', (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('session_token_hash', 128).notNullable()
      table.string('ip_address', 64).nullable()
      table.text('user_agent').nullable()
      table.boolean('is_revoked').notNullable().defaultTo(false)
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('last_active_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
    this.schema.raw('CREATE INDEX idx_user_sessions_user ON user_sessions (user_id)')
    this.schema.raw('CREATE INDEX idx_user_sessions_active ON user_sessions (user_id, is_revoked)')

    this.schema.raw('DROP INDEX IF EXISTS idx_sessions_user_active')
    this.schema.raw('DROP INDEX IF EXISTS idx_sessions_expiry')
    this.schema.alterTable('sessions', (table) => {
      table.dropColumn('ip_address')
      table.dropColumn('user_agent')
      table.dropColumn('is_revoked')
      table.dropColumn('revoked_at')
      table.dropColumn('last_active_at')
      table.dropColumn('created_at')
    })
  }
}
