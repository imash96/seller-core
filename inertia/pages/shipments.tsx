import {
  PageHeader,
  PageSection,
  TopStatusBar,
  AppButton,
  AppInput,
  AppSelect,
  StatusBadge,
  MonoBadge,
  RowAction,
  FormModal,
  SavedViewsBar,
  STATUS_TONES,
  money,
  when,
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Edit3,
  Search,
  Package,
} from 'lucide-react'

type Props = {
  shipments: Row[]
  shippingInvoices: Row[]
  orders: Row[]
  orderLineItems: Row[]
  sellerAccounts: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  financeCategories: Row[]
  savedViews?: Row[]
}

const SHIPMENT_STATUS = [
  'pending',
  'label_created',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delayed',
  'exception',
  'failed',
  'returned_to_sender',
]
const CHARGE_TYPES = [
  'base_freight',
  'fuel_surcharge',
  'residential_fee',
  'remote_area_surcharge',
  'customs_duty',
  'tax',
  'signature_fee',
  'dimensional_weight_adjustment',
  'address_correction',
  'return_shipping',
  'other',
]
const INVOICE_PAYMENT = ['unpaid', 'paid', 'partially_paid', 'overdue', 'disputed']

export default function Shipments({
  shipments,
  shippingInvoices,
  orders,
  orderLineItems,
  savedViews,
}: Props) {
  const [createShipmentOpen, setCreateShipmentOpen] = useState(false)
  const [updateShipmentRow, setUpdateShipmentRow] = useState<Row | null>(null)
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [updateInvoiceRow, setUpdateInvoiceRow] = useState<Row | null>(null)

  // Shipment Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusGroupFilter, setStatusGroupFilter] = useState<
    'all' | 'delivered' | 'in_transit' | 'waiting' | 'exception'
  >('all')

  // Status Bar Counts
  const stats = useMemo(() => {
    let delivered = 0
    let inTransit = 0
    let waitingForPickup = 0
    let exceptions = 0

    for (const s of shipments) {
      const st = String(s.status ?? 'pending')
      if (st === 'delivered') delivered++
      else if (st === 'in_transit' || st === 'out_for_delivery') inTransit++
      else if (st === 'pending' || st === 'label_created') waitingForPickup++
      else exceptions++
    }

    const totalVariance = shippingInvoices.reduce(
      (sum, inv) => sum + Number(inv.varianceAmount ?? 0),
      0
    )

    return { delivered, inTransit, waitingForPickup, exceptions, totalVariance }
  }, [shipments, shippingInvoices])

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const st = String(s.status ?? 'pending')
      if (statusGroupFilter === 'delivered' && st !== 'delivered') return false
      if (statusGroupFilter === 'in_transit' && st !== 'in_transit' && st !== 'out_for_delivery') {
        return false
      }
      if (statusGroupFilter === 'waiting' && st !== 'pending' && st !== 'label_created') {
        return false
      }
      if (
        statusGroupFilter === 'exception' &&
        !['delayed', 'exception', 'failed', 'returned_to_sender'].includes(st)
      ) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const hay = [
          s.shipmentNumber,
          s.carrierCode,
          s.carrierName,
          s.trackingNumber,
          (s.order as any)?.orderNumber,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [shipments, statusGroupFilter, searchQuery])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipments & Carrier Invoices (/shipments)"
        description="Interactive parcel fulfillment status bar, card-based shipment tracking, and carrier invoice variance reconciliation."
        icon={Truck}
        badge={`${shipments.length} shipments · ${shippingInvoices.length} invoices`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <AppButton
              label="+ Record Carrier Invoice"
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              onClick={() => setCreateInvoiceOpen(true)}
            />
            <AppButton
              label="+ Create Shipment"
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setCreateShipmentOpen(true)}
            />
          </div>
        }
      />

      {/* =====================================================================
          TOP STATUS BAR: DELIVERED, IN TRANSIT, WAITING FOR PICKUP, EXCEPTIONS
         ===================================================================== */}
      <TopStatusBar
        columns={5}
        items={[
          {
            label: 'Delivered Parcels',
            value: String(stats.delivered),
            sublabel: 'Click to filter delivered',
            icon: CheckCircle2,
            tone: 'success',
            active: statusGroupFilter === 'delivered',
            onClick: () => setStatusGroupFilter((p) => (p === 'delivered' ? 'all' : 'delivered')),
          },
          {
            label: 'In Transit / Out for Delivery',
            value: String(stats.inTransit),
            sublabel: 'Active carrier movement',
            icon: Truck,
            tone: 'info',
            active: statusGroupFilter === 'in_transit',
            onClick: () => setStatusGroupFilter((p) => (p === 'in_transit' ? 'all' : 'in_transit')),
          },
          {
            label: 'Waiting for Pickup',
            value: String(stats.waitingForPickup),
            sublabel: 'Pending & Label Created',
            icon: Clock,
            tone: 'warning',
            active: statusGroupFilter === 'waiting',
            onClick: () => setStatusGroupFilter((p) => (p === 'waiting' ? 'all' : 'waiting')),
          },
          {
            label: 'Exceptions & Delayed',
            value: String(stats.exceptions),
            sublabel: 'Delayed, Exception or Returned',
            icon: AlertTriangle,
            tone: stats.exceptions > 0 ? 'error' : 'neutral',
            active: statusGroupFilter === 'exception',
            onClick: () => setStatusGroupFilter((p) => (p === 'exception' ? 'all' : 'exception')),
          },
          {
            label: 'Invoice Variance Total',
            value: money('USD', stats.totalVariance),
            sublabel: `${shippingInvoices.length} carrier invoices audited`,
            icon: FileSpreadsheet,
            tone: stats.totalVariance > 0 ? 'error' : 'primary',
          },
        ]}
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* =====================================================================
          UPPER SECTION: CARD-BASED SHIPMENT LISTING
         ===================================================================== */}
      <PageSection
        title="Fulfillment Shipments (Card-Based Dispatch Queue)"
        description="Track parcel carrier status, volumetric vs actual weight, and shipping cost estimates."
        actions={
          <div className="flex items-center gap-2">
            {statusGroupFilter !== 'all' && (
              <AppButton
                label="Show All Shipments"
                variant="ghost"
                size="xs"
                onClick={() => setStatusGroupFilter('all')}
              />
            )}
            <AppButton
              label="+ Create Shipment"
              variant="primary"
              size="xs"
              icon={Plus}
              onClick={() => setCreateShipmentOpen(true)}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl border border-card-border bg-muted/25 p-3.5">
            <div className="md:col-span-2">
              <AppInput
                label="Search Shipments"
                icon={Search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Shipment #, tracking number, carrier, order #..."
              />
            </div>
            <AppSelect
              label="Fulfillment Stage"
              value={statusGroupFilter}
              onChange={(e) => setStatusGroupFilter(e.target.value as any)}
              options={[
                { value: 'all', label: `All Shipments (${shipments.length})` },
                { value: 'waiting', label: `Waiting for Pickup (${stats.waitingForPickup})` },
                { value: 'in_transit', label: `In Transit (${stats.inTransit})` },
                { value: 'delivered', label: `Delivered (${stats.delivered})` },
                { value: 'exception', label: `Exceptions / Delayed (${stats.exceptions})` },
              ]}
            />
          </div>

          {filteredShipments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
              <p className="text-sm font-bold text-foreground">
                No shipments match your active filter.
              </p>
              <AppButton
                label="+ Create Shipment"
                variant="primary"
                size="sm"
                onClick={() => setCreateShipmentOpen(true)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredShipments.map((shipment) => {
                const currency = String(shipment.currencyCode ?? 'USD')
                const estCost = Number(shipment.estimatedShippingCost ?? 0)
                const actCost = Number(
                  shipment.actualInvoicedCost ?? shipment.actualShippingCost ?? 0
                )
                const orderNum = (shipment.order as any)?.orderNumber ?? shipment.orderId ?? '—'
                const items = (shipment.shipmentItems as Row[]) ?? []

                return (
                  <div
                    key={String(shipment.id)}
                    className="rounded-2xl border border-card-border bg-card text-card-foreground hover:border-primary/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-5 space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-foreground font-mono">
                              {String(shipment.shipmentNumber)}
                            </span>
                            <StatusBadge
                              label={String(
                                shipment.carrierName || shipment.carrierCode || 'Carrier'
                              ).toUpperCase()}
                              variant="info"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Order: <strong className="text-foreground">#{String(orderNum)}</strong>
                            {shipment.serviceLevel ? ` · ${String(shipment.serviceLevel)}` : ''}
                          </p>
                        </div>
                        <StatusBadge
                          label={String(shipment.status ?? 'pending').replace(/_/g, ' ')}
                          variant={STATUS_TONES[String(shipment.status)] ?? 'neutral'}
                        />
                      </div>

                      <div className="rounded-xl border border-border-subtle bg-muted/25 p-2.5 flex items-center justify-between gap-2 text-xs">
                        <span className="text-muted-foreground font-medium">Tracking #:</span>
                        <MonoBadge text={String(shipment.trackingNumber || 'AWAITING_LABEL')} />
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-divider text-xs">
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                            Est. Freight
                          </span>
                          <span className="font-bold text-foreground tabular-nums">
                            {money(currency, estCost)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                            Actual Billed
                          </span>
                          <span
                            className={`font-extrabold tabular-nums ${
                              actCost > estCost && estCost > 0 ? 'text-error' : 'text-price-current'
                            }`}
                          >
                            {money(currency, actCost)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                            Dispatched
                          </span>
                          <span className="font-medium text-foreground-secondary">
                            {when(shipment.shippedAt || shipment.createdAt)}
                          </span>
                        </div>
                      </div>

                      {items.length > 0 && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                          <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{items.length} parcel line(s) fulfilled</span>
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-3 bg-muted/30 border-t border-divider flex items-center justify-between gap-2">
                      <AppButton
                        label="Update Status"
                        variant="primary"
                        size="xs"
                        icon={Edit3}
                        onClick={() => setUpdateShipmentRow(shipment)}
                      />
                      <div className="flex items-center gap-1.5">
                        <AppButton
                          label="+ Invoice"
                          variant="secondary"
                          size="xs"
                          onClick={() => setCreateInvoiceOpen(true)}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PageSection>

      {/* =====================================================================
          LOWER SECTION: CARRIER INVOICES & VARIANCE RECONCILIATION
         ===================================================================== */}
      <PageSection
        title="Carrier Invoices & Freight Variance Reconciliation"
        description="Audit carrier billing against estimated shipping costs and flag dimensional-weight or surcharge discrepancies."
        actions={
          <AppButton
            label="+ Record Carrier Invoice"
            variant="primary"
            size="xs"
            icon={Plus}
            onClick={() => setCreateInvoiceOpen(true)}
          />
        }
      >
        {shippingInvoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
            <p className="text-sm font-bold text-foreground">No carrier invoices recorded yet.</p>
            <AppButton
              label="+ Record Carrier Invoice"
              variant="primary"
              size="sm"
              onClick={() => setCreateInvoiceOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-card-border bg-card shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-divider bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Carrier</th>
                  <th className="py-3.5 px-4">Invoice Date</th>
                  <th className="py-3.5 px-4 text-right">Expected</th>
                  <th className="py-3.5 px-4 text-right">Billed Total</th>
                  <th className="py-3.5 px-4 text-right">Variance</th>
                  <th className="py-3.5 px-4">Audit Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {shippingInvoices.map((inv) => {
                  const cur = String(inv.currencyCode ?? 'USD')
                  const variance = Number(inv.varianceAmount ?? 0)
                  const expected = Number(inv.totalAmount ?? inv.totalBilledAmount ?? 0) - variance

                  return (
                    <tr key={String(inv.id)} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {String(inv.invoiceNumber)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          label={String(inv.carrierName || inv.carrierCode || 'UPS').toUpperCase()}
                          variant="info"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {when(inv.invoiceDate || inv.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-muted-foreground tabular-nums">
                        {money(cur, Math.max(0, expected))}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-price-current tabular-nums">
                        {money(cur, inv.totalAmount ?? inv.totalBilledAmount ?? 0)}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-extrabold tabular-nums ${
                          variance > 0 ? 'text-error' : 'text-success'
                        }`}
                      >
                        {variance > 0 ? `+${money(cur, variance)}` : money(cur, variance)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          label={String(
                            inv.reconciliationStatus ?? inv.auditStatus ?? 'matched'
                          ).replace(/_/g, ' ')}
                          variant={
                            STATUS_TONES[
                              String(inv.reconciliationStatus ?? inv.auditStatus ?? 'matched')
                            ] ?? 'info'
                          }
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          label={String(inv.paymentStatus ?? 'unpaid')}
                          variant={STATUS_TONES[String(inv.paymentStatus)] ?? 'warning'}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <AppButton
                            label="Reconcile"
                            variant="secondary"
                            size="xs"
                            icon={Edit3}
                            onClick={() => setUpdateInvoiceRow(inv)}
                          />
                          <RowAction
                            action={`/shipping-invoices/${inv.id}/delete`}
                            label="Delete"
                            variant="ghost"
                            confirmText={`Delete invoice ${inv.invoiceNumber}?`}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageSection>

      {/* Modals */}
      <FormModal
        isOpen={createShipmentOpen}
        onOpenChange={setCreateShipmentOpen}
        title="Create Shipment"
        subtitle="Select an order first — only line items belonging to that order are shown."
        submitLabel="Create Shipment"
        action="/shipments"
        fields={[
          {
            name: 'orderId',
            label: 'Order',
            kind: 'select',
            required: true,
            options: orders.map((o) => ({ value: String(o.id), label: String(o.orderNumber) })),
          },
          {
            name: 'orderLineItemId',
            label: 'Order line item (filtered by Order)',
            kind: 'select',
            required: true,
            options: (vals) => {
              const activeOrderId = vals.orderId
              const matching = activeOrderId
                ? orderLineItems.filter((li) => String((li as any).orderId) === activeOrderId)
                : []
              return matching.map((li) => ({
                value: String(li.id),
                label: `${li.sku} · ${li.title ?? li.sku} (ordered: ${li.quantityOrdered}, rem: ${Math.max(0, Number(li.quantityOrdered) - Number((li as any).quantityFulfilled ?? 0))})`,
              }))
            },
            placeholder: 'Select an order first…',
          },
          { name: 'shipmentNumber', label: 'Shipment number', required: true },
          { name: 'carrierCode', label: 'Carrier code (e.g. ups, fedex)', required: true },
          { name: 'carrierName', label: 'Carrier name', required: true },
          { name: 'serviceLevel', label: 'Service level' },
          { name: 'trackingNumber', label: 'Tracking number' },
          {
            name: 'quantityShipped',
            label: 'Qty shipped',
            kind: 'number',
            required: true,
            default: '1',
          },
          { name: 'estimatedShippingCost', label: 'Estimated cost', kind: 'number' },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            default: 'in_transit',
            options: SHIPMENT_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
        ]}
      />

      <FormModal
        isOpen={!!updateShipmentRow}
        onOpenChange={(o) => {
          if (!o) setUpdateShipmentRow(null)
        }}
        title={`Update Shipment ${String(updateShipmentRow?.shipmentNumber ?? '')}`}
        submitLabel="Update Status"
        action={
          updateShipmentRow
            ? `/shipments/${updateShipmentRow.id}/status`
            : '/shipments/placeholder/status'
        }
        initialValues={{ status: String(updateShipmentRow?.status ?? 'delivered') }}
        fields={[
          {
            name: 'status',
            label: 'Shipment status',
            kind: 'select',
            required: true,
            fullWidth: true,
            options: SHIPMENT_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
        ]}
      />

      <FormModal
        isOpen={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
        title="Record Carrier Invoice (local only)"
        subtitle="An omitted expected amount remains unverified. No carrier or payment provider is contacted."
        submitLabel="Create Invoice"
        action="/shipping-invoices"
        fields={[
          { name: 'carrierCode', label: 'Carrier code', required: true },
          { name: 'carrierName', label: 'Carrier name', required: true },
          { name: 'invoiceNumber', label: 'Invoice number', required: true },
          { name: 'invoiceDate', label: 'Invoice date', kind: 'date', required: true },
          { name: 'dueDate', label: 'Due date', kind: 'date' },
          {
            name: 'shipmentId',
            label: 'Shipment (optional)',
            kind: 'select',
            options: shipments.map((s) => ({
              value: String(s.id),
              label: String(s.shipmentNumber),
            })),
          },
          {
            name: 'chargeType',
            label: 'Charge type',
            kind: 'select',
            default: 'base_freight',
            options: CHARGE_TYPES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') })),
          },
          { name: 'expectedAmount', label: 'Expected amount (optional)', kind: 'number' },
          { name: 'billedAmount', label: 'Billed amount', kind: 'number', required: true },
        ]}
      />

      <FormModal
        isOpen={!!updateInvoiceRow}
        onOpenChange={(o) => {
          if (!o) setUpdateInvoiceRow(null)
        }}
        title={`Manual review: ${String(updateInvoiceRow?.invoiceNumber ?? '')}`}
        subtitle="Records your report locally; no external payment or carrier verification occurs."
        submitLabel="Update Invoice"
        action={
          updateInvoiceRow
            ? `/shipping-invoices/${updateInvoiceRow.id}`
            : '/shipping-invoices/placeholder'
        }
        initialValues={{
          paymentStatus: String(updateInvoiceRow?.paymentStatus ?? 'unpaid'),
          reconciliationStatus: String(updateInvoiceRow?.reconciliationStatus ?? 'unreconciled'),
          paidAmount: String(updateInvoiceRow?.paidAmount ?? '0'),
          paymentReference: String(updateInvoiceRow?.paymentReference ?? ''),
          notes: '',
        }}
        fields={[
          {
            name: 'paidAmount',
            label: 'Paid amount (manually reported)',
            kind: 'number',
            required: true,
          },
          { name: 'paymentReference', label: 'Payment reference (required for paid or partial)' },
          { name: 'notes', label: 'Review note (required)', required: true },
          {
            name: 'paymentStatus',
            label: 'Payment status',
            kind: 'select',
            required: true,
            options: INVOICE_PAYMENT.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
          {
            name: 'reconciliationStatus',
            label: 'Reconciliation status',
            kind: 'select',
            options: [
              { value: 'matched', label: 'Matched' },
              { value: 'variance_detected', label: 'Variance detected' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'unreconciled', label: 'Unreconciled' },
            ],
          },
        ]}
      />
    </div>
  )
}
