/*
|--------------------------------------------------------------------------
| Bouncer abilities — thin wrappers over RbacService + isSuperAdmin
|--------------------------------------------------------------------------
| Every ability receives the authenticated user as its first argument.
| `user` is never null here because abilities are only evaluated inside
| `auth` middleware groups. Return `true` to allow, `false` to deny.
| For richer denials (status/message) wrap with AuthorizationResponse.
*/

import { Bouncer } from '@adonisjs/bouncer'
import type User from '#models/user'
import { RbacService } from '#services/rbac_service'

/** Super-admin bypass — used by most abilities via composition. */
export const isSuperAdmin = Bouncer.ability((user: User) => {
  return user.isSuperAdmin === true
})

/** Any authenticated user may view the dashboard. */
export const viewDashboard = Bouncer.ability((user: User) => {
  return !!user
})

/** User & RBAC provisioning — super-admin only. */
export const manageUsers = Bouncer.ability((user: User) => {
  return user.isSuperAdmin === true
})

export const manageRoles = Bouncer.ability((user: User) => {
  return user.isSuperAdmin === true
})

export const manageEntitlements = Bouncer.ability((user: User) => {
  return user.isSuperAdmin === true
})

export const viewAudit = Bouncer.ability((user: User) => {
  return !!user
})

/** Permission-gated abilities — superAdmin or explicit RBAC permission. */
export const manageOrders = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'orders.create', 'orders')
})

export const deleteOrders = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'orders.delete', 'orders')
})

export const manageCustomers = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'customers.manage', 'customers')
})

export const manageCatalog = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'catalog.manage', 'products')
})

export const manageSellerAccounts = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'seller_accounts.manage', 'seller-accounts')
})

export const manageShipments = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'shipments.manage', 'shipments')
})

export const manageReturns = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'returns.manage', 'returns')
})

export const manageFinance = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'finance.manage', 'finance')
})

export const manageTasks = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'tasks.manage', 'tasks')
})

export const bulkImport = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'orders.bulk_import', 'orders')
})

/**
 * Ownership check — resource bel belongs to the actor. Call with the resource
 * record that carries `userId`. SuperAdmin bypasses ownership.
 */
export const ownsOrder = Bouncer.ability(
  (user: User, order: { userId: string }) => {
    if (user.isSuperAdmin) return true
    return order.userId === user.id
  }
)

export const ownsProduct = Bouncer.ability(
  (user: User, product: { userId: string }) => {
    if (user.isSuperAdmin) return true
    return product.userId === user.id
  }
)

export const ownsShipment = Bouncer.ability(
  (user: User, shipment: { userId: string }) => {
    if (user.isSuperAdmin) return true
    return shipment.userId === user.id
  }
)

export const ownsFinancialAccount = Bouncer.ability(
  (user: User, account: { userId: string }) => {
    if (user.isSuperAdmin) return true
    return account.userId === user.id
  }
)
