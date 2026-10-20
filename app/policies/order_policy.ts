import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'
import { RbacService } from '#services/rbac_service'

type Owned = { userId: string }

export default class OrderPolicy extends BasePolicy {
  async view(user: User, order: Owned): Promise<AuthorizerResponse> {
    if (user.isSuperAdmin) return true
    return order.userId === user.id
  }

  async create(user: User): Promise<AuthorizerResponse> {
    if (user.isSuperAdmin) return true
    return RbacService.hasPermission(user, 'orders.create', 'orders')
  }

  async updateStatus(user: User, order: Owned): Promise<AuthorizerResponse> {
    if (user.isSuperAdmin) return true
    if (order.userId !== user.id) return false
    return RbacService.hasPermission(user, 'orders.create', 'orders')
  }

  async delete(user: User, order: Owned): Promise<AuthorizerResponse> {
    if (order.userId !== user.id) return false
    if (user.isSuperAdmin) return true
    return RbacService.hasPermission(user, 'orders.delete', 'orders')
  }

  async bulkImport(user: User): Promise<AuthorizerResponse> {
    if (user.isSuperAdmin) return true
    return RbacService.hasPermission(user, 'orders.bulk_import', 'orders')
  }
}
