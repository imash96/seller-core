import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import UserRole from '#models/user_role'
import ModuleEntitlement from '#models/module_entitlement'
import Order from '#models/order'
import FinancialTransaction from '#models/financial_transaction'
import { RbacService } from '../services/rbac_service.js'
import { createUserValidator } from '#validators/user'
import { UserStatus, ModuleKeys } from '../enums/index.js'
import db from '@adonisjs/lucid/services/db'
import { AuditContext } from '#services/audit_context'
import Organization from '#models/organization'

export default class AdminController {
  async index({ auth, inertia, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    if (!actor.isSuperAdmin) {
      return response.redirect('/dashboard')
    }
    const [users, roles, permissions, entitlements] = await Promise.all([
      User.query().preload('roles').orderBy('createdAt', 'desc'),
      Role.query().preload('permissions').orderBy('name'),
      Permission.query().orderBy('slug'),
      ModuleEntitlement.query().orderBy('moduleKey'),
    ])
    return inertia.render('admin', {
      allUsers: users.map((u) => u.serialize()),
      allRoles: roles.map((r) => r.serialize()),
      allPermissions: permissions.map((p) => p.serialize()),
      moduleEntitlements: entitlements.map((e) => e.serialize()),
    })
  }

  async storeUser({ auth, bouncer, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    await bouncer.with('UserPolicy').authorize('create')
    const payload = await request.validateUsing(createUserValidator)

    try {
      const roleSlugs =
        (payload as any).roleSlugs ??
        ((payload as any).roleSlug ? [(payload as any).roleSlug] : ['operations_manager'])
      const created = await RbacService.createUserBySuperAdmin(
        actor,
        {
          email: payload.email,
          fullName: payload.fullName,
          password: payload.password,
          phone: payload.phone ?? null,
          defaultCurrency: payload.defaultCurrency || 'USD',
          timezone: payload.timezone || 'UTC',
          isSuperAdmin: payload.isSuperAdmin ?? false,
          roleSlugs,
          enabledModules: payload.enabledModules,
        },
        {
          requestId: request.id(),
          ipAddress: request.ip(),
          userAgent: request.header('user-agent') ?? undefined,
        }
      )
      session.flash('success', `User ${created.email} provisioned by Super Administrator.`)
    } catch (err: any) {
      session.flash(
        'error',
        err.message || 'Forbidden: Only Super Administrators can create users.'
      )
    }
    return response.redirect().back()
  }

  async toggleUserStatus(ctx: HttpContext) {
    const { auth, bouncer, params, request, response, session } = ctx
    const actor = auth.getUserOrFail()
    await bouncer.authorize('manageUsers')
    if (!actor.isSuperAdmin) {
      session.flash('error', 'Forbidden: Only Super Administrators can change user account status.')
      return response.redirect().back()
    }

    const targetStatus = request.input('status', UserStatus.SUSPENDED)
    if (!Object.values(UserStatus).includes(targetStatus))
      return response.badRequest({ error: 'Invalid user status.' })
    try {
      if (targetStatus === UserStatus.SUSPENDED) {
        await RbacService.suspendUser(actor, params.id, 'Suspended via Admin Console', {
          requestId: request.id(),
          ipAddress: request.ip(),
        })
        session.flash('success', 'User suspended and all active sessions revoked.')
      } else {
        const target = await db.transaction(async (trx) => {
          await AuditContext.apply(trx, {
            actorUserId: actor.id,
            requestId: request.id(),
            ipAddress: request.ip(),
            reason: 'user.status_changed',
          })
          const user = await User.query({ client: trx }).where('id', params.id).firstOrFail()
          user.status = targetStatus
          user.failedLoginAttempts = 0
          user.lockedUntil = null
          await user.save()
          return user
        })
        session.flash('success', `User ${target.email} status updated to ${targetStatus}.`)
      }
    } catch (err: any) {
      session.flash('error', err.message)
    }
    return response.redirect().back()
  }

  async updateUser(ctx: HttpContext) {
    return this.toggleUserStatus(ctx)
  }

  async deleteUser({ auth, bouncer, params, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    await bouncer.authorize('manageUsers')
    if (!actor.isSuperAdmin) {
      session.flash('error', 'Forbidden: Only Super Administrators can delete users.')
      return response.redirect().back()
    }
    if (params.id === actor.id) {
      session.flash('error', 'You cannot delete your own account. Deactivate it instead.')
      return response.redirect().back()
    }
    const target = await User.findOrFail(params.id)
    const sharedOwner = await Organization.query()
      .where('ownerUserId', target.id)
      .where('isPersonal', false)
      .first()
    const otherMembers = await db
      .from('organizations as o')
      .join('organization_memberships as m', 'm.organization_id', 'o.id')
      .where('o.owner_user_id', target.id)
      .whereNot('m.user_id', target.id)
      .first()
    if (sharedOwner || otherMembers) {
      session.flash(
        'error',
        'Transfer or remove company workspaces before deleting their owner. Owner transfer is not yet supported.'
      )
      return response.redirect().back()
    }
    const [orderCount, txCount] = await Promise.all([
      Order.query().where('userId', target.id).count('* as total'),
      FinancialTransaction.query().where('userId', target.id).count('* as total'),
    ])
    const hasOrders = Number((orderCount[0] as any).$extras.total) > 0
    const hasTx = Number((txCount[0] as any).$extras.total) > 0
    if (hasOrders || hasTx) {
      await db.transaction(async (trx) => {
        await AuditContext.apply(trx, {
          actorUserId: actor.id,
          requestId: request.id(),
          ipAddress: request.ip(),
          reason: 'user.suspended_instead_of_delete',
        })
        const user = await User.query({ client: trx }).where('id', target.id).firstOrFail()
        user.status = UserStatus.SUSPENDED
        await user.save()
      })
      session.flash(
        'success',
        `User "${target.email}" owns orders/transactions and was suspended instead of deleted to preserve data integrity.`
      )
      return response.redirect().back()
    }
    await db.transaction(async (trx) => {
      await AuditContext.apply(trx, {
        actorUserId: actor.id,
        requestId: request.id(),
        ipAddress: request.ip(),
        reason: 'user.deleted',
      })
      await trx.from('users').where('id', target.id).delete()
    })
    session.flash('success', `User "${target.email}" deleted.`)
    return response.redirect().back()
  }

  async assignUserRole({ auth, bouncer, params, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    await bouncer.authorize('manageRoles')
    if (!actor.isSuperAdmin) {
      session.flash('error', 'Forbidden: Only Super Administrators can modify user roles.')
      return response.redirect().back()
    }

    const target = await User.findOrFail(params.id)
    const roleSlug = String(request.input('roleSlug', '')).trim()
    const role = await Role.findByOrFail('slug', roleSlug)

    await db.transaction(async (trx) => {
      const existing = await UserRole.query({ client: trx })
        .where('userId', target.id)
        .andWhere('roleId', role.id)
        .first()

      await AuditContext.apply(trx, {
        actorUserId: actor.id,
        requestId: request.id(),
        ipAddress: request.ip(),
        reason: existing ? 'rbac.role_revoked' : 'rbac.role_assigned',
      })

      if (existing) {
        await existing.delete()
        session.flash('success', `Removed role "${role.slug}" from ${target.email}.`)
      } else {
        await UserRole.create({
          userId: target.id,
          roleId: role.id,
          assignedByUserId: actor.id,
        })
        session.flash('success', `Assigned role "${role.slug}" to ${target.email}.`)
      }
    })

    return response.redirect().back()
  }

  async toggleModuleEntitlement({
    auth,
    bouncer,
    params,
    response,
    session,
    request,
  }: HttpContext) {
    const actor = auth.getUserOrFail()
    await bouncer.authorize('manageEntitlements')
    const entitlement = await db.transaction(async (trx) => {
      await AuditContext.apply(trx, {
        actorUserId: actor.id,
        requestId: request.id(),
        ipAddress: request.ip(),
        userAgent: request.header('user-agent') ?? null,
        reason: `rbac.entitlement_changed`,
      })
      const record = await ModuleEntitlement.query({ client: trx })
        .where('id', params.id)
        .forUpdate()
        .firstOrFail()
      record.isEnabled = !record.isEnabled
      record.updatedByUserId = actor.id
      await record.save()
      return record
    })
    session.flash(
      'success',
      `Module "${entitlement.moduleKey}" is now ${entitlement.isEnabled ? 'ENABLED' : 'DISABLED'}.`
    )
    return response.redirect().back()
  }

  async setModuleAccess({ auth, bouncer, params, request, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    await bouncer.authorize('manageEntitlements')
    const moduleKey = String(request.input('moduleKey', ''))
    const isEnabled = request.input('isEnabled')
    if (
      !ModuleKeys.includes(moduleKey as (typeof ModuleKeys)[number]) ||
      typeof isEnabled !== 'boolean'
    )
      return response.badRequest({ error: 'Provide a valid moduleKey and boolean isEnabled.' })
    await db.transaction(async (trx) => {
      await AuditContext.apply(trx, {
        actorUserId: actor.id,
        requestId: request.id(),
        ipAddress: request.ip(),
        userAgent: request.header('user-agent') ?? null,
        reason: 'rbac.entitlement_changed',
      })
      // Lock the parent even when no entitlement row exists yet.
      await User.query({ client: trx }).where('id', params.id).forUpdate().firstOrFail()
      const existing = await ModuleEntitlement.query({ client: trx })
        .where('userId', params.id)
        .where('moduleKey', moduleKey)
        .forUpdate()
        .first()
      const record = existing ?? new ModuleEntitlement()
      record.useTransaction(trx)
      record.userId = params.id
      record.moduleKey = moduleKey
      record.isEnabled = isEnabled
      record.planTier = record.planTier || 'enterprise'
      record.updatedByUserId = actor.id
      await record.save()
    })
    return response.ok({ message: `Module ${moduleKey} ${isEnabled ? 'enabled' : 'disabled'}.` })
  }
}
