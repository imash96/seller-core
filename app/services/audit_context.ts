import { AsyncLocalStorage } from 'node:async_hooks'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * Application context handed to the PostgreSQL audit trigger.
 *
 * Row-level auditing has exactly one writer: the `trg_audit_capture` trigger
 * (`fn_audit_log_capture`). Everything the trigger cannot know — who performed the
 * mutation, from which request, and why — is passed through session-local GUCs
 * (`SET LOCAL` / `set_config(..., true)`), so the audit row is written atomically
 * with the mutation inside the same transaction:
 *
 *  - `app.actor_user_id`    → `audit_logs.actor_user_id`
 *  - `app.request_id`       → `audit_logs.request_id`
 *  - `app.correlation_id`   → `audit_logs.correlation_id`
 *  - `app.ip_address`       → `audit_logs.ip_address`
 *  - `app.user_agent`       → `audit_logs.user_agent`
 *  - `app.audit_reason`     → `audit_logs.metadata.reason` (semantic label,
 *                             e.g. `order.cancelled`, without a second audit row)
 *
 * `SET LOCAL` only lives inside a transaction, which is exactly why mutations must
 * be wrapped in `AuditContext.run(...)` (or applied to an existing transaction with
 * `AuditContext.apply(...)`).
 */
export interface AuditActorContext {
  actorUserId?: string | null
  requestId?: string | null
  correlationId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  /** Semantic label recorded in `audit_logs.metadata.reason`. */
  reason?: string | null
}

/**
 * The slice of `HttpContext` the audit layer needs. Both the real context and the
 * destructured handler arguments satisfy it, so controllers can stay terse.
 */
export interface AuditRequestSource {
  auth: { user?: { id: string } | null }
  request: {
    id(): string | undefined
    ip(): string | undefined
    header(name: string): string | null | undefined
  }
}

const AMBIENT = new AsyncLocalStorage<AuditActorContext | (() => AuditActorContext)>()

const GUC_SETTINGS: Array<[setting: string, key: keyof AuditActorContext]> = [
  ['app.actor_user_id', 'actorUserId'],
  ['app.request_id', 'requestId'],
  ['app.correlation_id', 'correlationId'],
  ['app.ip_address', 'ipAddress'],
  ['app.user_agent', 'userAgent'],
  ['app.audit_reason', 'reason'],
]

export class AuditContext {
  /**
   * Publishes the audit context for the enclosing transaction.
   *
   * `set_config(name, value, is_local => true)` is the parameterisable form of
   * `SET LOCAL`, so a single round-trip sets every GUC and nothing leaks to the
   * connection pool once the transaction ends.
   */
  static async apply(client: TransactionClientContract, context: AuditActorContext): Promise<void> {
    // Explicit values win, but they are merged on top of the request-scoped
    // ambient context so a service that only knows the `reason` still records the
    // actor, request id, correlation id and client address.
    const resolved = AuditContext.merge(AuditContext.current(), context)
    const select = GUC_SETTINGS.map(([setting]) => `set_config('${setting}', ?, true)`).join(', ')
    await client.rawQuery(
      `SELECT ${select}`,
      GUC_SETTINGS.map(([, key]) => String(resolved[key] ?? ''))
    )
  }

  /** Overlays defined keys of `override` on top of `base`. */
  private static merge(base: AuditActorContext, override: AuditActorContext): AuditActorContext {
    const merged: AuditActorContext = { ...base }
    for (const [key, value] of Object.entries(override) as Array<
      [keyof AuditActorContext, string | null | undefined]
    >) {
      if (value !== undefined && value !== null && value !== '') merged[key] = value as never
    }
    return merged
  }

  /**
   * Runs `callback` inside an ambient audit scope.
   *
   * A scope may carry the context itself or a thunk that resolves it lazily — the
   * HTTP middleware uses the thunk form so `auth.user` is only read when a
   * transaction actually starts (after the auth guard ran).
   */
  static async runWithAmbient<T>(
    source: AuditActorContext | (() => AuditActorContext),
    callback: () => Promise<T>
  ): Promise<T> {
    return await AMBIENT.run(source, callback)
  }

  /** The ambient context of the current async execution (empty when none). */
  static current(): AuditActorContext {
    const source = AMBIENT.getStore()
    if (!source) return {}
    return typeof source === 'function' ? source() : source
  }

  /**
   * `db.transaction` with the ambient audit context already published.
   *
   * Services use this instead of `db.transaction` so every row they write is
   * attributed to the request actor without threading an audit object through
   * each method signature.
   */
  static async transaction<T>(
    callback: (trx: TransactionClientContract) => Promise<T>
  ): Promise<T> {
    return await db.transaction(async (trx) => {
      await AuditContext.apply(trx, {})
      return await callback(trx)
    })
  }

  /**
   * Runs `callback` inside a transaction whose audit context is already set.
   *
   * Every mutation inside the callback is attributed to the actor and carries the
   * request/correlation ids, so the trigger can write one complete audit row.
   */
  static async run<T>(
    context: AuditActorContext,
    callback: (trx: TransactionClientContract) => Promise<T>
  ): Promise<T> {
    return await db.transaction(async (trx) => {
      await AuditContext.apply(trx, context)
      return await callback(trx)
    })
  }

  /**
   * Runs `callback` in a transaction whose audit context is taken from the request
   * (actor, request id, correlation id, ip, user agent) plus a semantic `reason`.
   *
   * Every controller mutation uses this so the trigger writes a complete audit row
   * — the actor is never lost just because a handler forgets to pass it.
   */
  static async runRequest<T>(
    ctx: AuditRequestSource,
    reason: string,
    callback: (trx: TransactionClientContract) => Promise<T>
  ): Promise<T> {
    return await AuditContext.run(AuditContext.fromRequest(ctx, { reason }), callback)
  }

  /** Builds the audit context of an HTTP request. */
  static fromRequest(
    ctx: AuditRequestSource,
    options: { actorUserId?: string | null; reason?: string | null } = {}
  ): AuditActorContext {
    return {
      actorUserId: options.actorUserId ?? ctx.auth.user?.id ?? null,
      requestId: ctx.request.id() ?? null,
      correlationId: requestIdOf(ctx),
      ipAddress: ctx.request.ip() ?? null,
      userAgent: ctx.request.header('user-agent') ?? null,
      reason: options.reason ?? null,
    }
  }
}

/** The client-supplied correlation id, when the caller sent one. */
function requestIdOf(ctx: AuditRequestSource): string | null {
  const header = ctx.request.header('x-correlation-id')
  return typeof header === 'string' && header.trim() ? header.trim().slice(0, 128) : null
}
