import { Bouncer } from '@adonisjs/bouncer'
import type User from '#models/user'
import { RbacService } from '#services/rbac_service'

export const isSuperAdmin = Bouncer.ability((user: User) => {
  return user.isSuperAdmin === true
})

export const viewDashboard = Bouncer.ability((user: User) => {
  return !!user
})

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

export const manageOrders = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  const [canCreate, canUpdate] = await Promise.all([
    RbacService.hasPermission(user, 'orders.create', 'orders'),
    RbacService.hasPermission(user, 'orders.update', 'orders'),
  ])
  return canCreate || canUpdate
})

export const deleteOrders = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'orders.delete', 'orders')
})

export const manageCustomers = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  const [canCreate, canUpdate] = await Promise.all([
    RbacService.hasPermission(user, 'customers.create', 'customers'),
    RbacService.hasPermission(user, 'customers.update', 'customers'),
  ])
  return canCreate || canUpdate
})

export const manageCatalog = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  const [canCreate, canUpdate] = await Promise.all([
    RbacService.hasPermission(user, 'catalog.create', 'catalog'),
    RbacService.hasPermission(user, 'catalog.update', 'catalog'),
  ])
  return canCreate || canUpdate
})

export const manageSellerAccounts = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  const [canCreate, canUpdate] = await Promise.all([
    RbacService.hasPermission(user, 'integrations.create', 'integrations'),
    RbacService.hasPermission(user, 'integrations.update', 'integrations'),
  ])
  return canCreate || canUpdate
})

export const manageShipments = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  const [canCreate, canUpdate] = await Promise.all([
    RbacService.hasPermission(user, 'shipments.create', 'shipments'),
    RbacService.hasPermission(user, 'shipments.update', 'shipments'),
  ])
  return canCreate || canUpdate
})

export const manageReturns = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  const [canCreate, canUpdate] = await Promise.all([
    RbacService.hasPermission(user, 'returns.create', 'returns'),
    RbacService.hasPermission(user, 'returns.update', 'returns'),
  ])
  return canCreate || canUpdate
})

export const manageFinance = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  const [canCreate, canUpdate] = await Promise.all([
    RbacService.hasPermission(user, 'finance.create', 'finance'),
    RbacService.hasPermission(user, 'finance.update', 'finance'),
  ])
  return canCreate || canUpdate
})

export const manageTasks = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return !!user
})

export const bulkImport = Bouncer.ability(async (user: User) => {
  if (user.isSuperAdmin) return true
  return RbacService.hasPermission(user, 'orders.create', 'orders')
})

export const ownsOrder = Bouncer.ability((user: User, order: { userId: string }) => {
  if (user.isSuperAdmin) return true
  return order.userId === user.id
})

export const ownsProduct = Bouncer.ability((user: User, product: { userId: string }) => {
  if (user.isSuperAdmin) return true
  return product.userId === user.id
})

export const ownsShipment = Bouncer.ability((user: User, shipment: { userId: string }) => {
  if (user.isSuperAdmin) return true
  return shipment.userId === user.id
})

export const ownsFinancialAccount = Bouncer.ability((user: User, account: { userId: string }) => {
  if (user.isSuperAdmin) return true
  return account.userId === user.id
})
