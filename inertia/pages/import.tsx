import {
  PageHeader,
  PageSection,
  FormModal,
  StatusBadge,
  ResponsiveDataView,
  SavedViewsBar,
  TopStatusBar,
  SlideOverDrawer,
  AppButton,
  col,
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import { Upload, CheckCircle2, AlertTriangle, RefreshCw, Database, Eye } from 'lucide-react'

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

export default function Import({ syncJobs = [], sellerAccounts = [], savedViews = [] }: Props) {
  const [importOpen, setImportOpen] = useState(false)
  const [syncOpen, setSyncOpen] = useState(false)
  const [inspectJob, setInspectJob] = useState<Row | null>(null)

  const stats = useMemo(() => {
    const completedCount = syncJobs.filter((j) => String(j.status) === 'completed').length
    const totalSucceeded = syncJobs.reduce((acc, j) => acc + Number(j.succeededRecords ?? 0), 0)
    const totalFailed = syncJobs.reduce((acc, j) => acc + Number(j.failedRecords ?? 0), 0)
    return { completedCount, totalSucceeded, totalFailed }
  }, [syncJobs])

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
          <div className="flex items-center gap-2 flex-wrap">
            <AppButton
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => setSyncOpen(true)}
            >
              Queue Account Sync
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              icon={Upload}
              onClick={() => setImportOpen(true)}
            >
              Run Bulk JSON Import
            </AppButton>
          </div>
        }
      />

      <TopStatusBar
        columns={4}
        items={[
          {
            id: 'total-jobs',
            label: 'Total Sync Jobs',
            value: syncJobs.length,
            hint: `${sellerAccounts.length} connected accounts`,
            icon: Database,
            tone: 'primary',
          },
          {
            id: 'completed-jobs',
            label: 'Completed Runs',
            value: stats.completedCount,
            hint: 'Idempotent key verification',
            icon: CheckCircle2,
            tone: 'success',
          },
          {
            id: 'succeeded-records',
            label: 'Records Imported',
            value: stats.totalSucceeded,
            hint: 'Orders & marketplace sync items',
            icon: Upload,
            tone: 'info',
          },
          {
            id: 'failed-records',
            label: 'Failed Records',
            value: stats.totalFailed,
            hint: 'Isolated per-record diagnostics',
            icon: AlertTriangle,
            tone: stats.totalFailed > 0 ? 'warning' : 'success',
          },
        ]}
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Bulk JSON Import Modal */}
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

      {/* SlideOverDrawer for Sync Job Diagnostics */}
      <SlideOverDrawer
        open={!!inspectJob}
        onClose={() => setInspectJob(null)}
        title={`Sync Job: ${String(inspectJob?.idempotencyKey ?? inspectJob?.jobType ?? '')}`}
        subtitle={`Status: ${String(inspectJob?.status ?? '')} · ${String(inspectJob?.succeededRecords ?? 0)} succeeded · ${String(inspectJob?.failedRecords ?? 0)} failed · ${String(inspectJob?.skippedDuplicates ?? 0)} skipped`}
        width="lg"
        footer={
          <div className="flex justify-end">
            <AppButton variant="secondary" size="sm" onClick={() => setInspectJob(null)}>
              Close
            </AppButton>
          </div>
        }
      >
        {inspectJob && (
          <div className="space-y-3">
            {Array.isArray((inspectJob as any).errors) && (inspectJob as any).errors.length > 0 ? (
              (inspectJob as any).errors.map((e: Row, i: number) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-error/25 bg-error-subtle space-y-1"
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
        )}
      </SlideOverDrawer>

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
              <AppButton
                variant="secondary"
                size="xs"
                icon={Eye}
                onClick={() => setInspectJob(row)}
              >
                Inspect Errors
              </AppButton>
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
              <AppButton
                variant="secondary"
                size="xs"
                icon={Eye}
                onClick={() => setInspectJob(row)}
              >
                Inspect
              </AppButton>
            )),
          ]}
        />
      </PageSection>
    </div>
  )
}
