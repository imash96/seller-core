import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
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
import { OrderCard } from '~/modules/order/order-card'
import { OrderDetailsDrawer } from '~/modules/order/order-detail-drawer'
import { Package, Download, CheckSquare } from 'lucide-react'

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
    setSelectedIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((item) => item !== id)
    )
  }

  const handleBulkStatus = () => {
    if (selectedIds.length === 0) return
    router.post(
      '/orders/bulk/status',
      { ids: selectedIds, status: bulkStatus },
      { preserveScroll: true, onSuccess: () => setSelectedIds([]) }
    )
  }

  const handleBulkExport = () => {
    router.post('/orders/bulk/export', { ids: selectedIds }, { preserveScroll: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders & Multi-Currency P&L"
        description="Multi-channel order management with real-time COGS, marketplace fee waterfall, and multi-currency net profit."
        icon={Package}
        badge={`${orders.length} orders`}
        actions={
          <>
            <button
              type="button"
              onClick={handleBulkExport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <Button
              label="Bulk Import JSON"
              variant="secondary"
              onClick={() => setBulkOpen(true)}
            />
            <Button label="+ Create Order" variant="primary" onClick={() => setCreateOpen(true)} />
          </>
        }
      />

      {selectedIds.length > 0 && (
        <div className="px-4 py-3 rounded-xl border border-primary/30 bg-primary/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span>{selectedIds.length} order(s) selected</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="h-8 px-2.5 rounded-lg text-xs border border-border bg-card text-foreground font-medium"
            >
              {ORDER_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <Button
              label="Apply Bulk Status"
              variant="primary"
              size="sm"
              onClick={handleBulkStatus}
            />
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
            />
          </div>
        </div>
      )}

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Featured Order Cards */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {orders.slice(0, 4).map((order) => (
            <OrderCard
              key={String(order.id)}
              order={order}
              selected={selectedIds.includes(String(order.id))}
              onSelect={toggleSelect}
              onOpenDetail={(o) => setDetailRow(o)}
              onEditStatus={(o) => setEditRow(o)}
              onDelete={(o) => {
                if (window.confirm(`Delete order ${o.orderNumber}?`)) {
                  router.post(`/orders/${o.id}/delete`, {}, { preserveScroll: true })
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Create Order Modal — Grouped into 3 Logical Sections */}
      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Order"
        subtitle="Manual order entry with automatic P&L waterfall calculation (numeric(14,2) precision)."
        submitLabel="Create Order"
        action="/orders"
        fields={[
          {
            name: 'orderNumber',
            label: 'Order number',
            required: true,
            section: '1. Order & Channel',
          },
          { name: 'externalOrderId', label: 'External order ID', section: '1. Order & Channel' },
          {
            name: 'sellerAccountId',
            label: 'Seller account',
            kind: 'select',
            section: '1. Order & Channel',
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
            section: '1. Order & Channel',
            options: [
              { value: 'direct', label: 'Direct' },
              { value: 'amazon', label: 'Amazon' },
              { value: 'ebay', label: 'eBay' },
              { value: 'shopify', label: 'Shopify' },
              { value: 'walmart', label: 'Walmart' },
            ],
          },
          {
            name: 'currencyCode',
            label: 'Currency',
            default: 'USD',
            section: '1. Order & Channel',
          },
          {
            name: 'exchangeRate',
            label: 'Exchange rate',
            kind: 'number',
            default: '1',
            section: '1. Order & Channel',
          },
          {
            name: 'customerFullName',
            label: 'Customer full name',
            required: true,
            section: '2. Customer & Shipping Address',
          },
          {
            name: 'customerEmail',
            label: 'Customer email',
            kind: 'email',
            section: '2. Customer & Shipping Address',
          },
          {
            name: 'shippingLine1',
            label: 'Ship-to street line 1',
            section: '2. Customer & Shipping Address',
          },
          {
            name: 'shippingCity',
            label: 'City',
            section: '2. Customer & Shipping Address',
          },
          {
            name: 'shippingPostalCode',
            label: 'Postal code',
            section: '2. Customer & Shipping Address',
          },
          {
            name: 'shippingCountryCode',
            label: 'Country code (ISO-2)',
            default: 'US',
            section: '2. Customer & Shipping Address',
          },
          {
            name: 'sku',
            label: 'Line Item SKU',
            required: true,
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'itemTitle',
            label: 'Item title',
            required: true,
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'quantityOrdered',
            label: 'Quantity ordered',
            kind: 'number',
            required: true,
            default: '1',
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'unitPrice',
            label: 'Unit price',
            kind: 'number',
            required: true,
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'unitCostAmount',
            label: 'Unit COGS cost',
            kind: 'number',
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'taxAmount',
            label: 'Tax amount',
            kind: 'number',
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'discountAmount',
            label: 'Discount amount',
            kind: 'number',
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'shippingChargedAmount',
            label: 'Shipping charged to buyer',
            kind: 'number',
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'shippingCostAmount',
            label: 'Actual shipping cost',
            kind: 'number',
            section: '3. Line Item & P&L Economics',
          },
        ]}
      />

      {/* Bulk Import Modal */}
      <FormModal
        isOpen={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Bulk Marketplace Order Import"
        subtitle="Idempotent JSON import — duplicates are skipped and raw payloads are stored with secret redaction."
        submitLabel="Import Orders"
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
            fullWidth: true,
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
        title={`Update Order ${editRow?.orderNumber ?? ''}`}
        subtitle="Change order status — marking delivered queues a customer delivery notification."
        submitLabel="Update Status"
        action={editRow ? `/orders/${editRow.id}/status` : '/orders/placeholder/status'}
        initialValues={{ status: String(editRow?.status ?? 'confirmed') }}
        fields={[
          {
            name: 'status',
            label: 'Order status',
            kind: 'select',
            required: true,
            fullWidth: true,
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
        description="Search, filter, sort, or switch between card grid and table views."
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
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  label="Inspect P&L"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDetailRow(row)}
                />
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
              </div>
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
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditRow(row)}
                />
                <Button
                  label="P&L"
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
              </div>
            )),
          ]}
        />
      </PageSection>
    </div>
  )
}
