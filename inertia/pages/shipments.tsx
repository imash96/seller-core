import { Stack } from '@astryxdesign/core/Stack'
import AppLayout from '~/layouts/app'
import {
  PageSection,
  DataTable,
  SmartForm,
  StatusForm,
  col,
  STATUS_TONES,
  type Row,
} from '~/lib/ui'

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

const INVOICE_PAYMENT = ['unpaid', 'partially_paid', 'paid', 'disputed', 'overdue', 'voided']
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

export default function Shipments({ shipments, shippingInvoices, orders, orderLineItems }: Props) {
  return (
    <Stack gap={4}>
      <PageSection
        title="Create shipment"
        description="Partial fulfillment and shipment splitting: ship any quantity up to the ordered amount, across multiple shipments with multiple lines each."
      >
        <SmartForm
          action="/shipments"
          submitLabel="Create shipment"
          fields={[
            {
              name: 'orderId',
              label: 'Order',
              kind: 'select',
              required: true,
              width: 210,
              options: orders.map((o) => ({ value: String(o.id), label: String(o.orderNumber) })),
            },
            {
              name: 'orderLineItemId',
              label: 'Order line',
              kind: 'select',
              required: true,
              width: 230,
              options: orderLineItems.map((li) => ({
                value: String(li.id),
                label: `${li.sku} · qty ${li.quantityOrdered}`,
              })),
            },
            { name: 'shipmentNumber', label: 'Shipment number', required: true, width: 170 },
            { name: 'carrierCode', label: 'Carrier code', required: true, width: 120 },
            { name: 'carrierName', label: 'Carrier name', required: true, width: 150 },
            { name: 'serviceLevel', label: 'Service level', width: 130 },
            { name: 'trackingNumber', label: 'Tracking number', width: 160 },
            {
              name: 'quantityShipped',
              label: 'Qty shipped',
              kind: 'number',
              required: true,
              default: '1',
              width: 110,
            },
            { name: 'estimatedShippingCost', label: 'Est. cost', kind: 'number', width: 110 },
            {
              name: 'status',
              label: 'Initial status',
              kind: 'select',
              width: 150,
              default: 'pending',
              options: SHIPMENT_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
            },
          ]}
        />
      </PageSection>

      <PageSection
        title="Shipments"
        description="Track packages and update delivery status (delivery fires a notification outbox event)."
      >
        <DataTable
          rows={shipments}
          empty="No shipments yet."
          columns={[
            col.text('shipmentNumber', 'Shipment #', 140),
            col.text('carrierCode', 'Carrier', 90),
            col.text('trackingNumber', 'Tracking', 140),
            col.badge('status', 'Status', STATUS_TONES),
            col.money('estimatedShippingCost', 'Est. cost', 'currencyCode'),
            col.money('actualInvoicedCost', 'Invoiced', 'currencyCode'),
            col.date('shippedAt', 'Shipped'),
            col.date('deliveredAt', 'Delivered'),
            col.action('Status', (row) => (
              <StatusForm
                action={`/shipments/${row.id}/status`}
                options={SHIPMENT_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                current={String(row.status ?? 'pending')}
                label="Shipment status"
              />
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Reconcile carrier invoices"
        description="Each shipment/charge-type pair is protected from duplicate charges unless explicitly allowed. Variance vs expected cost is computed per line."
      >
        <SmartForm
          action="/shipping-invoices"
          submitLabel="Create invoice + line"
          fields={[
            { name: 'carrierCode', label: 'Carrier code', required: true, width: 120 },
            { name: 'carrierName', label: 'Carrier name', required: true, width: 150 },
            { name: 'invoiceNumber', label: 'Invoice number', required: true, width: 160 },
            {
              name: 'invoiceDate',
              label: 'Invoice date',
              kind: 'date',
              required: true,
              width: 150,
            },
            { name: 'dueDate', label: 'Due date', kind: 'date', width: 150 },
            {
              name: 'shipmentId',
              label: 'Shipment (optional)',
              kind: 'select',
              width: 200,
              options: shipments.map((s) => ({
                value: String(s.id),
                label: String(s.shipmentNumber),
              })),
            },
            {
              name: 'chargeType',
              label: 'Charge type',
              kind: 'select',
              width: 190,
              default: 'base_freight',
              options: CHARGE_TYPES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') })),
            },
            { name: 'expectedAmount', label: 'Expected', kind: 'number', width: 110 },
            { name: 'billedAmount', label: 'Billed', kind: 'number', required: true, width: 110 },
          ]}
        />
      </PageSection>

      <PageSection
        title="Carrier invoices"
        description="Payment and reconciliation state per invoice."
      >
        <DataTable
          rows={shippingInvoices}
          empty="No carrier invoices."
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
            col.action('Status', (row) => (
              <StatusForm
                action={`/shipping-invoices/${row.id}/status`}
                fieldName="paymentStatus"
                options={INVOICE_PAYMENT.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                current={String(row.paymentStatus ?? 'unpaid')}
                label="Payment status"
              />
            )),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
