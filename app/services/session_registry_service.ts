import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import type { QueryClientContract, TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * Session registry — the revocation / auditing layer of the single `sessions`
 * store.
 *
 * The `@adonisjs/session` database driver owns the row (id, signed payload,
 * expiry); this service owns the registry columns on that same row
 * (`user_id`, `ip_address`, `user_agent`, `is_revoked`, `revoked_at`,
 * `last_active_at`). Because the key is the session id the browser actually
 * presents, revoking a row kills the real session — there is no second token to
 * keep in sync and no second table to expire.
 *
 * With the `cookie` (or `memory`) driver no row exists, so registry enforcement is
 * skipped; `SESSION_DRIVER=database` is the supported production configuration.
 */
export class SessionRegistryService {
  /** The registry is only meaningful when the session payload lives in Postgres. */
  static get isEnabled(): boolean {
    return env.get('SESSION_DRIVER') === 'database'
  }

  /**
   * Associates the (already regenerated) session with its user. Adonis session
   * tagging writes the id along with the session payload, so no row is needed yet.
   */
  static async tag(ctx: HttpContext, userId: string): Promise<void> {
    if (!this.isEnabled) return
    await ctx.session.tag(userId)
  }

  /** Removes the user association from the current session. */
  static async untag(ctx: HttpContext, userId: string): Promise<void> {
    if (!this.isEnabled) return
    await ctx.session.untag(userId)
  }

  /**
   * Records the request metadata on the session row and answers whether the
   * session may still be used.
   *
   * A missing, revoked or expired row means the session was killed elsewhere
   * (logout, suspension, password change, janitor) and the caller must log out.
   * The write itself is throttled to once a minute per session, so a normal page
   * load is a single cheap UPDATE-at-most query.
   */
  static async touch(ctx: HttpContext, userId: string): Promise<boolean> {
    if (!this.isEnabled) return true
    const sessionId = ctx.session.sessionId
    if (!sessionId) return false

    const touched = await db.rawQuery(
      `UPDATE sessions
          SET last_active_at = now(),
              ip_address = COALESCE(ip_address, ?),
              user_agent = COALESCE(user_agent, ?)
        WHERE id = ?
          AND user_id = ?
          AND is_revoked = false
          AND expires_at > now()
          AND (last_active_at < now() - interval '1 minute' OR ip_address IS NULL OR user_agent IS NULL)
        RETURNING id`,
      [ctx.request.ip(), ctx.request.header('user-agent') ?? null, sessionId, userId]
    )
    if (SessionRegistryService.rowCount(touched) > 0) return true

    // Either the session is fresh (written seconds ago) or it is dead — ask.
    const active = await db.rawQuery(
      `SELECT 1 AS ok FROM sessions
        WHERE id = ? AND user_id = ? AND is_revoked = false AND expires_at > now()
        LIMIT 1`,
      [sessionId, userId]
    )
    return SessionRegistryService.rowCount(active) > 0
  }

  /** Revokes one session immediately (logout). */
  static async revoke(sessionId: string, client?: QueryClientContract): Promise<number> {
    if (!this.isEnabled) return 0
    const connection = client ?? db
    const result = await connection.rawQuery(
      `UPDATE sessions SET is_revoked = true, revoked_at = now()
        WHERE id = ? AND is_revoked = false`,
      [sessionId]
    )
    return SessionRegistryService.rowCount(result)
  }

  /** Revokes every live session of a user (suspension, password change, lockout). */
  static async revokeAllForUser(
    userId: string,
    client?: QueryClientContract | TransactionClientContract
  ): Promise<number> {
    const connection = client ?? db
    const result = await connection.rawQuery(
      `UPDATE sessions SET is_revoked = true, revoked_at = now()
        WHERE user_id = ? AND is_revoked = false`,
      [userId]
    )
    return SessionRegistryService.rowCount(result)
  }

  /** Number of live sessions a user currently has open (auditing). */
  static async countActiveForUser(userId: string): Promise<number> {
    const result = await db.rawQuery(
      `SELECT COUNT(*)::int AS total FROM sessions
        WHERE user_id = ? AND is_revoked = false AND expires_at > now()`,
      [userId]
    )
    const rows = (result as { rows?: Array<{ total: number }> }).rows ?? []
    return Number(rows[0]?.total ?? 0)
  }

  /**
   * Janitor pass: drop expired rows outright (the session can never be used
   * again) and keep revoked rows for a week as a forensic trail.
   */
  static async purgeExpired(now: DateTime = DateTime.now()): Promise<number> {
    const purged = await db.rawQuery(
      `DELETE FROM sessions
        WHERE expires_at <= ?
           OR (is_revoked = true AND revoked_at < ?)`,
      [now.toSQL(), now.minus({ days: 7 }).toSQL()]
    )
    return SessionRegistryService.rowCount(purged)
  }

  /** Normalises the driver response of a raw statement into an affected-row count. */
  private static rowCount(result: unknown): number {
    const value = result as { rowCount?: number; rows?: unknown[] } | undefined
    if (typeof value?.rowCount === 'number') return value.rowCount
    if (Array.isArray(value?.rows)) return value.rows.length
    return 0
  }
}
