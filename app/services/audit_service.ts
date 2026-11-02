import AuditLog from '#models/audit_log'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * Actions that are *not* row mutations and therefore have no trigger to write them:
 * authentication, exports and other cross-cutting operations. Everything else is
 * captured by `trg_audit_capture` — writing it here as well would duplicate rows.
 */
export const NON_ROW_AUDIT_ACTIONS = [
  'auth.login',
  'auth.login_failed',
  'auth.logout',
  'export.downloaded',
] as const

export type NonRowAuditAction = (typeof NON_ROW_AUDIT_ACTIONS)[number]

export interface NonRowAuditInput {
  action: NonRowAuditAction
  actorUserId?: string | null
  userId?: string | null
  entityType: string
  entityId?: string | null
  requestId?: string | null
  correlationId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  beforeState?: Record<string, unknown> | null
  afterState?: Record<string, unknown> | null
  metadata?: Record<string, unknown>
}

/**
 * The only application-side writer of `audit_logs`.
 *
 * Row-level INSERT/UPDATE/DELETE audit comes from the PostgreSQL trigger; this
 * service is reserved for events that have no row (a successful login does not
 * mutate a business table). Keeping the allow-list closed means "duplicate audit
 * entry" bugs are impossible by construction: there is no API to write a row-level
 * audit by hand.
 */
export class AuditService {
  static async record(
    input: NonRowAuditInput,
    options?: { client?: TransactionClientContract }
  ): Promise<AuditLog> {
    if (!NON_ROW_AUDIT_ACTIONS.includes(input.action)) {
      throw new Error(
        `AuditService.record only accepts non-row actions (${NON_ROW_AUDIT_ACTIONS.join(
          ', '
        )}); row mutations are audited by the trg_audit_capture trigger. Received "${input.action}".`
      )
    }
    return await AuditLog.create(
      {
        actorUserId: input.actorUserId ?? null,
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        requestId: input.requestId ?? null,
        correlationId: input.correlationId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        beforeState: input.beforeState ?? null,
        afterState: input.afterState ?? null,
        metadata: input.metadata ?? {},
      },
      options?.client ? { client: options.client } : undefined
    )
  }

  /** Successful authentication. `entity_id` is the user, never the credentials. */
  static async recordLogin(
    input: Omit<NonRowAuditInput, 'action' | 'entityType'> & { actorUserId: string }
  ): Promise<AuditLog> {
    return await this.record({
      ...input,
      action: 'auth.login',
      entityType: 'users',
      entityId: input.actorUserId,
    })
  }

  /** Failed authentication — an identifier only, never the attempted secret. */
  static async recordLoginFailed(input: {
    email: string
    userId?: string | null
    requestId?: string | null
    ipAddress?: string | null
    userAgent?: string | null
    reason?: string
  }): Promise<AuditLog | null> {
    try {
      return await this.record({
        action: 'auth.login_failed',
        actorUserId: null,
        userId: input.userId ?? null,
        entityType: 'users',
        entityId: input.userId ?? null,
        requestId: input.requestId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        afterState: { email: input.email.slice(0, 254) },
        metadata: { reason: input.reason ?? 'invalid_credentials' },
      })
    } catch {
      // Never let audit failure mask an authentication error.
      return null
    }
  }

  /** Sign-out of an existing session. */
  static async recordLogout(
    input: Omit<NonRowAuditInput, 'action' | 'entityType' | 'entityId'> & { userId: string }
  ): Promise<AuditLog> {
    return await this.record({
      ...input,
      action: 'auth.logout',
      entityType: 'users',
      entityId: input.userId,
    })
  }

  /** Data export / download (CSV, listing payloads…). */
  static async recordExport(input: {
    actorUserId: string
    userId?: string | null
    entityType: string
    entityId?: string | null
    requestId?: string | null
    ipAddress?: string | null
    metadata?: Record<string, unknown>
  }): Promise<AuditLog> {
    return await this.record({
      action: 'export.downloaded',
      actorUserId: input.actorUserId,
      userId: input.userId ?? input.actorUserId,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      requestId: input.requestId ?? null,
      ipAddress: input.ipAddress ?? null,
      metadata: input.metadata ?? {},
    })
  }
}
