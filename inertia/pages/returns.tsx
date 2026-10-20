import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import AppLayout from '~/layouts/app'
import {
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

Returns.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

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
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [updateRmaRow, setUpdateRmaRow] = useState<Row | null>(null)
  const [createRefundOpen, setCreateRefundOpen] = useState(false)

  const filteredLineItems = useMemo(() => {
    if (!selectedOrderId) return []
    return orderLineItems.filter((li) => String((li as any).orderId) === selectedOrderId)
  }, [selectedOrderId, orderLineItems])

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
    <Stack gap={4}>
      <Card padding={4}>
        <Stack direction="horizontal" gap={3} wrap="wrap" align="center">
          <Button label="+ Create RMA" variant="primary" onClick={() => setCreateRmaOpen(true)} />
          <Button
            label="+ Process Refund"
            variant="secondary"
            onClick={() => setCreateRefundOpen(true)}
          />
          <Text type="supporting" as="div">
            {returnRequests.length} RMAs · {refundTransactions.length} refunds
          </Text>
        </Stack>
      </Card>
      {savedViews && savedViews.length > 0 ? <SavedViewsBar views={savedViews} /> : null}

      <FormModal
        isOpen={createRmaOpen}
        onOpenChange={(o) => {
          setCreateRmaOpen(o)
          if (!o) setSelectedOrderId('')
        }}
        title="Create return (RMA)"
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
            label: 'Order line',
            kind: 'select',
            required: true,
            options:
              filteredLineItems.length > 0
                ? filteredLineItems.map((li) => ({
                    value: String(li.id),
                    label: `${li.sku} · qty ${li.quantityOrdered} · remaining ${Math.max(0, Number(li.quantityOrdered) - Number((li as any).quantityReturned ?? 0))}`,
                  }))
                : [
                    {
                      value: '',
                      label: selectedOrderId
                        ? 'No line items for this order'
                        : 'Select an order first',
                    },
                  ],
          },
          { name: 'rmaNumber', label: 'RMA number', required: true },
          {
            name: 'returnReason',
            label: 'Reason',
            kind: 'select',
            required: true,
            options: RETURN_REASONS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
          },
          {
            name: 'resolutionType',
            label: 'Resolution',
            kind: 'select',
            default: 'refund',
            options: RESOLUTIONS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
          },
          {
            name: 'quantityRequested',
            label: 'Qty requested',
            kind: 'number',
            required: true,
            default: '1',
          },
          { name: 'restockingFeeAmount', label: 'Restocking fee', kind: 'number' },
          { name: 'customerComments', label: 'Customer comments' },
        ]}
      >
        <Stack gap={2}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Filter line items by order</label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              fontSize: 14,
            }}
          >
            <option value="">— Select order —</option>
            {orders.map((o) => (
              <option key={String(o.id)} value={String(o.id)}>
                {String(o.orderNumber)} —{' '}
                {money(String((o as any).currencyCode ?? 'USD'), (o as any).totalAmount)}
              </option>
            ))}
          </select>
          <Text type="supporting" as="div">
            {filteredLineItems.length} line items for selected order
          </Text>
        </Stack>
      </FormModal>

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
            label: 'Status',
            kind: 'select',
            required: true,
            options: RETURN_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          {
            name: 'itemCondition',
            label: 'Item condition',
            kind: 'select',
            options: [
              { value: '', label: '—' },
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
        title="Process refund"
        subtitle="Refunds capped at order total − already-refunded (over-refund guard)."
        submitLabel="Process refund"
        action="/refunds"
        fields={[
          {
            name: 'orderId',
            label: 'Order',
            kind: 'select',
            required: true,
            options: orders.map((o) => ({
              value: String(o.id),
              label: `${o.orderNumber} — ${money(String((o as any).currencyCode ?? 'USD'), (o as any).totalAmount)} (refundable: ${money(String((o as any).currencyCode ?? 'USD'), refundableByOrder[String(o.id)] ?? 0)})`,
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
          { name: 'itemsRefundAmount', label: 'Items refund', kind: 'number', required: true },
          { name: 'shippingRefundAmount', label: 'Shipping refund', kind: 'number' },
          { name: 'taxRefundAmount', label: 'Tax refund', kind: 'number' },
          { name: 'restockingFeeDeducted', label: 'Restocking deducted', kind: 'number' },
          { name: 'reason', label: 'Reason' },
        ]}
      />

      <PageSection
        title="Return requests"
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
        title="Refund transactions"
        description="Every refund records external IDs for idempotent reconciliation."
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
