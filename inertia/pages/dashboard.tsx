import { Link } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Heading } from '@astryxdesign/core/Heading'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Grid } from '@astryxdesign/core/Grid'
import { Divider } from '@astryxdesign/core/Divider'
import { Banner } from '@astryxdesign/core/Banner'
import { TabList, Tab } from '@astryxdesign/core/TabList'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import {
  KpiCard,
  PageSection,
  DataTable,
  col,
  money,
  STATUS_TONES,
  type Row,
  displayValue,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  Truck,
  RotateCcw,
  CreditCard,
  Plus,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react'

type Kpis = {
  totalOrders: number
  grossSales: string
  netSales: string
  totalRefunded: string
  totalMarketplaceFees: string
  totalCogs: string
  totalShippingCost: string
  orderNetProfit: string
  businessOperatingExpenses: string
  householdExpenses: string
  pendingOrders: number
  deliveredOrders: number
  activeShipments: number
  openReturns: number
  pendingRiskReviews: number
  invoiceVarianceTotal: string
}

type Props = {
  kpis: Kpis
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


/* ------------------------------------------------------------------ */
/* SVG Chart components - token-styled with tooltips                   */
/* ------------------------------------------------------------------ */

function Tooltip({
  x,
  y,
  children,
  visible,
}: {
  x: number
  y: number
  children: React.ReactNode
  visible: boolean
}) {
  if (!visible) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: x + 12,
        top: y - 10,
        background: '#1f2937',
        color: 'white',
        padding: '6px 10px',
        borderRadius: 6,
        fontSize: 12,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 10,
        transform: 'translateY(-100%)',
      }}
    >
      {children}
    </div>
  )
}

