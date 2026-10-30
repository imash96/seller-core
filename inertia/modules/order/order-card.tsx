import {
  Calendar,
  MapPin,
  Truck,
  Pencil,
  Trash2,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Repeat,
  UserCheck,
  Mail,
  Phone,
} from 'lucide-react'
import { StatusBadge, STATUS_TONES } from '~/components/atoms/status-badge'
import { MonoBadge } from '~/components/atoms/mono-badge'
import { ThumbnailStack } from '~/components/atoms/thumbnail-stack'
import { AppButton } from '~/components/atoms/button'
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

  // Build ThumbnailStack items from order line items
  const thumbItems =
    lineItems.length > 0
      ? lineItems.map((li) => ({
          imageUrl: String(li.imageUrl ?? (li.productVariant as any)?.product?.images?.[0] ?? ''),
          sku: String(li.sku ?? ''),
          title: String(li.title ?? ''),
          quantity: Number(li.quantityOrdered ?? 1),
        }))
      : [{ sku: String(order.orderNumber ?? 'ORD'), title: 'Order Item' }]

  const totalUnits = lineItems.reduce((sum, li) => sum + Number(li.quantityOrdered ?? 1), 0)

  // Resolve Shipping Address
  const addrSnap =
    (order.shippingAddressSnapshot as Record<string, any>) ??
    (order.shippingAddress as Record<string, any>) ??
    ((customer.addresses as any[])?.[0] as Record<string, any>) ??
    {}
  const addressString = [
    addrSnap.line1 || addrSnap.street,
    addrSnap.city,
    addrSnap.stateCode || addrSnap.state,
    addrSnap.postalCode || addrSnap.zip,
    addrSnap.countryCode || addrSnap.country,
  ]
    .filter(Boolean)
    .join(', ')

  // Customer Intelligence: Repeat vs First-Time, Fraud/Risk vs Verified
  const ordersCount = Number(customer.ordersCount ?? 1)
  const isRepeat = Boolean(customer.isRepeatCustomer) || ordersCount > 1
  const riskLevel = String(customer.riskLevel ?? 'low').toLowerCase()
  const riskScore = Number(customer.riskScore ?? 0)
  const riskSignals = (customer.riskSignals as Row[]) ?? []
  const isFraudOrHighRisk =
    riskLevel === 'high' ||
    riskLevel === 'critical' ||
    riskLevel === 'fraud' ||
    riskScore >= 60 ||
    riskSignals.some((s) => s.status !== 'dismissed')

  const currency = String(order.currencyCode || 'USD')
  const netProfit = Number(order.netProfitAmount ?? 0)
  const totalFees =
    Number(order.marketplaceFeesAmount ?? 0) + Number(order.paymentProcessingFeesAmount ?? 0)

  return (
    <div
      className={`group rounded-2xl border bg-card text-card-foreground hover:border-primary/45 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-card-border'
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-divider">
        {/* ===================================================================
            SECTION 1: PRODUCT THUMBNAIL STACK (Tilted Background on Multi-Item)
           =================================================================== */}
        <div
          onClick={() => handleDetail(order)}
          className="lg:col-span-3 p-5 bg-surface-sunken/60 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 cursor-pointer"
        >
          <div className="flex items-center gap-3 w-full lg:justify-between">
            {onSelect && (
              <input
                type="checkbox"
                checked={!!selected}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onSelect(String(order.id), e.target.checked)}
                className="w-4 h-4 rounded border-input-border text-primary focus:ring-ring cursor-pointer"
                aria-label={`Select order ${order.orderNumber}`}
              />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {lineItems.length > 1
                ? `${lineItems.length} Line Items (${totalUnits} Qty)`
                : `${totalUnits || 1} Unit Ordered`}
            </span>
          </div>

          <div className="py-1">
            <ThumbnailStack items={thumbItems} size="lg" />
          </div>

          <div className="text-right lg:text-center min-w-0 max-w-full space-y-1">
            <MonoBadge text={String(lineItems[0]?.sku ?? order.orderNumber)} />
            <p className="text-xs font-medium text-foreground-secondary line-clamp-1">
              {String(lineItems[0]?.title ?? 'Direct Order Item')}
            </p>
            {lineItems.length > 1 && (
              <p className="text-[11px] font-semibold text-primary">
                +{lineItems.length - 1} more item(s) stacked
              </p>
            )}
          </div>
        </div>

        {/* ===================================================================
            SECTION 2: ORDER METADATA, LINE ITEMS & P&L ECONOMICS
           =================================================================== */}
        <div className="lg:col-span-5 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            {/* Order Header & Statuses */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleDetail(order)}
                    className="text-base font-extrabold text-foreground hover:text-primary transition-colors font-mono cursor-pointer"
                  >
                    #{String(order.orderNumber)}
                  </button>
                  <StatusBadge
                    label={String(order.marketplaceCode || 'direct').toUpperCase()}
                    variant="purple"
                  />
                  <StatusBadge
                    label={String(order.status ?? 'pending').replace(/_/g, ' ')}
                    variant={STATUS_TONES[String(order.status)] ?? 'neutral'}
                  />
                  <StatusBadge
                    label={`Pay: ${String(order.paymentStatus ?? 'paid')}`}
                    variant={STATUS_TONES[String(order.paymentStatus)] ?? 'info'}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(order.orderedAt)}
                  </span>
                  {order.externalOrderId && (
                    <span className="font-mono">Ext: {String(order.externalOrderId)}</span>
                  )}
                  {firstShipment?.trackingNumber && (
                    <span className="inline-flex items-center gap-1 text-primary font-mono">
                      <Truck className="w-3.5 h-3.5" />
                      {String(firstShipment.carrierCode || 'CARRIER').toUpperCase()}:{' '}
                      {String(firstShipment.trackingNumber)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Compact Line Items List */}
            {lineItems.length > 0 && (
              <div className="rounded-xl border border-border-subtle bg-muted/25 p-2.5 space-y-1.5 max-h-28 overflow-y-auto">
                {lineItems.map((li, i) => (
                  <div
                    key={String(li.id ?? i)}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className="font-bold text-primary tabular-nums">
                        {String(li.quantityOrdered ?? 1)}×
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-foreground">
                        {String(li.sku)}
                      </span>
                      <span className="text-muted-foreground truncate">— {String(li.title)}</span>
                    </div>
                    <span className="font-semibold text-foreground tabular-nums shrink-0">
                      {formatMoney(currency, li.lineTotalAmount ?? li.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transparent 5-Column P&L Economics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-divider text-xs">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Paid
              </span>
              <span className="font-bold text-price-current tabular-nums">
                {formatMoney(currency, order.totalAmount)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                COGS
              </span>
              <span className="font-semibold text-foreground-secondary tabular-nums">
                {formatMoney(currency, order.cogsAmount)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Channel Fees
              </span>
              <span className="font-semibold text-foreground-secondary tabular-nums">
                {formatMoney(currency, totalFees)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Shipping
              </span>
              <span className="font-semibold text-foreground-secondary tabular-nums">
                {formatMoney(currency, order.shippingCostAmount)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Net Profit
              </span>
              <span
                className={`font-extrabold tabular-nums ${
                  netProfit >= 0 ? 'text-price-save' : 'text-error'
                }`}
              >
                {formatMoney(currency, netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================================
            SECTION 3: CUSTOMER DETAILS, ADDRESS & REPEAT / FRAUD INTELLIGENCE
           =================================================================== */}
        <div className="lg:col-span-4 p-5 flex flex-col justify-between gap-4 bg-surface/40">
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Customer & Destination
                </span>
                <div className="text-sm font-bold text-foreground mt-0.5">
                  {String(customer.fullName ?? addrSnap.recipientName ?? 'Guest Buyer')}
                </div>
              </div>

              {/* Repeat vs First-Time Customer Badge */}
              {isRepeat ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-info-subtle text-info border border-info/25">
                  <Repeat className="w-3 h-3" />
                  Repeat ({ordersCount} orders)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                  <UserCheck className="w-3 h-3" />
                  1st Order
                </span>
              )}
            </div>

            {/* Contact & Shipping Address */}
            <div className="space-y-1 text-xs text-muted-foreground">
              {customer.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{String(customer.email)}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span>{String(customer.phone)}</span>
                </div>
              )}
              <div className="flex items-start gap-1.5 pt-0.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-primary mt-0.5" />
                <span className="line-clamp-2 text-foreground-secondary">
                  {addressString || 'Standard Marketplace Fulfillment Address'}
                </span>
              </div>
            </div>

            {/* Fraud / Risk Intelligence Banner */}
            <div className="pt-1 flex items-center gap-2 flex-wrap">
              {isFraudOrHighRisk ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-error-subtle text-error border border-error/30">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Fraud / Risk Alert ({riskLevel.toUpperCase()} · Score {riskScore})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success-subtle text-success border border-success/25">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Buyer (Risk Score: {riskScore})
                </span>
              )}
              {customer.totalSpent && Number(customer.totalSpent) > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  LTV:{' '}
                  <strong className="text-foreground">
                    {formatMoney(currency, customer.totalSpent)}
                  </strong>
                </span>
              )}
            </div>
          </div>

          {/* Card Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-divider flex-wrap">
            <AppButton
              label="Details"
              variant="secondary"
              size="xs"
              icon={Eye}
              onClick={() => handleDetail(order)}
            />
            <AppButton
              label="Update Status"
              variant="outline"
              size="xs"
              icon={Pencil}
              onClick={() => handleEdit(order)}
            />
            <AppButton
              label="Cancel"
              variant="ghost"
              size="xs"
              icon={Trash2}
              onClick={() => onDelete(order)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
