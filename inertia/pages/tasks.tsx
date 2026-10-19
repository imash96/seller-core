import { Stack } from '@astryxdesign/core/Stack'
import AppLayout from '~/layouts/app'
import { PageSection, DataTable, SmartForm, RowAction, StatusForm, col, type Row } from '~/lib/ui'

type Props = {
  tasksReminders: Row[]
}

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

export default function Tasks({ tasksReminders }: Props) {
  return (
    <Stack gap={4}>
      <PageSection
        title="Create task / reminder"
        description="Operational to-dos with due dates, priorities and entity links."
      >
        <SmartForm
          action="/tasks"
          submitLabel="Create task"
          fields={[
            { name: 'title', label: 'Title', required: true, width: 250 },
            {
              name: 'taskType',
              label: 'Type',
              kind: 'select',
              default: 'general',
              width: 180,
              options: TASK_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
            },
            {
              name: 'priority',
              label: 'Priority',
              kind: 'select',
              default: 'medium',
              width: 120,
              options: PRIORITIES.map((p) => ({ value: p, label: p })),
            },
            { name: 'dueAt', label: 'Due at', kind: 'date', width: 150 },
            { name: 'description', label: 'Description', kind: 'textarea', width: 280 },
          ]}
        />
      </PageSection>

      <PageSection
        title="Task queue"
        description="Complete, re-prioritize, or dismiss tasks as you work through them."
      >
        <DataTable
          rows={tasksReminders}
          empty="Task queue is clear."
          columns={[
            col.text('title', 'Title', 200),
            col.badge('taskType', 'Type', {
              credit_card_due: 'warning',
              fraud_review: 'error',
              general: 'neutral',
            }),
            col.badge('priority', 'Priority', {
              urgent: 'error',
              high: 'warning',
              medium: 'info',
              low: 'neutral',
            }),
            col.badge('status', 'Status', {
              completed: 'success',
              pending: 'warning',
              in_progress: 'info',
              snoozed: 'neutral',
              dismissed: 'neutral',
            }),
            col.date('dueAt', 'Due'),
            col.date('completedAt', 'Completed'),
            col.action('Actions', (row) => (
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <RowAction action={`/tasks/${row.id}/complete`} label="Complete" />
                <StatusForm
                  action={`/tasks/${row.id}`}
                  fieldName="status"
                  label="Status"
                  current={String(row.status ?? 'pending')}
                  options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                />
                <StatusForm
                  action={`/tasks/${row.id}`}
                  fieldName="priority"
                  label="Priority"
                  current={String(row.priority ?? 'medium')}
                  options={PRIORITIES.map((s) => ({ value: s, label: s }))}
                />
                <RowAction
                  action={`/tasks/${row.id}/delete`}
                  label="Delete"
                  variant="ghost"
                  confirmText="Delete this task?"
                />
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection title="Update task details">
        <SmartForm
          action="/tasks"
          actionFor={(v) => `/tasks/${v.id}`}
          submitLabel="Update task"
          fields={[
            {
              name: 'id',
              label: 'Task',
              kind: 'select',
              required: true,
              width: 240,
              options: tasksReminders.map((t) => ({ value: String(t.id), label: String(t.title) })),
            },
            { name: 'title', label: 'New title', width: 220 },
            { name: 'description', label: 'New description', width: 240 },
            { name: 'dueAt', label: 'New due date', kind: 'date', width: 150 },
          ]}
        />
      </PageSection>

      <PageSection
        title="Saved views"
        description="Remember filter presets per module for fast recurring workflows."
      >
        <SmartForm
          action="/saved-views"
          submitLabel="Save view"
          fields={[
            { name: 'name', label: 'View name', required: true, width: 180 },
            {
              name: 'moduleKey',
              label: 'Module',
              kind: 'select',
              default: 'orders',
              width: 150,
              options: ['orders', 'customers', 'products', 'shipments', 'returns', 'finance'].map(
                (m) => ({
                  value: m,
                  label: m,
                })
              ),
            },
            {
              name: 'filterStatus',
              label: 'Status filter',
              kind: 'select',
              default: 'all',
              width: 140,
              options: [
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'delivered', label: 'Delivered' },
              ],
            },
          ]}
        />
      </PageSection>
    </Stack>
  )
}
