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
  STATUS_TONES,
  money,
  moneyAmountString,
  moneyCurrencyCode,
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import {
  RotateCcw,
  Clock,
  PackageCheck,
  DollarSign,
  CheckCircle2,
  Plus,
  RefreshCw,
} from 'lucide-react'

type Props = {
  returnRequests: Row[]
  refundTransactions: Row[]
  orders: Row[]
  orderLineItems: Row[]
  sellerAccounts: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  financeCategories: Row[]
  savedViews?: Row[]
}

const RETURN_STATUS = [
  'requested',
  'authorized',
  'in_transit',
  'received',
  'inspected',
  'refunded',
  'replacement_sent',
  'closed',
]
const RETURN_REASONS = [
  'defective',
  'wrong_item',
  'damaged_in_transit',
  'not_as_described',
  'changed_mind',
  'size_fit_issue',
  'late_delivery',
  'other',
]
const RESOLUTIONS = ['refund', 'partial_refund', 'replacement', 'store_credit', 'rejected']

// Matches PostgreSQL enum `return_item_condition` 1:1
const ITEM_CONDITIONS = [
  { value: 'unopened', label: 'Unopened' },
  { value: 'like_new', label: 'Like New' },
  { value: 'used', label: 'Used' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'unsellable', label: 'Unsellable / Defective' },
]

