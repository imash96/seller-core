import { useState, useMemo } from 'react'
import { router } from '@inertiajs/react'
import {
  PageHeader,
  PageSection,
  TopStatusBar,
  AppButton,
  AppInput,
  AppSelect,
  FormModal,
  SavedViewsBar,
  PaginationBar,
  convertToLocale,
  type Row,
} from '~/lib/ui'
import { OrderCard } from '~/modules/order/order-card'
import { OrderDetailsDrawer } from '~/modules/order/order-detail-drawer'
import {
  Package,
  Download,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldAlert,
  Upload,
  Plus,
  Search,
} from 'lucide-react'

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

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [customerSegmentFilter, setCustomerSegmentFilter] = useState<
    'all' | 'repeat' | 'fraud_risk'
  >('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const sampleJson = JSON.stringify(
    [
      {
        orderNumber: 'AMZ-2026-901',
        externalOrderId: 'EXT-901',
        customerFullName: 'Jane Doe',
        currencyCode: 'USD',
        lines: [
          {
            sku: 'MCTDC01-BLK-NP-RG-M',
            title: 'Leather Duster Coat',
            quantityOrdered: 1,
            currencyCode: 'USD',
            unitPrice: 239.99,
          },
          {
            sku: 'MJKBK03-BLK-NP-SL-L',
            title: 'Moto Biker Jacket',
            quantityOrdered: 1,
            currencyCode: 'USD',
            unitPrice: 259.99,
          },
        ],
      },
    ],
    null,
    2
  )

  // KPI Metrics for TopStatusBar
  const stats = useMemo(() => {
    let grossRevenue = 0
    let netProfit = 0
    let unfulfilled = 0
    let flaggedOrRepeat = 0

    for (const o of orders) {
      grossRevenue += Number(o.totalAmount ?? 0)
      netProfit += Number(o.netProfitAmount ?? 0)
      if (
        ['pending', 'confirmed', 'processing', 'partially_fulfilled'].includes(String(o.status))
      ) {
        unfulfilled++
      }
      const cust = (o.customer as Row) ?? {}
      const risk = String(cust.riskLevel ?? 'low').toLowerCase()
      if (risk === 'high' || risk === 'critical' || Number(cust.riskScore ?? 0) >= 60) {
        flaggedOrRepeat++
      }
    }
    return { grossRevenue, netProfit, unfulfilled, flaggedOrRepeat }
  }, [orders])

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && String(o.status) !== statusFilter) return false
      if (channelFilter !== 'all' && String(o.marketplaceCode) !== channelFilter) return false

      const cust = (o.customer as Row) ?? {}
      if (customerSegmentFilter === 'repeat') {
        const isRep = Boolean(cust.isRepeatCustomer) || Number(cust.ordersCount ?? 1) > 1
        if (!isRep) return false
      } else if (customerSegmentFilter === 'fraud_risk') {
        const risk = String(cust.riskLevel ?? 'low').toLowerCase()
        const highRisk =
          risk === 'high' ||
          risk === 'critical' ||
          Number(cust.riskScore ?? 0) >= 60 ||
          ((cust.riskSignals as Row[]) ?? []).length > 0
        if (!highRisk) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const hay = [
          o.orderNumber,
          o.externalOrderId,
          o.marketplaceCode,
          cust.fullName,
          cust.email,
          ...((o.lineItems as Row[]) ?? []).map((li) => `${li.sku} ${li.title}`),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [orders, statusFilter, channelFilter, customerSegmentFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, currentPage])

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
        description="3-section order cards featuring stacked product thumbnails, multi-currency OrderPrice & OrderLineItemPrice P&L waterfall economics, and customer repeat/fraud intelligence."
        icon={Package}
        badge={`${orders.length} orders`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <AppButton
              label="Export CSV"
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleBulkExport}
            />
            <AppButton
              label="Bulk Import JSON"
              variant="secondary"
              size="sm"
              icon={Upload}
              onClick={() => setBulkOpen(true)}
            />
            <AppButton
              label="+ Create Order"
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setCreateOpen(true)}
            />
          </div>
        }
      />

      {/* Top Interactive Status Bar */}
      <TopStatusBar
        columns={4}
        items={[
          {
            label: 'Total Orders',
            value: String(orders.length),
            sublabel: `Gross Revenue: ${convertToLocale({ amount: stats.grossRevenue, currency_code: 'USD' })}`,
            icon: DollarSign,
            tone: 'primary',
            active: statusFilter === 'all' && customerSegmentFilter === 'all',
            onClick: () => {
              setStatusFilter('all')
              setCustomerSegmentFilter('all')
            },
          },
          {
            label: 'True Net Profit',
            value: convertToLocale({ amount: stats.netProfit, currency_code: 'USD' }),
            sublabel: 'After COGS, Fees & Shipping',
            icon: TrendingUp,
            tone: 'success',
          },
          {
            label: 'Pending / Processing',
            value: String(stats.unfulfilled),
            sublabel: 'Click to filter unfulfilled queue',
            icon: Clock,
            tone: 'warning',
            active: statusFilter === 'pending',
            onClick: () => setStatusFilter((prev) => (prev === 'pending' ? 'all' : 'pending')),
          },
          {
            label: 'Fraud / Risk Alerts',
            value: String(stats.flaggedOrRepeat),
            sublabel: 'Click to filter high-risk buyers',
            icon: ShieldAlert,
            tone: 'error',
            active: customerSegmentFilter === 'fraud_risk',
            onClick: () =>
              setCustomerSegmentFilter((prev) => (prev === 'fraud_risk' ? 'all' : 'fraud_risk')),
          },
        ]}
      />

      {/* Bulk Selection Floating/Inline Bar */}
      {selectedIds.length > 0 && (
        <div className="px-4 py-3 rounded-2xl border border-primary/35 bg-primary-subtle flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span>{selectedIds.length} order(s) selected</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="h-8 px-2.5 rounded-lg text-xs border border-input-border bg-card text-foreground font-medium"
            >
              {ORDER_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <AppButton
              label="Apply Bulk Status"
              variant="primary"
              size="xs"
              onClick={handleBulkStatus}
            />
            <AppButton
              label="Clear Selection"
              variant="ghost"
              size="xs"
              onClick={() => setSelectedIds([])}
            />
          </div>
        </div>
      )}

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Unified Filter Bar + 3-Section Order Cards List */}
      <PageSection
        title="Order Operations Queue (3-Section Cards)"
        description="Left: Product thumbnail stack (tilted layered images when multi-item). Center: Multi-currency OrderPrice & OrderLineItemPrice P&L breakdown. Right: Customer address & Repeat/Fraud intelligence."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-card-border bg-muted/25 p-3.5">
            <AppInput
              label="Search Order / SKU / Customer"
              icon={Search}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              onClear={() => setSearchQuery('')}
              placeholder="Order #, SKU, buyer name or email..."
            />

            <AppSelect
              label="Order Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              options={[
                { value: 'all', label: 'All Order Statuses' },
                ...ORDER_STATUS.map((s) => ({
                  value: s,
                  label: s.replace(/_/g, ' ').toUpperCase(),
                })),
              ]}
            />

            <AppSelect
              label="Marketplace Channel"
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value)
                setPage(1)
              }}
              options={[
                { value: 'all', label: 'All Channels' },
                { value: 'amazon', label: 'Amazon' },
                { value: 'ebay', label: 'eBay' },
                { value: 'etsy', label: 'Etsy' },
                { value: 'direct', label: 'Direct / Medusa Website' },
              ]}
            />

            <AppSelect
              label="Customer Intelligence Segment"
              value={customerSegmentFilter}
              onChange={(e) => {
                setCustomerSegmentFilter(e.target.value as any)
                setPage(1)
              }}
              options={[
                { value: 'all', label: 'All Buyers' },
                { value: 'repeat', label: 'Repeat Buyers Only' },
                { value: 'fraud_risk', label: 'Fraud / High-Risk Buyers' },
              ]}
            />
          </div>

          {paginatedOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
              <p className="text-sm font-bold text-foreground">
                No orders match your active filters.
              </p>
              <div className="flex items-center justify-center gap-2">
                <AppButton
                  label="Reset Filters"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setChannelFilter('all')
                    setCustomerSegmentFilter('all')
                  }}
                />
                <AppButton
                  label="+ Create Order"
                  variant="primary"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedOrders.map((order) => (
                <OrderCard
                  key={String(order.id)}
                  order={order}
                  selected={selectedIds.includes(String(order.id))}
                  onSelect={toggleSelect}
                  onOpenDetail={(o) => setDetailRow(o)}
                  onEditStatus={(o) => setEditRow(o)}
                  onDelete={(o) => {
                    if (window.confirm(`Cancel order ${o.orderNumber}?`)) {
                      router.post(`/orders/${o.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
              ))}

              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={filteredOrders.length}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </PageSection>

      {/* Create Order Modal */}
      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Order (Multi-Currency OrderPrice & OrderLineItemPrice)"
        subtitle="Manual order entry with per-field currency codes and automatic P&L waterfall calculation."
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
              { value: 'etsy', label: 'Etsy' },
            ],
          },
          {
            name: 'currencyCode',
            label: 'Order Currency Code (USD, INR, EUR, GBP, CAD, MXN)',
            default: 'USD',
            section: '1. Order & Channel',
          },
          {
            name: 'reportingCurrencyCode',
            label: 'Reporting Currency Code',
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
            label: 'Country ISO-2',
            default: 'US',
            section: '2. Customer & Shipping Address',
          },
          {
            name: 'sku',
            label: 'Line SKU',
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
            label: 'Quantity',
            kind: 'number',
            default: '1',
            required: true,
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
            label: 'Unit COGS',
            kind: 'number',
            default: '0',
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'taxAmount',
            label: 'Tax',
            kind: 'number',
            default: '0',
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'discountAmount',
            label: 'Discount',
            kind: 'number',
            default: '0',
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'shippingChargedAmount',
            label: 'Shipping charged to buyer',
            kind: 'number',
            default: '0',
            section: '3. Line Item & P&L Economics',
          },
          {
            name: 'shippingCostAmount',
            label: 'Actual shipping cost',
            kind: 'number',
            default: '0',
            section: '3. Line Item & P&L Economics',
          },
        ]}
      />

      {/* Bulk Import Modal */}
      <FormModal
        isOpen={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Idempotent Bulk Order Import (JSON)"
        subtitle="Deduplicates on (seller_account_id, external_order_id) and creates OrderPrice, OrderLineItemPrice, and SyncJob records."
        submitLabel="Run Import Batch"
        action="/orders/bulk-import"
        presetActions={[
          {
            label: 'Load Sample Multi-Item JSON',
            values: {
              idempotencyKey: 'batch-orders-2026-01',
              marketplaceCode: 'amazon',
              ordersJson: sampleJson,
            },
          },
        ]}
        fields={[
          {
            name: 'idempotencyKey',
            label: 'Idempotency key',
            default: 'batch-orders-2026-01',
            required: true,
          },
          {
            name: 'marketplaceCode',
            label: 'Marketplace code',
            kind: 'select',
            default: 'amazon',
            required: true,
            options: [
              { value: 'amazon', label: 'Amazon' },
              { value: 'ebay', label: 'eBay' },
              { value: 'etsy', label: 'Etsy' },
              { value: 'direct', label: 'Direct' },
            ],
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
            label: 'JSON orders array',
            kind: 'textarea',
            required: true,
            default: sampleJson,
            fullWidth: true,
          },
        ]}
      />

      {/* Update Status Modal */}
      <FormModal
        isOpen={!!editRow}
        onOpenChange={(o) => {
          if (!o) setEditRow(null)
        }}
        title={editRow ? `Update Status — #${editRow.orderNumber}` : 'Update Status'}
        subtitle="Automatically stamps delivered_at or cancelled_at and records a tamper-evident audit entry."
        submitLabel="Update Status"
        action={editRow ? `/orders/${editRow.id}/status` : '/orders/placeholder/status'}
        initialValues={editRow ? { status: String(editRow.status ?? 'confirmed') } : undefined}
        fields={[
          {
            name: 'status',
            label: 'New order status',
            kind: 'select',
            required: true,
            fullWidth: true,
            options: ORDER_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
        ]}
      />

      {/* Order Detail Drawer */}
      <OrderDetailsDrawer
        open={!!detailRow}
        order={detailRow}
        onClose={() => setDetailRow(null)}
        onEditStatus={(o) => {
          setDetailRow(null)
          setEditRow(o)
        }}
      />
    </div>
  )
}
