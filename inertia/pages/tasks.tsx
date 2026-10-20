import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import AppLayout from '~/layouts/app'
import {
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  STATUS_TONES,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'

type Props = { tasksReminders: Row[]; savedViews?: Row[] }

Tasks.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

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

  return (
    <Stack gap={4}>
      <Card padding={4}>
        <Stack direction="horizontal" gap={3} wrap="wrap" align="center">
          <Button label="+ Create Task" variant="primary" onClick={() => setCreateOpen(true)} />
          <Text type="supporting" as="div">
            {tasksReminders.length} tasks ·{' '}
            {
              tasksReminders.filter((t) => t.status === 'pending' || t.status === 'in_progress')
                .length
            }{' '}
            active
          </Text>
        </Stack>
      </Card>
      {savedViews && savedViews.length > 0 ? <SavedViewsBar views={savedViews} /> : null}

      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Create task / reminder"
        subtitle="Operational to-dos with due dates and priorities."
        submitLabel="Create task"
        action="/tasks"
        fields={[
          { name: 'title', label: 'Title', required: true },
          {
            name: 'taskType',
            label: 'Type',
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
          { name: 'dueAt', label: 'Due at', kind: 'date' },
          { name: 'description', label: 'Description', kind: 'textarea' },
        ]}
      />

      <FormModal
        isOpen={!!editRow}
        onOpenChange={(o) => {
          if (!o) setEditRow(null)
        }}
        title={`Edit task: ${String(editRow?.title ?? '')}`}
        submitLabel="Save task"
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
          { name: 'title', label: 'Title' },
          {
            name: 'taskType',
            label: 'Type',
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
          { name: 'dueAt', label: 'Due at', kind: 'date' },
          { name: 'description', label: 'Description', kind: 'textarea' },
        ]}
      />

      <PageSection title="Task queue" description="Complete, re-prioritize, or dismiss tasks.">
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
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditRow(row)}
                />
                {String(row.status) !== 'completed' ? (
                  <Button
                    label="Complete"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/tasks/${row.id}/complete`
                      document.body.appendChild(f)
                      f.submit()
                    }}
                  />
                ) : null}
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete task?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/tasks/${row.id}/delete`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
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
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditRow(row)}
                />
                {String(row.status) !== 'completed' ? (
                  <Button
                    label="Complete"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/tasks/${row.id}/complete`
                      document.body.appendChild(f)
                      f.submit()
                    }}
                  />
                ) : null}
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete task?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/tasks/${row.id}/delete`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Saved views"
        description="Filters and column presets saved for quick recall."
      >
        <Stack gap={3}>
          <ResponsiveDataView
            rows={savedViews ?? []}
            searchKeys={['name', 'moduleKey']}
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
                    if (confirm('Delete saved view?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/saved-views/${row.id}/delete`
                      document.body.appendChild(f)
                      f.submit()
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
                    if (confirm('Delete saved view?')) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/saved-views/${row.id}/delete`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
              )),
            ]}
            emptyTitle="No saved views"
            emptyDescription="Create a saved view from any module's filter controls."
          />
          {/* Inline create saved view */}
          <Card padding={3} variant="muted">
            <Stack gap={2}>
              <Text type="label" as="div" weight="semibold">
                Create saved view
              </Text>
              <form method="POST" action="/saved-views">
                <input
                  type="hidden"
                  name="_csrf"
                  value={
                    (typeof document !== 'undefined'
                      ? (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
                          ?.content
                      : '') ?? ''
                  }
                />
                <Stack direction="horizontal" gap={2} wrap="wrap" align="end">
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>View name</label>
                    <input
                      name="name"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #d1d5db',
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Module</label>
                    <select
                      name="moduleKey"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #d1d5db',
                        fontSize: 14,
                      }}
                    >
                      <option value="orders">Orders</option>
                      <option value="customers">Customers</option>
                      <option value="products">Products</option>
                      <option value="tasks">Tasks</option>
                    </select>
                  </div>
                  <Button label="Save view" type="submit" variant="primary" size="sm" />
                </Stack>
              </form>
            </Stack>
          </Card>
        </Stack>
      </PageSection>
    </Stack>
  )
}
