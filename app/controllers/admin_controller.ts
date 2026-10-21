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
import { UserStatus } from '../enums/index.js'

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

  async toggleUserStatus({ auth, bouncer, params, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    await bouncer.authorize('manageUsers')
    if (!actor.isSuperAdmin) {
      session.flash('error', 'Forbidden: Only Super Administrators can change user account status.')
      return response.redirect().back()
    }

    const targetStatus = request.input('status', UserStatus.SUSPENDED)
    try {
      if (targetStatus === UserStatus.SUSPENDED) {
        await RbacService.suspendUser(actor, params.id, 'Suspended via Admin Console', {
          requestId: request.id(),
          ipAddress: request.ip(),
        })
        session.flash('success', 'User suspended and all active sessions revoked.')
      } else {
        const target = await User.findOrFail(params.id)
        const prev = target.status
        target.status = targetStatus
        target.failedLoginAttempts = 0
        target.lockedUntil = null
        await target.save()

        await RbacService.recordAudit({
          actorUserId: actor.id,
          userId: target.id,
          action: 'user.status_changed',
          entityType: 'users',
          entityId: target.id,
          requestId: request.id(),
          beforeState: { status: prev },
          afterState: { status: targetStatus },
        })
        session.flash('success', `User ${target.email} status updated to ${targetStatus}.`)
      }
    } catch (err: any) {
      session.flash('error', err.message)
    }
    return response.redirect().back()
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
    const [orderCount, txCount] = await Promise.all([
      Order.query().where('userId', target.id).count('* as total'),
      FinancialTransaction.query().where('userId', target.id).count('* as total'),
    ])
    const hasOrders = Number((orderCount[0] as any).$extras.total) > 0
    const hasTx = Number((txCount[0] as any).$extras.total) > 0
    if (hasOrders || hasTx) {
      target.status = UserStatus.SUSPENDED
      await target.save()
      await RbacService.recordAudit({
        actorUserId: actor.id,
        userId: target.id,
        action: 'user.suspended_instead_of_delete',
        entityType: 'users',
        entityId: target.id,
        requestId: request.id(),
        beforeState: { hasOrders, hasTx },
        afterState: { status: UserStatus.SUSPENDED },
      })
      session.flash(
        'success',
        `User "${target.email}" owns orders/transactions and was suspended instead of deleted to preserve data integrity.`
      )
      return response.redirect().back()
    }
    await target.delete()
    await RbacService.recordAudit({
      actorUserId: actor.id,
      userId: target.id,
      action: 'user.deleted',
      entityType: 'users',
      entityId: params.id,
      requestId: request.id(),
      beforeState: { email: target.email },
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

    const existing = await UserRole.query()
      .where('userId', target.id)
      .andWhere('roleId', role.id)
      .first()

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

    await RbacService.recordAudit({
      actorUserId: actor.id,
      userId: target.id,
      action: existing ? 'rbac.role_revoked' : 'rbac.role_assigned',
      entityType: 'user_roles',
      entityId: target.id,
      requestId: request.id(),
      afterState: { roleSlug: role.slug },
    })

    return response.redirect().back()
  }

  async toggleModuleEntitlement({ auth, bouncer, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    if (!user.isSuperAdmin && (await bouncer.denies('manageEntitlements'))) {
      session.flash('error', 'Bouncer: not authorized to manage entitlements.')
      return response.redirect().back()
    }
    const entitlement = await ModuleEntitlement.query()
      .where('id', params.id)
      .andWhere((q) => {
        if (!user.isSuperAdmin) {
          q.where('userId', user.id)
        }
      })
      .firstOrFail()

    entitlement.isEnabled = !entitlement.isEnabled
    entitlement.updatedByUserId = user.id
    await entitlement.save()

    session.flash(
      'success',
      `Module "${entitlement.moduleKey}" is now ${entitlement.isEnabled ? 'ENABLED' : 'DISABLED'}.`
    )
    return response.redirect().back()
  }
}
