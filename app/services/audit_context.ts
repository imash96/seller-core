import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
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
    const select = GUC_SETTINGS.map(([setting]) => `set_config('${setting}', ?, true)`).join(', ')
    await client.rawQuery(
      `SELECT ${select}`,
      GUC_SETTINGS.map(([, key]) => String(context[key] ?? ''))
    )
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

  /** Builds the audit context of an HTTP request. */
  static fromRequest(
    ctx: HttpContext,
    options: { actorUserId?: string | null; reason?: string | null } = {}
  ): AuditActorContext {
    return {
      actorUserId: options.actorUserId ?? ctx.auth.user?.id ?? null,
      requestId: ctx.request.id(),
      correlationId: requestIdOf(ctx),
      ipAddress: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent') ?? null,
      reason: options.reason ?? null,
    }
  }
}

/** The client-supplied correlation id, when the caller sent one. */
function requestIdOf(ctx: HttpContext): string | null {
  const header = ctx.request.header('x-correlation-id')
  return typeof header === 'string' && header.trim() ? header.trim().slice(0, 128) : null
}
