import User from '#models/user'
import Role from '#models/role'
import ModuleEntitlement from '#models/module_entitlement'
import { SessionRegistryService } from './session_registry_service.js'
import { AuditContext } from './audit_context.js'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { PermissionEffect, UserStatus } from '../enums/index.js'
import { generateEntityId } from '../utils/generate_entity_id.js'

export interface EffectivePermissionsResult {
  isSuperAdmin: boolean
  roles: string[]
  allowedPermissions: string[]
  deniedPermissions: string[]
  enabledModules: string[]
}

export class RbacService {
  /**
   * Resolves a user's effective permissions across all active roles.
   * Implements explicit deny-override precedence: if ANY assigned role has `effect = 'deny'`
   * for a permission, that permission is denied even if another role grants `allow`.
   */
  static async getEffectivePermissions(user: User): Promise<EffectivePermissionsResult> {
    const userRolesRows = await db
      .from('user_roles')
      .join('roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', user.id)
      .andWhere((q) => {
        q.whereNull('user_roles.expires_at').orWhere('user_roles.expires_at', '>', new Date())
      })
      .select('roles.id as role_id', 'roles.slug as role_slug')

    const roleIds = userRolesRows.map((r) => r.role_id)
    const roleSlugs = userRolesRows.map((r) => r.role_slug)

    const allowedSet = new Set<string>()
    const deniedSet = new Set<string>()

    if (roleIds.length > 0) {
      const rpRows = await db
        .from('role_permissions')
        .join('permissions', 'permissions.id', 'role_permissions.permission_id')
        .whereIn('role_permissions.role_id', roleIds)
        .select('permissions.slug as permission_slug', 'role_permissions.effect')

      for (const row of rpRows) {
        if (row.effect === PermissionEffect.DENY) {
          deniedSet.add(row.permission_slug)
        } else if (row.effect === PermissionEffect.ALLOW) {
          allowedSet.add(row.permission_slug)
        }
      }
    }

    // Explicit deny overrides allow
    for (const denied of deniedSet) {
      allowedSet.delete(denied)
    }

    // Module entitlements are evaluated independently from RBAC permissions
    const entitlements = await ModuleEntitlement.query()
      .where('userId', user.id)
      .andWhere('isEnabled', true)
      .andWhere((q) => {
        q.whereNull('expiresAt').orWhere('expiresAt', '>', DateTime.now().toSQL()!)
      })

    const enabledModules = entitlements.map((e) => e.moduleKey)

    return {
      isSuperAdmin: Boolean(user.isSuperAdmin),
      roles: roleSlugs,
      allowedPermissions: Array.from(allowedSet),
      deniedPermissions: Array.from(deniedSet),
      enabledModules,
    }
  }

  /**
   * Checks whether a user has a specific permission (e.g. 'orders.create')
   * and optionally checks module entitlement independently.
   */
  static async hasPermission(
    user: User,
    permissionSlug: string,
    requiredModuleKey?: string
  ): Promise<boolean> {
    const effective = await this.getEffectivePermissions(user)
    return this.allows(user, effective, permissionSlug, requiredModuleKey)
  }

  /** Evaluate an already-resolved permission set without repeating database queries. */
  static allows(
    user: User,
    effective: EffectivePermissionsResult,
    permissionSlug: string,
    requiredModuleKey?: string
  ): boolean {
    if (user.status !== UserStatus.ACTIVE) return false
    if (
      requiredModuleKey &&
      !user.isSuperAdmin &&
      !effective.enabledModules.includes(requiredModuleKey)
    )
      return false
    const [resource] = permissionSlug.split('.')
    if (
      effective.deniedPermissions.includes(permissionSlug) ||
      effective.deniedPermissions.includes(resource)
    )
      return false
    if (user.isSuperAdmin) return true
    return (
      effective.allowedPermissions.includes(permissionSlug) ||
      effective.allowedPermissions.includes(resource)
    )
  }

