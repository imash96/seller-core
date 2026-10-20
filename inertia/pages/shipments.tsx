import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import AppLayout from '~/layouts/app'
import {
  PageSection,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  STATUS_TONES,
  money,
  short,
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'

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

Shipments.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

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
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [updateShipmentRow, setUpdateShipmentRow] = useState<Row | null>(null)
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [updateInvoiceRow, setUpdateInvoiceRow] = useState<Row | null>(null)

  // Filter line items by selected order — BUG FIX #8
  const filteredLineItems = useMemo(() => {
    if (!selectedOrderId) return []
    return orderLineItems.filter((li) => String((li as any).orderId) === selectedOrderId)
  }, [selectedOrderId, orderLineItems])

  return (
    <Stack gap={4}>
      <Card padding={4}>
        <Stack direction="horizontal" gap={3} wrap="wrap" align="center">
          <Button
            label="+ Create Shipment"
            variant="primary"
            onClick={() => setCreateShipmentOpen(true)}
          />
          <Button
            label="+ Carrier Invoice"
            variant="secondary"
            onClick={() => setCreateInvoiceOpen(true)}
          />
          <Text type="supporting" as="div">
            {shipments.length} shipments · {shippingInvoices.length} invoices
          </Text>
        </Stack>
      </Card>
      {savedViews && savedViews.length > 0 ? <SavedViewsBar views={savedViews} /> : null}

      {/* Create Shipment — filtered line items */}
      <FormModal
        isOpen={createShipmentOpen}
        onOpenChange={(o) => {
          setCreateShipmentOpen(o)
          if (!o) setSelectedOrderId('')
        }}
        title="Create shipment"
        subtitle="Select an order first — only its line items will be shown."
        submitLabel="Create shipment"
        action="/shipments"
        fields={[
          {
            name: 'orderId',
            label: 'Order',
            kind: 'select',
            required: true,
            options: orders.map((o) => ({ value: String(o.id), label: String(o.orderNumber) })),
          },
          // line items filtered by selected order — rendered via custom logic below
          {
            name: 'orderLineItemId',
            label: 'Order line item',
            kind: 'select',
            required: true,
            options:
              filteredLineItems.length > 0
                ? filteredLineItems.map((li) => ({
                    value: String(li.id),
                    label: `${li.sku} · ${li.title ?? li.sku} · ordered ${li.quantityOrdered}${(li as any).quantityFulfilled !== undefined ? ` · remaining ${Number(li.quantityOrdered) - Number((li as any).quantityFulfilled ?? 0)}` : ''}`,
                  }))
                : [
                    {
                      value: '',
                      label: selectedOrderId
                        ? 'No line items for this order'
                        : 'Select an order first',
                    },
                  ],
          },
          { name: 'shipmentNumber', label: 'Shipment number', required: true },
          { name: 'carrierCode', label: 'Carrier code', required: true },
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
          { name: 'estimatedShippingCost', label: 'Est. cost', kind: 'number' },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            default: 'in_transit',
            options: SHIPMENT_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
        ]}
      >
        <Stack gap={2}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Quick order filter</label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              fontSize: 14,
            }}
          >
            <option value="">— Select order to filter line items —</option>
            {orders.map((o) => (
              <option key={String(o.id)} value={String(o.id)}>
                {String(o.orderNumber)}
              </option>
            ))}
          </select>
          <Text type="supporting" as="div">
            {filteredLineItems.length} line items for selected order · {orderLineItems.length} total
            across all orders
          </Text>
        </Stack>
      </FormModal>

      <FormModal
        isOpen={!!updateShipmentRow}
        onOpenChange={(o) => {
          if (!o) setUpdateShipmentRow(null)
        }}
        title={`Update shipment ${String(updateShipmentRow?.shipmentNumber ?? '')}`}
        submitLabel="Update status"
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
            options: SHIPMENT_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
        ]}
      />

      <FormModal
        isOpen={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
        title="Reconcile carrier invoice"
        subtitle="Each shipment/charge-type pair is protected from duplicate billing."
        submitLabel="Create invoice"
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
          { name: 'expectedAmount', label: 'Expected', kind: 'number' },
          { name: 'billedAmount', label: 'Billed', kind: 'number', required: true },
        ]}
      />

      <FormModal
        isOpen={!!updateInvoiceRow}
        onOpenChange={(o) => {
          if (!o) setUpdateInvoiceRow(null)
        }}
        title={`Update invoice ${String(updateInvoiceRow?.invoiceNumber ?? '')}`}
        submitLabel="Update invoice"
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
            label: 'Reconciliation',
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
        description="Split fulfillment with volumetric weight — delivered shipments notify customers."
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
              <Stack direction="horizontal" gap={2}>
                <Button
                  label="Update status"
                  variant="secondary"
                  size="sm"
                  onClick={() => setUpdateShipmentRow(row)}
                />
              </Stack>
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
        title="Carrier invoices"
        description="Payment and reconciliation state per invoice."
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
    </Stack>
  )
}
