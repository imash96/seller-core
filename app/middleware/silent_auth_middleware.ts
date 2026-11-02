import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { SessionRegistryService } from '../services/session_registry_service.js'
import { UserStatus } from '../enums/index.js'

/**
 * Validates the live session registry on every request.
 *
 * The registry lives on the same `sessions` row the browser's cookie points at, so
 * a session revoked by logout, a password change, a suspension or the janitor
 * stops working immediately — there is no second table to expire. The check also
 * refreshes `last_active_at` / `ip_address` / `user_agent` (at most once a minute
 * per session) for active-session auditing.
 */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authenticated = await ctx.auth.check()
    if (authenticated) {
      const user = ctx.auth.getUserOrFail()
      const alive =
        user.status === UserStatus.ACTIVE && (await SessionRegistryService.touch(ctx, user.id))
      if (!alive) {
        await ctx.auth.use('web').logout()
        ctx.session.forget('sessionRegistryToken')
      }
    }
    return next()
  }
}