function WaterfallChart({ kpis }: { kpis: Kpis }) {
  const steps = [
    { label: 'Gross Sales', value: Number(kpis.grossSales), color: '#0866ff' },
    { label: 'Refunds', value: -Number(kpis.totalRefunded), color: '#ef4444' },
    { label: 'Net Sales', value: Number(kpis.netSales), color: '#22c55e', isTotal: true },
    { label: 'COGS', value: -Number(kpis.totalCogs), color: '#f59e0b' },
    { label: 'Fees', value: -Number(kpis.totalMarketplaceFees), color: '#e8790a' },
    { label: 'Shipping', value: -Number(kpis.totalShippingCost), color: '#a78bfa' },
    { label: 'Net Profit', value: Number(kpis.orderNetProfit), color: '#7c3aed', isTotal: true },
    { label: 'Business Opex', value: -Number(kpis.businessOperatingExpenses), color: '#94a3b8' },
  ]
  const maxAbs = Math.max(...steps.map((s) => Math.abs(s.value)), 1)
  const [tip, setTip] = useState<{ x: number; y: number; label: string; value: number } | null>(
    null
  )

  return (
    <div style={{ position: 'relative' }}>
      <Stack gap={2}>
        {steps.map((step, i) => {
          const barW = Math.max(4, (Math.abs(step.value) / maxAbs) * 100)
          return (
            <div
              key={step.label}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                setTip({ x: e.clientX - rect.left, y: 10, label: step.label, value: step.value })
              }}
              onMouseLeave={() => setTip(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}
            >
              <Text
                type="supporting"
                as="div"
                style={{ minWidth: 100, fontSize: 12, fontWeight: step.isTotal ? 700 : 400 }}
              >
                {step.label}
              </Text>
              <div
                style={{
                  flex: 1,
                  height: 18,
                  background: '#f1f5f9',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${barW}%`,
                    height: '100%',
                    background: step.color,
                    borderRadius: 4,
                    border: step.isTotal ? '2px solid #1e293b' : 'none',
                    transition: 'width 0.4s ease',
                    marginLeft: step.value < 0 ? `${100 - barW}%` : 0,
                  }}
                />
              </div>
              <Text
                type="label"
                as="div"
                weight="semibold"
                style={{
                  minWidth: 90,
                  textAlign: 'right',
                  fontSize: 12,
                  color: step.value < 0 ? '#ef4444' : step.color,
                }}
              >
                {step.value >= 0 ? '+' : ''}
                {money('USD', step.value)}
              </Text>
            </div>
          )
        })}
      </Stack>
      {tip ? (
        <div
          style={{
            position: 'absolute',
            bottom: -28,
            left: tip.x,
            background: '#1f2937',
            color: 'white',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 11,
            whiteSpace: 'nowrap',
          }}
        >
          {tip.label}: {money('USD', tip.value)} ({((tip.value / maxAbs) * 100).toFixed(1)}% of
          gross)
        </div>
      ) : null}
    </div>
  )
}

function RevenueTrendChart({ orders }: { orders: Row[] }) {
  const [tip, setTip] = useState<{ idx: number; x: number; y: number } | null>(null)
  const sorted = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(String(a.orderedAt)).getTime() - new Date(String(b.orderedAt)).getTime()
      ),
    [orders]
  )
  const sliced = sorted.slice(-12)
  const [mode, setMode] = useState<'revenue' | 'profit' | 'fees'>('revenue')

  if (sliced.length === 0)
    return (
      <Text type="supporting" as="div">
        No orders to chart.
      </Text>
    )

  const getVal = (o: Row) => {
    if (mode === 'revenue') return Number(o.reportingTotalAmount ?? o.totalAmount ?? 0)
    if (mode === 'profit') return Number(o.netProfitAmount ?? 0)
    return Number(o.marketplaceFeesAmount ?? 0) + Number(o.paymentProcessingFeesAmount ?? 0)
  }
  const vals = sliced.map(getVal)
  const maxV = Math.max(...vals, 1)
  const minV = Math.min(...vals, 0)
  const range = maxV - minV || 1
  const W = 600
  const H = 160
  const pad = 20
  const stepX = (W - pad * 2) / Math.max(sliced.length - 1, 1)

  const points = vals.map((v, i) => ({
    x: pad + i * stepX,
    y: H - pad - ((v - minV) / range) * (H - pad * 2),
  }))

  return (
    <Stack gap={3}>
      <Stack direction="horizontal" gap={2}>
        {(['revenue', 'profit', 'fees'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              border: '1px solid #d1d5db',
              background: mode === m ? '#0866ff' : 'transparent',
              color: mode === m ? 'white' : 'inherit',
              fontSize: 12,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {m}
          </button>
        ))}
      </Stack>
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg width={W} height={H} style={{ display: 'block', minWidth: W }}>
          {/* Grid lines */}
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={pad}
              y1={H - pad - t * (H - pad * 2)}
              x2={W - pad}
              y2={H - pad - t * (H - pad * 2)}
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}
          {/* Area fill */}
          <path
            d={`M ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1]?.x ?? pad},${H - pad} L ${pad},${H - pad} Z`}
            fill={mode === 'revenue' ? '#dbeafe' : mode === 'profit' ? '#ede9fe' : '#fef3c7'}
            opacity={0.6}
          />
          {/* Line */}
          <path
            d={`M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`}
            fill="none"
            stroke={mode === 'revenue' ? '#0866ff' : mode === 'profit' ? '#7c3aed' : '#f59e0b'}
            strokeWidth={2}
          />
          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={tip?.idx === i ? 6 : 4}
              fill={mode === 'revenue' ? '#0866ff' : mode === 'profit' ? '#7c3aed' : '#f59e0b'}
              stroke="white"
              strokeWidth={2}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTip({ idx: i, x: p.x, y: p.y })}
              onMouseLeave={() => setTip(null)}
            />
          ))}
        </svg>
        {tip !== null ? (
          <div
            style={{
              position: 'absolute',
              left: tip.x,
              top: tip.y - 40,
              background: '#1f2937',
              color: 'white',
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 12,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              transform: 'translateX(-50%)',
            }}
          >
            <div style={{ fontWeight: 600 }}>{sliced[tip.idx]?.orderNumber ?? `#${tip.idx}`}</div>
            <div>{money('USD', vals[tip.idx])}</div>
          </div>
        ) : null}
      </div>
      <Stack direction="horizontal" gap={2} wrap="wrap">
        {sliced.map((o, i) => (
          <Text key={i} type="supporting" as="span" style={{ fontSize: 10 }}>
            {String(o.orderNumber).slice(0, 12)}
          </Text>
        ))}
      </Stack>
    </Stack>
  )
}

function DonutChart({
  title,
  segments,
}: {
  title: string
  segments: Array<{ label: string; value: number; color: string }>
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  let cumAngle = -90
  const R = 70
  const cx = 90
  const cy = 90

  const arcs = segments.map((seg) => {
    const angle = (seg.value / total) * 360
    const startAngle = cumAngle
    const endAngle = cumAngle + angle
    cumAngle = endAngle
    const largeArc = angle > 180 ? 1 : 0
    const rad1 = (startAngle * Math.PI) / 180
    const rad2 = (endAngle * Math.PI) / 180
    const x1 = cx + R * Math.cos(rad1)
    const y1 = cy + R * Math.sin(rad1)
    const x2 = cx + R * Math.cos(rad2)
    const y2 = cy + R * Math.sin(rad2)
    const d = `M ${cx},${cy} L ${x1},${y1} A ${R},${R} 0 ${largeArc} 1 ${x2},${y2} Z`
    return { ...seg, d, pct: ((seg.value / total) * 100).toFixed(1) }
  })

  return (
    <Stack gap={2} align="center">
      <Text type="label" as="div" weight="semibold">
        {title}
      </Text>
      <div style={{ position: 'relative' }}>
        <svg width={180} height={180} viewBox="0 0 180 180">
          {arcs.map((arc, i) => (
            <path
              key={i}
              d={arc.d}
              fill={arc.color}
              stroke="white"
              strokeWidth={hoverIdx === i ? 3 : 1}
              opacity={hoverIdx !== null && hoverIdx !== i ? 0.4 : 1}
              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}
          <circle cx={cx} cy={cy} r={36} fill="white" />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fill="#64748b">
            Total
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill="#1e293b"
          >
            {total}
          </text>
        </svg>
        {hoverIdx !== null ? (
          <div
            style={{
              position: 'absolute',
              top: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1f2937',
              color: 'white',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 11,
              whiteSpace: 'nowrap',
            }}
          >
            {arcs[hoverIdx].label}: {arcs[hoverIdx].value} ({arcs[hoverIdx].pct}%)
          </div>
        ) : null}
      </div>
      <Stack gap={1}>
        {arcs.map((arc, i) => (
          <Stack key={i} direction="horizontal" gap={2} align="center">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: arc.color,
                display: 'inline-block',
              }}
            />
            <Text type="supporting" as="span">
              {arc.label}: {arc.value} ({arc.pct}%)
            </Text>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}

function CreditUtilizationBars({ cards, transactions }: { cards: Row[]; transactions: Row[] }) {
  const byCard = cards.slice(0, 6)
  const businessSpend = transactions
    .filter((t) => t.dataClassification === 'business')
    .reduce((s, t) => s + Number(t.reportingAmount ?? 0), 0)
  const householdSpend = transactions
    .filter((t) => t.dataClassification === 'household_personal')
    .reduce((s, t) => s + Number(t.reportingAmount ?? 0), 0)
  const totalSpend = businessSpend + householdSpend || 1

  return (
    <Stack gap={4}>
      {/* Credit cards */}
      <Stack gap={2}>
        <Text type="label" as="div" weight="semibold">
          Credit Card Utilization
        </Text>
        {byCard.length === 0 ? (
          <Text type="supporting" as="div">
            No credit cards.
          </Text>
        ) : null}
        {byCard.map((card) => {
          const limit = Number(card.creditLimit ?? 0)
          const bal = Number(card.currentBalance ?? 0)
          const pct = limit > 0 ? (bal / limit) * 100 : 0
          const variant: 'success' | 'warning' | 'error' =
            pct > 80 ? 'error' : pct > 50 ? 'warning' : 'success'
          const daysLeft = card.nextPaymentDueDate
            ? Math.ceil(
              (new Date(String(card.nextPaymentDueDate)).getTime() - Date.now()) / 86400000
            )
            : null
          return (
            <Stack key={String(card.id)} gap={1}>
              <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
                <Text type="label" as="span" weight="medium">
                  {String(card.cardLabel)} ··{String(card.last4Digits)}
                </Text>
                <Text type="supporting" as="span">
                  {money(String(card.currencyCode ?? 'USD'), bal)} /{' '}
                  {money(String(card.currencyCode ?? 'USD'), limit)}
                </Text>
                {daysLeft !== null ? (
                  <Badge
                    variant={daysLeft < 7 ? 'error' : daysLeft < 14 ? 'warning' : 'neutral'}
                    label={`${daysLeft}d due`}
                  />
                ) : null}
              </Stack>
              <ProgressBar
                label={`${String(card.cardLabel)} utilization`}
                value={Math.min(pct, 100)}
                hasValueLabel
                variant={
                  variant === 'success' ? 'success' : variant === 'warning' ? 'warning' : 'error'
                }
              />
            </Stack>
          )
        })}
      </Stack>
      <Divider />
      {/* Cashflow comparison */}
      <Stack gap={2}>
        <Text type="label" as="div" weight="semibold">
          Business vs Household Cashflow
        </Text>
        <Stack gap={2}>
          <Stack gap={1}>
            <Stack direction="horizontal" gap={2} align="center">
              <Text type="supporting" as="span" style={{ minWidth: 80 }}>
                Business
              </Text>
              <div
                style={{
                  flex: 1,
                  height: 16,
                  background: '#f1f5f9',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(businessSpend / totalSpend) * 100}%`,
                    height: '100%',
                    background: '#0866ff',
                    borderRadius: 8,
                  }}
                />
              </div>
              <Text type="label" as="span" weight="semibold">
                {money('USD', businessSpend)}
              </Text>
            </Stack>
          </Stack>
          <Stack gap={1}>
            <Stack direction="horizontal" gap={2} align="center">
              <Text type="supporting" as="span" style={{ minWidth: 80 }}>
                Household
              </Text>
              <div
                style={{
                  flex: 1,
                  height: 16,
                  background: '#f1f5f9',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(householdSpend / totalSpend) * 100}%`,
                    height: '100%',
                    background: '#f43f5e',
                    borderRadius: 8,
                  }}
                />
              </div>
              <Text type="label" as="span" weight="semibold">
                {money('USD', householdSpend)}
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default function Dashboard(props: Props) {
  const {
    kpis,
    orders,
    shipments,
    returnRequests,
    creditCards,
    tasksReminders,
    auditLogs,
    sellerAccounts,
    financialTransactions,
  } = props
  const [activeTab, setActiveTab] = useState('orders')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  const filteredOrders =
    channelFilter === 'all'
      ? orders
      : orders.filter((o) =>
        String(o.marketplaceCode ?? o.sellerAccountId ?? '')
          .toLowerCase()
          .includes(channelFilter.toLowerCase())
      )

  const marketplaceSegments = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const o of orders) {
      const key = String(o.marketplaceCode ?? 'direct')
      counts[key] = (counts[key] ?? 0) + 1
    }
    const colors: Record<string, string> = {
      amazon: '#ff9900',
      ebay: '#0064d2',
      etsy: '#f56400',
      direct: '#22c55e',
      shopify: '#95bf47',
    }
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      color: colors[label] ?? '#6366f1',
    }))
  }, [orders])

  const statusSegments = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const o of orders)
      counts[String(o.status ?? 'unknown')] = (counts[String(o.status ?? 'unknown')] ?? 0) + 1
    for (const s of shipments) counts[String(s.status)] = (counts[String(s.status)] ?? 0) + 1
    const colors: Record<string, string> = {
      delivered: '#22c55e',
      confirmed: '#0866ff',
      processing: '#6366f1',
      in_transit: '#0ea5e9',
      requested: '#f59e0b',
      pending: '#eab308',
    }
    return Object.entries(counts)
      .slice(0, 6)
      .map(([label, value]) => ({ label, value, color: colors[label] ?? '#94a3b8' }))
  }, [orders, shipments])

  const netMargin =
    Number(kpis.grossSales) > 0
      ? ((Number(kpis.orderNetProfit) / Number(kpis.grossSales)) * 100).toFixed(1)
      : '0'
  const refundRate =
    Number(kpis.grossSales) > 0
      ? ((Number(kpis.totalRefunded) / Number(kpis.grossSales)) * 100).toFixed(1)
      : '0'
  const completionRate =
    kpis.totalOrders > 0 ? ((kpis.deliveredOrders / kpis.totalOrders) * 100).toFixed(0) : '0'

  return (
    <Stack gap={4}>
      <PageSection
        id="overview"
        title="Business Overview"
        description="Reporting-currency P&L (USD) computed from order-level multi-currency amounts."
      >
        <Grid columns={{ minWidth: 210, max: 6 }} gap={3}>
          <KpiCard label="Total orders" value={String(kpis.totalOrders)} />
          <KpiCard label="Gross sales" value={money('USD', kpis.grossSales)} />
          <KpiCard label="Net sales" value={money('USD', kpis.netSales)} />
          <KpiCard label="Refunded" value={money('USD', kpis.totalRefunded)} />
          <KpiCard
            label="Marketplace + payment fees"
            value={money('USD', kpis.totalMarketplaceFees)}
          />
          <KpiCard label="COGS" value={money('USD', kpis.totalCogs)} />
          <KpiCard label="Shipping cost" value={money('USD', kpis.totalShippingCost)} />
          <KpiCard label="Orders net profit" value={money('USD', kpis.orderNetProfit)} />
          <KpiCard label="Business opex" value={money('USD', kpis.businessOperatingExpenses)} />
          <KpiCard label="Household spend" value={money('USD', kpis.householdExpenses)} />
          <KpiCard label="Pending orders" value={String(kpis.pendingOrders)} />
          <KpiCard label="Delivered orders" value={String(kpis.deliveredOrders)} />
          <KpiCard label="Active shipments" value={String(kpis.activeShipments)} />
          <KpiCard label="Open returns" value={String(kpis.openReturns)} />
          <KpiCard label="Risk reviews pending" value={String(kpis.pendingRiskReviews)} />
          <KpiCard label="Invoice variance" value={money('USD', kpis.invoiceVarianceTotal)} />
        </Grid>
      </PageSection>

      <PageSection
        title="Recent orders"
        description="Latest orders across your seller accounts."
        actions={
          <>
            <Link href="/orders">
              <Button label="+ New Order" variant="primary" size="sm" />
            </Link>
            <Link href="/products">
              <Button label="+ New Product" variant="secondary" size="sm" />
            </Link>
            <Link href="/shipments">
              <Button label="+ Shipment" variant="secondary" size="sm" />
            </Link>
            <Link href="/finance">
              <Button label="+ Transaction" variant="ghost" size="sm" />
            </Link>
            <Link href="/tasks">
              <Button label="+ Task" variant="ghost" size="sm" />
            </Link>
          </>
        }
      >
        <DataTable
          rows={filteredOrders.slice(0, 8)}
          empty="No orders yet."
          columns={[
            col.text('orderNumber', 'Order #', 130),
            col.badge('status', 'Status', STATUS_TONES),
            col.text('marketplaceCode', 'Channel', 100),
            col.money('reportingTotalAmount', 'Total'),
            col.date('orderedAt', 'Date'),
          ]}
        />
      </PageSection>

      <Grid columns={{ minWidth: 340, max: 3 }} gap={4}>
      <PageSection
        title="Active shipments"
        actions={
          <Link href="/shipments">
            <Button label="Open" variant="ghost" size="sm" />
          </Link>
        }
      >
        <DataTable
          rows={shipments.slice(0, 6)}
          empty="No shipments yet."
          columns={[
            col.text('shipmentNumber', 'Shipment #', 130),
            col.badge('status', 'Status', STATUS_TONES),
            col.text('carrierCode', 'Carrier', 90),
          ]}
        />
      </PageSection>

      <Card padding={4} variant="green" elevation="low">
        <Stack gap={2}>
          <Stack direction="horizontal" gap={2} align="center">
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={18} color="#22c55e" />
            </span>
            <Text type="label" as="div" weight="semibold">
              Order Net Profit
            </Text>
          </Stack>
          <Text type="display-2" as="div" weight="bold">
            {money('USD', kpis.orderNetProfit)}
          </Text>
          <Text type="supporting" as="div">
            Margin: {netMargin}% · COGS: {money('USD', kpis.totalCogs)}
          </Text>
          <Stack gap={1}>
            <Stack direction="horizontal" gap={2} align="center">
              <Text type="supporting" as="span">
                Fees: {money('USD', kpis.totalMarketplaceFees)}
              </Text>
              <Text type="supporting" as="span">
                Ship: {money('USD', kpis.totalShippingCost)}
              </Text>
            </Stack>
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ flex: Number(kpis.totalCogs) || 1, background: '#f59e0b' }} />
              <div
                style={{ flex: Number(kpis.totalMarketplaceFees) || 1, background: '#e8790a' }}
              />
              <div style={{ flex: Number(kpis.totalShippingCost) || 1, background: '#a78bfa' }} />
            </div>
          </Stack>
        </Stack>
      </Card>

      <Card padding={4} variant="cyan" elevation="low">
        <Stack gap={2}>
          <Stack direction="horizontal" gap={2} align="center">
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#cffafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={18} color="#0891b2" />
            </span>
            <Text type="label" as="div" weight="semibold">
              Fulfillment & SLA
            </Text>
          </Stack>
          <Text type="display-2" as="div" weight="bold">
            {kpis.deliveredOrders} / {kpis.totalOrders}
          </Text>
          <Text type="supporting" as="div">
            Delivered · {kpis.activeShipments} active shipments
          </Text>
          <Stack gap={1}>
            <Stack direction="horizontal" gap={2} align="center">
              <Text type="supporting" as="span">
                Completion
              </Text>
              <Text type="label" as="span" weight="semibold">
                {completionRate}%
              </Text>
            </Stack>
            <ProgressBar
              label="Fulfillment completion"
              value={Number(completionRate)}
              variant="success"
            />
            <Text type="supporting" as="div">
              Invoice variance: {money('USD', kpis.invoiceVarianceTotal)}
            </Text>
          </Stack>
        </Stack>
      </Card>

      <Card padding={4} variant="orange" elevation="low">
        <Stack gap={2}>
          <Stack direction="horizontal" gap={2} align="center">
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#ffedd5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} color="#f59e0b" />
            </span>
            <Text type="label" as="div" weight="semibold">
              Risk & Cashflow Alerts
            </Text>
          </Stack>
          <Stack direction="horizontal" gap={3}>
            <Stack gap={1}>
              <Text type="display-3" as="div" weight="bold">
                {kpis.openReturns}
              </Text>
              <Text type="supporting" as="div">
                Open RMAs
              </Text>
            </Stack>
            <Stack gap={1}>
              <Text type="display-3" as="div" weight="bold">
                {kpis.pendingRiskReviews}
              </Text>
              <Text type="supporting" as="div">
                Risk reviews
              </Text>
            </Stack>
          </Stack>
          <Text type="supporting" as="div">
            Business opex: {money('USD', kpis.businessOperatingExpenses)} · Household:{' '}
            {money('USD', kpis.householdExpenses)}
          </Text>
        </Stack>
      </Card>
      </Grid>

      {/* Secondary compact health strip */}
      <Card padding={3} variant="muted">
        <Grid columns={{ minWidth: 150, max: 6 }} gap={3}>
          {[
            { label: 'Total Orders', value: String(kpis.totalOrders) },
            { label: 'Pending', value: String(kpis.pendingOrders) },
            { label: 'Delivered', value: String(kpis.deliveredOrders) },
            { label: 'Active Shipments', value: String(kpis.activeShipments) },
            { label: 'Open Returns', value: String(kpis.openReturns) },
            { label: 'Risk Pending', value: String(kpis.pendingRiskReviews) },
          ].map((item) => (
            <Stack key={item.label} gap={1} align="center">
              <Text type="supporting" as="div">
                {item.label}
              </Text>
              <Text type="display-3" as="div" weight="bold">
                {item.value}
              </Text>
            </Stack>
          ))}
        </Grid>
      </Card>

      <PageSection
        title="Recent audit events"
        actions={
          <Link href="/audit">
            <Button label="Open" variant="ghost" size="sm" />
          </Link>
        }
      >
        <DataTable
          rows={auditLogs.slice(0, 6)}
          empty="No audit events recorded."
          columns={[
            col.text('action', 'Action', 150),
            col.text('entityType', 'Entity', 120),
            col.date('createdAt', 'When'),
          ]}
        />
      </PageSection>

      <Card padding={4} variant="muted">
        <Stack direction="horizontal" align="center" wrap="wrap" gap={3}>
          <Badge variant="info" label="Tip" />
          <Text type="supporting" as="div">
            Every module page provides complete create · read · update · delete flows with strict
            user_id isolation. Channel filter is interactive — try selecting Amazon or eBay above.
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}
