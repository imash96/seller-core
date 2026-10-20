import { BasePolicy } from '@adonisjs/bouncer'
import type { AuthorizerResponse } from '@adonisjs/bouncer/types'
import type User from '#models/user'

export default class UserPolicy extends BasePolicy {
  async view(user: User): Promise<AuthorizerResponse> {
    return !!user
  }

  async create(user: User): Promise<AuthorizerResponse> {
    return user.isSuperAdmin === true
  }

  async update(user: User, target: User): Promise<AuthorizerResponse> {
    if (user.isSuperAdmin) return true
    // Users may self-edit non-privileged fields; superAdmin check above handles elevation.
    return user.id === target.id
  }

  async delete(user: User, target: User): Promise<AuthorizerResponse> {
    if (user.id === target.id) return false
    return user.isSuperAdmin === true
  }

  async toggleStatus(user: User): Promise<AuthorizerResponse> {
    return user.isSuperAdmin === true
  }

  async assignRole(user: User): Promise<AuthorizerResponse> {
    return user.isSuperAdmin === true
  }

  async manageEntitlements(user: User): Promise<AuthorizerResponse> {
    return user.isSuperAdmin === true
  }
}
