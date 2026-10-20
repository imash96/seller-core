import AuditLog from '#models/audit_log'
import { RbacService } from '#services/rbac_service'

/**
 * Single audit writer used by multiple event listeners.
 * Keeps the append-only audit_logs table in sync without coupling
 * every service to RbacService directly.
 */
export default class WriteAuditTrail {
  async handle(event: {
    payload: {
      userId: string
      requestId?: string
      actorUserId?: string
      [k: string]: any
    }
    // events may carry constructor name; we sniff it for action naming
    constructor?: { name: string }
  }) {
    const { userId, requestId, actorUserId, ...rest } = event.payload
    const action = event.constructor?.name
      ? `event.${event.constructor.name
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .replace(/^_/, '')}`
      : 'event.unknown'

    await RbacService.recordAudit({
      actorUserId: actorUserId ?? userId,
      userId,
      action,
      entityType: 'outbox_events',
      entityId: (rest as any).orderId ?? (rest as any).shipmentId ?? userId,
      requestId: requestId ?? 'event-bus',
      afterState: rest,
    }).catch(() => {
      // Audit is best-effort — never fail the business transaction
    })

    // Also attempt direct insert for parity with legacy path
    try {
      // noop — RbacService already wrote above; this is the single source
      await AuditLog.query().whereRaw('1=0').first()
    } catch {}
  }
}
