import { Text } from '@astryxdesign/core/Text'
import { Stack } from '@astryxdesign/core/Stack'
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

export default function Import({ syncJobs, sellerAccounts, savedViews }: Props) {
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
        // Raw Amazon SP-API shape — the importer auto-detects the platform and
        // normalizes totals, tax lines and SLA windows.
        payload: {
          Orders: [
            {
              AmazonOrderId: '902-8324761-1234567',
              MarketplaceId: 'ATVPDKIKX0DER',
              PurchaseDate: '2026-02-11T14:22:31Z',
              OrderStatus: 'Unshipped',
              FulfillmentChannel: 'AFN',
              OrderTotal: { Amount: '124.98', CurrencyCode: 'USD' },
              TaxCollection: { Model: 'MarketplaceFacilitator' },
              LatestShipDate: '2026-02-14T23:59:59Z',
              ShippingAddress: {
                Name: 'Alex Johnson',
                AddressLine1: '1 Market St',
                City: 'Seattle',
                StateOrRegion: 'WA',
                PostalCode: '98101',
                CountryCode: 'US',
              },
              BuyerInfo: { BuyerEmail: 'alex@example.com' },
            },
          ],
        },
        orderItemsPayload: {
          payload: {
            OrderItems: [
              {
                ASIN: 'B09ASTRYX1',
                SellerSKU: 'SKU-001',
                OrderItemId: 'OI-1',
                Title: 'Premium Headphones',
                QuantityOrdered: 2,
                ItemPrice: { Amount: '99.98', CurrencyCode: 'USD' },
                ItemTax: { Amount: '8.00', CurrencyCode: 'USD' },
                ShippingPrice: { Amount: '17.00', CurrencyCode: 'USD' },
                ShippingTax: { Amount: '0.00', CurrencyCode: 'USD' },
                PromotionDiscount: { Amount: '0.00', CurrencyCode: 'USD' },
                ShippingDiscount: { Amount: '0.00', CurrencyCode: 'USD' },
              },
            ],
          },
        },
      },
    ],
    null,
    2
  )

  return (
    <Stack gap={6}>
      <PageHeader
        title="Bulk Marketplace Import & Sync Jobs"
        description="Idempotent JSON order batch import and per-record diagnostics. Marketplace sync is not configured."
        icon={Upload}
        badge={`${syncJobs.length} sync jobs`}
        actions={
          <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
            <AppButton
              variant="secondary"
              size="sm"
              disabled
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
          </Stack>
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
        subtitle="Accepts raw Amazon SP-API / eBay Fulfillment / Etsy v3 / MedusaJS v2 payloads or canonical Seller Core JSON — the platform is detected per record. Idempotent: the same key skips duplicates, and one invalid record never aborts the batch."
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
            label: 'Marketplace payloads or canonical orders (JSON array)',
            kind: 'textarea',
            required: true,
            fullWidth: true,
            placeholder:
              '[{"payload":{"Orders":[{"AmazonOrderId":"902-1","FulfillmentChannel":"AFN","OrderTotal":{"Amount":"10.00","CurrencyCode":"USD"}}]},"orderItemsPayload":{"payload":{"OrderItems":[{"ASIN":"B0X","SellerSKU":"A","QuantityOrdered":1,"ItemPrice":{"Amount":"10.00","CurrencyCode":"USD"}}]}}}]',
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
          <Stack direction="horizontal" justify="end">
            <AppButton variant="secondary" size="sm" onClick={() => setInspectJob(null)}>
              Close
            </AppButton>
          </Stack>
        }
      >
        {inspectJob && (
          <Stack gap={3}>
            {Array.isArray((inspectJob as any).errors) && (inspectJob as any).errors.length > 0 ? (
              (inspectJob as any).errors.map((e: Row, i: number) => (
                <Stack
                  gap={1}
                  padding={3}
                  key={i}
                  className="rounded-xl border border-rose-500/25 bg-rose-500/10"
                >
                  <Stack direction="horizontal" align="center" justify="between" gap={2}>
                    <StatusBadge
                      variant="error"
                      label={String(e.errorCode ?? e.error_code ?? 'ERROR')}
                    />
                    <Text size="xsm" color="secondary" className="font-mono">
                      Record #{String(e.recordIndex ?? e.record_index ?? i + 1)}
                    </Text>
                  </Stack>
                  <p className="text-xs font-semibold text-foreground">
                    {String(e.message ?? e.errorMessage ?? 'Validation error')}
                  </p>
                </Stack>
              ))
            ) : (
              <Stack
                padding={6}
                className="text-center text-sm text-muted-foreground rounded-xl border border-dashed border-border bg-muted/20"
              >
                No per-record errors logged for this sync job — all records processed cleanly.
              </Stack>
            )}
          </Stack>
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
    </Stack>
  )
}
