import { Stack } from '@astryxdesign/core/Stack'
import {
  PageHeader,
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  TopStatusBar,
  AppButton,
  col,
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import {
  ListChecks,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Plus,
  Edit3,
  Trash2,
} from 'lucide-react'

type Props = { tasksReminders: Row[]; savedViews?: Row[] }

const TASK_TYPES = [
  'credit_card_due',
  'confirm_shipment',
  'message_reply',
  'invoice_due',
  'return_review',
  'fraud_review',
  'restock_alert',
  'claim_deadline',
  'general',
]
const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const STATUSES = ['pending', 'in_progress', 'completed', 'snoozed', 'dismissed']

export default function Tasks({ tasksReminders, savedViews }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [createViewOpen, setCreateViewOpen] = useState(false)

  const stats = useMemo(() => {
    const activeCount = tasksReminders.filter(
      (t) => t.status === 'pending' || t.status === 'in_progress'
    ).length
    const urgentCount = tasksReminders.filter(
      (t) =>
        (t.priority === 'urgent' || t.priority === 'high') &&
        t.status !== 'completed' &&
        t.status !== 'dismissed'
    ).length
    const completedCount = tasksReminders.filter((t) => t.status === 'completed').length
    return { activeCount, urgentCount, completedCount }
  }, [tasksReminders])

  return (
    <Stack gap={6}>
      <PageHeader
        title="Tasks, Reminders & Saved Views"
        description="Operational SLA reminders, credit card payment alerts, and saved filter views across modules."
        icon={ListChecks}
        badge={`${tasksReminders.length} tasks · ${stats.activeCount} active`}
        actions={
          <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
            <AppButton
              variant="secondary"
              size="sm"
              icon={Bookmark}
              onClick={() => setCreateViewOpen(true)}
            >
              Save Filter View
            </AppButton>
            <AppButton variant="primary" size="sm" icon={Plus} onClick={() => setCreateOpen(true)}>
              Create Task
            </AppButton>
          </Stack>
        }
      />

      <TopStatusBar
        columns={4}
        items={[
          {
            id: 'active-tasks',
            label: 'Active Tasks',
            value: stats.activeCount,
            hint: `${tasksReminders.length} total tasks`,
            icon: Clock,
            tone: stats.activeCount > 0 ? 'info' : 'success',
          },
          {
            id: 'urgent-tasks',
            label: 'High / Urgent SLA',
            value: stats.urgentCount,
            hint: 'Priority attention required',
            icon: AlertTriangle,
            tone: stats.urgentCount > 0 ? 'warning' : 'success',
          },
          {
            id: 'completed-tasks',
            label: 'Completed Tasks',
            value: stats.completedCount,
            hint: 'Resolved operational items',
            icon: CheckCircle2,
            tone: 'success',
          },
          {
            id: 'saved-views',
            label: 'Saved Filter Views',
            value: (savedViews ?? []).length,
            hint: 'Persisted across modules',
            icon: Bookmark,
            tone: 'primary',
          },
        ]}
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Complete Create Task / Reminder Modal exposing all tasks_reminders fields */}
      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Task / Reminder"
        subtitle="Operational to-dos with due dates, linked entities, and priority levels."
        submitLabel="Create Task"
        action="/tasks"
        fields={[
          { name: 'title', label: 'Task Title', required: true },
          {
            name: 'taskType',
            label: 'Task Type',
            kind: 'select',
            default: 'general',
            options: TASK_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
          },
          {
            name: 'priority',
            label: 'Priority',
            kind: 'select',
            default: 'medium',
            options: PRIORITIES.map((p) => ({ value: p, label: p })),
          },
          {
            name: 'status',
            label: 'Initial Status',
            kind: 'select',
            default: 'pending',
            options: STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          { name: 'dueAt', label: 'Due Date', kind: 'date' },
          { name: 'snoozedUntil', label: 'Snooze Until Date', kind: 'date' },
          {
            name: 'relatedEntityType',
            label: 'Related Entity Type (optional)',
            placeholder: 'order, credit_card, shipment, claim',
          },
          {
            name: 'relatedEntityId',
            label: 'Related Entity ID (optional)',
            placeholder: 'ord_01...',
          },
          { name: 'description', label: 'Description', kind: 'textarea', fullWidth: true },
        ]}
      />

      <FormModal
        isOpen={!!editRow}
        onOpenChange={(o) => {
          if (!o) setEditRow(null)
        }}
        title={`Edit Task: ${String(editRow?.title ?? '')}`}
        submitLabel="Save Task"
        action={editRow ? `/tasks/${editRow.id}` : '/tasks/placeholder'}
        initialValues={
          editRow
            ? {
                title: String(editRow.title ?? ''),
                taskType: String(editRow.taskType ?? 'general'),
                priority: String(editRow.priority ?? 'medium'),
                status: String(editRow.status ?? 'pending'),
                description: String(editRow.description ?? ''),
                dueAt: editRow.dueAt ? String(editRow.dueAt).slice(0, 10) : '',
                snoozedUntil: editRow.snoozedUntil ? String(editRow.snoozedUntil).slice(0, 10) : '',
                relatedEntityType: String(editRow.relatedEntityType ?? ''),
                relatedEntityId: String(editRow.relatedEntityId ?? ''),
              }
            : undefined
        }
        fields={[
          { name: 'title', label: 'Task Title', required: true },
          {
            name: 'taskType',
            label: 'Task Type',
            kind: 'select',
            options: TASK_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
          },
          {
            name: 'priority',
            label: 'Priority',
            kind: 'select',
            options: PRIORITIES.map((p) => ({ value: p, label: p })),
          },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            options: STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          { name: 'dueAt', label: 'Due Date', kind: 'date' },
          { name: 'snoozedUntil', label: 'Snooze Until Date', kind: 'date' },
          { name: 'relatedEntityType', label: 'Related Entity Type' },
          { name: 'relatedEntityId', label: 'Related Entity ID' },
          { name: 'description', label: 'Description', kind: 'textarea', fullWidth: true },
        ]}
      />

      {/* Create Saved View Modal */}
      <FormModal
        isOpen={createViewOpen}
        onOpenChange={setCreateViewOpen}
        title="Create Saved View"
        subtitle="Persist a named filter preset for any operational module."
        submitLabel="Save View"
        action="/saved-views"
        fields={[
          { name: 'name', label: 'View Name', required: true, placeholder: 'High Priority Orders' },
          {
            name: 'moduleKey',
            label: 'Module',
            kind: 'select',
            default: 'orders',
            options: [
              { value: 'orders', label: 'Orders' },
              { value: 'customers', label: 'Customers' },
              { value: 'products', label: 'Products' },
              { value: 'shipments', label: 'Shipments' },
              { value: 'returns', label: 'Returns' },
              { value: 'claims', label: 'Claims' },
              { value: 'finance', label: 'Finance' },
              { value: 'tasks', label: 'Tasks' },
            ],
          },
          {
            name: 'filterStatus',
            label: 'Default Status Filter',
            default: 'all',
            placeholder: 'all, pending, delivered…',
          },
          {
            name: 'isDefault',
            label: 'Set as Default View for Module',
            kind: 'select',
            default: 'false',
            options: [
              { value: 'false', label: 'No' },
              { value: 'true', label: 'Yes (Default)' },
            ],
          },
        ]}
      />

      <PageSection title="Task Queue" description="Complete, re-prioritize, or dismiss tasks.">
        <ResponsiveDataView
          rows={tasksReminders}
          searchKeys={['title', 'description', 'taskType']}
          filterKey="priority"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'urgent', label: 'Urgent' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
          createLabel="+ Create Task"
          onCreateClick={() => setCreateOpen(true)}
          toCard={(row) => ({
            title: String(row.title),
            statusBadge: {
              label: String(row.status).replace(/_/g, ' '),
              variant:
                row.status === 'completed'
                  ? 'success'
                  : row.status === 'pending'
                    ? 'warning'
                    : 'neutral',
            },
            metrics: [
              { label: 'Type', value: String(row.taskType).replace(/_/g, ' ') },
              { label: 'Priority', value: String(row.priority) },
              {
                label: 'Due',
                value: row.dueAt ? new Date(String(row.dueAt)).toLocaleDateString() : '—',
              },
            ],
            actions: (
              <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditRow(row)}
                >
                  Edit
                </AppButton>
                {String(row.status) !== 'completed' && (
                  <AppButton
                    variant="outline"
                    size="xs"
                    icon={CheckCircle2}
                    onClick={() => {
                      router.post(`/tasks/${row.id}/complete`, {}, { preserveScroll: true })
                    }}
                  >
                    Complete
                  </AppButton>
                )}
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  onClick={() => {
                    if (window.confirm('Delete task?')) {
                      router.post(`/tasks/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                >
                  Delete
                </AppButton>
              </Stack>
            ),
          })}
          columns={[
            col.text('title', 'Title', 200),
            col.badge('taskType', 'Type', { general: 'neutral' }),
            col.badge('priority', 'Priority', {
              urgent: 'error',
              high: 'warning',
              medium: 'info',
              low: 'neutral',
            }),
            col.badge('status', 'Status', {
              pending: 'warning',
              in_progress: 'info',
              completed: 'success',
              snoozed: 'neutral',
              dismissed: 'neutral',
            }),
            col.date('dueAt', 'Due'),
            col.action('Actions', (row) => (
              <Stack direction="horizontal" align="center" wrap="wrap" gap={1.5}>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditRow(row)}
                >
                  Edit
                </AppButton>
                {String(row.status) !== 'completed' && (
                  <AppButton
                    variant="outline"
                    size="xs"
                    icon={CheckCircle2}
                    onClick={() => {
                      router.post(`/tasks/${row.id}/complete`, {}, { preserveScroll: true })
                    }}
                  >
                    Complete
                  </AppButton>
                )}
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  onClick={() => {
                    if (window.confirm('Delete task?')) {
                      router.post(`/tasks/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                >
                  Delete
                </AppButton>
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Saved Views"
        description="Filters and column presets saved across modules for quick recall."
      >
        <ResponsiveDataView
          rows={savedViews ?? []}
          searchKeys={['name', 'moduleKey']}
          createLabel="+ Save View"
          onCreateClick={() => setCreateViewOpen(true)}
          toCard={(row) => ({
            title: String(row.name),
            metrics: [
              { label: 'Module', value: String(row.moduleKey) },
              {
                label: 'Created',
                value: row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '—',
              },
            ],
            actions: (
              <AppButton
                variant="ghost"
                size="xs"
                icon={Trash2}
                onClick={() => {
                  if (window.confirm('Delete saved view?')) {
                    router.post(`/saved-views/${row.id}/delete`, {}, { preserveScroll: true })
                  }
                }}
              >
                Delete
              </AppButton>
            ),
          })}
          columns={[
            col.text('name', 'Name', 180),
            col.text('moduleKey', 'Module', 120),
            col.date('createdAt', 'Created'),
            col.action('Actions', (row) => (
              <AppButton
                variant="ghost"
                size="xs"
                icon={Trash2}
                onClick={() => {
                  if (window.confirm('Delete saved view?')) {
                    router.post(`/saved-views/${row.id}/delete`, {}, { preserveScroll: true })
                  }
                }}
              >
                Delete
              </AppButton>
            )),
          ]}
          emptyTitle="No saved views"
          emptyDescription="Create a saved view to store filter presets for any module."
        />
      </PageSection>
    </Stack>
  )
}
