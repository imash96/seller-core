import { test } from '@japa/runner'
import User from '../../app/models/user.js'
import { PermissionEffect, UserStatus } from '../../app/enums/index.js'

test.group('RBAC & Entitlements Engine', () => {
  interface RolePermission {
    roleSlug: string
    permissionSlug: string
    effect: (typeof PermissionEffect)[keyof typeof PermissionEffect]
  }

  function evaluatePermissions(params: {
    user: {
      status: string
      isSuperAdmin: boolean
    }
    roles: string[]
    rolePermissions: RolePermission[]
    enabledModules: string[]
    permissionToCheck: string
    requiredModuleKey?: string
  }): boolean {
    // 1. Inactive or suspended users have zero permissions
    if (params.user.status !== UserStatus.ACTIVE) {
      return false
    }

    const allowedSet = new Set<string>()
    const deniedSet = new Set<string>()

    for (const rp of params.rolePermissions) {
      if (params.roles.includes(rp.roleSlug)) {
        if (rp.effect === PermissionEffect.DENY) {
          deniedSet.add(rp.permissionSlug)
        } else if (rp.effect === PermissionEffect.ALLOW) {
          allowedSet.add(rp.permissionSlug)
        }
      }
    }

    // Explicit deny overrides allow (least privilege principle)
    for (const denied of deniedSet) {
      allowedSet.delete(denied)
    }

    // 2. Module entitlement is checked independently of role permissions
    if (params.requiredModuleKey && !params.user.isSuperAdmin) {
      if (!params.enabledModules.includes(params.requiredModuleKey)) {
        return false
      }
    }

    // 3. Explicit deny always wins, even for super admin or broad permissions
    if (deniedSet.has(params.permissionToCheck)) {
      return false
    }

    // 4. Super admin bypasses all role checks if not explicitly denied
    if (params.user.isSuperAdmin) {
      return true
    }

    // 5. Match resource wildcard (e.g. 'orders' grants 'orders.create') or exact permission
    const [resource] = params.permissionToCheck.split('.')
    if (allowedSet.has(params.permissionToCheck) || allowedSet.has(resource)) {
      return true
    }

    return false
  }

  test('active super administrator has universal wildcard access across all modules', ({
    assert,
  }) => {
    const user = { status: UserStatus.ACTIVE, isSuperAdmin: true }
    const canAccessOrders = evaluatePermissions({
      user,
      roles: [],
      rolePermissions: [],
      enabledModules: [],
      permissionToCheck: 'orders.delete',
      requiredModuleKey: 'orders',
    })
    assert.isTrue(canAccessOrders)

    const canAccessFinance = evaluatePermissions({
      user,
      roles: [],
      rolePermissions: [],
      enabledModules: [],
      permissionToCheck: 'finance.manage',
      requiredModuleKey: 'finance',
    })
    assert.isTrue(canAccessFinance)
  })

  test('inactive or suspended users are denied all permissions immediately', ({ assert }) => {
    const suspendedUser = { status: UserStatus.SUSPENDED, isSuperAdmin: false }
    const allowed = evaluatePermissions({
      user: suspendedUser,
      roles: ['admin'],
      rolePermissions: [{ roleSlug: 'admin', permissionSlug: 'orders.create', effect: 'allow' }],
      enabledModules: ['orders'],
      permissionToCheck: 'orders.create',
      requiredModuleKey: 'orders',
    })
    assert.isFalse(allowed)

    const lockedUser = { status: UserStatus.LOCKED, isSuperAdmin: true }
    const lockedAllowed = evaluatePermissions({
      user: lockedUser,
      roles: ['superadmin'],
      rolePermissions: [],
      enabledModules: ['orders'],
      permissionToCheck: 'orders.view',
    })
    assert.isFalse(lockedAllowed)
  })

  test('explicit DENY overrides ALLOW across multiple assigned roles (least privilege principle)', ({
    assert,
  }) => {
    const regularUser = { status: UserStatus.ACTIVE, isSuperAdmin: false }
    const rolePermissions: RolePermission[] = [
      { roleSlug: 'order_manager', permissionSlug: 'orders.delete', effect: 'allow' },
      { roleSlug: 'support_agent', permissionSlug: 'orders.delete', effect: 'deny' },
    ]

    // User assigned both roles: 'support_agent' has explicit DENY for 'orders.delete'
    const allowed = evaluatePermissions({
      user: regularUser,
      roles: ['order_manager', 'support_agent'],
      rolePermissions,
      enabledModules: ['orders'],
      permissionToCheck: 'orders.delete',
      requiredModuleKey: 'orders',
    })

    assert.isFalse(allowed, 'Explicit DENY must override ALLOW when roles collide')
  })

  test('resource-level permission grants all action-level permissions for that resource', ({
    assert,
  }) => {
    const regularUser = { status: UserStatus.ACTIVE, isSuperAdmin: false }
    const rolePermissions: RolePermission[] = [
      { roleSlug: 'catalog_admin', permissionSlug: 'catalog', effect: 'allow' },
    ]

    // User with resource 'catalog' can create, update, delete catalog items
    assert.isTrue(
      evaluatePermissions({
        user: regularUser,
        roles: ['catalog_admin'],
        rolePermissions,
        enabledModules: ['catalog'],
        permissionToCheck: 'catalog.create',
        requiredModuleKey: 'catalog',
      })
    )

    assert.isTrue(
      evaluatePermissions({
        user: regularUser,
        roles: ['catalog_admin'],
        rolePermissions,
        enabledModules: ['catalog'],
        permissionToCheck: 'catalog.update',
        requiredModuleKey: 'catalog',
      })
    )

    // But cannot access unrelated resources like 'finance'
    assert.isFalse(
      evaluatePermissions({
        user: regularUser,
        roles: ['catalog_admin'],
        rolePermissions,
        enabledModules: ['catalog'],
        permissionToCheck: 'finance.view',
        requiredModuleKey: 'finance',
      })
    )
  })

  test('module entitlement operates independently and gates access even with role permissions', ({
    assert,
  }) => {
    const regularUser = { status: UserStatus.ACTIVE, isSuperAdmin: false }
    const rolePermissions: RolePermission[] = [
      { roleSlug: 'finance_analyst', permissionSlug: 'finance.view', effect: 'allow' },
    ]

    // User has permission 'finance.view' but organization does NOT have 'finance' module enabled
    const withoutModule = evaluatePermissions({
      user: regularUser,
      roles: ['finance_analyst'],
      rolePermissions,
      enabledModules: ['orders', 'catalog'],
      permissionToCheck: 'finance.view',
      requiredModuleKey: 'finance',
    })
    assert.isFalse(withoutModule, 'Permission must be denied when module is not entitled')

    // When module is enabled, permission is granted
    const withModule = evaluatePermissions({
      user: regularUser,
      roles: ['finance_analyst'],
      rolePermissions,
      enabledModules: ['orders', 'catalog', 'finance'],
      permissionToCheck: 'finance.view',
      requiredModuleKey: 'finance',
    })
    assert.isTrue(withModule, 'Permission must be granted when module is entitled')
  })

  test('super administrator cannot suspend their own account', ({ assert }) => {
    function validateSuspendUser(actor: User, targetUserId: string) {
      if (!actor.isSuperAdmin) {
        throw new Error('FORBIDDEN: Only a super administrator can suspend user accounts.')
      }
      if (actor.id === targetUserId) {
        throw new Error('INVALID_OPERATION: Super administrator cannot suspend their own account.')
      }
      return true
    }

    const superAdmin = new User()
    superAdmin.id = 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6A'
    superAdmin.isSuperAdmin = true

    // Suspending self must throw INVALID_OPERATION
    assert.throws(
      () => validateSuspendUser(superAdmin, superAdmin.id),
      /INVALID_OPERATION: Super administrator cannot suspend their own account/
    )

    // Non-super-admin attempting to suspend must throw FORBIDDEN
    const standardUser = new User()
    standardUser.id = 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B'
    standardUser.isSuperAdmin = false

    assert.throws(
      () => validateSuspendUser(standardUser, 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6C'),
      /FORBIDDEN: Only a super administrator can suspend user accounts/
    )

    // Super admin suspending another user succeeds
    assert.isTrue(validateSuspendUser(superAdmin, 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6C'))
  })
})
