import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
  PageSection,
  FormModal,
  StatusBadge,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'
import { Upload, X } from 'lucide-react'

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

export default function Import({ syncJobs, sellerAccounts, savedViews }: Props) {
  const [importOpen, setImportOpen] = useState(false)
  const [syncOpen, setSyncOpen] = useState(false)
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
    <div className="space-y-6">
      <PageHeader
        title="Bulk Marketplace Import & Sync Jobs"
        description="Idempotent JSON order batch import, seller account synchronization, and per-record error diagnostics."
        icon={Upload}
        badge={`${syncJobs.length} sync jobs`}
        actions={
          <>
            <Button
              label="Queue Account Sync"
              variant="secondary"
              onClick={() => setSyncOpen(true)}
            />
            <Button
              label="Run Bulk JSON Import"
              variant="primary"
              onClick={() => setImportOpen(true)}
            />
          </>
        }
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Bulk JSON Import Modal (single clean preset button) */}
      <FormModal
        isOpen={importOpen}
        onOpenChange={setImportOpen}
        title="Run Bulk JSON Import"
        subtitle="Idempotent: re-submitting the same key skips duplicates. One invalid record never aborts the batch."
        submitLabel="Run Import"
        action="/orders/bulk-import"
        presetActions={[
          {
            label: 'Load Sample JSON Payload',
            values: {
              idempotencyKey: `sample-${Date.now()}`,
              ordersJson: sampleJson,
            },
          },
        ]}
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
            fullWidth: true,
            placeholder:
              '[{"orderNumber":"AMZ-1","externalOrderId":"X1","customerFullName":"Jane","lines":[{"sku":"A","title":"Item","quantityOrdered":1,"unitPrice":10}]}]',
          },
        ]}
      />

      {/* Queue Seller Account Sync Modal */}
      <FormModal
        isOpen={syncOpen}
        onOpenChange={setSyncOpen}
        title="Queue Seller Account Sync"
        subtitle="Trigger an immediate background sync job for a connected marketplace store."
        submitLabel="Enqueue Sync"
        action="/import/sync-accounts"
        fields={[
          {
            name: 'sellerAccountId',
            label: 'Connected seller account',
            kind: 'select',
            required: true,
            fullWidth: true,
            options: sellerAccounts.map((s) => ({
              value: String(s.id),
              label: `${s.accountName} (${s.marketplaceRegion ?? 'US'})`,
            })),
          },
        ]}
      />

      {/* Inspect Sync Job Errors Modal */}
      {inspectJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setInspectJob(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-xl max-h-[85dvh] flex flex-col rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Sync Job: {String(inspectJob.idempotencyKey ?? inspectJob.jobType)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Status: {String(inspectJob.status)} · {String(inspectJob.succeededRecords ?? 0)}{' '}
                  succeeded · {String(inspectJob.failedRecords ?? 0)} failed ·{' '}
                  {String(inspectJob.skippedDuplicates ?? 0)} skipped
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectJob(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {Array.isArray((inspectJob as any).errors) &&
              (inspectJob as any).errors.length > 0 ? (
                (inspectJob as any).errors.map((e: Row, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-rose-500/25 bg-rose-500/10 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge
                        variant="error"
                        label={String(e.errorCode ?? e.error_code ?? 'ERROR')}
                      />
                      <span className="text-xs font-mono text-muted-foreground">
                        Record #{String(e.recordIndex ?? e.record_index ?? i + 1)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      {String(e.message ?? e.errorMessage ?? 'Validation error')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground rounded-xl border border-dashed border-border bg-muted/20">
                  No per-record errors logged for this sync job — all records processed cleanly.
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
              <Button label="Close" variant="secondary" onClick={() => setInspectJob(null)} />
            </div>
          </div>
        </div>
      )}

      <PageSection
        title="Sync Jobs"
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
    </div>
  )
}
