import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import TasksReminder from '#models/tasks_reminder'
import SavedView from '#models/saved_view'
import SyncJob from '#models/sync_job'
import AuditLog from '#models/audit_log'
import SellerAccountsController from './seller_accounts_controller.js'
import { RbacService } from '../services/rbac_service.js'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createTaskValidator, updateTaskValidator } from '#validators/operations'
import { TaskStatus, TaskType, TaskPriority } from '../enums/index.js'

const SAVED_VIEW_RESOURCES: Record<string, string> = {
  orders: 'orders',
  shipments: 'shipments',
  returns: 'returns',
  customers: 'customers',
  products: 'catalog',
  seller_accounts: 'integrations',
  finance: 'finance',
  tasks: 'tasks',
  claims: 'orders',
  import: 'orders',
}

export default class ToolsController {
  async tasksPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [tasks, savedViews] = await Promise.all([
      TasksReminder.query().where('userId', user.id).orderBy('dueAt', 'asc').limit(100),
      WorkspaceLookupService.savedViewsFor(user.id, 'tasks'),
    ])
    return inertia.render('tasks', {
      tasksReminders: tasks.map((t) => t.serialize()),
      savedViews,
    })
  }

  async storeTask({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createTaskValidator)

    await TasksReminder.create({
      userId: user.id,
      taskType: payload.taskType ?? TaskType.GENERAL,
      priority: payload.priority ?? TaskPriority.MEDIUM,
      status: (request.input('status') as any) || TaskStatus.PENDING,
      title: payload.title,
      description: payload.description || null,
      dueAt: payload.dueAt ? DateTime.fromISO(payload.dueAt) : DateTime.now().plus({ days: 3 }),
    })

    session.flash('success', `Task "${payload.title}" added.`)
    return response.redirect().back()
  }

  async updateTask({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const payload = await request.validateUsing(updateTaskValidator)
      const task = await TasksReminder.query()
        .where('id', params.id)
        .andWhere('userId', user.id)
        .firstOrFail()
      if (payload.title !== undefined) task.title = payload.title
      if (payload.description !== undefined) task.description = payload.description
      if (payload.taskType !== undefined) task.taskType = payload.taskType
      if (payload.priority !== undefined) task.priority = payload.priority
      if (payload.status !== undefined) {
        task.status = payload.status
        if (payload.status === 'completed') task.completedAt = DateTime.now()
      }
      if (payload.dueAt !== undefined) task.dueAt = DateTime.fromISO(payload.dueAt)
      await task.save()
      session.flash('success', 'Task updated.')
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to update task.')
    }
    return response.redirect().back()
  }

  async updateTaskStatus(ctx: HttpContext) {
    return this.updateTask(ctx)
  }

  async completeTask({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const task = await TasksReminder.query()
        .where('userId', user.id)
        .andWhere('id', params.id)
        .firstOrFail()

      task.status = TaskStatus.COMPLETED
      task.completedAt = DateTime.now()
      await task.save()

      session.flash('success', `Task "${task.title}" marked completed.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to complete task.')
    }
    return response.redirect().back()
  }

  async deleteTask({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const task = await TasksReminder.query()
        .where('id', params.id)
        .andWhere('userId', user.id)
        .firstOrFail()
      await task.delete()
      session.flash('success', 'Task deleted.')
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to delete task.')
    }
    return response.redirect().back()
  }

  async storeSavedView({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    const moduleKey = String(request.input('moduleKey', 'orders')).trim()
    const resource = SAVED_VIEW_RESOURCES[moduleKey]
    if (!resource || !(await RbacService.hasPermission(user, `${resource}.read`, resource)))
      return response.forbidden({ error: 'Access to this saved view module is required.' })
    if (!name) {
      session.flash('error', 'View name is required.')
      return response.redirect().back()
    }

    try {
      await SavedView.updateOrCreate(
        { userId: user.id, moduleKey, name },
        {
          userId: user.id,
          moduleKey,
          name,
          isDefault: request.input('isDefault') === 'true' || request.input('isDefault') === true,
          filters: { status: request.input('filterStatus', 'all') },
          sortConfig: { field: 'created_at', direction: 'desc' },
          columnsConfig: ['order_number', 'status', 'total_amount', 'net_profit_amount'],
        }
      )

      session.flash('success', `Saved View "${name}" created for module ${moduleKey}.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to save view.')
    }
    return response.redirect().back()
  }

  async deleteSavedView({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const view = await SavedView.query()
        .where('userId', user.id)
        .andWhere('id', params.id)
        .firstOrFail()
      const resource = SAVED_VIEW_RESOURCES[view.moduleKey]
      if (!resource || !(await RbacService.hasPermission(user, `${resource}.read`, resource)))
        return response.forbidden({ error: 'Access to this saved view module is required.' })
      await view.delete()
      session.flash('success', `Saved view "${view.name}" removed.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to delete saved view.')
    }
    return response.redirect().back()
  }

  async importPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const canReadIntegrations = await RbacService.hasPermission(
      user,
      'integrations.read',
      'integrations'
    )
    const [jobs, effectiveRbac, savedViews, sharedLookups] = await Promise.all([
      canReadIntegrations
        ? SyncJob.query()
            .where('userId', user.id)
            .preload('errors', (q) => q.where('userId', user.id))
            .orderBy('createdAt', 'desc')
            .limit(30)
        : [],
      RbacService.getEffectivePermissions(user),
      WorkspaceLookupService.savedViewsFor(user.id, 'import'),
      WorkspaceLookupService.lookups(user),
    ])
    return inertia.render('import', {
      ...sharedLookups,
      syncJobs: jobs.map((j) => j.serialize()),
      effectiveRbac,
      savedViews,
    })
  }

  async uploadCatalogFile({ auth, response, session }: HttpContext) {
    auth.getUserOrFail()
    session.flash(
      'error',
      'This upload does not process files. Use the catalog studio JSON import instead.'
    )
    return response.redirect().back()
  }

  async uploadCatalogImport(ctx: HttpContext) {
    return this.uploadCatalogFile(ctx)
  }

  async triggerAccountSync(ctx: HttpContext) {
    return new SellerAccountsController().queueSellerSync(ctx)
  }

  async auditPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const logs = await AuditLog.query()
      .where((q) => q.where('userId', user.id).orWhere('actorUserId', user.id))
      .preload('user', (q) => q.if(!user.isSuperAdmin, (r) => r.where('id', user.id)))
      .preload('actor', (q) => q.if(!user.isSuperAdmin, (r) => r.where('id', user.id)))
      .orderBy('createdAt', 'desc')
      .limit(150)
    return inertia.render('audit', {
      auditLogs: logs.map((l) => l.serializeForViewer(user.isSuperAdmin)),
    })
  }
}