  /**
   * Provisions a new user account.
   * Enforces the mandatory rule: No public registration; only a system super administrator can create users.
   */
  static async createUserBySuperAdmin(
    actor: User,
    input: {
      email: string
      fullName: string
      password: string
      phone?: string | null
      defaultCurrency?: string
      timezone?: string
      status?: string
      isSuperAdmin?: boolean
      roleSlugs?: string[]
      enabledModules?: string[]
    },
    context?: { requestId?: string; ipAddress?: string; userAgent?: string; correlationId?: string }
  ): Promise<User> {
    if (!actor.isSuperAdmin || actor.status !== UserStatus.ACTIVE) {
      throw new Error('FORBIDDEN: Only an active system super administrator can create users.')
    }

    return await AuditContext.transaction(async (trx) => {
      // Row-level audit rows (users, user_roles, module_entitlements) are written by
      // the audit trigger; the context only says who did it and why.
      await AuditContext.apply(trx, {
        actorUserId: actor.id,
        requestId: context?.requestId ?? null,
        correlationId: context?.correlationId ?? null,
        ipAddress: context?.ipAddress ?? null,
        userAgent: context?.userAgent ?? null,
        reason: 'user.created',
      })
      const newUser = new User()
      newUser.useTransaction(trx)
      newUser.email = input.email.trim().toLowerCase()
      newUser.fullName = input.fullName.trim()
      newUser.password = input.password
      newUser.phone = input.phone ?? null
      newUser.defaultCurrency = (input.defaultCurrency || 'USD').toUpperCase()
      newUser.timezone = input.timezone || 'UTC'
      newUser.status = input.status || UserStatus.ACTIVE
      newUser.isSuperAdmin = Boolean(input.isSuperAdmin)
      newUser.createdByUserId = actor.id
      newUser.preferences = {}
      await newUser.save()

      if (input.roleSlugs && input.roleSlugs.length > 0) {
        const roles = await Role.query({ client: trx }).whereIn('slug', input.roleSlugs)
        for (const role of roles) {
          await trx.table('user_roles').insert({
            id: generateEntityId('urol'),
            user_id: newUser.id,
            role_id: role.id,
            assigned_by_user_id: actor.id,
            created_at: new Date(),
          })
        }
      }

      const modulesToEnable = input.enabledModules ?? [
        'orders',
        'customers',
        'catalog',
        'integrations',
        'shipments',
        'returns',
        'finance',
        'credit_cards',
        'analytics',
        'tasks',
      ]

      for (const moduleKey of modulesToEnable) {
        await trx.table('module_entitlements').insert({
          id: generateEntityId('ment'),
          user_id: newUser.id,
          module_key: moduleKey,
          is_enabled: true,
          plan_tier: 'enterprise',
          limits: JSON.stringify({}),
          updated_by_user_id: actor.id,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }

      return newUser
    })
  }

  /**
   * Suspends a user account and immediately revokes all active sessions.
   */
  static async suspendUser(
    actor: User,
    targetUserId: string,
    reason: string,
    context?: { requestId?: string; ipAddress?: string; correlationId?: string }
  ): Promise<User> {
    if (!actor.isSuperAdmin) {
      throw new Error('FORBIDDEN: Only a super administrator can suspend user accounts.')
    }
    if (actor.id === targetUserId) {
      throw new Error('INVALID_OPERATION: Super administrator cannot suspend their own account.')
    }

    return await AuditContext.transaction(async (trx) => {
      await AuditContext.apply(trx, {
        actorUserId: actor.id,
        requestId: context?.requestId ?? null,
        correlationId: context?.correlationId ?? null,
        ipAddress: context?.ipAddress ?? null,
        reason: `user.suspended: ${reason}`.slice(0, 200),
      })
      const target = await User.query({ client: trx }).where('id', targetUserId).firstOrFail()
      target.status = UserStatus.SUSPENDED
      await target.save()

      // Suspension kills every live session of the user in one statement.
      await SessionRegistryService.revokeAllForUser(target.id, trx)

      return target
    })
  }
}
