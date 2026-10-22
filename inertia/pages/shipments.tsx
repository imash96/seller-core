import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  STATUS_TONES,
  money,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'
import { Truck } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipments & Carrier Invoices"
        description="Split parcel fulfillment, volumetric weight tracking, and duplicate-guarded carrier invoice reconciliation."
        icon={Truck}
        badge={`${shipments.length} shipments · ${shippingInvoices.length} invoices`}
        actions={
          <>
            <Button
              label="+ Carrier Invoice"
              variant="secondary"
              onClick={() => setCreateInvoiceOpen(true)}
            />
            <Button
              label="+ Create Shipment"
              variant="primary"
              onClick={() => setCreateShipmentOpen(true)}
            />
          </>
        }
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Create Shipment — dynamically filters orderLineItemId by selected orderId */}
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
        title="Reconcile Carrier Invoice"
        subtitle="Each shipment and charge-type pair is protected from duplicate carrier billing."
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
          { name: 'expectedAmount', label: 'Expected amount', kind: 'number' },
          { name: 'billedAmount', label: 'Billed amount', kind: 'number', required: true },
        ]}
      />

      <FormModal
        isOpen={!!updateInvoiceRow}
        onOpenChange={(o) => {
          if (!o) setUpdateInvoiceRow(null)
        }}
        title={`Update Invoice ${String(updateInvoiceRow?.invoiceNumber ?? '')}`}
        submitLabel="Update Invoice"
        action={
          updateInvoiceRow
            ? `/shipping-invoices/${updateInvoiceRow.id}/status`
            : '/shipping-invoices/placeholder/status'
        }
        initialValues={{
          paymentStatus: String(updateInvoiceRow?.paymentStatus ?? 'paid'),
          reconciliationStatus: String(updateInvoiceRow?.reconciliationStatus ?? 'resolved'),
        }}
        fields={[
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

      <PageSection
        title="Shipments"
        description="Split fulfillment with volumetric weight — delivered shipments automatically notify customers."
      >
        <ResponsiveDataView
          rows={shipments}
          searchKeys={['shipmentNumber', 'carrierCode', 'trackingNumber']}
          filterKey="status"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'in_transit', label: 'In transit' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'pending', label: 'Pending' },
          ]}
          createLabel="+ Create Shipment"
          onCreateClick={() => setCreateShipmentOpen(true)}
          toCard={(row) => ({
            title: String(row.shipmentNumber),
            statusBadge: {
              label: String(row.status).replace(/_/g, ' '),
              variant: STATUS_TONES[String(row.status)] ?? 'neutral',
            },
            metrics: [
              { label: 'Carrier', value: String(row.carrierCode ?? '—') },
              { label: 'Tracking', value: String(row.trackingNumber ?? '—').slice(0, 20) },
              {
                label: 'Est. cost',
                value: money(String(row.currencyCode ?? 'USD'), row.estimatedShippingCost),
              },
              {
                label: 'Actual',
                value: money(
                  String(row.currencyCode ?? 'USD'),
                  row.actualInvoicedCost ?? row.actualShippingCost ?? 0
                ),
              },
            ],
            actions: (
              <Button
                label="Update status"
                variant="secondary"
                size="sm"
                onClick={() => setUpdateShipmentRow(row)}
              />
            ),
          })}
          columns={[
            col.text('shipmentNumber', 'Shipment #', 130),
            col.badge('status', 'Status', STATUS_TONES),
            col.text('carrierCode', 'Carrier', 90),
            col.money('estimatedShippingCost', 'Est. cost', 'currencyCode'),
            col.money('actualInvoicedCost', 'Invoiced', 'currencyCode'),
            col.date('shippedAt', 'Shipped'),
            col.date('deliveredAt', 'Delivered'),
            col.action('Actions', (row) => (
              <Button
                label="Update"
                variant="secondary"
                size="sm"
                onClick={() => setUpdateShipmentRow(row)}
              />
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Carrier Invoices"
        description="Payment and reconciliation state per carrier invoice."
      >
        <ResponsiveDataView
          rows={shippingInvoices}
          searchKeys={['invoiceNumber', 'carrierCode']}
          filterKey="paymentStatus"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'paid', label: 'Paid' },
            { value: 'unpaid', label: 'Unpaid' },
            { value: 'disputed', label: 'Disputed' },
          ]}
          createLabel="+ Carrier Invoice"
          onCreateClick={() => setCreateInvoiceOpen(true)}
          toCard={(row) => ({
            title: String(row.invoiceNumber),
            statusBadge: {
              label: String(row.paymentStatus),
              variant: STATUS_TONES[String(row.paymentStatus)] ?? 'neutral',
            },
            metrics: [
              { label: 'Carrier', value: String(row.carrierCode) },
              { label: 'Total', value: money(String(row.currencyCode), row.totalAmount) },
              { label: 'Variance', value: money(String(row.currencyCode), row.varianceAmount) },
              {
                label: 'Reconciliation',
                value: String(row.reconciliationStatus ?? '—').replace(/_/g, ' '),
              },
            ],
            actions: (
              <Button
                label="Update status"
                variant="secondary"
                size="sm"
                onClick={() => setUpdateInvoiceRow(row)}
              />
            ),
          })}
          columns={[
            col.text('invoiceNumber', 'Invoice #', 140),
            col.text('carrierCode', 'Carrier', 90),
            col.money('totalAmount', 'Total', 'currencyCode'),
            col.money('paidAmount', 'Paid', 'currencyCode'),
            col.money('varianceAmount', 'Variance', 'currencyCode'),
            col.badge('paymentStatus', 'Payment', STATUS_TONES),
            col.badge('reconciliationStatus', 'Reconciliation', {
              matched: 'success',
              variance_detected: 'warning',
              resolved: 'info',
              unreconciled: 'neutral',
            }),
            col.action('Actions', (row) => (
              <Button
                label="Update status"
                variant="secondary"
                size="sm"
                onClick={() => setUpdateInvoiceRow(row)}
              />
            )),
          ]}
        />
      </PageSection>
    </div>
  )
}
