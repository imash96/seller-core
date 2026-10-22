import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { ListChecks } from 'lucide-react'

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

  const activeCount = tasksReminders.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks, Reminders & Saved Views"
        description="Operational SLA reminders, credit card payment alerts, and saved filter views across modules."
        icon={ListChecks}
        badge={`${tasksReminders.length} tasks · ${activeCount} active`}
        actions={
          <>
            <Button
              label="+ Save Filter View"
              variant="secondary"
              onClick={() => setCreateViewOpen(true)}
            />
            <Button label="+ Create Task" variant="primary" onClick={() => setCreateOpen(true)} />
          </>
        }
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Task / Reminder"
        subtitle="Operational to-dos with due dates and priority levels."
        submitLabel="Create Task"
        action="/tasks"
        fields={[
          { name: 'title', label: 'Task title', required: true },
          {
            name: 'taskType',
            label: 'Task type',
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
          { name: 'dueAt', label: 'Due date', kind: 'date' },
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
              }
            : undefined
        }
        fields={[
          { name: 'title', label: 'Task title', required: true },
          {
            name: 'taskType',
            label: 'Task type',
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
          { name: 'dueAt', label: 'Due date', kind: 'date' },
          { name: 'description', label: 'Description', kind: 'textarea', fullWidth: true },
        ]}
      />

      {/* Create Saved View Modal (replaces raw HTML form) */}
      <FormModal
        isOpen={createViewOpen}
        onOpenChange={setCreateViewOpen}
        title="Create Saved View"
        subtitle="Persist a named filter preset for any operational module."
        submitLabel="Save View"
        action="/saved-views"
        fields={[
          { name: 'name', label: 'View name', required: true, placeholder: 'High Priority Orders' },
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
            label: 'Default status filter',
            default: 'all',
            placeholder: 'all, pending, delivered…',
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
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditRow(row)}
                />
                {String(row.status) !== 'completed' && (
                  <Button
                    label="Complete"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      router.post(`/tasks/${row.id}/complete`, {}, { preserveScroll: true })
                    }}
                  />
                )}
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Delete task?')) {
                      router.post(`/tasks/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
              </div>
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditRow(row)}
                />
                {String(row.status) !== 'completed' && (
                  <Button
                    label="Complete"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      router.post(`/tasks/${row.id}/complete`, {}, { preserveScroll: true })
                    }}
                  />
                )}
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Delete task?')) {
                      router.post(`/tasks/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
              </div>
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
              <Button
                label="Delete"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm('Delete saved view?')) {
                    router.post(`/saved-views/${row.id}/delete`, {}, { preserveScroll: true })
                  }
                }}
              />
            ),
          })}
          columns={[
            col.text('name', 'Name', 180),
            col.text('moduleKey', 'Module', 120),
            col.date('createdAt', 'Created'),
            col.action('Actions', (row) => (
              <Button
                label="Delete"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm('Delete saved view?')) {
                    router.post(`/saved-views/${row.id}/delete`, {}, { preserveScroll: true })
                  }
                }}
              />
            )),
          ]}
          emptyTitle="No saved views"
          emptyDescription="Create a saved view to store filter presets for any module."
        />
      </PageSection>
    </div>
  )
}
