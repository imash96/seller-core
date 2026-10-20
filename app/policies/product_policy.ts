import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'
import { RbacService } from '#services/rbac_service'

type Owned = { userId: string }

export default class ProductPolicy extends BasePolicy {
  async view(user: User, product: Owned): Promise<AuthorizerResponse> {
    if (user.isSuperAdmin) return true
    return product.userId === user.id
  }

  async create(user: User): Promise<AuthorizerResponse> {
    if (user.isSuperAdmin) return true
    return RbacService.hasPermission(user, 'catalog.manage', 'products')
  }

  async update(user: User, product: Owned): Promise<AuthorizerResponse> {
    if (product.userId !== user.id) return false
    if (user.isSuperAdmin) return true
    return RbacService.hasPermission(user, 'catalog.manage', 'products')
  }

  async delete(user: User, product: Owned): Promise<AuthorizerResponse> {
    if (product.userId !== user.id) return false
    if (user.isSuperAdmin) return true
    return RbacService.hasPermission(user, 'catalog.manage', 'products')
  }

  async manageVariants(user: User, product: Owned): Promise<AuthorizerResponse> {
    if (product.userId !== user.id) return false
    if (user.isSuperAdmin) return true
    return RbacService.hasPermission(user, 'catalog.manage', 'products')
  }
}
