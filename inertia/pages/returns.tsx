import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  STATUS_TONES,
  money,
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import { RotateCcw } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns (RMA) & Refund Ledger"
        description="Full RMA lifecycle with line-item quantity guards and over-refund protection."
        icon={RotateCcw}
        badge={`${returnRequests.length} RMAs · ${refundTransactions.length} refunds`}
        actions={
          <>
            <Button
              label="+ Process Refund"
              variant="secondary"
              onClick={() => setCreateRefundOpen(true)}
            />
            <Button label="+ Create RMA" variant="primary" onClick={() => setCreateRmaOpen(true)} />
          </>
        }
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      <FormModal
        isOpen={createRmaOpen}
        onOpenChange={setCreateRmaOpen}
        title="Create Return (RMA)"
        subtitle="Quantity limits enforced: requested ≤ ordered − already returned."
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
          { name: 'rmaNumber', label: 'RMA number', required: true },
          {
            name: 'returnReason',
            label: 'Return reason',
            kind: 'select',
            required: true,
            options: RETURN_REASONS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
          },
          {
            name: 'resolutionType',
            label: 'Resolution type',
            kind: 'select',
            default: 'refund',
            options: RESOLUTIONS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
          },
          {
            name: 'quantityRequested',
            label: 'Quantity requested',
            kind: 'number',
            required: true,
            default: '1',
          },
          { name: 'restockingFeeAmount', label: 'Restocking fee', kind: 'number' },
          {
            name: 'customerComments',
            label: 'Customer comments',
            kind: 'textarea',
            fullWidth: true,
          },
        ]}
      />

      <FormModal
        isOpen={!!updateRmaRow}
        onOpenChange={(o) => {
          if (!o) setUpdateRmaRow(null)
        }}
        title={`Update RMA ${String(updateRmaRow?.rmaNumber ?? '')}`}
        submitLabel="Update RMA"
        action={updateRmaRow ? `/returns/${updateRmaRow.id}/status` : '/returns/placeholder/status'}
        initialValues={{
          status: String(updateRmaRow?.status ?? 'received'),
          itemCondition: String(updateRmaRow?.itemCondition ?? ''),
        }}
        fields={[
          {
            name: 'status',
            label: 'RMA status',
            kind: 'select',
            required: true,
            options: RETURN_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          {
            name: 'itemCondition',
            label: 'Inspected item condition',
            kind: 'select',
            options: [
              { value: 'new', label: 'New' },
              { value: 'used', label: 'Used' },
              { value: 'damaged', label: 'Damaged' },
              { value: 'defective', label: 'Defective' },
            ],
          },
        ]}
      />

      <FormModal
        isOpen={createRefundOpen}
        onOpenChange={setCreateRefundOpen}
        title="Process Refund"
        subtitle="Refunds are capped at order total − already-refunded (over-refund guard)."
        submitLabel="Process Refund"
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
          { name: 'refundNumber', label: 'Refund number', required: true },
          { name: 'itemsRefundAmount', label: 'Items refund amount', kind: 'number', required: true },
          { name: 'shippingRefundAmount', label: 'Shipping refund amount', kind: 'number' },
          { name: 'taxRefundAmount', label: 'Tax refund amount', kind: 'number' },
          { name: 'restockingFeeDeducted', label: 'Restocking fee deducted', kind: 'number' },
          { name: 'reason', label: 'Refund reason / notes', kind: 'textarea', fullWidth: true },
        ]}
      />

      <PageSection
        title="Return Requests (RMA)"
        description="Full RMA lifecycle: requested → authorized → received → inspected → refunded/closed."
      >
        <ResponsiveDataView
          rows={returnRequests}
          searchKeys={['rmaNumber', 'returnReason']}
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
              <Button
                label="Update status"
                variant="secondary"
                size="sm"
                onClick={() => setUpdateRmaRow(row)}
              />
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
              <Button
                label="Update"
                variant="secondary"
                size="sm"
                onClick={() => setUpdateRmaRow(row)}
              />
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
    </div>
  )
}
