import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Guest middleware denies access to guest-only routes (like `/`)
 * when a user is already authenticated, redirecting to `/dashboard`.
 */
export default class GuestMiddleware {
  /**
   * The URL to redirect to when user is already logged in
   */
  redirectTo = '/dashboard'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { guards?: (keyof Authenticators)[] } = {}
  ) {
    for (let guard of options.guards || [ctx.auth.defaultGuard]) {
      if (await ctx.auth.use(guard).check()) {
        ctx.session.reflash()
        return ctx.response.redirect(this.redirectTo, true)
      }
    }

    return next()
  }
}
