import { Link } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import AppLayout from '~/layouts/app'
import { KpiCard, PageSection, DataTable, col, money, STATUS_TONES, type Row } from '~/lib/ui'

type Kpis = {
  totalOrders: number
  grossSales: string
  netSales: string
  totalRefunded: string
  totalMarketplaceFees: string
  totalCogs: string
  totalShippingCost: string
  orderNetProfit: string
  businessOperatingExpenses: string
  householdExpenses: string
  pendingOrders: number
  deliveredOrders: number
  activeShipments: number
  openReturns: number
  pendingRiskReviews: number
  invoiceVarianceTotal: string
}

type Props = {
  kpis: Kpis
  effectiveRbac: Record<string, any>
  orders: Row[]
  shipments: Row[]
  returnRequests: Row[]
  creditCards: Row[]
  tasksReminders: Row[]
  auditLogs: Row[]
  sellerAccounts: Row[]
  financialTransactions: Row[]
  customers: Row[]
  riskSignals: Row[]
  products: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  syncJobs: Row[]
  shippingInvoices: Row[]
  refundTransactions: Row[]
  marketplaceClaims: Row[]
  financialAccounts: Row[]
  financeCategories: Row[]
  allUsers: Row[]
  allRoles: Row[]
  allPermissions: Row[]
  moduleEntitlements: Row[]
  savedViews: Row[]
}

Dashboard.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

export default function Dashboard(props: Props) {
  const {
    kpis,
    orders,
    shipments,
    returnRequests,
    creditCards,
    tasksReminders,
    auditLogs,
    sellerAccounts,
  } = props

  return (
    <Stack gap={4}>
      <PageSection
        id="overview"
        title="Business Overview"
        description="Reporting-currency P&L (USD) computed from order-level multi-currency amounts."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 12,
          }}
        >
          <KpiCard label="Total orders" value={String(kpis.totalOrders)} />
          <KpiCard label="Gross sales" value={money('USD', kpis.grossSales)} />
          <KpiCard label="Net sales" value={money('USD', kpis.netSales)} />
          <KpiCard label="Refunded" value={money('USD', kpis.totalRefunded)} />
          <KpiCard
            label="Marketplace + payment fees"
            value={money('USD', kpis.totalMarketplaceFees)}
          />
          <KpiCard label="COGS" value={money('USD', kpis.totalCogs)} />
          <KpiCard label="Shipping cost" value={money('USD', kpis.totalShippingCost)} />
          <KpiCard label="Orders net profit" value={money('USD', kpis.orderNetProfit)} />
          <KpiCard label="Business opex" value={money('USD', kpis.businessOperatingExpenses)} />
          <KpiCard label="Household spend" value={money('USD', kpis.householdExpenses)} />
          <KpiCard label="Pending orders" value={String(kpis.pendingOrders)} />
          <KpiCard label="Delivered orders" value={String(kpis.deliveredOrders)} />
          <KpiCard label="Active shipments" value={String(kpis.activeShipments)} />
          <KpiCard label="Open returns" value={String(kpis.openReturns)} />
          <KpiCard label="Risk reviews pending" value={String(kpis.pendingRiskReviews)} />
          <KpiCard label="Invoice variance" value={money('USD', kpis.invoiceVarianceTotal)} />
        </div>
      </PageSection>

      <PageSection
        title="Recent orders"
        description="Latest orders across your seller accounts."
        actions={
          <Link href="/orders">
            <Button label="Manage orders" variant="secondary" size="sm" />
          </Link>
        }
      >
        <DataTable
          rows={orders.slice(0, 8)}
          empty="No orders yet — create your first order in the Orders module."
          columns={[
            col.text('orderNumber', 'Order #', 140),
            col.badge('status', 'Status', STATUS_TONES),
            col.money('totalAmount', 'Total', 'currencyCode'),
            col.money('netProfitAmount', 'Net profit', 'reportingCurrencyCode'),
            col.date('orderedAt', 'Ordered'),
          ]}
        />
      </PageSection>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 16,
        }}
      >
        <PageSection
          title="Active shipments"
          actions={
            <Link href="/shipments">
              <Button label="Open" variant="ghost" size="sm" />
            </Link>
          }
        >
          <DataTable
            rows={shipments.slice(0, 6)}
            empty="No shipments yet."
            columns={[
              col.text('shipmentNumber', 'Shipment #', 130),
              col.badge('status', 'Status', STATUS_TONES),
              col.text('carrierCode', 'Carrier', 90),
            ]}
          />
        </PageSection>

        <PageSection
          title="Open returns"
          actions={
            <Link href="/returns">
              <Button label="Open" variant="ghost" size="sm" />
            </Link>
          }
        >
          <DataTable
            rows={returnRequests.slice(0, 6)}
            empty="No return requests."
            columns={[
              col.text('rmaNumber', 'RMA #', 120),
              col.badge('status', 'Status', STATUS_TONES),
              col.text('returnReason', 'Reason', 120),
            ]}
          />
        </PageSection>

        <PageSection
          title="Credit cards due"
          actions={
            <Link href="/finance">
              <Button label="Open" variant="ghost" size="sm" />
            </Link>
          }
        >
          <DataTable
            rows={creditCards.slice(0, 6)}
            empty="No credit cards on file."
            columns={[
              col.text('cardLabel', 'Card', 140),
              col.text('last4Digits', 'Last 4', 70),
              col.money('minimumPaymentDue', 'Min due', 'currencyCode'),
            ]}
          />
        </PageSection>

        <PageSection
          title="Upcoming tasks"
          actions={
            <Link href="/tasks">
              <Button label="Open" variant="ghost" size="sm" />
            </Link>
          }
        >
          <DataTable
            rows={tasksReminders.slice(0, 6)}
            empty="Task queue is clear."
            columns={[
              col.text('title', 'Task', 180),
              col.badge('priority', 'Priority', {
                urgent: 'error',
                high: 'warning',
                medium: 'info',
                low: 'neutral',
              }),
              col.date('dueAt', 'Due'),
            ]}
          />
        </PageSection>

        <PageSection
          title="Seller accounts"
          actions={
            <Link href="/seller-accounts">
              <Button label="Open" variant="ghost" size="sm" />
            </Link>
          }
        >
          <DataTable
            rows={sellerAccounts.slice(0, 6)}
            empty="No seller accounts connected."
            columns={[
              col.text('accountName', 'Account', 150),
              col.badge('status', 'Status', STATUS_TONES),
              col.badge('healthStatus', 'Health', {
                healthy: 'success',
                warning: 'warning',
                critical: 'error',
                unknown: 'neutral',
              }),
            ]}
          />
        </PageSection>

        <PageSection
          title="Recent audit events"
          actions={
            <Link href="/audit">
              <Button label="Open" variant="ghost" size="sm" />
            </Link>
          }
        >
          <DataTable
            rows={auditLogs.slice(0, 6)}
            empty="No audit events recorded."
            columns={[
              col.text('action', 'Action', 150),
              col.text('entityType', 'Entity', 120),
              col.date('createdAt', 'When'),
            ]}
          />
        </PageSection>
      </div>

      <Card padding={4} variant="muted">
        <Stack direction="horizontal" align="center" wrap="wrap" gap={3}>
          <Badge variant="info" label="Tip" />
          <Text type="supporting" as="div">
            Every module page (Orders, Customers, Products, Shipments, Returns, Finance, Tasks,
            Users) provides complete create · read · update · delete flows with strict user_id
            isolation.
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}
