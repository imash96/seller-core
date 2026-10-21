import { Card } from '~/ui/card'
import { Badge, statusBadgeVariant } from '~/ui/badge'
import { formatMoney, formatDate } from '~/lib/utils'
import { Truck, ExternalLink, Edit3 } from 'lucide-react'
import type { Row } from '~/lib/ui'

export function ShipmentCard({
  shipment,
  selected,
  onSelect,
  onEdit,
}: {
  shipment: Row
  selected?: boolean
  onSelect?: (id: string, checked: boolean) => void
  onEdit: (shipment: Row) => void
}) {
  const currency = String(shipment.currencyCode ?? 'USD')
  return (
    <Card padding="none" hoverable className="overflow-hidden flex flex-col justify-between">
      <div>
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {onSelect ? (
              <input
                type="checkbox"
                checked={!!selected}
                onChange={(e) => onSelect(String(shipment.id), e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] text-blue-600"
              />
            ) : null}
            <Truck className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
            <span className="font-mono text-sm font-bold text-[var(--text-primary)] truncate">
              {String(shipment.shipmentNumber)}
            </span>
          </div>
          <Badge variant={statusBadgeVariant(String(shipment.status))} dot>
            {String(shipment.status).replace(/_/g, ' ')}
          </Badge>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-[var(--text-muted)] uppercase font-semibold">Carrier & Service</div>
            <div className="font-semibold text-[var(--text-primary)] mt-0.5">
              {String(shipment.carrierName ?? shipment.carrierCode ?? '—')}
              {shipment.serviceLevel ? ` · ${String(shipment.serviceLevel)}` : ''}
            </div>
          </div>
          <div>
            <div className="text-[var(--text-muted)] uppercase font-semibold">Tracking</div>
            <div className="font-mono text-[var(--text-primary)] mt-0.5 truncate flex items-center gap-1">
              {String(shipment.trackingNumber ?? '—')}
              {shipment.trackingUrl ? (
                <a
                  href={String(shipment.trackingUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent-primary)]"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : null}
            </div>
          </div>
          <div>
            <div className="text-[var(--text-muted)] uppercase font-semibold">Est. / Actual Cost</div>
            <div className="font-mono font-semibold text-[var(--text-primary)] mt-0.5">
              {formatMoney(currency, shipment.estimatedShippingCost)} /{' '}
              {formatMoney(currency, shipment.actualInvoicedCost ?? shipment.actualShippingCost ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-[var(--text-muted)] uppercase font-semibold">Shipped / Delivered</div>
            <div className="text-[var(--text-secondary)] mt-0.5">
              {formatDate(shipment.shippedAt)} · {formatDate(shipment.deliveredAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">
          Qty: <strong className="text-[var(--text-primary)]">{String(shipment.quantityShipped ?? 1)}</strong>
        </span>
        <button
          type="button"
          onClick={() => onEdit(shipment)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Update Status
        </button>
      </div>
    </Card>
  )
}
