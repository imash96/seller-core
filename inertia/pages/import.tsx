import { Stack } from '@astryxdesign/core/Stack'
import AppLayout from '~/layouts/app'
import { PageSection, DataTable, SmartForm, col, type Row } from '~/lib/ui'

type Props = {
  syncJobs: Row[]
  sellerAccounts: Row[]
  orders: Row[]
  orderLineItems: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  financeCategories: Row[]
  effectiveRbac: Record<string, any>
}

Import.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

export default function Import({ syncJobs, sellerAccounts }: Props) {
  return (
    <Stack gap={4}>
      <PageSection
        title="Bulk order import"
        description="Idempotent marketplace import: reuse the same idempotency key to make retries safe, duplicates are skipped and counted."
      >
        <SmartForm
          action="/orders/bulk-import"
          submitLabel="Run import"
          compact
          fields={[
            {
              name: 'idempotencyKey',
              label: 'Idempotency key',
              required: true,
              placeholder: 'amz-us-2026-10-20-a',
            },
            {
              name: 'sellerAccountId',
              label: 'Seller account',
              kind: 'select',
              options: sellerAccounts.map((s) => ({
                value: String(s.id),
                label: String(s.accountName ?? s.id),
              })),
            },
            {
              name: 'ordersJson',
              label: 'Orders JSON array',
              kind: 'textarea',
              required: true,
              placeholder:
                '[{"orderNumber":"AMZ-1","externalOrderId":"X1","customerFullName":"Jane","currencyCode":"USD","lines":[{"sku":"A","title":"Item","quantityOrdered":1,"unitPrice":10}]}]',
            },
          ]}
        />
      </PageSection>

      <PageSection
        title="Sync jobs"
        description="Import runs with per-record error capture — one bad record never blocks the rest of the batch."
      >
        <DataTable
          rows={syncJobs}
          empty="No sync jobs yet."
          columns={[
            col.text('jobType', 'Job type', 140),
            col.badge('status', 'Status', {
              completed: 'success',
              completed_with_errors: 'warning',
              running: 'info',
              queued: 'neutral',
              failed: 'error',
            }),
            col.text('idempotencyKey', 'Idempotency key', 170),
            col.text('totalRecords', 'Total', 70),
            col.text('succeededRecords', 'OK', 60),
            col.text('failedRecords', 'Failed', 65),
            col.text('skippedDuplicates', 'Skipped dup', 90),
            col.date('startedAt', 'Started'),
            col.action('Errors', (row) => {
              const errors = (row.errors as Row[]) ?? []
              return (
                <span style={{ fontSize: 12 }}>
                  {errors.length === 0
                    ? '—'
                    : errors.map((e) => String(e.errorCode ?? 'error')).join(', ')}
                </span>
              )
            }),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
