import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Heading } from '@astryxdesign/core/Heading'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Grid } from '@astryxdesign/core/Grid'
import { Divider } from '@astryxdesign/core/Divider'
import { Banner } from '@astryxdesign/core/Banner'
import AppLayout from '~/layouts/app'
import {
  PageSection,
  DataTable,
  SmartForm,
  RowAction,
  StatusForm,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  STATUS_TONES,
  money,
  short,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'
import { Pencil, Eye, Trash2, Plus } from 'lucide-react'

type Props = {
  orders: Row[]
  customers: Row[]
  sellerAccounts: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  orderLineItems: Row[]
  financeCategories: Row[]
  savedViews?: Row[]
}

Orders.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

const ORDER_STATUS = [
  'draft',
  'pending',
  'confirmed',
  'processing',
  'partially_fulfilled',
  'fulfilled',
  'delivered',
  'cancelled',
  'on_hold',
]

export default function Orders({ orders, sellerAccounts, customers, savedViews }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [detailRow, setDetailRow] = useState<Row | null>(null)

  const sampleJson = JSON.stringify(
    [
      {
        orderNumber: 'AMZ-1',
        externalOrderId: 'X1',
        customerFullName: 'Jane Doe',
        currencyCode: 'USD',
        lines: [{ sku: 'SKU-001', title: 'Wireless Mouse', quantityOrdered: 2, unitPrice: 29.99 }],
      },
    ],
    null,
    2
  )

  return (
    <Stack gap={4}>
      {/* Toolbar */}
      <Card padding={4}>
        <Stack direction="horizontal" gap={3} wrap="wrap" align="center">
          <Button label="+ Create Order" variant="primary" onClick={() => setCreateOpen(true)} />
          <Button label="Bulk Import" variant="secondary" onClick={() => setBulkOpen(true)} />
          <Text type="supporting" as="div">
            {orders.length} orders in workspace
          </Text>
        </Stack>
      </Card>

      {savedViews && savedViews.length > 0 ? <SavedViewsBar views={savedViews} /> : null}

      {/* Create Order Modal */}
      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Create order"
        subtitle="Manual order entry with P&L calculation — all amounts use numeric(14,2) precision."
        submitLabel="Create order"
        action="/orders"
        fields={[
          { name: 'orderNumber', label: 'Order number', required: true },
          { name: 'externalOrderId', label: 'External order ID' },
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
            name: 'marketplaceCode',
            label: 'Marketplace',
            kind: 'select',
            default: 'direct',
            options: [
              { value: 'direct', label: 'Direct' },
              { value: 'amazon', label: 'Amazon' },
              { value: 'ebay', label: 'eBay' },
              { value: 'shopify', label: 'Shopify' },
              { value: 'walmart', label: 'Walmart' },
            ],
          },
          { name: 'currencyCode', label: 'Currency', default: 'USD' },
          { name: 'exchangeRate', label: 'Exchange rate', kind: 'number', default: '1' },
          { name: 'customerFullName', label: 'Customer name', required: true },
          { name: 'customerEmail', label: 'Customer email', kind: 'email' },
          { name: 'sku', label: 'SKU', required: true },
          { name: 'itemTitle', label: 'Item title', required: true },
          { name: 'quantityOrdered', label: 'Qty', kind: 'number', required: true, default: '1' },
          { name: 'unitPrice', label: 'Unit price', kind: 'number', required: true },
          { name: 'unitCostAmount', label: 'Unit cost', kind: 'number' },
          { name: 'taxAmount', label: 'Tax', kind: 'number' },
          { name: 'discountAmount', label: 'Discount', kind: 'number' },
          { name: 'shippingChargedAmount', label: 'Ship charged', kind: 'number' },
          { name: 'shippingCostAmount', label: 'Ship cost', kind: 'number' },
          { name: 'shippingLine1', label: 'Ship-to street' },
          { name: 'shippingCity', label: 'City' },
          { name: 'shippingPostalCode', label: 'Postal code' },
          { name: 'shippingCountryCode', label: 'Country', default: 'US' },
        ]}
      />

      {/* Bulk Import Modal */}
      <FormModal
        isOpen={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Bulk marketplace import"
        subtitle="Idempotent JSON import — duplicates are skipped, raw payloads stored redacted."
        submitLabel="Import orders"
        action="/orders/bulk-import"
        fields={[
          { name: 'idempotencyKey', label: 'Import idempotency key', required: true },
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
          }}
        />
      </FormModal>

      {/* Update Order Status Modal */}
      <FormModal
        isOpen={!!editRow}
        onOpenChange={(open) => {
          if (!open) setEditRow(null)
        }}
        title={`Update order ${editRow?.orderNumber ?? ''}`}
        subtitle="Change order status — delivery triggers customer notification."
        submitLabel="Update status"
        action={editRow ? `/orders/${editRow.id}/status` : '/orders/placeholder/status'}
        initialValues={{ status: String(editRow?.status ?? 'confirmed') }}
        fields={[
          {
            name: 'status',
            label: 'Order status',
            kind: 'select',
            required: true,
            options: ORDER_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
        ]}
      />

      {/* Order Detail Modal */}
      {detailRow ? (
        <Card padding={5}>
          <Stack gap={3}>
            <Stack direction="horizontal" gap={2} align="center">
              <Heading level={3}>Order {String(detailRow.orderNumber)} detail</Heading>
              <Badge
                variant={(STATUS_TONES[String(detailRow.status)] as any) ?? 'neutral'}
                label={String(detailRow.status)}
              />
            </Stack>
            <Grid columns={{ minWidth: 160, max: 3 }} gap={3}>
              <Stack gap={1}>
                <Text type="supporting" as="div">
                  Total
                </Text>
                <Text type="body" as="div" weight="bold">
                  {money(String(detailRow.currencyCode), detailRow.totalAmount)}
                </Text>
              </Stack>
              <Stack gap={1}>
                <Text type="supporting" as="div">
                  Net Profit
                </Text>
                <Text type="body" as="div" weight="bold">
                  {money(String(detailRow.reportingCurrencyCode), detailRow.netProfitAmount)}
                </Text>
              </Stack>
              <Stack gap={1}>
                <Text type="supporting" as="div">
                  Customer
                </Text>
                <Text type="body" as="div">
                  {String(
                    (detailRow.customer as any)?.fullName ?? detailRow.customerFullName ?? '—'
                  )}
                </Text>
              </Stack>
            </Grid>
            {Array.isArray(detailRow.lineItems) && detailRow.lineItems.length > 0 ? (
              <DataTable
                rows={detailRow.lineItems as Row[]}
                columns={[
                  col.text('sku', 'SKU', 120),
                  col.text('title', 'Title', 180),
                  col.text('quantityOrdered', 'Qty', 60),
                  col.money('unitPrice', 'Unit price'),
                ]}
              />
            ) : null}
            <Button label="Close" variant="secondary" onClick={() => setDetailRow(null)} />
          </Stack>
        </Card>
      ) : null}

      <PageSection
        title="Orders"
        description="All orders in your workspace with P&L and fulfillment state."
        actions={<Button label="Table / Card toggle via toolbar" variant="ghost" size="sm" />}
      >
        <ResponsiveDataView
          rows={orders}
          searchKeys={['orderNumber', 'externalOrderId', 'status', 'customerFullName']}
          filterKey="status"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'processing', label: 'Processing' },
            { value: 'pending', label: 'Pending' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          pageSizeOptions={[10, 25, 50]}
          createLabel="+ Create Order"
          onCreateClick={() => setCreateOpen(true)}
          toCard={(row) => ({
            title: String(row.orderNumber),
            idBadge: short(row.id),
            statusBadge: {
              label: String(row.status).replace(/_/g, ' '),
              variant: STATUS_TONES[String(row.status)] ?? 'neutral',
            },
            metrics: [
              { label: 'Total', value: money(String(row.currencyCode), row.totalAmount) },
              {
                label: 'Net Profit',
                value: money(String(row.reportingCurrencyCode), row.netProfitAmount),
              },
              { label: 'Marketplace', value: String(row.marketplaceCode ?? '—') },
              { label: 'Ordered', value: new Date(String(row.orderedAt)).toLocaleDateString() },
            ],
            actions: (
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <Button label="View" variant="ghost" size="sm" onClick={() => setDetailRow(row)} />
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditRow(row)}
                />
                <RowAction
                  action={`/orders/${row.id}/delete`}
                  label="Delete"
                  variant="ghost"
                  confirmText="Delete this order and its lines?"
                />
              </Stack>
            ),
          })}
          columns={[
            col.text('orderNumber', 'Order #', 140),
            col.text('externalOrderId', 'External ID', 120),
            col.badge('status', 'Status', STATUS_TONES),
            col.badge('paymentStatus', 'Payment', {
              paid: 'success',
              unpaid: 'warning',
              refunded: 'neutral',
              chargeback: 'error',
            }),
            col.badge('fulfillmentStatus', 'Fulfillment', STATUS_TONES),
            col.money('totalAmount', 'Total', 'currencyCode'),
            col.money('marketplaceFeesAmount', 'Fees', 'currencyCode'),
            col.money('cogsAmount', 'COGS', 'currencyCode'),
            col.money('netProfitAmount', 'Net profit', 'reportingCurrencyCode'),
            col.date('orderedAt', 'Ordered'),
            col.action('Actions', (row) => (
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditRow(row)}
                />
                <Button
                  label="Detail"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDetailRow(row)}
                />
                <RowAction
                  action={`/orders/${row.id}/delete`}
                  label="Delete"
                  variant="ghost"
                  confirmText="Delete this order and its lines?"
                />
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Order economics"
        description="Gross sales, fees and refunds per order in reporting currency."
      >
        <ResponsiveDataView
          rows={orders}
          searchKeys={['orderNumber']}
          toCard={(row) => ({
            title: String(row.orderNumber),
            metrics: [
              { label: 'Subtotal', value: money(String(row.currencyCode), row.subtotalAmount) },
              {
                label: 'Gross Profit',
                value: money(String(row.reportingCurrencyCode), row.grossProfitAmount),
              },
              { label: 'Refunded', value: money(String(row.currencyCode), row.refundedAmount) },
            ],
          })}
          columns={[
            col.text('orderNumber', 'Order #', 140),
            col.money('subtotalAmount', 'Subtotal', 'currencyCode'),
            col.money('shippingChargedAmount', 'Ship charged', 'currencyCode'),
            col.money('paymentProcessingFeesAmount', 'Payment fees', 'currencyCode'),
            col.money('shippingCostAmount', 'Ship cost', 'currencyCode'),
            col.money('refundedAmount', 'Refunded', 'currencyCode'),
            col.money('grossProfitAmount', 'Gross profit', 'reportingCurrencyCode'),
            col.action('Totals', (row) => (
              <span style={{ fontSize: 12 }}>
                {money(String(row.reportingCurrencyCode ?? 'USD'), row.reportingTotalAmount)}{' '}
                reporting
              </span>
            )),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
