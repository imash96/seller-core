import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/** Defense in depth: privileged routes also invoke their existing Bouncer abilities. */
export default class SuperAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (await ctx.bouncer.denies('isSuperAdmin'))
      return ctx.response.forbidden({ error: 'Super administrator access is required.' })
    return next()
  }
}
