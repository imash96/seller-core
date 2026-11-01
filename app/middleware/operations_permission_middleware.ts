import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { RbacService } from '#services/rbac_service'

export default class OperationsPermissionMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      resource:
        | 'orders'
        | 'shipments'
        | 'returns'
        | 'finance'
        | 'credit_cards'
        | 'customers'
        | 'integrations'
        | 'tasks'
      action: 'read' | 'create' | 'update' | 'delete' | 'export'
    }
  ) {
    const user = ctx.auth.getUserOrFail()
    if (
      !(await RbacService.hasPermission(
        user,
        `${options.resource}.${options.action}`,
        options.resource
      ))
    ) {
      return ctx.response.forbidden({ error: 'You do not have permission for this operation.' })
    }
    return next()
  }
}
