import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Button } from '@astryxdesign/core/Button'
import {
  PageSection,
  RowAction,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  STATUS_TONES,
  money,
  short,
  type Row,
} from '~/lib/ui'
import { ModulePageHeader } from '~/modules/common/page-header'
import { OrderCard } from '~/modules/order/order-card'
import { OrderDetailsDrawer } from '~/modules/order/order-detail-drawer'
import { Download, CheckSquare } from 'lucide-react'

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

export default function Orders({ orders, sellerAccounts, savedViews }: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [detailRow, setDetailRow] = useState<Row | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState('confirmed')

  const sampleJson = JSON.stringify(
    [
      {
        orderNumber: 'AMZ-2026-901',
        externalOrderId: 'EXT-901',
        customerFullName: 'Jane Doe',
        currencyCode: 'USD',
        lines: [{ sku: 'SKU-001', title: 'Wireless Mouse', quantityOrdered: 2, unitPrice: 29.99 }],
      },
    ],
    null,
    2
  )

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((item) => item !== id)))
  }

  const handleBulkStatus = () => {
    if (selectedIds.length === 0) return
    router.post(
      '/orders/bulk/status',
      { ids: selectedIds, status: bulkStatus },
      { preserveScroll: true, onSuccess: () => setSelectedIds([]) }
    )
  }

  return (
    <Stack gap={4}>
      <ModulePageHeader
        title="Orders & P&L"
        subtitle="Multi-channel order management with real-time COGS, marketplace fee waterfall, and multi-currency net profit."
        badge={`${orders.length} orders`}
        actions={
          <>
            <form method="POST" action="/orders/bulk/export" className="inline">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </form>
            <Button label="Bulk Import JSON" variant="secondary" onClick={() => setBulkOpen(true)} />
            <Button label="+ Create Order" variant="primary" onClick={() => setCreateOpen(true)} />
          </>
        }
      />

      {selectedIds.length > 0 ? (
        <div className="px-4 py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>{selectedIds.length} orders selected</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
            >
              {ORDER_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <Button label="Apply Bulk Status" variant="primary" size="sm" onClick={handleBulkStatus} />
            <Button label="Clear" variant="ghost" size="sm" onClick={() => setSelectedIds([])} />
          </div>
        </div>
      ) : null}

      {savedViews && savedViews.length > 0 ? <SavedViewsBar views={savedViews} /> : null}

      {/* Featured Card Grid from inertia-old */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.slice(0, 6).map((order) => (
          <OrderCard
            key={String(order.id)}
            order={order}
            selected={selectedIds.includes(String(order.id))}
            onSelect={toggleSelect}
            onView={(o) => setDetailRow(o)}
            onEdit={(o) => setEditRow(o)}
            onDelete={(o) => {
              if (window.confirm(`Delete order ${o.orderNumber}?`)) {
                router.post(`/orders/${o.id}/delete`, {}, { preserveScroll: true })
              }
            }}
          />
        ))}
      </div>

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
        presetActions={[
          {
            label: 'Load Sample JSON Payload',
            values: {
              idempotencyKey: `batch-${Date.now()}`,
              ordersJson: sampleJson,
            },
          },
        ]}
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
      />

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

      {/* Slide-over Order Details & P&L Waterfall Drawer */}
      <OrderDetailsDrawer
        order={detailRow}
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        onEditStatus={(o) => {
          setDetailRow(null)
          setEditRow(o)
        }}
      />

      <PageSection
        title="All Workspace Orders"
        description="Search, filter, sort, or switch between table and card views."
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
                <Button label="Inspect P&L" variant="ghost" size="sm" onClick={() => setDetailRow(row)} />
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
                  label="P&L Drawer"
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
    </Stack>
  )
}
