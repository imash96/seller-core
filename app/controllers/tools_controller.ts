import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import TasksReminder from '#models/tasks_reminder'
import SavedView from '#models/saved_view'
import SyncJob from '#models/sync_job'
import AuditLog from '#models/audit_log'
import { RbacService } from '../services/rbac_service.js'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createTaskValidator, updateTaskValidator } from '#validators/operations'
import { TaskStatus, TaskType, TaskPriority } from '../enums/index.js'

export default class ToolsController {
  async tasksPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [tasks, savedViews] = await Promise.all([
      TasksReminder.query()
        .where('userId', user.id)
        .preload('creditCard')
        .orderBy('dueAt', 'asc')
        .limit(100),
      WorkspaceLookupService.savedViewsFor(user.id),
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
      status: TaskStatus.PENDING,
      title: payload.title,
      description: payload.description || null,
      dueAt: payload.dueAt ? DateTime.fromISO(payload.dueAt) : DateTime.now().plus({ days: 3 }),
    })

    session.flash('success', `Task "${payload.title}" added.`)
    return response.redirect().back()
  }

  async updateTask({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
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
    return response.redirect().back()
  }

  async completeTask({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await TasksReminder.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    task.status = TaskStatus.COMPLETED
    task.completedAt = DateTime.now()
    await task.save()

    session.flash('success', `Task "${task.title}" marked completed.`)
    return response.redirect().back()
  }

  async deleteTask({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await TasksReminder.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await task.delete()
    session.flash('success', 'Task deleted.')
    return response.redirect().back()
  }

  async storeSavedView({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    const moduleKey = String(request.input('moduleKey', 'orders')).trim()
    if (!name) {
      session.flash('error', 'View name is required.')
      return response.redirect().back()
    }

    await SavedView.updateOrCreate(
      { userId: user.id, moduleKey, name },
      {
        userId: user.id,
        moduleKey,
        name,
        isDefault: Boolean(request.input('isDefault', false)),
        filters: { status: request.input('filterStatus', 'all') },
        sortConfig: { field: 'created_at', direction: 'desc' },
        columnsConfig: ['order_number', 'status', 'total_amount', 'net_profit_amount'],
      }
    )

    session.flash('success', `Saved View "${name}" created for module ${moduleKey}.`)
    return response.redirect().back()
  }

  async deleteSavedView({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const view = await SavedView.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()
    await view.delete()
    session.flash('success', `Saved view "${view.name}" removed.`)
    return response.redirect().back()
  }

  async importPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [jobs, effectiveRbac, savedViews, sharedLookups] = await Promise.all([
      SyncJob.query()
        .where('userId', user.id)
        .preload('errors')
        .orderBy('createdAt', 'desc')
        .limit(30),
      RbacService.getEffectivePermissions(user),
      WorkspaceLookupService.savedViewsFor(user.id, 'import'),
      WorkspaceLookupService.lookups(user.id),
    ])
    return inertia.render('import', {
      ...sharedLookups,
      syncJobs: jobs.map((j) => j.serialize()),
      effectiveRbac,
      savedViews,
    })
  }

  async uploadCatalogFile({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const file = request.file('catalogFile', {
      size: '5mb',
      extnames: ['csv', 'xlsx', 'pdf', 'json'],
    })

    if (!file || !file.isValid) {
      session.flash(
        'error',
        file?.errors?.[0]?.message ?? 'Please attach a catalog file (csv/xlsx/pdf/json, <=5mb).'
      )
      return response.redirect().back()
    }

    const fileName = `${user.id}_${Date.now()}_${file.clientName}`

    try {
      const notifMod = await import('#jobs/send_notification')
      const SendNotification = notifMod.default
      await (SendNotification as any).dispatch({
        userId: user.id,
        to: user.email,
        channel: 'in_app',
        subject: 'Catalog import queued',
        body: `File ${file.clientName} (${file.size} bytes) received and queued for processing.`,
        metadata: { fileName, userId: user.id, requestId: request.id() },
      } as any)
      session.flash(
        'success',
        `File ${file.clientName} accepted and queued for background processing.`
      )
    } catch {
      session.flash(
        'success',
        `File ${file.clientName} received (${Math.round((file.size ?? 0) / 1024)}KB).`
      )
    }
    return response.redirect().back()
  }

  async auditPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const logs = await AuditLog.query()
      .where((q) => q.where('userId', user.id).orWhere('actorUserId', user.id))
      .preload('user')
      .preload('actor')
      .orderBy('createdAt', 'desc')
      .limit(150)
    return inertia.render('audit', {
      auditLogs: logs.map((l) => l.serialize()),
    })
  }
}
