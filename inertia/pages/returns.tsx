import { Stack } from '@astryxdesign/core/Stack'
import AppLayout from '~/layouts/app'
import {
  PageSection,
  DataTable,
  SmartForm,
  StatusForm,
  col,
  STATUS_TONES,
  type Row,
} from '~/lib/ui'

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
}

Returns.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

const RETURN_STATUS = [
  'requested',
  'authorized',
  'rejected',
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
}: Props) {
  return (
    <Stack gap={4}>
      <PageSection
        title="Create return (RMA)"
        description="Quantity limits are enforced: requested/approved/received can never exceed what was ordered and not yet returned. Partial refunds plug into the over-refund guard."
      >
        <SmartForm
          action="/returns"
          submitLabel="Create RMA"
          fields={[
            {
              name: 'orderId',
              label: 'Order',
              kind: 'select',
              required: true,
              width: 200,
              options: orders.map((o) => ({ value: String(o.id), label: String(o.orderNumber) })),
            },
            {
              name: 'orderLineItemId',
              label: 'Order line',
              kind: 'select',
              required: true,
              width: 220,
              options: orderLineItems.map((li) => ({
                value: String(li.id),
                label: `${li.sku} · qty ${li.quantityOrdered}`,
              })),
            },
            { name: 'rmaNumber', label: 'RMA number', required: true, width: 150 },
            {
              name: 'returnReason',
              label: 'Reason',
              kind: 'select',
              required: true,
              width: 180,
              options: RETURN_REASONS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
            },
            {
              name: 'resolutionType',
              label: 'Resolution',
              kind: 'select',
              width: 160,
              default: 'refund',
              options: RESOLUTIONS.map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
            },
            {
              name: 'quantityRequested',
              label: 'Qty requested',
              kind: 'number',
              required: true,
              default: '1',
              width: 120,
            },
            { name: 'restockingFeeAmount', label: 'Restocking fee', kind: 'number', width: 130 },
            { name: 'customerComments', label: 'Customer comments', width: 250 },
          ]}
        />
      </PageSection>

      <PageSection
        title="Return requests"
        description="Full RMA lifecycle: requested → authorized → received → inspected → refunded/closed."
      >
        <DataTable
          rows={returnRequests}
          empty="No return requests."
          columns={[
            col.text('rmaNumber', 'RMA #', 120),
            col.text('returnReason', 'Reason', 130),
            col.badge('status', 'Status', STATUS_TONES),
            col.text('quantityRequested', 'Req', 55),
            col.text('quantityApproved', 'Appr', 55),
            col.text('quantityReceived', 'Recv', 55),
            col.money('refundAmount', 'Refund', 'currencyCode'),
            col.money('restockingFeeAmount', 'Fee', 'currencyCode'),
            col.action('Status', (row) => (
              <StatusForm
                action={`/returns/${row.id}/status`}
                options={RETURN_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                current={String(row.status ?? 'requested')}
                label="Return status"
              />
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Process refund"
        description="Refunds are capped at the order total minus already-refunded amounts (over-refund protection), and can be split into partial refunds."
      >
        <SmartForm
          action="/refunds"
          submitLabel="Process refund"
          fields={[
            {
              name: 'orderId',
              label: 'Order',
              kind: 'select',
              required: true,
              width: 200,
              options: orders.map((o) => ({ value: String(o.id), label: String(o.orderNumber) })),
            },
            {
              name: 'returnRequestId',
              label: 'Linked RMA (optional)',
              kind: 'select',
              width: 200,
              options: returnRequests.map((r) => ({
                value: String(r.id),
                label: String(r.rmaNumber),
              })),
            },
            { name: 'refundNumber', label: 'Refund number', required: true, width: 160 },
            {
              name: 'itemsRefundAmount',
              label: 'Items refund',
              kind: 'number',
              required: true,
              width: 130,
            },
            { name: 'shippingRefundAmount', label: 'Shipping refund', kind: 'number', width: 140 },
            { name: 'taxRefundAmount', label: 'Tax refund', kind: 'number', width: 120 },
            {
              name: 'restockingFeeDeducted',
              label: 'Restocking deducted',
              kind: 'number',
              width: 150,
            },
            { name: 'reason', label: 'Reason', width: 220 },
          ]}
        />
      </PageSection>

      <PageSection
        title="Refund transactions"
        description="Every refund records external IDs for idempotent marketplace reconciliation."
      >
        <DataTable
          rows={refundTransactions}
          empty="No refunds processed."
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
