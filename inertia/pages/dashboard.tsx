import { Stack } from '@astryxdesign/core/Stack'
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
import { Grid, VStack } from '@astryxdesign/core'
import { Text } from '@astryxdesign/core/Text'
import { resolvePriceMoney } from '~/lib/utils'

type Props = {
  kpis: DashboardKpis
  access: Record<string, boolean>
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
    access,
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

  const filteredOrders = useMemo(() => {
    if (channelFilter === 'all') return orders
    return orders.filter((o) =>
      String(o.channelCode ?? o.sellerAccountId ?? '')
        .toLowerCase()
        .includes(channelFilter.toLowerCase())
    )
  }, [orders, channelFilter])

  // Recompute monetary KPIs for USD-reporting orders when a channel is selected.
  const activeKpis: DashboardKpis = useMemo(() => {
    if (channelFilter === 'all') return kpis
    const usdOrders = filteredOrders.filter((o) => o.reportingCurrencyCode === 'USD')
    const rateOf = (o: Row) => Number(o.exchangeRate || 1)
    // Every amount is a self-contained PriceMoney object; reporting totals are
    // already converted to the reporting currency server-side.
    const amount = (value: unknown) => Number(resolvePriceMoney(value, 'USD').amount || 0)
    const gross = usdOrders.reduce((s, o) => s + amount(o.reportingTotal), 0)
    const refunded = usdOrders.reduce((s, o) => s + amount(o.refundedTotal) * rateOf(o), 0)
    const fees = usdOrders.reduce(
      (s, o) =>
        s + (amount(o.marketplaceFeesTotal) + amount(o.paymentProcessingFeesTotal)) * rateOf(o),
      0
    )
    const cogs = usdOrders.reduce((s, o) => s + amount(o.cogsTotal) * rateOf(o), 0)
    const ship = usdOrders.reduce((s, o) => s + amount(o.shippingCostTotal) * rateOf(o), 0)
    const profit = usdOrders.reduce((s, o) => s + amount(o.netProfit) * rateOf(o), 0)
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
  }, [kpis, filteredOrders, channelFilter])

  const marketplaceSegments = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const o of filteredOrders) {
      const key = String(o.channelCode ?? 'direct')
      counts[key] = (counts[key] ?? 0) + 1
    }
    const colors: Record<string, string> = {
      amazon: '#f59e0b',
      amazon_us: '#f59e0b',
      amazon_ca: '#fbbf24',
      ebay: '#3b82f6',
      etsy: '#f97316',
      direct: '#10b981',
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
    <Stack gap={6}>
      <PageHeader
        title="Executive Operations & P&L Command Center"
        description="Recent order economics, carrier invoices, risk review queues and local ledger activity."
        icon={LayoutDashboard}
        badge="Reporting USD"
      />

      {Object.values(access).some((allowed) => !allowed) && (
        <Text type="supporting" as="p">
          Some modules are restricted. Metrics and lists reflect only accessible data; zero does not
          necessarily mean there are no records.
        </Text>
      )}

      <Text type="supporting" as="p">
        Dashboard figures are based on recent records (up to 50 orders, 50 shipments, 40 returns and
        60 ledger entries). Monetary totals include only USD reporting records or USD invoices; they
        are not full-period financial reports.
      </Text>

      {/* Top Executive Filter Bar */}
      <Stack
        direction="horizontal"
        align="center"
        justify="between"
        wrap="wrap"
        gap={3}
        padding={3}
        className="bg-card text-card-foreground border border-border rounded-xl shadow-xs"
      >
        <Stack direction="horizontal" align="center" gap={1.5} className="overflow-x-auto pb-0.5">
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
        </Stack>
      </Stack>

      {/* 4 Hero KPI Scorecards */}
      <Grid columns={{ minWidth: 280, max: 3 }} gap={4}>
        <KpiScorecard
          title="Gross & Net Revenue"
          value={money('USD', activeKpis.grossSales)}
          subtitle={`Net after refunds: ${money('USD', activeKpis.netSales)}`}
          badge={{
            label: `Refunds ${refundRate}%`,
            variant: Number(refundRate) > 10 ? 'warning' : 'info',
          }}
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
          <Stack gap={1.5}>
            <Stack
              direction="horizontal"
              align="center"
              justify="between"
              className="text-2xs text-muted-foreground"
            >
              <Text>Cost Stack (COGS / Fees / Ship)</Text>
              <Text hasTabularNumbers>Ship: {money('USD', activeKpis.totalShippingCost)}</Text>
            </Stack>
            <Stack direction="horizontal" className="h-2 rounded-full overflow-hidden bg-muted">
              <Stack
                style={{
                  width: `${(Number(activeKpis.totalCogs) / totalCostBurden) * 100}%`,
                }}
                aria-label="COGS"
                className="bg-amber-500"
              />
              <Stack
                style={{
                  width: `${(Number(activeKpis.totalMarketplaceFees) / totalCostBurden) * 100}%`,
                }}
                aria-label="Marketplace & Payment Fees"
                className="bg-orange-500"
              />
              <Stack
                style={{
                  width: `${(Number(activeKpis.totalShippingCost) / totalCostBurden) * 100}%`,
                }}
                aria-label="Shipping Cost"
                className="bg-cyan-500"
              />
            </Stack>
          </Stack>
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
          <Stack
            direction="horizontal"
            align="center"
            justify="between"
            className="text-xs text-muted-foreground"
          >
            <Text>Household ledger spend:</Text>
            <Text color="primary" weight="semibold" hasTabularNumbers>
              {access.householdFinance && access.finance
                ? money('USD', activeKpis.householdExpenses)
                : 'Restricted'}
            </Text>
          </Stack>
        </KpiScorecard>
      </Grid>

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
      <Grid columns={{ minWidth: 220, max: 1 }} className="lg:grid-cols-2">
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
          <RevenueTrendChart
            orders={filteredOrders.filter((o) => o.reportingCurrencyCode === 'USD')}
          />
        </PageSection>

        <PageSection
          title="Marketplace Share & Order Status Funnel"
          description="Distribution by sales channel and fulfillment lifecycle stage."
          actions={<PieChart className="w-4 h-4 text-primary" />}
        >
          <Grid columns={{ minWidth: 220, max: 1 }} className="sm:grid-cols-2">
            <DonutChart title="Channel Mix" segments={marketplaceSegments} />
            <DonutChart title="Status Funnel" segments={statusSegments} />
          </Grid>
        </PageSection>

        <PageSection
          title="Credit Card Utilization & Cashflow Segregation"
          description="PCI-safe credit limit monitoring and Business vs. Household ledger comparison."
          actions={<CreditCard className="w-4 h-4 text-primary" />}
        >
          <CreditUtilizationBars cards={creditCards} transactions={financialTransactions} />
        </PageSection>
      </Grid>

      {/* Interactive Tabbed Operational Queues */}
      <PageSection
        title="Live Operational Queues"
        description="Switch across active operational domains without leaving the command center."
      >
        <VStack gap={4}>
          <Stack
            direction="horizontal"
            align="center"
            gap={2}
            className="overflow-x-auto border-b border-border pb-2.5"
          >
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
          </Stack>

          {activeTab === 'orders' && (
            <Stack gap={3}>
              <Stack direction="horizontal" align="center" justify="between">
                <Text size="xsm" color="secondary">
                  Showing latest {Math.min(8, filteredOrders.length)} of {filteredOrders.length}{' '}
                  orders
                </Text>
                <Link href="/orders">
                  <Button label="Open Orders Module →" variant="secondary" size="sm" />
                </Link>
              </Stack>
              <DataTable
                rows={filteredOrders.slice(0, 8)}
                empty="No orders recorded yet."
                columns={[
                  col.text('orderNumber', 'Order #', 140),
                  col.badge('status', 'Status', STATUS_TONES),
                  col.text('channelCode', 'Channel', 110),
                  col.money('totalAmount', 'Order Total', 'currencyCode'),
                  col.money('netProfitAmount', 'Net Profit', 'reportingCurrencyCode'),
                  col.date('orderedAt', 'Ordered At'),
                ]}
              />
            </Stack>
          )}

          {activeTab === 'shipments' && (
            <Stack gap={3}>
              <Stack direction="horizontal" align="center" justify="between">
                <Text size="xsm" color="secondary">
                  Active parcel dispatches & carrier tracking
                </Text>
                <Link href="/shipments">
                  <Button label="Open Shipments & Invoices →" variant="secondary" size="sm" />
                </Link>
              </Stack>
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
            </Stack>
          )}

          {activeTab === 'returns' && (
            <Grid columns={{ minWidth: 220, max: 1 }} className="lg:grid-cols-2">
              <VStack gap={3}>
                <Stack direction="horizontal" align="center" justify="between">
                  <Text size="xsm" color="primary" weight="semibold">
                    Open Return Requests (RMAs)
                  </Text>
                  <Link href="/returns">
                    <Button label="Manage RMAs →" variant="ghost" size="sm" />
                  </Link>
                </Stack>
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
              </VStack>

              <VStack gap={3}>
                <Stack direction="horizontal" align="center" justify="between">
                  <Text size="xsm" color="primary" weight="semibold">
                    Marketplace Claims
                  </Text>
                  <Link href="/claims">
                    <Button label="Manage Claims →" variant="ghost" size="sm" />
                  </Link>
                </Stack>
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
              </VStack>
            </Grid>
          )}

          {activeTab === 'finance' && (
            <Grid columns={{ minWidth: 220, max: 1 }} className="lg:grid-cols-2">
              <VStack gap={3}>
                <Stack direction="horizontal" align="center" justify="between">
                  <Text size="xsm" color="primary" weight="semibold">
                    Registered Credit Cards
                  </Text>
                  <Link href="/finance">
                    <Button label="Open Finance →" variant="ghost" size="sm" />
                  </Link>
                </Stack>
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
              </VStack>

              <VStack gap={3}>
                <Stack direction="horizontal" align="center" justify="between">
                  <Text size="xsm" color="primary" weight="semibold">
                    Operational Tasks & Reminders
                  </Text>
                  <Link href="/tasks">
                    <Button label="Open Tasks →" variant="ghost" size="sm" />
                  </Link>
                </Stack>
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
              </VStack>
            </Grid>
          )}

          {activeTab === 'governance' && (
            <Grid columns={{ minWidth: 220, max: 1 }} className="lg:grid-cols-2">
              <VStack gap={3}>
                <Stack direction="horizontal" align="center" justify="between">
                  <Text size="xsm" color="primary" weight="semibold">
                    Connected Seller Accounts
                  </Text>
                  <Link href="/seller-accounts">
                    <Button label="Manage Accounts →" variant="ghost" size="sm" />
                  </Link>
                </Stack>
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
              </VStack>

              <VStack gap={3}>
                <Stack direction="horizontal" align="center" justify="between">
                  <Text size="xsm" color="primary" weight="semibold">
                    Recent Tamper-Evident Audit Events
                  </Text>
                  <Link href="/audit">
                    <Button label="Full Audit Trail →" variant="ghost" size="sm" />
                  </Link>
                </Stack>
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
              </VStack>
            </Grid>
          )}
        </VStack>
      </PageSection>
    </Stack>
  )
}
