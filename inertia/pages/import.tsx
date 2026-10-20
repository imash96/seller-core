import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import AppLayout from '~/layouts/app'
import { PageSection, FormModal, ResponsiveDataView, SavedViewsBar, col, type Row } from '~/lib/ui'
import { useState } from 'react'

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
  savedViews?: Row[]
}

Import.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

export default function Import({ syncJobs, sellerAccounts, savedViews }: Props) {
  const [importOpen, setImportOpen] = useState(false)
  const [inspectJob, setInspectJob] = useState<Row | null>(null)

  const sampleJson = JSON.stringify(
    [
      {
        orderNumber: 'AMZ-2026-001',
        externalOrderId: 'AMZ-EXT-001',
        customerFullName: 'Alex Johnson',
        customerEmail: 'alex@example.com',
        currencyCode: 'USD',
        exchangeRate: 1,
        lines: [
          {
            sku: 'SKU-001',
            title: 'Premium Headphones',
            quantityOrdered: 2,
            unitPrice: 49.99,
            unitCostAmount: 20,
          },
        ],
      },
    ],
    null,
    2
  )

  return (
    <Stack gap={4}>
      <Card padding={4}>
        <Stack direction="horizontal" gap={3} wrap="wrap" align="center">
          <Button
            label="Run Bulk JSON Import"
            variant="primary"
            onClick={() => setImportOpen(true)}
          />
          <Text type="supporting" as="div">
            {syncJobs.length} sync jobs · Idempotent — retries are safe
          </Text>
        </Stack>
      </Card>
      {savedViews && savedViews.length > 0 ? <SavedViewsBar views={savedViews} /> : null}

      <FormModal
        isOpen={importOpen}
        onOpenChange={setImportOpen}
        title="Run bulk JSON import"
        subtitle="Idempotent: same key → duplicates skipped. One bad record never blocks the batch."
        submitLabel="Run import"
        action="/orders/bulk-import"
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
              '[{"orderNumber":"AMZ-1","externalOrderId":"X1","customerFullName":"Jane","lines":[{"sku":"A","title":"Item","quantityOrdered":1,"unitPrice":10}]}]',
          },
        ]}
      >
        <Card padding={3} variant="muted">
          <Stack gap={2}>
            <Text type="label" as="div" weight="semibold">
              Quick start helper
            </Text>
            <Text type="supporting" as="div">
              Click to load a valid sample payload into the JSON field below, then submit.
            </Text>
            <Button
              label="Load Sample JSON Payload"
              variant="secondary"
              size="sm"
              onClick={() => {
                const el = document.querySelector(
                  'textarea[name="ordersJson"]'
                ) as HTMLTextAreaElement | null
                if (el) {
                  el.value = sampleJson
                  el.dispatchEvent(new Event('input', { bubbles: true }))
                  el.dispatchEvent(new Event('change', { bubbles: true }))
                }
                const keyEl = document.querySelector(
                  'input[name="idempotencyKey"]'
                ) as HTMLInputElement | null
                if (keyEl && !keyEl.value) {
                  keyEl.value = `sample-${Date.now()}`
                  keyEl.dispatchEvent(new Event('input', { bubbles: true }))
                  keyEl.dispatchEvent(new Event('change', { bubbles: true }))
                }
              }}
            />
          </Stack>
        </Card>
      </FormModal>

      <Dialog
        isOpen={!!inspectJob}
        onOpenChange={(o) => {
          if (!o) setInspectJob(null)
        }}
        width={640}
        purpose="info"
      >
        <DialogHeader
          title={`Sync job: ${String(inspectJob?.idempotencyKey ?? '')}`}
          subtitle={`Status: ${String(inspectJob?.status ?? '')} · ${inspectJob ? `${(inspectJob as any).succeededRecords ?? 0} succeeded · ${(inspectJob as any).failedRecords ?? 0} failed · ${(inspectJob as any).skippedDuplicates ?? 0} skipped` : ''}`}
          onOpenChange={(o) => {
            if (!o) setInspectJob(null)
          }}
        />
        <div style={{ padding: 20 }}>
          <Stack gap={3}>
            {inspectJob &&
            Array.isArray((inspectJob as any).errors) &&
            (inspectJob as any).errors.length > 0 ? (
              <Stack gap={2}>
                <Text type="label" as="div" weight="semibold">
                  Per-record errors ({(inspectJob as any).errors.length})
                </Text>
                {(inspectJob as any).errors.map((e: Row, i: number) => (
                  <Card key={i} padding={3} variant="muted">
                    <Stack gap={1}>
                      <Text type="label" as="div" weight="medium">
                        {String(e.errorCode ?? e.error_code ?? 'error')}:{' '}
                        {String(e.message ?? e.errorMessage ?? '')}
                      </Text>
                      <Text type="supporting" as="div">
                        {String(e.recordIndex ?? e.record_index ?? '')} · {String(e.field ?? '')}
                      </Text>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text type="supporting" as="div">
                No errors for this job — all records processed cleanly.
              </Text>
            )}
            <Button label="Close" variant="secondary" onClick={() => setInspectJob(null)} />
          </Stack>
        </div>
      </Dialog>

      <PageSection
        title="Sync jobs"
        description="Import runs with per-record error capture — one bad record never blocks the rest."
      >
        <ResponsiveDataView
          rows={syncJobs}
          searchKeys={['idempotencyKey', 'jobType', 'status']}
          filterKey="status"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'completed', label: 'Completed' },
            { value: 'failed', label: 'Failed' },
            { value: 'running', label: 'Running' },
          ]}
          createLabel="Run Import"
          onCreateClick={() => setImportOpen(true)}
          toCard={(row) => ({
            title: String(row.idempotencyKey ?? row.jobType),
            statusBadge: {
              label: String(row.status),
              variant:
                String(row.status) === 'completed'
                  ? 'success'
                  : String(row.status) === 'failed'
                    ? 'error'
                    : String(row.status) === 'running'
                      ? 'info'
                      : 'neutral',
            },
            metrics: [
              {
                label: 'Total / OK',
                value: `${row.totalRecords ?? 0} / ${row.succeededRecords ?? 0}`,
              },
              { label: 'Failed', value: String(row.failedRecords ?? 0) },
              { label: 'Skipped dup', value: String(row.skippedDuplicates ?? 0) },
              {
                label: 'Started',
                value: row.startedAt ? new Date(String(row.startedAt)).toLocaleString() : '—',
              },
            ],
            actions: (
              <Button
                label="Inspect errors"
                variant="secondary"
                size="sm"
                onClick={() => setInspectJob(row)}
              />
            ),
          })}
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
            col.action('Actions', (row) => (
              <Button
                label="Inspect"
                variant="secondary"
                size="sm"
                onClick={() => setInspectJob(row)}
              />
            )),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
