import { Stack } from '@astryxdesign/core/Stack'
import AppLayout from '~/layouts/app'
import {
  PageSection,
  DataTable,
  SmartForm,
  RowAction,
  StatusForm,
  col,
  STATUS_TONES,
  money,
  type Row,
} from '~/lib/ui'

type Props = {
  orders: Row[]
  customers: Row[]
  sellerAccounts: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  orderLineItems: Row[]
  financeCategories: Row[]
}

Orders.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

const ORDER_STATUS = [
  'draft',
  'pending',
  'confirmed',
  'processing',
  'partially_fulfilled',
  'fulfilled',
  'delivered',
  'cancelled',
  'on_hold',
]

export default function Orders({ orders, sellerAccounts }: Props) {
  return (
    <Stack gap={4}>
      <PageSection
        title="Create order"
        description="Manual order entry with customer, P&L inputs and one order line. Money values use numeric(14,2) precision."
      >
        <SmartForm
          action="/orders"
          submitLabel="Create order"
          fields={[
            { name: 'orderNumber', label: 'Order number', required: true, width: 180 },
            { name: 'customerFullName', label: 'Customer name', required: true, width: 200 },
            { name: 'customerEmail', label: 'Customer email', kind: 'email', width: 200 },
            {
              name: 'sellerAccountId',
              label: 'Seller account',
              kind: 'select',
              width: 220,
              options: sellerAccounts.map((s) => ({
                value: String(s.id),
                label: String(s.accountName ?? s.id),
              })),
            },
            { name: 'externalOrderId', label: 'External order ID', width: 170 },
            {
              name: 'marketplaceCode',
              label: 'Marketplace',
              kind: 'select',
              width: 150,
              options: [
                { value: 'direct', label: 'Direct' },
                { value: 'amazon', label: 'Amazon' },
                { value: 'ebay', label: 'eBay' },
                { value: 'shopify', label: 'Shopify' },
                { value: 'walmart', label: 'Walmart' },
              ],
            },
            { name: 'currencyCode', label: 'Currency', default: 'USD', width: 100 },
            {
              name: 'exchangeRate',
              label: 'Exchange rate',
              kind: 'number',
              default: '1',
              width: 120,
            },
            { name: 'sku', label: 'SKU', required: true, width: 140 },
            { name: 'itemTitle', label: 'Item title', required: true, width: 220 },
            {
              name: 'quantityOrdered',
              label: 'Qty',
              kind: 'number',
              required: true,
              default: '1',
              width: 80,
            },
            { name: 'unitPrice', label: 'Unit price', kind: 'number', required: true, width: 110 },
            { name: 'unitCostAmount', label: 'Unit cost', kind: 'number', width: 110 },
            { name: 'taxAmount', label: 'Tax', kind: 'number', width: 90 },
            { name: 'discountAmount', label: 'Discount', kind: 'number', width: 90 },
            { name: 'shippingChargedAmount', label: 'Ship charged', kind: 'number', width: 120 },
            { name: 'shippingCostAmount', label: 'Ship cost', kind: 'number', width: 110 },
            { name: 'shippingLine1', label: 'Ship-to street', width: 200 },
            { name: 'shippingCity', label: 'City', width: 130 },
            { name: 'shippingPostalCode', label: 'Postal code', width: 120 },
            { name: 'shippingCountryCode', label: 'Country', default: 'US', width: 90 },
          ]}
        />
      </PageSection>

      <PageSection
        title="Bulk marketplace import"
        description="Idempotent JSON import: duplicate external order IDs are skipped and raw payloads are stored redacted in order_import_payloads."
      >
        <SmartForm
          action="/orders/bulk-import"
          submitLabel="Import orders"
          compact
          fields={[
            { name: 'idempotencyKey', label: 'Import idempotency key', required: true },
            {
              name: 'sellerAccountId',
              label: 'Seller account',
              kind: 'select',
              options: sellerAccounts.map((s) => ({
                value: String(s.id),
                label: String(s.accountName ?? s.id),
              })),
            },
            {
              name: 'ordersJson',
              label: 'Orders JSON array',
              kind: 'textarea',
              required: true,
              placeholder:
                '[{"orderNumber":"AMZ-1","externalOrderId":"X1","customerFullName":"Jane","lines":[{"sku":"A","title":"Item","quantityOrdered":1,"unitPrice":10}]}]',
            },
          ]}
        />
      </PageSection>

      <PageSection
        title="Orders"
        description="All orders owned by your account, with status workflow and P&L."
      >
        <DataTable
          rows={orders}
          empty="No orders yet."
          columns={[
            col.text('orderNumber', 'Order #', 140),
            col.text('externalOrderId', 'External ID', 120),
            col.badge('status', 'Status', STATUS_TONES),
            col.badge('paymentStatus', 'Payment', {
              paid: 'success',
              unpaid: 'warning',
              refunded: 'neutral',
              chargeback: 'error',
            }),
            col.badge('fulfillmentStatus', 'Fulfillment', STATUS_TONES),
            col.money('totalAmount', 'Total', 'currencyCode'),
            col.money('marketplaceFeesAmount', 'Fees', 'currencyCode'),
            col.money('cogsAmount', 'COGS', 'currencyCode'),
            col.money('netProfitAmount', 'Net profit', 'reportingCurrencyCode'),
            col.date('orderedAt', 'Ordered'),
            col.action('Workflow', (row) => (
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <StatusForm
                  action={`/orders/${row.id}/status`}
                  options={ORDER_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                  current={String(row.status ?? '')}
                  label="Order status"
                />
                <RowAction
                  action={`/orders/${row.id}/delete`}
                  label="Delete"
                  variant="ghost"
                  confirmText="Delete this order and its lines?"
                />
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Order economics"
        description="Gross sales, fees and refunds per order in reporting currency."
      >
        <DataTable
          rows={orders}
          empty="No economics to show."
          columns={[
            col.text('orderNumber', 'Order #', 140),
            col.money('subtotalAmount', 'Subtotal', 'currencyCode'),
            col.money('shippingChargedAmount', 'Ship charged', 'currencyCode'),
            col.money('paymentProcessingFeesAmount', 'Payment fees', 'currencyCode'),
            col.money('shippingCostAmount', 'Ship cost', 'currencyCode'),
            col.money('refundedAmount', 'Refunded', 'currencyCode'),
            col.money('grossProfitAmount', 'Gross profit', 'reportingCurrencyCode'),
            col.action('Totals', (row) => (
              <span style={{ fontSize: 12 }}>
                {money(String(row.reportingCurrencyCode ?? 'USD'), row.reportingTotalAmount)}{' '}
                reporting
              </span>
            )),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
