import { Calendar, MapPin, Package, Truck, ChevronRight, Pencil, Trash2, Eye } from 'lucide-react'
import { StatusBadge } from '~/ui/badge'
import { formatMoney, formatDate } from '~/lib/utils'
import { STATUS_TONES, type Row } from '~/lib/ui'

export interface OrderCardProps {
  order: Row
  onOpenDetail: (order: Row) => void
  onEditStatus: (order: Row) => void
  onDelete: (order: Row) => void
}

export function OrderCard({ order, onOpenDetail, onEditStatus, onDelete }: OrderCardProps) {
  const lineItems = (order.lineItems as Row[]) ?? []
  const customer = (order.customer as Row) ?? {}
  const shipments = (order.shipments as Row[]) ?? []
  const firstShipment = shipments[0]

  return (
    <div className="group rounded-xl border border-border bg-card hover:border-indigo-500/40 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* LEFT: SKU & Line Items Summary Stack */}
        <div
          onClick={() => onOpenDetail(order)}
          className="w-full lg:w-48 p-5 shrink-0 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-border bg-muted/20 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
            <Package className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground text-center truncate max-w-full px-2">
            {lineItems[0]?.sku || order.marketplaceCode || 'ORDER'}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {lineItems.length || 1} {lineItems.length === 1 ? 'line item' : 'line items'}
          </span>
        </div>

        {/* MIDDLE: Order Timeline & P&L */}
        <div className="flex-1 p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <button
                type="button"
                onClick={() => onOpenDetail(order)}
                className="flex items-center gap-1.5 text-left group/btn cursor-pointer"
              >
                <h3 className="text-base sm:text-lg font-bold text-foreground group-hover/btn:text-indigo-600 transition-colors">
                  {String(order.orderNumber)}
                </h3>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/btn:text-indigo-600 transition-colors" />
              </button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                <span className="font-mono">{String(order.externalOrderId || order.id).slice(0, 18)}</span>
                <span>•</span>
                <span className="uppercase font-semibold text-indigo-600 dark:text-indigo-400">
                  {String(order.marketplaceCode || 'direct')}
                </span>
                <span>•</span>
                <span>{String(customer.fullName || order.customerFullName || 'Walk-in Buyer')}</span>
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

          {/* 3-Stage Fulfillment Timeline (ported from inertia-old/modules/order/order-card.tsx) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 border-y border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
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

            <div className={`flex items-center gap-2.5 ${firstShipment || order.fulfillmentStatus === 'fulfilled' ? 'opacity-100' : 'opacity-45'}`}>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
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

            <div className={`flex items-center gap-2.5 ${order.deliveredAt || order.status === 'delivered' ? 'opacity-100' : 'opacity-45'}`}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
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
                <span className="text-base font-bold text-foreground">
                  {formatMoney(String(order.currencyCode || 'USD'), order.totalAmount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                  Net Profit (USD)
                </span>
                <span
                  className={`text-base font-bold ${
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
                <span className="text-xs font-medium text-muted-foreground">
                  {formatMoney(String(order.currencyCode || 'USD'), order.marketplaceFeesAmount)} /{' '}
                  {formatMoney(String(order.currencyCode || 'USD'), order.cogsAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenDetail(order)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" /> Details
              </button>
              <button
                type="button"
                onClick={() => onEditStatus(order)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Status
              </button>
              <button
                type="button"
                onClick={() => onDelete(order)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete order"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Customer & Shipment Summary (ported from inertia-old OrderCard) */}
        <div className="w-full lg:w-64 p-5 bg-muted/25 border-t lg:border-t-0 lg:border-l border-border flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Buyer & Channel
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {String(customer.fullName || order.customerFullName || 'Customer')}
              </p>
              {customer.email && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{String(customer.email)}</p>
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
