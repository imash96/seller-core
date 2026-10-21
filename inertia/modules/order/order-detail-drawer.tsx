import Drawer from '~/ui/drawer'
import { StatusBadge } from '~/ui/badge'
import { Package, Calendar, DollarSign, Truck } from 'lucide-react'
import { formatMoney, formatDate } from '~/lib/utils'
import { STATUS_TONES, type Row } from '~/lib/ui'

export function OrderDetailsDrawer({
  order,
  onClose,
  onEditStatus,
}: {
  order: Row | null
  onClose: () => void
  onEditStatus?: (order: Row) => void
}) {
  if (!order) return null

  const lineItems = (order.lineItems as Row[]) ?? []
  const shipments = (order.shipments as Row[]) ?? []
  const customer = (order.customer as Row) ?? {}
  const cur = String(order.currencyCode || 'USD')
  const repCur = String(order.reportingCurrencyCode || 'USD')

  return (
    <Drawer
      open={!!order}
      onClose={onClose}
      direction="right"
      title={`Order ${String(order.orderNumber)}`}
      subtitle={`External ID: ${String(order.externalOrderId || 'Direct')} · ${String(order.marketplaceCode || 'direct').toUpperCase()}`}
      widthClass="max-w-xl"
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap p-4 rounded-xl bg-muted/40 border border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge
              label={String(order.status || 'pending')}
              variant={STATUS_TONES[String(order.status)] || 'neutral'}
            />
            <StatusBadge
              label={`Payment: ${String(order.paymentStatus || 'paid')}`}
              variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}
            />
            <StatusBadge
              label={`Fulfillment: ${String(order.fulfillmentStatus || 'unfulfilled')}`}
              variant={STATUS_TONES[String(order.fulfillmentStatus)] || 'neutral'}
            />
          </div>
          {onEditStatus && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onEditStatus(order)
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
            >
              Change Status
            </button>
          )}
        </div>

        {/* Customer & Dates */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Customer & Timeline</span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-card text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Customer</span>
              <span className="font-semibold">{String(customer.fullName || order.customerFullName || '—')}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Email</span>
              <span className="font-medium truncate block">{String(customer.email || '—')}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Ordered At</span>
              <span className="font-medium">{formatDate(order.orderedAt)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Delivered At</span>
              <span className="font-medium">{formatDate(order.deliveredAt)}</span>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Package className="w-4 h-4 text-indigo-600" />
            <span>Order Line Items ({lineItems.length})</span>
          </div>
          <div className="space-y-2.5">
            {lineItems.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No line items recorded.</p>
            ) : (
              lineItems.map((li) => (
                <div
                  key={String(li.id)}
                  className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {String(li.title || li.sku)}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      SKU: {String(li.sku)} · Qty: {String(li.quantityOrdered ?? 1)} (Fulfilled:{' '}
                      {String(li.quantityFulfilled ?? 0)})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">
                      {formatMoney(cur, Number(li.unitPrice ?? 0) * Number(li.quantityOrdered ?? 1))}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatMoney(cur, li.unitPrice)} / unit
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shipments */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Truck className="w-4 h-4 text-indigo-600" />
            <span>Shipments ({shipments.length})</span>
          </div>
          {shipments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No shipments dispatched yet.</p>
          ) : (
            <div className="space-y-2">
              {shipments.map((s) => (
                <div
                  key={String(s.id)}
                  className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-foreground">{String(s.shipmentNumber)}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {String(s.carrierCode || '').toUpperCase()} · {String(s.trackingNumber || 'No tracking')}
                    </p>
                  </div>
                  <StatusBadge
                    label={String(s.status)}
                    variant={STATUS_TONES[String(s.status)] || 'neutral'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial P&L Waterfall */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            <span>Order P&L Waterfall</span>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted/25 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatMoney(cur, order.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping Charged</span>
              <span className="font-medium">{formatMoney(cur, order.shippingChargedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">{formatMoney(cur, order.taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border font-bold">
              <span>Order Total ({cur})</span>
              <span>{formatMoney(cur, order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400">
              <span>− Marketplace & Payment Fees</span>
              <span>
                −
                {formatMoney(
                  cur,
                  Number(order.marketplaceFeesAmount ?? 0) +
                    Number(order.paymentProcessingFeesAmount ?? 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400">
              <span>− COGS & Shipping Cost</span>
              <span>
                −
                {formatMoney(
                  cur,
                  Number(order.cogsAmount ?? 0) + Number(order.shippingCostAmount ?? 0)
                )}
              </span>
            </div>
            {Number(order.refundedAmount ?? 0) > 0 && (
              <div className="flex justify-between text-xs text-rose-600">
                <span>− Refunded</span>
                <span>−{formatMoney(cur, order.refundedAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border text-base font-bold text-emerald-600 dark:text-emerald-400">
              <span>True Net Profit ({repCur})</span>
              <span>{formatMoney(repCur, order.netProfitAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
