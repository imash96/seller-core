import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { RbacService } from '#services/rbac_service'

/** Apply the existing per-action RBAC and module-entitlement rules to the pipeline. */
export default class CatalogPermissionMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { action: 'read' | 'create' | 'update' | 'delete' }
  ) {
    const user = ctx.auth.getUserOrFail()
    if (!(await RbacService.hasPermission(user, `catalog.${options.action}`, 'catalog'))) {
      return ctx.response.forbidden({
        error: 'You do not have permission to access this catalog operation.',
      })
    }
    return next()
  }
}
