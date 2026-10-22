import { useState, useMemo } from 'react'
import { formatMoney } from '~/lib/utils'
import { StatusBadge } from '../atoms/status-badge'
import { ProgressMeter } from '../atoms/progress-meter'
import type { Row } from './responsive-data-view'

export type DashboardKpis = {
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

export function WaterfallChart({
  kpis,
  currencyCode = 'USD',
}: {
  kpis: DashboardKpis
  currencyCode?: string
}) {
  const steps = [
    { label: 'Gross Sales', value: Number(kpis.grossSales), color: '#4f46e5', isTotal: false },
    { label: '− Refunds', value: -Number(kpis.totalRefunded), color: '#ef4444', isTotal: false },
    { label: '= Net Sales', value: Number(kpis.netSales), color: '#10b981', isTotal: true },
    { label: '− COGS', value: -Number(kpis.totalCogs), color: '#f59e0b', isTotal: false },
    {
      label: '− Channel Fees',
      value: -Number(kpis.totalMarketplaceFees),
      color: '#f97316',
      isTotal: false,
    },
    {
      label: '− Shipping Cost',
      value: -Number(kpis.totalShippingCost),
      color: '#06b6d4',
      isTotal: false,
    },
    {
      label: '= Order Net Profit',
      value: Number(kpis.orderNetProfit),
      color: '#8b5cf6',
      isTotal: true,
    },
    {
      label: '− Business Opex',
      value: -Number(kpis.businessOperatingExpenses),
      color: '#64748b',
      isTotal: false,
    },
  ]

  const maxAbs = Math.max(...steps.map((s) => Math.abs(s.value)), 1)
  const [hovered, setHovered] = useState<{ label: string; value: number } | null>(null)

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {steps.map((step) => {
          const barW = Math.max(4, (Math.abs(step.value) / maxAbs) * 100)
          return (
            <div
              key={step.label}
              onMouseEnter={() => setHovered({ label: step.label, value: step.value })}
              onMouseLeave={() => setHovered(null)}
              className="flex items-center gap-3 group cursor-default"
            >
              <span
                className={`w-32 text-xs truncate ${
                  step.isTotal ? 'font-bold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
              <div className="flex-1 h-4 rounded-md bg-muted overflow-hidden relative">
                <div
                  className="h-full rounded-md transition-all duration-300 group-hover:opacity-90"
                  style={{
                    width: `${barW}%`,
                    backgroundColor: step.color,
                  }}
                />
              </div>
              <span
                className={`w-24 text-right text-xs font-semibold tabular-nums ${
                  step.value < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : step.isTotal
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-foreground'
                }`}
              >
                {step.value > 0 ? '+' : ''}
                {formatMoney(currencyCode, step.value)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="h-7 flex items-center justify-between px-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
        {hovered ? (
          <>
            <span className="font-semibold text-foreground">{hovered.label}</span>
            <span className="tabular-nums font-medium">
              {formatMoney(currencyCode, hovered.value)} (
              {((Math.abs(hovered.value) / maxAbs) * 100).toFixed(1)}% of Gross Sales)
            </span>
          </>
        ) : (
          <span>Hover any bar to inspect exact P&L share of gross revenue</span>
        )}
      </div>
    </div>
  )
}

export function RevenueTrendChart({
  orders,
  currencyCode = 'USD',
}: {
  orders: Row[]
  currencyCode?: string
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [mode, setMode] = useState<'revenue' | 'profit' | 'fees'>('revenue')

  const sorted = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(String(a.orderedAt)).getTime() - new Date(String(b.orderedAt)).getTime()
      ),
    [orders]
  )
  const sliced = sorted.slice(-12)

  if (sliced.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No order timeline data available for current filter.
      </div>
    )
  }

  const getVal = (o: Row) => {
    if (mode === 'revenue') return Number(o.reportingTotalAmount ?? o.totalAmount ?? 0)
    if (mode === 'profit') return Number(o.netProfitAmount ?? 0)
    return Number(o.marketplaceFeesAmount ?? 0) + Number(o.paymentProcessingFeesAmount ?? 0)
  }

  const vals = sliced.map(getVal)
  const maxV = Math.max(...vals, 1)
  const minV = Math.min(...vals, 0)
  const range = maxV - minV || 1
  const W = 560
  const H = 170
  const padX = 24
  const padY = 20
  const stepX = (W - padX * 2) / Math.max(sliced.length - 1, 1)

  const points = vals.map((v, i) => ({
    x: padX + i * stepX,
    y: H - padY - ((v - minV) / range) * (H - padY * 2),
  }))

  const strokeColor = mode === 'revenue' ? '#4f46e5' : mode === 'profit' ? '#10b981' : '#f59e0b'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center p-0.5 rounded-xl bg-muted border border-border">
          {(['revenue', 'profit', 'fees'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                mode === m
                  ? 'bg-card text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'fees' ? 'Fee Burden' : m === 'profit' ? 'Net Profit' : 'Revenue'}
            </button>
          ))}
        </div>

        {hoverIdx !== null && sliced[hoverIdx] ? (
          <div className="text-xs font-semibold text-foreground bg-muted px-2.5 py-1 rounded-lg border border-border tabular-nums">
            {String(sliced[hoverIdx].orderNumber)}: {formatMoney(currencyCode, vals[hoverIdx])}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            Last {sliced.length} chronological orders
          </span>
        )}
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-border bg-muted/20 p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 block overflow-visible">
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={padX}
              y1={H - padY - t * (H - padY * 2)}
              x2={W - padX}
              y2={H - padY - t * (H - padY * 2)}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}
          <path
            d={`M ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1]?.x ?? padX},${H - padY} L ${padX},${H - padY} Z`}
            fill={strokeColor}
            fillOpacity={0.14}
          />
          <path
            d={`M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoverIdx === i ? 6 : 4}
              fill={strokeColor}
              stroke="var(--card)"
              strokeWidth={2}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

export function DonutChart({
  title,
  segments,
}: {
  title: string
  segments: Array<{ label: string; value: number; color: string }>
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  let cumAngle = -90
  const R = 68
  const cx = 85
  const cy = 85

  const arcs = segments.map((seg) => {
    const rawAngle = (seg.value / total) * 360
    const angle = Math.min(rawAngle, 359.9)
    const startAngle = cumAngle
    const endAngle = cumAngle + angle
    cumAngle += rawAngle
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
    <div className="flex flex-col items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="relative">
        <svg width={170} height={170} viewBox="0 0 170 170">
          {arcs.map((arc, i) => (
            <path
              key={i}
              d={arc.d}
              fill={arc.color}
              stroke="var(--card)"
              strokeWidth={hoverIdx === i ? 3 : 1.5}
              opacity={hoverIdx !== null && hoverIdx !== i ? 0.45 : 1}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          ))}
          <circle cx={cx} cy={cy} r={36} fill="var(--card)" />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize={10}
            fill="var(--muted-foreground)"
          >
            {hoverIdx !== null && arcs[hoverIdx] ? arcs[hoverIdx].label.slice(0, 10) : 'Total'}
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill="var(--foreground)"
          >
            {hoverIdx !== null && arcs[hoverIdx] ? `${arcs[hoverIdx].pct}%` : total}
          </text>
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-xs">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: arc.color }}
              />
              <span className="text-muted-foreground capitalize truncate">{arc.label}</span>
            </div>
            <span className="font-semibold text-foreground tabular-nums">{arc.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CreditUtilizationBars({
  cards,
  transactions,
}: {
  cards: Row[]
  transactions: Row[]
}) {
  const byCard = cards.slice(0, 5)
  const businessSpend = transactions
    .filter((t) => t.dataClassification === 'business')
    .reduce((s, t) => s + Number(t.reportingAmount ?? 0), 0)
  const householdSpend = transactions
    .filter((t) => t.dataClassification === 'household_personal')
    .reduce((s, t) => s + Number(t.reportingAmount ?? 0), 0)
  const totalSpend = businessSpend + householdSpend || 1

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Credit Card Utilization & Payment Due Alerts
        </div>
        {byCard.length === 0 ? (
          <p className="text-xs text-muted-foreground">No credit cards registered.</p>
        ) : (
          byCard.map((card) => {
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
              <div key={String(card.id)} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                  <span className="font-semibold text-foreground">
                    {String(card.cardLabel)} ···· {String(card.last4Digits)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground tabular-nums">
                      {formatMoney(String(card.currencyCode ?? 'USD'), bal)} /{' '}
                      {formatMoney(String(card.currencyCode ?? 'USD'), limit)}
                    </span>
                    {daysLeft !== null && (
                      <StatusBadge
                        variant={daysLeft < 7 ? 'error' : daysLeft < 14 ? 'warning' : 'neutral'}
                        label={daysLeft >= 0 ? `${daysLeft}d due` : `${Math.abs(daysLeft)}d overdue`}
                      />
                    )}
                  </div>
                </div>
                <ProgressMeter value={pct} variant={variant} showValue size="sm" />
              </div>
            )
          })
        )}
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-2.5">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Business vs. Household Ledger Segregation
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="w-20 text-muted-foreground font-medium">Business</span>
            <div className="flex-1 h-3.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(businessSpend / totalSpend) * 100}%` }}
              />
            </div>
            <span className="w-24 text-right font-semibold text-foreground tabular-nums">
              {formatMoney('USD', businessSpend)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="w-20 text-muted-foreground font-medium">Household</span>
            <div className="flex-1 h-3.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{ width: `${(householdSpend / totalSpend) * 100}%` }}
              />
            </div>
            <span className="w-24 text-right font-semibold text-foreground tabular-nums">
              {formatMoney('USD', householdSpend)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
