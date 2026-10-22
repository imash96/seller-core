import { Link } from '@adonisjs/inertia/react'
import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
  PageSection,
  KpiScorecard,
  StatStrip,
  DataTable,
  StatusBadge,
  ProgressMeter,
  WaterfallChart,
  RevenueTrendChart,
  DonutChart,
  CreditUtilizationBars,
  col,
  money,
  STATUS_TONES,
  displayValue,
  type Row,
  type DashboardKpis,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  LayoutDashboard,
  BarChart3,
  PieChart,
  CreditCard,
  Activity,
} from 'lucide-react'

type Props = {
  kpis: DashboardKpis
  effectiveRbac: Record<string, any>
  orders: Row[]
  shipments: Row[]
  returnRequests: Row[]
  creditCards: Row[]
  tasksReminders: Row[]
  auditLogs: Row[]
  sellerAccounts: Row[]
  financialTransactions: Row[]
  customers: Row[]
  riskSignals: Row[]
  products: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  syncJobs: Row[]
  shippingInvoices: Row[]
  refundTransactions: Row[]
  marketplaceClaims: Row[]
  financialAccounts: Row[]
  financeCategories: Row[]
  allUsers: Row[]
  allRoles: Row[]
  allPermissions: Row[]
  moduleEntitlements: Row[]
  savedViews: Row[]
}

const CHANNEL_FILTERS = [
  { value: 'all', label: 'All Channels' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'ebay', label: 'eBay' },
  { value: 'etsy', label: 'Etsy' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'direct', label: 'Direct Webstore' },
]

const QUEUE_TABS = [
  { id: 'orders', label: 'Recent Orders' },
  { id: 'shipments', label: 'Fulfillment & Shipments' },
  { id: 'returns', label: 'Returns & Claims' },
  { id: 'finance', label: 'Credit Cards & Tasks' },
  { id: 'governance', label: 'Account Health & Audit Trail' },
] as const