export default function Returns({
  returnRequests,
  refundTransactions,
  orders,
  orderLineItems,
  savedViews,
}: Props) {
  const [createRmaOpen, setCreateRmaOpen] = useState(false)
  const [updateRmaRow, setUpdateRmaRow] = useState<Row | null>(null)
  const [createRefundOpen, setCreateRefundOpen] = useState(false)

  // Compute remaining refundable per order for refund modal helper
  const refundableByOrder = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of orders) {
      const total = Number(o.totalAmount ?? 0)
      const refunded = Number(o.refundedAmount ?? 0)
      map[String(o.id)] = Math.max(0, total - refunded)
    }
    return map
  }, [orders])

  const stats = useMemo(() => {
    const openCount = returnRequests.filter((r) =>
      ['requested', 'authorized', 'in_transit'].includes(String(r.status))
    ).length
    const inspectedCount = returnRequests.filter((r) =>
      ['received', 'inspected'].includes(String(r.status))
    ).length
    const totalRefundedVal = refundTransactions.reduce(
      (acc, r) => acc + Number(r.totalRefundAmount ?? 0),
      0
    )
    const restockingFeesVal = returnRequests.reduce(
      (acc, r) => acc + Number(r.restockingFeeAmount ?? 0),
      0
    )
    return { openCount, inspectedCount, totalRefundedVal, restockingFeesVal }
  }, [returnRequests, refundTransactions])

  return (
    <Stack gap={6}>
      <PageHeader
        title="Returns (RMA) & Refund Ledger"
        description="Full RMA lifecycle with line-item quantity guards, carrier return tracking, and over-refund protection."
        icon={RotateCcw}
        badge={`${returnRequests.length} RMAs · ${refundTransactions.length} refunds`}
        actions={
          <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
            <AppButton
              variant="secondary"
              size="sm"
              icon={DollarSign}
              onClick={() => setCreateRefundOpen(true)}
            >
              Process Refund
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setCreateRmaOpen(true)}
            >
              Create RMA
            </AppButton>
          </Stack>
        }
      />

      <TopStatusBar
        columns={4}
        items={[
          {
            id: 'open-rmas',
            label: 'Open RMAs',
            value: stats.openCount,
            hint: `${returnRequests.length} total return requests`,
            icon: Clock,
            tone: stats.openCount > 0 ? 'warning' : 'success',
          },
          {
            id: 'awaiting-inspection',
            label: 'Received / Inspected',
            value: stats.inspectedCount,
            hint: 'Warehouse condition grading',
            icon: PackageCheck,
            tone: 'info',
          },
          {
            id: 'refunded-total',
            label: 'Total Refunded',
            value: money('USD', stats.totalRefundedVal),
            hint: `${refundTransactions.length} ledger transactions`,
            icon: DollarSign,
            tone: 'primary',
          },
          {
            id: 'restocking-fees',
            label: 'Restocking Fees Retained',
            value: money('USD', stats.restockingFeesVal),
            hint: 'Deducted from return payouts',
            icon: CheckCircle2,
            tone: 'success',
          },
        ]}
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Complete Create RMA Modal exposing all return_requests fields */}
      <FormModal
        isOpen={createRmaOpen}
        onOpenChange={setCreateRmaOpen}
        title="Create Return Request (RMA)"
        subtitle="Quantity limits enforced: requested ≤ ordered − already returned. Includes return carrier tracking and condition fields."
        submitLabel="Create RMA"
        action="/returns"
        fields={[
          {
            name: 'orderId',
            label: 'Order',
            kind: 'select',
            required: true,
            options: orders.map((o) => ({ value: String(o.id), label: String(o.orderNumber) })),
          },
          {
            name: 'orderLineItemId',
            label: 'Order line item (filtered by Order)',
            kind: 'select',
            required: true,
            options: (vals) => {
              const activeOrderId = vals.orderId
              const matching = activeOrderId
                ? orderLineItems.filter((li) => String((li as any).orderId) === activeOrderId)
                : []
              return matching.map((li) => ({
                value: String(li.id),
                label: `${li.sku} · ${li.title ?? li.sku} (ordered: ${li.quantityOrdered}, returnable: ${Math.max(0, Number(li.quantityOrdered) - Number((li as any).quantityReturned ?? 0))})`,
              }))
            },
            placeholder: 'Select an order first…',
          },
          { name: 'rmaNumber', label: 'RMA Number', required: true, placeholder: 'RMA-2026-001' },
          {
            name: 'returnReason',
            label: 'Return Reason',
            kind: 'select',
            required: true,
            options: RETURN_REASONS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
          },
          {
            name: 'resolutionType',
            label: 'Resolution Type',
            kind: 'select',
            default: 'refund',
            options: RESOLUTIONS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
          },
          {
            name: 'itemCondition',
            label: 'Item Condition',
            kind: 'select',
            default: 'unopened',
            options: ITEM_CONDITIONS,
          },
          {
            name: 'quantityRequested',
            label: 'Quantity Requested',
            kind: 'number',
            required: true,
            default: '1',
          },
          {
            name: 'restockingFeeTotal',
            label: 'Restocking Fee',
            kind: 'money',
            defaultCurrency: 'USD',
            default: '0',
          },
          {
            name: 'returnShippingCost',
            label: 'Return Shipping Cost',
            kind: 'money',
            defaultCurrency: 'USD',
            default: '0',
          },
          { name: 'returnCarrier', label: 'Return Carrier (UPS / FedEx / USPS)' },
          { name: 'returnTrackingNumber', label: 'Return Tracking Number' },
          {
            name: 'customerComments',
            label: 'Customer Comments',
            kind: 'textarea',
            fullWidth: true,
          },
          {
            name: 'internalNotes',
            label: 'Internal Warehouse / Operator Notes',
            kind: 'textarea',
            fullWidth: true,
          },
        ]}
      />

      {/* Complete Update RMA Modal */}
      <FormModal
        isOpen={!!updateRmaRow}
        onOpenChange={(o) => {
          if (!o) setUpdateRmaRow(null)
        }}
        title={`Update RMA ${String(updateRmaRow?.rmaNumber ?? '')}`}
        subtitle="Update RMA lifecycle status, warehouse inspection condition, received quantities, and return carrier tracking."
        submitLabel="Update RMA"
        action={updateRmaRow ? `/returns/${updateRmaRow.id}/status` : '/returns/placeholder/status'}
        initialValues={{
          status: String(updateRmaRow?.status ?? 'received'),
          itemCondition: String(updateRmaRow?.itemCondition ?? 'unopened'),
          resolutionType: String(updateRmaRow?.resolutionType ?? 'refund'),
          quantityApproved: String(
            updateRmaRow?.quantityApproved ?? updateRmaRow?.quantityRequested ?? 1
          ),
          quantityReceived: String(updateRmaRow?.quantityReceived ?? 0),
          refundTotal: moneyAmountString(updateRmaRow?.refundTotal ?? updateRmaRow?.refundAmount),
          refundTotal__currency: moneyCurrencyCode(
            updateRmaRow?.refundTotal ?? updateRmaRow?.refundAmount
          ),
          restockingFeeTotal: moneyAmountString(
            updateRmaRow?.restockingFeeTotal ?? updateRmaRow?.restockingFeeAmount
          ),
          restockingFeeTotal__currency: moneyCurrencyCode(
            updateRmaRow?.restockingFeeTotal ?? updateRmaRow?.restockingFeeAmount
          ),
          returnShippingCost: moneyAmountString(updateRmaRow?.returnShippingCost),
          returnShippingCost__currency: moneyCurrencyCode(updateRmaRow?.returnShippingCost),
          returnCarrier: String(updateRmaRow?.returnCarrier ?? ''),
          returnTrackingNumber: String(updateRmaRow?.returnTrackingNumber ?? ''),
          internalNotes: String(updateRmaRow?.internalNotes ?? ''),
        }}
        fields={[
          {
            name: 'status',
            label: 'RMA Status',
            kind: 'select',
            required: true,
            options: RETURN_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          {
            name: 'itemCondition',
            label: 'Inspected Item Condition',
            kind: 'select',
            options: ITEM_CONDITIONS,
          },
          {
            name: 'resolutionType',
            label: 'Resolution Type',
            kind: 'select',
            options: RESOLUTIONS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
          },
          { name: 'quantityApproved', label: 'Quantity Approved', kind: 'number' },
          { name: 'quantityReceived', label: 'Quantity Received', kind: 'number' },
          { name: 'refundTotal', label: 'Refund Amount', kind: 'money' },
          { name: 'restockingFeeTotal', label: 'Restocking Fee', kind: 'money' },
          { name: 'returnShippingCost', label: 'Return Shipping Cost', kind: 'money' },
          { name: 'returnCarrier', label: 'Return Carrier' },
          { name: 'returnTrackingNumber', label: 'Return Tracking Number' },
          {
            name: 'internalNotes',
            label: 'Internal Warehouse Inspection Notes',
            kind: 'textarea',
            fullWidth: true,
          },
        ]}
      />

      {/* Complete Process Refund Modal exposing all refund_transactions fields */}
      <FormModal
        isOpen={createRefundOpen}
        onOpenChange={setCreateRefundOpen}
        title="Record Local Refund"
        subtitle="Records a refund in the local ledger only. No payment is sent to the customer. Refunds are capped at the remaining order total."
        submitLabel="Record Refund"
        action="/refunds"
        fields={[
          {
            name: 'orderId',
            label: 'Order',
            kind: 'select',
            required: true,
            fullWidth: true,
            options: orders.map((o) => ({
              value: String(o.id),
              label: `${o.orderNumber} — Total: ${money(String((o as any).currencyCode ?? 'USD'), (o as any).totalAmount)} (Remaining refundable: ${money(String((o as any).currencyCode ?? 'USD'), refundableByOrder[String(o.id)] ?? 0)})`,
            })),
          },
          {
            name: 'returnRequestId',
            label: 'Linked RMA (optional)',
            kind: 'select',
            options: returnRequests.map((r) => ({
              value: String(r.id),
              label: String(r.rmaNumber),
            })),
          },
          {
            name: 'refundNumber',
            label: 'Refund Number',
            required: true,
            placeholder: 'REF-2026-001',
          },
          {
            name: 'itemsRefundTotal',
            label: 'Items Refund Amount',
            kind: 'money',
            required: true,
          },
          {
            name: 'shippingRefundTotal',
            label: 'Shipping Refund Amount',
            kind: 'money',
            default: '0',
          },
          { name: 'taxRefundTotal', label: 'Tax Refund Amount', kind: 'money', default: '0' },
          {
            name: 'restockingFeeTotal',
            label: 'Restocking Fee Deducted',
            kind: 'money',
            default: '0',
          },
          { name: 'reason', label: 'Refund Reason / Notes', kind: 'textarea', fullWidth: true },
        ]}
      />

      <PageSection
        title="Return Requests (RMA)"
        description="Full RMA lifecycle: requested → authorized → received → inspected → refunded/closed."
      >
        <ResponsiveDataView
          rows={returnRequests}
          searchKeys={['rmaNumber', 'returnReason', 'returnTrackingNumber']}
          filterKey="status"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'requested', label: 'Requested' },
            { value: 'received', label: 'Received' },
            { value: 'closed', label: 'Closed' },
          ]}
          createLabel="+ Create RMA"
          onCreateClick={() => setCreateRmaOpen(true)}
          toCard={(row) => ({
            title: String(row.rmaNumber),
            statusBadge: {
              label: String(row.status).replace(/_/g, ' '),
              variant: STATUS_TONES[String(row.status)] ?? 'neutral',
            },
            metrics: [
              { label: 'Reason', value: String(row.returnReason).replace(/_/g, ' ') },
              {
                label: 'Req / Appr / Recv',
                value: `${row.quantityRequested ?? 0}/${row.quantityApproved ?? 0}/${row.quantityReceived ?? 0}`,
              },
              {
                label: 'Refund',
                value: money(String(row.currencyCode ?? 'USD'), row.refundAmount),
              },
              {
                label: 'Fee',
                value: money(String(row.currencyCode ?? 'USD'), row.restockingFeeAmount),
              },
            ],
            actions: (
              <AppButton
                variant="secondary"
                size="xs"
                icon={RefreshCw}
                onClick={() => setUpdateRmaRow(row)}
              >
                Update Status
              </AppButton>
            ),
          })}
          columns={[
            col.text('rmaNumber', 'RMA #', 120),
            col.text('returnReason', 'Reason', 130),
            col.badge('status', 'Status', STATUS_TONES),
            col.text('quantityRequested', 'Req', 55),
            col.text('quantityApproved', 'Appr', 55),
            col.text('quantityReceived', 'Recv', 55),
            col.money('refundAmount', 'Refund', 'currencyCode'),
            col.money('restockingFeeAmount', 'Fee', 'currencyCode'),
            col.action('Actions', (row) => (
              <AppButton
                variant="secondary"
                size="xs"
                icon={RefreshCw}
                onClick={() => setUpdateRmaRow(row)}
              >
                Update
              </AppButton>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Refund Transactions"
        description="Every refund records external IDs for idempotent ledger reconciliation."
      >
        <ResponsiveDataView
          rows={refundTransactions}
          searchKeys={['refundNumber', 'status']}
          filterKey="status"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'processed', label: 'Processed' },
            { value: 'pending', label: 'Pending' },
          ]}
          createLabel="+ Process Refund"
          onCreateClick={() => setCreateRefundOpen(true)}
          toCard={(row) => ({
            title: String(row.refundNumber),
            statusBadge: {
              label: String(row.status),
              variant: STATUS_TONES[String(row.status)] ?? 'neutral',
            },
            metrics: [
              { label: 'Items', value: money(String(row.currencyCode), row.itemsRefundAmount) },
              {
                label: 'Shipping',
                value: money(String(row.currencyCode), row.shippingRefundAmount),
              },
              { label: 'Total', value: money(String(row.currencyCode), row.totalRefundAmount) },
              {
                label: 'Processed',
                value: row.processedAt
                  ? new Date(String(row.processedAt)).toLocaleDateString()
                  : '—',
              },
            ],
          })}
          columns={[
            col.text('refundNumber', 'Refund #', 130),
            col.badge('status', 'Status', STATUS_TONES),
            col.money('itemsRefundAmount', 'Items', 'currencyCode'),
            col.money('shippingRefundAmount', 'Shipping', 'currencyCode'),
            col.money('taxRefundAmount', 'Tax', 'currencyCode'),
            col.money('totalRefundAmount', 'Total', 'currencyCode'),
            col.date('processedAt', 'Processed'),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
