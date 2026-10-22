import { Calendar, MapPin, Package, Truck, ChevronRight, Pencil, Trash2, Eye } from 'lucide-react'
import { StatusBadge, STATUS_TONES } from '~/components/atoms/status-badge'
import { formatMoney, formatDate } from '~/lib/utils'
import type { Row } from '~/lib/ui'

export interface OrderCardProps {
  order: Row
  selected?: boolean
  onSelect?: (id: string, checked: boolean) => void
  onOpenDetail?: (order: Row) => void
  onView?: (order: Row) => void
  onEditStatus?: (order: Row) => void
  onEdit?: (order: Row) => void
  onDelete: (order: Row) => void
}

export function OrderCard({
  order,
  selected,
  onSelect,
  onOpenDetail,
  onView,
  onEditStatus,
  onEdit,
  onDelete,
}: OrderCardProps) {
  const handleDetail = onOpenDetail ?? onView ?? (() => {})
  const handleEdit = onEditStatus ?? onEdit ?? (() => {})
  const lineItems = (order.lineItems as Row[]) ?? []
  const customer = (order.customer as Row) ?? {}
  const shipments = (order.shipments as Row[]) ?? []
  const firstShipment = shipments[0]

  return (
    <div
      className={`group rounded-xl border bg-card text-card-foreground hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      }`}
    >
      <div className="flex flex-col lg:flex-row">
        {/* LEFT: SKU & Line Items Summary Stack */}
        <div
          onClick={() => handleDetail(order)}
          className="w-full lg:w-44 p-5 shrink-0 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-border bg-muted/25 cursor-pointer relative"
        >
          {onSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onSelect(String(order.id), e.target.checked)}
              aria-label={`Select order ${String(order.orderNumber)}`}
              className="absolute top-3.5 left-3.5 w-4 h-4 rounded border-border accent-primary"
            />
          )}
          <div className="w-12 h-12 rounded-2xl bg-primary/12 border border-primary/25 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground text-center truncate max-w-full px-2">
            {lineItems[0]?.sku || order.marketplaceCode || 'ORDER'}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {lineItems.length || 1} {lineItems.length === 1 ? 'line item' : 'line items'}
          </span>
        </div>

        {/* MIDDLE: Order Timeline & P&L */}
        <div className="flex-1 p-5 flex flex-col justify-between gap-4 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => handleDetail(order)}
                className="flex items-center gap-1.5 text-left group/btn cursor-pointer"
              >
                <h3 className="text-base sm:text-lg font-bold text-foreground group-hover/btn:text-primary transition-colors">
                  {String(order.orderNumber)}
                </h3>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/btn:text-primary transition-colors" />
              </button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                <span className="font-mono">
                  {String(order.externalOrderId || order.id).slice(0, 18)}
                </span>
                <span>•</span>
                <span className="uppercase font-semibold text-primary">
                  {String(order.marketplaceCode || 'direct')}
                </span>
                <span>•</span>
                <span className="truncate">
                  {String(customer.fullName || order.customerFullName || 'Walk-in Buyer')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge
                label={String(order.status || 'pending')}
                variant={STATUS_TONES[String(order.status)] || 'neutral'}
              />
              {order.paymentStatus && (
                <StatusBadge
                  label={String(order.paymentStatus)}
                  variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                />
              )}
            </div>
          </div>

          {/* 3-Stage Fulfillment Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 border-y border-border/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/12 text-primary flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ordered
                </p>
                <p className="text-xs font-semibold text-foreground truncate">
                  {formatDate(order.orderedAt)}
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-2.5 min-w-0 ${
                firstShipment || order.fulfillmentStatus === 'fulfilled'
                  ? 'opacity-100'
                  : 'opacity-50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/12 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fulfillment
                </p>
                <p className="text-xs font-semibold text-foreground capitalize truncate">
                  {String(order.fulfillmentStatus || 'unfulfilled').replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-2.5 min-w-0 ${
                order.deliveredAt || order.status === 'delivered' ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Delivered
                </p>
                <p className="text-xs font-semibold text-foreground truncate">
                  {order.deliveredAt ? formatDate(order.deliveredAt) : 'Pending'}
                </p>
              </div>
            </div>
          </div>

          {/* Totals & Actions Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5 flex-wrap">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                  Order Total
                </span>
                <span className="text-base font-bold text-foreground tabular-nums">
                  {formatMoney(String(order.currencyCode || 'USD'), order.totalAmount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                  Net Profit (USD)
                </span>
                <span
                  className={`text-base font-bold tabular-nums ${
                    Number(order.netProfitAmount ?? 0) >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatMoney(String(order.reportingCurrencyCode || 'USD'), order.netProfitAmount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                  Fees / COGS
                </span>
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {formatMoney(String(order.currencyCode || 'USD'), order.marketplaceFeesAmount)} /{' '}
                  {formatMoney(String(order.currencyCode || 'USD'), order.cogsAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDetail(order)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> Details
              </button>
              <button
                type="button"
                onClick={() => handleEdit(order)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:opacity-90 text-primary-foreground transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Status
              </button>
              <button
                type="button"
                onClick={() => onDelete(order)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete order"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Customer & Shipment Summary */}
        <div className="w-full lg:w-60 p-5 bg-muted/20 border-t lg:border-t-0 lg:border-l border-border flex flex-col justify-between shrink-0">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Buyer & Channel
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {String(customer.fullName || order.customerFullName || 'Customer')}
              </p>
              {customer.email && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {String(customer.email)}
                </p>
              )}
              {firstShipment && (
                <div className="mt-3 pt-2.5 border-t border-border/70">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Parcel
                  </p>
                  <p className="text-xs font-mono font-semibold text-foreground truncate mt-0.5">
                    {String(firstShipment.carrierCode || '').toUpperCase()} ·{' '}
                    {String(firstShipment.trackingNumber || firstShipment.shipmentNumber)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