export default function Dashboard(props: Props) {
  const {
    kpis,
    orders,
    shipments,
    returnRequests,
    marketplaceClaims,
    creditCards,
    tasksReminders,
    auditLogs,
    sellerAccounts,
    financialTransactions,
  } = props

  const [activeTab, setActiveTab] = useState<(typeof QUEUE_TABS)[number]['id']>('orders')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [currencyMode, setCurrencyMode] = useState<'reporting' | 'native'>('reporting')

  const filteredOrders = useMemo(() => {
    if (channelFilter === 'all') return orders
    return orders.filter((o) =>
      String(o.marketplaceCode ?? o.sellerAccountId ?? '')
        .toLowerCase()
        .includes(channelFilter.toLowerCase())
    )
  }, [orders, channelFilter])

  // Dynamically recompute KPIs when a channel filter or currency mode is selected
  const activeKpis: DashboardKpis = useMemo(() => {
    if (channelFilter === 'all' && currencyMode === 'reporting') return kpis
    const rateOf = (o: Row) => (currencyMode === 'reporting' ? Number(o.exchangeRate || 1) : 1)
    const gross = filteredOrders.reduce(
      (s, o) =>
        s +
        (currencyMode === 'reporting'
          ? Number(o.reportingTotalAmount || o.totalAmount || 0)
          : Number(o.totalAmount || 0)),
      0
    )
    const refunded = filteredOrders.reduce(
      (s, o) => s + Number(o.refundedAmount || 0) * rateOf(o),
      0
    )
    const fees = filteredOrders.reduce(
      (s, o) =>
        s +
        (Number(o.marketplaceFeesAmount || 0) + Number(o.paymentProcessingFeesAmount || 0)) *
          rateOf(o),
      0
    )
    const cogs = filteredOrders.reduce((s, o) => s + Number(o.cogsAmount || 0) * rateOf(o), 0)
    const ship = filteredOrders.reduce(
      (s, o) => s + Number(o.shippingCostAmount || 0) * rateOf(o),
      0
    )
    const profit = filteredOrders.reduce(
      (s, o) => s + Number(o.netProfitAmount || 0) * rateOf(o),
      0
    )
    return {
      ...kpis,
      totalOrders: filteredOrders.length,
      grossSales: gross.toFixed(2),
      netSales: (gross - refunded).toFixed(2),
      totalRefunded: refunded.toFixed(2),
      totalMarketplaceFees: fees.toFixed(2),
      totalCogs: cogs.toFixed(2),
      totalShippingCost: ship.toFixed(2),
      orderNetProfit: profit.toFixed(2),
      pendingOrders: filteredOrders.filter((o) =>
        ['draft', 'pending', 'confirmed', 'processing'].includes(String(o.status))
      ).length,
      deliveredOrders: filteredOrders.filter(
        (o) => o.status === 'delivered' || o.status === 'fulfilled'
      ).length,
    }
  }, [kpis, filteredOrders, channelFilter, currencyMode])

  const marketplaceSegments = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const o of filteredOrders) {
      const key = String(o.marketplaceCode ?? 'direct')
      counts[key] = (counts[key] ?? 0) + 1
    }
    const colors: Record<string, string> = {
      amazon: '#f59e0b',
      amazon_us: '#f59e0b',
      amazon_ca: '#fbbf24',
      ebay: '#3b82f6',
      etsy: '#f97316',
      direct: '#10b981',
      shopify: '#22c55e',
    }
    const entries = Object.entries(counts)
    if (entries.length === 0) {
      return [{ label: 'No Orders', value: 1, color: '#64748b' }]
    }
    return entries.map(([label, value]) => ({
      label: label.replace(/_/g, ' '),
      value,
      color: colors[label] ?? '#6366f1',
    }))
  }, [filteredOrders])

  const statusSegments = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const o of filteredOrders) {
      const key = String(o.status ?? 'pending')
      counts[key] = (counts[key] ?? 0) + 1
    }
    const colors: Record<string, string> = {
      delivered: '#10b981',
      fulfilled: '#059669',
      confirmed: '#3b82f6',
      processing: '#6366f1',
      partially_fulfilled: '#0ea5e9',
      pending: '#f59e0b',
      cancelled: '#ef4444',
    }
    const entries = Object.entries(counts).slice(0, 6)
    if (entries.length === 0) {
      return [{ label: 'None', value: 1, color: '#64748b' }]
    }
    return entries.map(([label, value]) => ({
      label: label.replace(/_/g, ' '),
      value,
      color: colors[label] ?? '#94a3b8',
    }))
  }, [filteredOrders])

  const netMargin =
    Number(activeKpis.grossSales) > 0
      ? ((Number(activeKpis.orderNetProfit) / Number(activeKpis.grossSales)) * 100).toFixed(1)
      : '0.0'
  const refundRate =
    Number(activeKpis.grossSales) > 0
      ? ((Number(activeKpis.totalRefunded) / Number(activeKpis.grossSales)) * 100).toFixed(1)
      : '0.0'
  const completionRate =
    activeKpis.totalOrders > 0
      ? ((activeKpis.deliveredOrders / activeKpis.totalOrders) * 100).toFixed(0)
      : '0'

  const totalCostBurden =
    Number(activeKpis.totalCogs) +
      Number(activeKpis.totalMarketplaceFees) +
      Number(activeKpis.totalShippingCost) || 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Operations & P&L Command Center"
        description="Real-time multi-currency order economics, carrier invoice reconciliation, risk review queues, and Business vs. Household ledger analytics."
        icon={LayoutDashboard}
        badge={currencyMode === 'reporting' ? 'Reporting USD' : 'Native Currency'}
        actions={
          <>
            <Link href="/orders">
              <Button label="+ New Order" variant="primary" size="sm" />
            </Link>
            <Link href="/products">
              <Button label="+ New Product" variant="secondary" size="sm" />
            </Link>
            <Link href="/shipments">
              <Button label="+ Record Shipment" variant="secondary" size="sm" />
            </Link>
            <Link href="/finance">
              <Button label="+ Log Transaction" variant="ghost" size="sm" />
            </Link>
            <Link href="/tasks">
              <Button label="+ Create Task" variant="ghost" size="sm" />
            </Link>
          </>
        }
      />

      {/* Top Executive Filter Bar */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {CHANNEL_FILTERS.map((ch) => {
            const active = channelFilter === ch.value
            return (
              <button
                key={ch.value}
                type="button"
                onClick={() => setChannelFilter(ch.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                }`}
              >
                {ch.label}
              </button>
            )
          })}
        </div>

        <div className="inline-flex items-center p-0.5 rounded-xl bg-muted border border-border">
          <button
            type="button"
            onClick={() => setCurrencyMode('reporting')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              currencyMode === 'reporting'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Reporting USD
          </button>
          <button
            type="button"
            onClick={() => setCurrencyMode('native')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              currencyMode === 'native'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Native Breakdown
          </button>
        </div>
      </div>

      {/* 4 Hero KPI Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiScorecard
          title="Gross & Net Revenue"
          value={money('USD', activeKpis.grossSales)}
          subtitle={`Net after refunds: ${money('USD', activeKpis.netSales)}`}
          badge={{ label: `Refunds ${refundRate}%`, variant: Number(refundRate) > 10 ? 'warning' : 'info' }}
          icon={<DollarSign className="w-5 h-5" />}
          tone="primary"
        >
          <ProgressMeter
            label={`Refunded: ${money('USD', activeKpis.totalRefunded)}`}
            value={Number(refundRate)}
            showValue
            variant={Number(refundRate) > 10 ? 'warning' : 'success'}
            size="sm"
          />
        </KpiScorecard>

        <KpiScorecard
          title="True Order Net Profit"
          value={money('USD', activeKpis.orderNetProfit)}
          subtitle={`COGS: ${money('USD', activeKpis.totalCogs)} · Fees: ${money('USD', activeKpis.totalMarketplaceFees)}`}
          badge={{
            label: `${netMargin}% Margin`,
            variant: Number(activeKpis.orderNetProfit) >= 0 ? 'success' : 'error',
          }}
          icon={<TrendingUp className="w-5 h-5" />}
          tone="success"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Cost Stack (COGS / Fees / Ship)</span>
              <span className="tabular-nums">Ship: {money('USD', activeKpis.totalShippingCost)}</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              <div
                style={{
                  width: `${(Number(activeKpis.totalCogs) / totalCostBurden) * 100}%`,
                }}
                className="bg-amber-500"
                title="COGS"
              />
              <div
                style={{
                  width: `${(Number(activeKpis.totalMarketplaceFees) / totalCostBurden) * 100}%`,
                }}
                className="bg-orange-500"
                title="Marketplace & Payment Fees"
              />
              <div
                style={{
                  width: `${(Number(activeKpis.totalShippingCost) / totalCostBurden) * 100}%`,
                }}
                className="bg-cyan-500"
                title="Shipping Cost"
              />
            </div>
          </div>
        </KpiScorecard>

        <KpiScorecard
          title="Fulfillment & Logistics SLA"
          value={`${activeKpis.deliveredOrders} / ${activeKpis.totalOrders}`}
          subtitle={`${activeKpis.activeShipments} active shipments · ${activeKpis.pendingOrders} pending`}
          badge={{ label: `${completionRate}% Delivered`, variant: 'info' }}
          icon={<Package className="w-5 h-5" />}
          tone="info"
        >
          <ProgressMeter
            label={`Invoice variance: ${money('USD', activeKpis.invoiceVarianceTotal)}`}
            value={Number(completionRate)}
            showValue
            variant="info"
            size="sm"
          />
        </KpiScorecard>

        <KpiScorecard
          title="Risk, Returns & Cashflow"
          value={`${activeKpis.openReturns} RMAs · ${activeKpis.pendingRiskReviews} Risk`}
          subtitle={`Business Opex: ${money('USD', activeKpis.businessOperatingExpenses)}`}
          badge={{
            label: activeKpis.pendingRiskReviews > 0 ? 'Action Required' : 'Clear',
            variant: activeKpis.pendingRiskReviews > 0 ? 'warning' : 'success',
          }}
          icon={<AlertTriangle className="w-5 h-5" />}
          tone="warning"
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Household ledger spend:</span>
            <span className="font-semibold text-foreground tabular-nums">
              {money('USD', activeKpis.householdExpenses)}
            </span>
          </div>
        </KpiScorecard>
      </div>

      {/* Secondary Compact Operational Health Strip */}
      <StatStrip
        items={[
          { label: 'Total Orders', value: String(activeKpis.totalOrders) },
          { label: 'Pending Orders', value: String(activeKpis.pendingOrders) },
          { label: 'Delivered Orders', value: String(activeKpis.deliveredOrders) },
          { label: 'Active Shipments', value: String(activeKpis.activeShipments) },
          { label: 'Open Returns', value: String(activeKpis.openReturns) },
          { label: 'Risk Reviews', value: String(activeKpis.pendingRiskReviews) },
        ]}
      />

      {/* 4 Interactive Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageSection
          title="Order Economics & P&L Waterfall"
          description="Gross Sales → − Refunds → = Net Sales → − COGS → − Channel Fees → − Shipping → = Order Net Profit."
          actions={<BarChart3 className="w-4 h-4 text-primary" />}
        >
          <WaterfallChart kpis={activeKpis} />
        </PageSection>

        <PageSection
          title="Order Revenue, Profit & Fee Timeline"
          description="Chronological order performance with interactive mode switcher."
          actions={<Activity className="w-4 h-4 text-primary" />}
        >
          <RevenueTrendChart orders={filteredOrders} />
        </PageSection>

        <PageSection
          title="Marketplace Share & Order Status Funnel"
          description="Distribution by sales channel and fulfillment lifecycle stage."
          actions={<PieChart className="w-4 h-4 text-primary" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DonutChart title="Channel Mix" segments={marketplaceSegments} />
            <DonutChart title="Status Funnel" segments={statusSegments} />
          </div>
        </PageSection>

        <PageSection
          title="Credit Card Utilization & Cashflow Segregation"
          description="PCI-safe credit limit monitoring and Business vs. Household ledger comparison."
          actions={<CreditCard className="w-4 h-4 text-primary" />}
        >
          <CreditUtilizationBars cards={creditCards} transactions={financialTransactions} />
        </PageSection>
      </div>

      {/* Interactive Tabbed Operational Queues */}
      <PageSection
        title="Live Operational Queues"
        description="Switch across active operational domains without leaving the command center."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-2.5">
            {QUEUE_TABS.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Showing latest {Math.min(8, filteredOrders.length)} of {filteredOrders.length}{' '}
                  orders
                </span>
                <Link href="/orders">
                  <Button label="Open Orders Module →" variant="secondary" size="sm" />
                </Link>
              </div>
              <DataTable
                rows={filteredOrders.slice(0, 8)}
                empty="No orders recorded yet."
                columns={[
                  col.text('orderNumber', 'Order #', 140),
                  col.badge('status', 'Status', STATUS_TONES),
                  col.text('marketplaceCode', 'Channel', 110),
                  col.money('totalAmount', 'Order Total', 'currencyCode'),
                  col.money('netProfitAmount', 'Net Profit', 'reportingCurrencyCode'),
                  col.date('orderedAt', 'Ordered At'),
                ]}
              />
            </div>
          )}

          {activeTab === 'shipments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Active parcel dispatches & carrier tracking
                </span>
                <Link href="/shipments">
                  <Button label="Open Shipments & Invoices →" variant="secondary" size="sm" />
                </Link>
              </div>
              <DataTable
                rows={shipments.slice(0, 8)}
                empty="No shipments dispatched yet."
                columns={[
                  col.text('shipmentNumber', 'Shipment #', 140),
                  col.badge('status', 'Status', STATUS_TONES),
                  col.text('carrierCode', 'Carrier', 90),
                  col.text('trackingNumber', 'Tracking #', 160),
                  col.money('estimatedShippingCost', 'Est. Cost', 'currencyCode'),
                  col.date('shippedAt', 'Shipped'),
                ]}
              />
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Open Return Requests (RMAs)
                  </span>
                  <Link href="/returns">
                    <Button label="Manage RMAs →" variant="ghost" size="sm" />
                  </Link>
                </div>
                <DataTable
                  rows={returnRequests.slice(0, 6)}
                  empty="No return requests."
                  columns={[
                    col.text('rmaNumber', 'RMA #', 120),
                    col.badge('status', 'Status', STATUS_TONES),
                    col.text('returnReason', 'Reason', 130),
                    col.money('refundAmount', 'Refund', 'currencyCode'),
                  ]}
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Marketplace Claims</span>
                  <Link href="/claims">
                    <Button label="Manage Claims →" variant="ghost" size="sm" />
                  </Link>
                </div>
                <DataTable
                  rows={marketplaceClaims.slice(0, 6)}
                  empty="No marketplace claims."
                  columns={[
                    col.text('claimNumber', 'Claim #', 120),
                    col.badge('status', 'Status', STATUS_TONES),
                    col.money('disputedAmount', 'Disputed', 'currencyCode'),
                    col.date('respondByAt', 'Respond By'),
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Registered Credit Cards
                  </span>
                  <Link href="/finance">
                    <Button label="Open Finance →" variant="ghost" size="sm" />
                  </Link>
                </div>
                <DataTable
                  rows={creditCards.slice(0, 6)}
                  empty="No credit cards."
                  columns={[
                    col.text('cardLabel', 'Card', 140),
                    col.text('last4Digits', 'Last 4', 70),
                    col.money('currentBalance', 'Balance', 'currencyCode'),
                    col.money('creditLimit', 'Limit', 'currencyCode'),
                  ]}
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Operational Tasks & Reminders
                  </span>
                  <Link href="/tasks">
                    <Button label="Open Tasks →" variant="ghost" size="sm" />
                  </Link>
                </div>
                <DataTable
                  rows={tasksReminders.slice(0, 6)}
                  empty="No tasks queued."
                  columns={[
                    col.text('title', 'Task', 170),
                    col.badge('priority', 'Priority', {
                      urgent: 'error',
                      high: 'warning',
                      medium: 'info',
                      low: 'neutral',
                    }),
                    col.badge('status', 'Status', STATUS_TONES),
                    col.date('dueAt', 'Due'),
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Connected Seller Accounts
                  </span>
                  <Link href="/seller-accounts">
                    <Button label="Manage Accounts →" variant="ghost" size="sm" />
                  </Link>
                </div>
                <DataTable
                  rows={sellerAccounts.slice(0, 6)}
                  empty="No seller accounts."
                  columns={[
                    col.text('accountName', 'Account', 150),
                    col.text('marketplaceRegion', 'Region', 70),
                    col.badge('status', 'Status', STATUS_TONES),
                    col.badge('healthStatus', 'Health', STATUS_TONES),
                  ]}
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Recent Tamper-Evident Audit Events
                  </span>
                  <Link href="/audit">
                    <Button label="Full Audit Trail →" variant="ghost" size="sm" />
                  </Link>
                </div>
                <DataTable
                  rows={auditLogs.slice(0, 6).map((r) => ({
                    ...r,
                    actorDisplay: displayValue(r.actor ?? r.user),
                  }))}
                  empty="No audit events."
                  columns={[
                    col.badge('action', 'Action', {
                      INSERT: 'success',
                      UPDATE: 'info',
                      DELETE: 'error',
                    }),
                    col.text('entityType', 'Entity', 120),
                    col.text('actorDisplay', 'Actor / Owner', 140),
                    col.date('createdAt', 'When'),
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </PageSection>
    </div>
  )
}
