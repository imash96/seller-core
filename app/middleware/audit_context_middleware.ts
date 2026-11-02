import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { AuditContext } from '#services/audit_context'

/**
 * Publishes the request's audit identity (actor, request id, correlation id, ip,
 * user agent) into an async-local scope for the lifetime of the request.
 *
 * Any service that writes through `AuditContext.transaction()` therefore feeds
 * `app.actor_user_id` and friends to the `trg_audit_capture` trigger, so the
 * single audit writer records *who* changed a row without every call site having
 * to pass an actor around. The context is resolved lazily because this middleware
 * runs before the route-level auth guard populates `ctx.auth.user`.
 */
export default class AuditContextMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    return await AuditContext.runWithAmbient(
      () => AuditContext.fromRequest(ctx),
      async () => {
        await next()
      }
    )
  }
}
