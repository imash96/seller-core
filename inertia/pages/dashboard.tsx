import React, { useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Form } from '@adonisjs/inertia/react'
import {
  ShoppingCart,
  Package,
  Users,
  Truck,
  RotateCcw,
  DollarSign,
  CreditCard as CreditCardIcon,
  Store,
  ShieldCheck,
  Plus,
  Upload,
  CheckCircle2,
  TrendingUp,
  Trash2,
} from 'lucide-react'
import {
  AstryxBadge,
  AstryxButton,
  AstryxCard,
  AstryxKpiCard,
  AstryxModal,
  statusTone,
} from '~/components/astryx'

type TabId =
  | 'overview'
  | 'orders'
  | 'catalog'
  | 'customers'
  | 'shipments'
  | 'returns'
  | 'finance'
  | 'integrations'
  | 'rbac'

export default function Dashboard(props: any) {
  const {
    kpis = {},
    effectiveRbac = { allowed: [], denied: [], roles: [], isSuperAdmin: false },
    orders = [],
    customers = [],
    riskSignals = [],
    products = [],
    salesChannels = [],
    sellerAccounts = [],
    syncJobs = [],
    shipments = [],
    shippingInvoices = [],
    returnRequests = [],
    refundTransactions = [],
    marketplaceClaims = [],
    creditCards = [],
    financialTransactions = [],
    tasksReminders = [],
    auditLogs = [],
    allUsers = [],
    moduleEntitlements = [],
  } = props

  const { user } = usePage<any>().props

  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // Modals state
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [rmaModalOpen, setRmaModalOpen] = useState(false)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [txModalOpen, setTxModalOpen] = useState(false)
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [sellerModalOpen, setSellerModalOpen] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)

  // Selected order for shipment/RMA helper
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '')
  const selectedOrder = orders.find((o: any) => o.id === selectedOrderId) || orders[0]
  const nextSeq = orders.length + 101

  const sampleBulkJson = JSON.stringify(
    [
      {
        orderNumber: `IMP-AMZ-${nextSeq}`,
        externalOrderId: `114-8829100-${nextSeq}`,
        marketplaceCode: 'amazon_us',
        currencyCode: 'USD',
        exchangeRate: 1.0,
        shippingCostAmount: 9.5,
        customer: {
          fullName: 'Elena Rostova',
          email: 'elena.rostova@marketplace-buyer.io',
          phone: '+1-415-555-0188',
        },
        shippingAddress: {
          recipientName: 'Elena Rostova',
          line1: '500 Howard Street',
          city: 'San Francisco',
          stateProvince: 'CA',
          postalCode: '94105',
          countryCode: 'US',
        },
        lines: [
          {
            sku: 'AST-HUB-TB4-SLV',
            title: 'Astryx Pro 12-in-1 Thunderbolt 4 Dock',
            quantityOrdered: 1,
            unitPrice: 249.0,
            unitCostAmount: 78.5,
            taxAmount: 21.17,
            shippingAmount: 0,
            marketplaceFeeAmount: 37.35,
            paymentFeeAmount: 7.22,
          },
        ],
      },
    ],
    null,
    2
  )

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Executive & P&L', icon: <TrendingUp size={15} /> },
    {
      id: 'orders',
      label: 'Orders & Import',
      icon: <ShoppingCart size={15} />,
      count: orders.length,
    },
    {
      id: 'catalog',
      label: 'Products & Variants',
      icon: <Package size={15} />,
      count: products.length,
    },
    {
      id: 'customers',
      label: 'Customers & Fraud',
      icon: <Users size={15} />,
      count: customers.length,
    },
    {
      id: 'shipments',
      label: 'Shipments & Invoices',
      icon: <Truck size={15} />,
      count: shipments.length,
    },
    {
      id: 'returns',
      label: 'Returns, Refunds & Claims',
      icon: <RotateCcw size={15} />,
      count: returnRequests.length,
    },
    {
      id: 'finance',
      label: 'Finance & Credit Cards',
      icon: <DollarSign size={15} />,
      count: financialTransactions.length,
    },
    {
      id: 'integrations',
      label: 'Seller Accounts & Sync',
      icon: <Store size={15} />,
      count: sellerAccounts.length,
    },
    {
      id: 'rbac',
      label: 'RBAC, Entitlements & Audit',
      icon: <ShieldCheck size={15} />,
      count: auditLogs.length,
    },
  ]

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
      {/* Top Astryx Workspace Header */}
      <div className="bg-[var(--card)] border border-[var(--line-2)] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
              Multi-Channel Commerce & Financial Operations
            </h1>
            <AstryxBadge tone="primary">Reporting Currency: USD</AstryxBadge>
            <AstryxBadge tone="success">Tenant Owner: {user?.fullName || user?.email}</AstryxBadge>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Unified workspace for Orders, Bulk Imports, Catalog Variants, Split Shipments, Carrier
            Invoices, RMA Returns, Multi-Currency P&L, and RBAC Governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AstryxButton variant="secondary" size="sm" onClick={() => setBulkImportModalOpen(true)}>
            <Upload size={14} /> Bulk Import JSON
          </AstryxButton>
          <AstryxButton variant="primary" size="sm" onClick={() => setOrderModalOpen(true)}>
            <Plus size={14} /> New Manual Order
          </AstryxButton>
        </div>
      </div>

      {/* Astryx Segmented Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[var(--line)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-[#0866FF] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--card)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-200/70 dark:bg-zinc-800 text-[var(--muted)]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* =================================================================
          TAB 1: EXECUTIVE OVERVIEW & MULTI-CURRENCY P&L
          ================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AstryxKpiCard
              label="Gross Sales (Reporting USD)"
              value={`$${kpis.grossSales}`}
              subtext={`${kpis.totalOrders} total orders across channels`}
              tone="primary"
              icon={<ShoppingCart size={18} />}
            />
            <AstryxKpiCard
              label="Order Net Profit (After Fees & COGS)"
              value={`$${kpis.orderNetProfit}`}
              subtext={`COGS: $${kpis.totalCogs} · Fees: $${kpis.totalMarketplaceFees}`}
              tone="success"
              icon={<TrendingUp size={18} />}
            />
            <AstryxKpiCard
              label="Fulfillment & Carrier Variance"
              value={`${kpis.activeShipments} Active / ${kpis.deliveredOrders} Delivered`}
              subtext={`Carrier Invoice Variance: $${kpis.invoiceVarianceTotal}`}
              tone="warning"
              icon={<Truck size={18} />}
            />
            <AstryxKpiCard
              label="Business vs Household Outflows"
              value={`$${kpis.businessOperatingExpenses} Biz`}
              subtext={`Household/Personal Segregated: $${kpis.householdExpenses}`}
              tone="purple"
              icon={<DollarSign size={18} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order-level P&L Waterfall */}
            <div className="lg:col-span-2">
              <AstryxCard
                title="Order-Level Profitability & Multi-Currency Breakdown"
                subtitle="Exact decimal(19,4) accounting converting CAD, MXN, and INR orders into USD reporting currency"
                actions={
                  <AstryxButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab('orders')}
                  >
                    Manage All Orders
                  </AstryxButton>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[var(--muted)] uppercase text-[10px]">
                        <th className="py-2.5 pr-3">Order #</th>
                        <th className="py-2.5 px-2">Channel</th>
                        <th className="py-2.5 px-2">Status</th>
                        <th className="py-2.5 px-2 text-right">Orig Total</th>
                        <th className="py-2.5 px-2 text-right">USD Total</th>
                        <th className="py-2.5 px-2 text-right">COGS + Fees</th>
                        <th className="py-2.5 pl-2 text-right">Net Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {orders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-[var(--paper)]/60">
                          <td className="py-3 pr-3 font-semibold mono text-[var(--ink)]">
                            {o.orderNumber}
                            <div className="text-[10px] text-[var(--muted)] font-normal">
                              {o.customer?.fullName || 'Guest'}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <AstryxBadge tone="primary">{o.marketplaceCode}</AstryxBadge>
                          </td>
                          <td className="py-3 px-2">
                            <AstryxBadge tone={statusTone(o.status)}>{o.status}</AstryxBadge>
                          </td>
                          <td className="py-3 px-2 text-right mono">
                            {o.totalAmount} {o.currencyCode}
                          </td>
                          <td className="py-3 px-2 text-right mono font-medium">
                            ${o.reportingTotalAmount}
                          </td>
                          <td className="py-3 px-2 text-right mono text-[var(--muted)]">
                            {(
                              Number(o.cogsAmount || 0) +
                              Number(o.marketplaceFeesAmount || 0) +
                              Number(o.paymentProcessingFeesAmount || 0)
                            ).toFixed(2)}{' '}
                            {o.currencyCode}
                          </td>
                          <td className="py-3 pl-2 text-right mono font-bold text-emerald-600">
                            {o.netProfitAmount} {o.currencyCode}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AstryxCard>
            </div>

            {/* Actionable Tasks & Reminders */}
            <div>
              <AstryxCard
                title="Operational Tasks & Payment Reminders"
                subtitle="Credit card statement due alerts, carrier disputes & RMA reviews"
              >
                <div className="space-y-3">
                  {tasksReminders.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--line)] flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <AstryxBadge tone={statusTone(t.priority)}>{t.priority}</AstryxBadge>
                          <AstryxBadge tone={statusTone(t.status)}>{t.status}</AstryxBadge>
                        </div>
                        <div className="text-xs font-semibold text-[var(--ink)]">{t.title}</div>
                        {t.description && (
                          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                            {t.description}
                          </p>
                        )}
                      </div>
                      {t.status !== 'completed' && (
                        <Form route="tasks.complete" routeParams={{ id: t.id }}>
                          <AstryxButton type="submit" variant="secondary" size="sm">
                            <CheckCircle2 size={13} /> Done
                          </AstryxButton>
                        </Form>
                      )}
                    </div>
                  ))}
                </div>
              </AstryxCard>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 2: ORDERS, LIFECYCLE, DELIVERY NOTIFICATIONS & BULK IMPORT
          ================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <AstryxCard
            title="Multi-Channel Orders & Idempotent Marketplace Imports"
            subtitle="Supports manual modal creation, bulk JSON array import with duplicate skip, lifecycle transitions, and automated customer delivery notifications"
            actions={
              <div className="flex items-center gap-2">
                <AstryxButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setBulkImportModalOpen(true)}
                >
                  <Upload size={14} /> Bulk Import JSON
                </AstryxButton>
                <AstryxButton variant="primary" size="sm" onClick={() => setOrderModalOpen(true)}>
                  <Plus size={14} /> New Manual Order
                </AstryxButton>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--muted)] uppercase text-[10px]">
                    <th className="py-2.5 pr-3">Order / Ext ID</th>
                    <th className="py-2.5 px-2">Source</th>
                    <th className="py-2.5 px-2">Customer</th>
                    <th className="py-2.5 px-2">Line Items</th>
                    <th className="py-2.5 px-2 text-right">Financials</th>
                    <th className="py-2.5 px-2">Status & Delivery</th>
                    <th className="py-2.5 pl-2 text-right">Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-[var(--paper)]/50">
                      <td className="py-3 pr-3">
                        <div className="font-bold mono text-[var(--ink)]">{o.orderNumber}</div>
                        <div className="text-[10px] mono text-[var(--muted)]">
                          Ext: {o.externalOrderId || 'Manual'}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <AstryxBadge tone="primary">{o.marketplaceCode}</AstryxBadge>
                        <div className="text-[10px] text-[var(--muted)] mt-0.5">{o.sourceType}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium">{o.customer?.fullName || 'N/A'}</div>
                        <div className="text-[10px] text-[var(--muted)]">
                          {o.customer?.email || o.customer?.proxyEmail}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {(o.lineItems || []).map((li: any) => (
                          <div key={li.id} className="text-[11px]">
                            <span className="mono font-semibold">{li.sku}</span> ×{' '}
                            {li.quantityOrdered} (Fulfilled: {li.quantityFulfilled}, Returned:{' '}
                            {li.quantityReturned})
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-2 text-right mono">
                        <div className="font-bold">
                          {o.totalAmount} {o.currencyCode}
                        </div>
                        <div className="text-[10px] text-[var(--muted)]">
                          USD: ${o.reportingTotalAmount} · Profit: {o.netProfitAmount}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1 items-start">
                          <AstryxBadge tone={statusTone(o.status)}>{o.status}</AstryxBadge>
                          {o.deliveryNotificationSentAt && (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              ✓ Customer Notified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              const formData = new FormData(e.currentTarget)
                              router.post(`/orders/${o.id}/status`, {
                                status: formData.get('status'),
                              })
                            }}
                            className="inline-flex items-center gap-1"
                          >
                            <select
                              name="status"
                              defaultValue={o.status}
                              className="h-7 px-2 rounded-lg text-[11px] bg-[var(--paper)] border border-[var(--line-2)]"
                            >
                              <option value="draft">draft</option>
                              <option value="pending">pending</option>
                              <option value="confirmed">confirmed</option>
                              <option value="processing">processing</option>
                              <option value="partially_fulfilled">partially_fulfilled</option>
                              <option value="fulfilled">fulfilled</option>
                              <option value="delivered">delivered (notify)</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                            <AstryxButton type="submit" variant="secondary" size="sm">
                              Update
                            </AstryxButton>
                          </form>
                          <Form route="orders.delete" routeParams={{ id: o.id }}>
                            <button
                              type="submit"
                              title="Delete Order (RBAC Checked)"
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </Form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AstryxCard>
        </div>
      )}

      {/* =================================================================
          TAB 3: PRODUCTS, VARIATIONS & CHANNEL LISTINGS
          ================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <AstryxCard
            title="Products, N-Dimensional Variations & Marketplace Listings"
            subtitle="Every product has ≥1 sellable ProductVariant SKU with cost breakdown (COGS, manufacturing, packaging), ASIN/GTIN, and channel listings"
            actions={
              <AstryxButton variant="primary" size="sm" onClick={() => setProductModalOpen(true)}>
                <Plus size={14} /> New Product & SKU
              </AstryxButton>
            }
          >
            <div className="space-y-4">
              {products.map((p: any) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--ink)]">{p.title}</span>
                        <AstryxBadge tone={statusTone(p.status)}>{p.status}</AstryxBadge>
                        <AstryxBadge tone={p.hasVariants ? 'purple' : 'neutral'}>
                          {p.hasVariants
                            ? `Multi-Variant (${(p.variationDimensions || []).join(', ')})`
                            : 'Simple Product (1 Default SKU)'}
                        </AstryxBadge>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Brand: {p.brand?.name || 'Unbranded'} · Category:{' '}
                        {p.category?.name || 'General'}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--line)] text-[var(--muted)] uppercase text-[10px]">
                          <th className="py-2 pr-3">Variant SKU / ASIN</th>
                          <th className="py-2 px-2">Attributes</th>
                          <th className="py-2 px-2 text-right">Unit Cost Breakdown</th>
                          <th className="py-2 px-2 text-right">Retail Price</th>
                          <th className="py-2 px-2 text-right">Stock Available</th>
                          <th className="py-2 px-2">Channel Listings</th>
                          <th className="py-2 pl-2 text-right">Quick Update</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)]">
                        {(p.variants || []).map((v: any) => (
                          <tr key={v.id}>
                            <td className="py-2.5 pr-3">
                              <div className="font-bold mono text-[var(--ink)]">{v.sku}</div>
                              <div className="text-[10px] mono text-[var(--muted)]">
                                ASIN: {v.asin || '—'} · GTIN: {v.barcodeGtin || '—'}
                              </div>
                            </td>
                            <td className="py-2.5 px-2">
                              {(v.variantAttributes || []).length === 0 ? (
                                <span className="text-[var(--muted)]">Default</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {(v.variantAttributes || []).map((attr: any) => (
                                    <AstryxBadge key={attr.id} tone="neutral">
                                      {attr.attributeName}: {attr.attributeValue}
                                    </AstryxBadge>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right mono text-[11px]">
                              COGS: ${v.costPrice} + Mfg: ${v.manufacturingCost} + Pkg: $
                              {v.packagingCost}
                            </td>
                            <td className="py-2.5 px-2 text-right mono font-bold">
                              {v.retailPrice} {v.currencyCode}
                            </td>
                            <td className="py-2.5 px-2 text-right mono">
                              <AstryxBadge
                                tone={
                                  v.stockAvailable <= v.reorderPointThreshold
                                    ? 'warning'
                                    : 'success'
                                }
                              >
                                {v.stockAvailable} avail ({v.stockOnHand} on hand)
                              </AstryxBadge>
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="flex flex-wrap gap-1">
                                {(v.listings || []).map((l: any) => (
                                  <AstryxBadge key={l.id} tone="primary">
                                    {l.externalListingId || l.channelSku} ({l.listedPrice}{' '}
                                    {l.currencyCode})
                                  </AstryxBadge>
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 pl-2 text-right">
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  const fd = new FormData(e.currentTarget)
                                  router.post(`/variants/${v.id}/stock`, {
                                    stockOnHand: fd.get('stockOnHand'),
                                    retailPrice: fd.get('retailPrice'),
                                  })
                                }}
                                className="inline-flex items-center gap-1"
                              >
                                <input
                                  type="number"
                                  name="stockOnHand"
                                  defaultValue={v.stockOnHand}
                                  className="w-16 h-7 px-2 rounded-lg text-xs mono bg-[var(--card)] border border-[var(--line-2)]"
                                  min={0}
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  name="retailPrice"
                                  defaultValue={v.retailPrice}
                                  className="w-20 h-7 px-2 rounded-lg text-xs mono bg-[var(--card)] border border-[var(--line-2)]"
                                  min={0}
                                />
                                <AstryxButton type="submit" variant="secondary" size="sm">
                                  Save
                                </AstryxButton>
                              </form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </AstryxCard>
        </div>
      )}

      {/* =================================================================
          TAB 4: CUSTOMERS, ADDRESSES & EXPLAINABLE FRAUD/RISK SIGNALS
          ================================================================= */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AstryxCard
              title="Customers, Normalized Identity & Repeat Buyer Detection"
              subtitle="Normalized email, phone, and address fingerprints prevent duplicate records while preserving historical order snapshots"
              actions={
                <AstryxButton
                  variant="primary"
                  size="sm"
                  onClick={() => setCustomerModalOpen(true)}
                >
                  <Plus size={14} /> Add Customer
                </AstryxButton>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[var(--muted)] uppercase text-[10px]">
                      <th className="py-2.5 pr-3">Customer</th>
                      <th className="py-2.5 px-2">Normalized Identity</th>
                      <th className="py-2.5 px-2">Repeat Status</th>
                      <th className="py-2.5 px-2 text-right">Orders / Spent</th>
                      <th className="py-2.5 px-2">Risk Profile</th>
                      <th className="py-2.5 pl-2">Saved Addresses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {customers.map((c: any) => (
                      <tr key={c.id}>
                        <td className="py-3 pr-3 font-semibold text-[var(--ink)]">
                          {c.fullName}
                          <div className="text-[10px] mono text-[var(--muted)]">
                            Ext: {c.externalBuyerId || 'Direct'}
                          </div>
                        </td>
                        <td className="py-3 px-2 mono text-[11px]">
                          <div>{c.normalizedEmail || c.proxyEmail || '—'}</div>
                          <div className="text-[var(--muted)]">{c.normalizedPhone || '—'}</div>
                        </td>
                        <td className="py-3 px-2">
                          <AstryxBadge tone={c.isRepeatCustomer ? 'purple' : 'neutral'}>
                            {c.isRepeatCustomer ? 'Repeat Customer' : 'First-Time Buyer'}
                          </AstryxBadge>
                        </td>
                        <td className="py-3 px-2 text-right mono">
                          <div className="font-bold">{c.ordersCount} orders</div>
                          <div className="text-[10px] text-[var(--muted)]">
                            {c.totalSpent} {c.preferredCurrency}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <AstryxBadge tone={statusTone(c.riskLevel)}>
                            {c.riskLevel} (score: {c.riskScore})
                          </AstryxBadge>
                        </td>
                        <td className="py-3 pl-2 text-[11px] text-[var(--muted)]">
                          {(c.addresses || []).map((a: any) => (
                            <div key={a.id}>
                              {a.line1}, {a.city}, {a.countryCode}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AstryxCard>
          </div>

          <div>
            <AstryxCard
              title="Explainable Fraud & Risk Review Queue"
              subtitle="Auditable risk signals with evidence JSON and human review status"
            >
              <div className="space-y-3">
                {riskSignals.map((rs: any) => (
                  <div
                    key={rs.id}
                    className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <AstryxBadge tone={statusTone(rs.severity)}>{rs.severity}</AstryxBadge>
                      <AstryxBadge tone={statusTone(rs.reviewStatus)}>
                        {rs.reviewStatus}
                      </AstryxBadge>
                    </div>
                    <div className="text-xs font-bold text-[var(--ink)]">
                      {rs.customer?.fullName} — <span className="mono">{rs.signalCode}</span> (+
                      {rs.scoreDelta} pts)
                    </div>
                    <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                      {rs.explanation}
                    </p>
                    {rs.reviewStatus === 'pending_review' && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <Form route="risk_signals.review" routeParams={{ id: rs.id }}>
                          <input type="hidden" name="reviewStatus" value="resolved" />
                          <AstryxButton type="submit" variant="secondary" size="sm">
                            Approve / Resolve
                          </AstryxButton>
                        </Form>
                        <Form route="risk_signals.review" routeParams={{ id: rs.id }}>
                          <input type="hidden" name="reviewStatus" value="confirmed_risk" />
                          <AstryxButton type="submit" variant="danger" size="sm">
                            Confirm Fraud
                          </AstryxButton>
                        </Form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AstryxCard>
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 5: SHIPMENTS, PARCEL SPLITTING & CARRIER INVOICES
          ================================================================= */}
      {activeTab === 'shipments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AstryxCard
              title="Shipments & Split-Order Fulfillment"
              subtitle="Many-to-many shipment_items join supports partial fulfillment, split shipments, and volumetric weight calculation"
              actions={
                <AstryxButton
                  variant="primary"
                  size="sm"
                  onClick={() => setShipmentModalOpen(true)}
                >
                  <Plus size={14} /> Create Shipment
                </AstryxButton>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[var(--muted)] uppercase text-[10px]">
                      <th className="py-2 pr-2">Shipment / Order</th>
                      <th className="py-2 px-2">Carrier & Tracking</th>
                      <th className="py-2 px-2">Dimensions & Weight</th>
                      <th className="py-2 px-2">Items Shipped</th>
                      <th className="py-2 pl-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {shipments.map((s: any) => (
                      <tr key={s.id}>
                        <td className="py-3 pr-2">
                          <div className="font-bold mono">{s.shipmentNumber}</div>
                          <div className="text-[10px] mono text-[var(--muted)]">
                            Order: {s.order?.orderNumber}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="font-medium">{s.carrierName}</div>
                          <div className="text-[10px] mono text-[#0866FF]">
                            {s.trackingNumber || 'Pending label'}
                          </div>
                        </td>
                        <td className="py-3 px-2 mono text-[11px]">
                          <div>
                            {s.lengthCm}×{s.widthCm}×{s.heightCm} cm
                          </div>
                          <div className="text-[var(--muted)]">
                            Dead: {s.deadWeightGrams}g · Billable: {s.billableWeightGrams}g
                          </div>
                        </td>
                        <td className="py-3 px-2 text-[11px]">
                          {(s.shipmentItems || []).map((si: any) => (
                            <div key={si.id}>
                              <span className="mono font-semibold">
                                {si.orderLineItem?.sku || 'SKU'}
                              </span>{' '}
                              × {si.quantityShipped}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 pl-2">
                          <AstryxBadge tone={statusTone(s.status)}>{s.status}</AstryxBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AstryxCard>

            <AstryxCard
              title="Carrier Shipping Invoices & Surcharge Reconciliation"
              subtitle="Unique index on (shipment_id, charge_type) prevents duplicate billing across carrier invoices"
              actions={
                <AstryxButton variant="primary" size="sm" onClick={() => setInvoiceModalOpen(true)}>
                  <Plus size={14} /> Reconcile Carrier Invoice
                </AstryxButton>
              }
            >
              <div className="space-y-3">
                {shippingInvoices.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold mono text-xs">{inv.invoiceNumber}</span>
                        <span className="text-xs text-[var(--muted)] ml-2">{inv.carrierName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AstryxBadge tone={statusTone(inv.reconciliationStatus)}>
                          {inv.reconciliationStatus}
                        </AstryxBadge>
                        <AstryxBadge tone={statusTone(inv.status)}>{inv.status}</AstryxBadge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mono">
                      <span>
                        Expected: {inv.expectedAmount} {inv.currencyCode}
                      </span>
                      <span>
                        Billed: <strong>{inv.totalAmount}</strong> {inv.currencyCode}
                      </span>
                      <span
                        className={
                          Number(inv.varianceAmount) > 0
                            ? 'text-red-600 font-bold'
                            : 'text-emerald-600 font-bold'
                        }
                      >
                        Variance: {inv.varianceAmount} {inv.currencyCode}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-[var(--line)] space-y-1">
                      {(inv.lines || []).map((ln: any) => (
                        <div
                          key={ln.id}
                          className="flex items-center justify-between text-[11px] text-[var(--muted)] mono"
                        >
                          <span>
                            Charge: <strong className="text-[var(--ink)]">{ln.chargeType}</strong>
                          </span>
                          <span>
                            Est {ln.expectedAmount} → Billed {ln.billedAmount} (Δ{' '}
                            {ln.varianceAmount})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AstryxCard>
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 6: RETURNS (RMA), PARTIAL REFUNDS & MARKETPLACE CLAIMS
          ================================================================= */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AstryxCard
              title="Return Requests (RMA) & Item Inspection"
              subtitle="Supports multiple returns per order line with remaining-returnable quantity enforcement"
              actions={
                <AstryxButton variant="primary" size="sm" onClick={() => setRmaModalOpen(true)}>
                  <Plus size={14} /> New Return (RMA)
                </AstryxButton>
              }
            >
              <div className="space-y-3">
                {returnRequests.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold mono">{r.rmaNumber}</span>
                      <AstryxBadge tone={statusTone(r.status)}>{r.status}</AstryxBadge>
                    </div>
                    <div className="text-[var(--muted)]">
                      Order:{' '}
                      <strong className="mono text-[var(--ink)]">{r.order?.orderNumber}</strong> ·
                      SKU:{' '}
                      <strong className="mono text-[var(--ink)]">{r.orderLineItem?.sku}</strong> ·
                      Qty Requested: <strong>{r.quantityRequested}</strong>
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      Reason: <span className="mono">{r.returnReason}</span> · Resolution:{' '}
                      <span className="mono">{r.resolutionType}</span> · Restocking Fee: $
                      {r.restockingFeeAmount}
                    </div>
                  </div>
                ))}
              </div>
            </AstryxCard>

            <AstryxCard
              title="Refund Transactions & Marketplace Claims"
              subtitle="Prevents over-refunding above remaining refundable order balance"
              actions={
                <AstryxButton variant="primary" size="sm" onClick={() => setRefundModalOpen(true)}>
                  <Plus size={14} /> Process Refund
                </AstryxButton>
              }
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Processed Refunds
                  </div>
                  {refundTransactions.map((rf: any) => (
                    <div
                      key={rf.id}
                      className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--line)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold mono">{rf.refundNumber}</div>
                        <div className="text-[11px] text-[var(--muted)]">
                          Order: {rf.order?.orderNumber} · {rf.reason}
                        </div>
                      </div>
                      <div className="text-right mono">
                        <div className="font-bold text-red-600">
                          -{rf.totalRefundAmount} {rf.currencyCode}
                        </div>
                        <AstryxBadge tone={statusTone(rf.status)}>{rf.status}</AstryxBadge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--line)]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Marketplace Claims & Chargebacks
                  </div>
                  {marketplaceClaims.map((cl: any) => (
                    <div
                      key={cl.id}
                      className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--line)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold mono">
                          {cl.externalClaimId} ({cl.claimType})
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          Order: {cl.order?.orderNumber} · {cl.reason}
                        </div>
                      </div>
                      <div className="text-right mono">
                        <div className="font-bold">
                          {cl.disputedAmount} {cl.currencyCode}
                        </div>
                        <AstryxBadge tone={statusTone(cl.status)}>{cl.status}</AstryxBadge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AstryxCard>
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 7: FINANCE, MULTI-CURRENCY LEDGER & CREDIT CARDS
          ================================================================= */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AstryxCard
                title="Multi-Currency Financial Ledger (Business vs Household Segregated)"
                subtitle="Tracks original currency, FX conversion rate numeric(19,8), and reporting currency amount numeric(19,4)"
                actions={
                  <AstryxButton variant="primary" size="sm" onClick={() => setTxModalOpen(true)}>
                    <Plus size={14} /> Post Ledger Entry
                  </AstryxButton>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[var(--muted)] uppercase text-[10px]">
                        <th className="py-2 pr-2">Ref / Date</th>
                        <th className="py-2 px-2">Scope</th>
                        <th className="py-2 px-2">Type</th>
                        <th className="py-2 px-2">Description & Vendor</th>
                        <th className="py-2 px-2 text-right">Original</th>
                        <th className="py-2 pl-2 text-right">Reporting (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {financialTransactions.map((ft: any) => (
                        <tr key={ft.id}>
                          <td className="py-2.5 pr-2 mono">
                            <div className="font-bold">{ft.referenceNumber}</div>
                            <div className="text-[10px] text-[var(--muted)]">
                              {String(ft.transactionDate).slice(0, 10)}
                            </div>
                          </td>
                          <td className="py-2.5 px-2">
                            <AstryxBadge
                              tone={ft.dataClassification === 'business' ? 'primary' : 'purple'}
                            >
                              {ft.dataClassification}
                            </AstryxBadge>
                          </td>
                          <td className="py-2.5 px-2">
                            <AstryxBadge tone={statusTone(ft.transactionType)}>
                              {ft.transactionType}
                            </AstryxBadge>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="font-medium">{ft.description}</div>
                            <div className="text-[10px] text-[var(--muted)]">
                              {ft.vendorOrPayer || 'Internal'}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right mono">
                            {ft.originalAmount} {ft.originalCurrencyCode}
                          </td>
                          <td className="py-2.5 pl-2 text-right mono font-bold">
                            ${ft.reportingAmount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AstryxCard>
            </div>

            <div>
              <AstryxCard
                title="Tokenized Credit Cards & Seller Links"
                subtitle="PCI-safe metadata: last_4_digits + vault_token_reference only"
                actions={
                  <AstryxButton variant="primary" size="sm" onClick={() => setCardModalOpen(true)}>
                    <Plus size={14} /> Add Card
                  </AstryxButton>
                }
              >
                <div className="space-y-3">
                  {creditCards.map((cc: any) => (
                    <div
                      key={cc.id}
                      className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCardIcon size={16} className="text-[#0866FF]" />
                          <span className="font-bold text-xs">{cc.cardLabel}</span>
                        </div>
                        <AstryxBadge
                          tone={cc.dataClassification === 'business' ? 'primary' : 'purple'}
                        >
                          {cc.dataClassification}
                        </AstryxBadge>
                      </div>
                      <div className="text-xs mono text-[var(--muted)]">
                        {cc.brandName} •••• <strong>{cc.last4Digits}</strong> · Exp {cc.expMonth}/
                        {cc.expYear}
                      </div>
                      <div className="flex items-center justify-between text-xs mono">
                        <span>Balance: ${cc.currentBalance}</span>
                        <span className="text-amber-600 font-semibold">
                          Min Due: ${cc.minimumPaymentDue}
                        </span>
                      </div>
                      {(cc.sellerAccountLinks || []).length > 0 && (
                        <div className="pt-1 border-t border-[var(--line)] flex flex-wrap gap-1">
                          {(cc.sellerAccountLinks || []).map((link: any) => (
                            <AstryxBadge key={link.id} tone="success">
                              Linked: {link.sellerAccount?.accountName} ({link.usagePurpose})
                            </AstryxBadge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AstryxCard>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 8: MARKETPLACE INTEGRATIONS & SYNC JOBS
          ================================================================= */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AstryxCard
            title="Connected Marketplace Seller Accounts"
            subtitle="Supports multiple seller accounts per user across regions with AES-256-GCM encrypted credentials"
            actions={
              <AstryxButton variant="primary" size="sm" onClick={() => setSellerModalOpen(true)}>
                <Plus size={14} /> Connect Seller Account
              </AstryxButton>
            }
          >
            <div className="space-y-3">
              {sellerAccounts.map((sa: any) => (
                <div
                  key={sa.id}
                  className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{sa.accountName}</span>
                      <AstryxBadge tone="primary">{sa.marketplaceRegion}</AstryxBadge>
                      <AstryxBadge tone="neutral">{sa.defaultCurrency}</AstryxBadge>
                    </div>
                    <div className="text-[11px] mono text-[var(--muted)]">
                      Merchant ID: {sa.externalSellerId} · Credential Vault:{' '}
                      <span className="text-emerald-600">{sa.encryptedCredentials}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <AstryxBadge tone={statusTone(sa.healthStatus)}>{sa.healthStatus}</AstryxBadge>
                    <span className="text-[10px] mono text-[var(--muted)]">
                      {sa.rateLimitRpm} RPM limit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AstryxCard>

          <AstryxCard
            title="Idempotent Import Batches & Sync Job Logs"
            subtitle="Tracks total, succeeded, skipped duplicates, and per-record error payloads"
          >
            <div className="space-y-3">
              {syncJobs.map((job: any) => (
                <div
                  key={job.id}
                  className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold mono">{job.idempotencyKey}</span>
                    <AstryxBadge tone={statusTone(job.status)}>{job.status}</AstryxBadge>
                  </div>
                  <div className="flex items-center gap-4 mono text-[11px]">
                    <span>Total: {job.totalRecords}</span>
                    <span className="text-emerald-600">Succeeded: {job.succeededRecords}</span>
                    <span className="text-blue-600">
                      Duplicates Skipped: {job.skippedDuplicates}
                    </span>
                    <span className="text-red-600">Failed: {job.failedRecords}</span>
                  </div>
                </div>
              ))}
            </div>
          </AstryxCard>
        </div>
      )}

      {/* =================================================================
          TAB 9: RBAC, MODULE ENTITLEMENTS & TAMPER-EVIDENT AUDIT TRAIL
          ================================================================= */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AstryxCard
                title="System Users, Roles & Super-Administrator Provisioning"
                subtitle="Public signup is disabled. Only Super Administrators can provision users or change account status."
                actions={
                  effectiveRbac.isSuperAdmin && (
                    <AstryxButton
                      variant="primary"
                      size="sm"
                      onClick={() => setUserModalOpen(true)}
                    >
                      <Plus size={14} /> Provision New User
                    </AstryxButton>
                  )
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[var(--muted)] uppercase text-[10px]">
                        <th className="py-2 pr-2">User</th>
                        <th className="py-2 px-2">Status</th>
                        <th className="py-2 px-2">Assigned Roles</th>
                        <th className="py-2 pl-2 text-right">Admin Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {allUsers.map((u: any) => (
                        <tr key={u.id}>
                          <td className="py-3 pr-2">
                            <div className="font-bold">{u.fullName}</div>
                            <div className="text-[11px] mono text-[var(--muted)]">{u.email}</div>
                          </td>
                          <td className="py-3 px-2">
                            <AstryxBadge tone={statusTone(u.status)}>{u.status}</AstryxBadge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex flex-wrap gap-1">
                              {u.isSuperAdmin && (
                                <AstryxBadge tone="purple">super_admin (root)</AstryxBadge>
                              )}
                              {(u.roles || []).map((r: any) => (
                                <AstryxBadge key={r.id} tone="primary">
                                  {r.slug}
                                </AstryxBadge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 pl-2 text-right">
                            {effectiveRbac.isSuperAdmin && u.id !== user?.id && (
                              <Form route="admin.users.toggle_status" routeParams={{ id: u.id }}>
                                <input
                                  type="hidden"
                                  name="status"
                                  value={u.status === 'active' ? 'suspended' : 'active'}
                                />
                                <AstryxButton
                                  type="submit"
                                  variant={u.status === 'active' ? 'danger' : 'secondary'}
                                  size="sm"
                                >
                                  {u.status === 'active' ? 'Suspend & Revoke' : 'Activate'}
                                </AstryxButton>
                              </Form>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AstryxCard>
            </div>

            <div>
              <AstryxCard
                title="Per-User Module Entitlements"
                subtitle="Evaluated independently of RBAC roles (Deny > Allow)"
              >
                <div className="space-y-2">
                  {moduleEntitlements.map((me: any) => (
                    <div
                      key={me.id}
                      className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--line)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold mono">{me.moduleKey}</div>
                        <div className="text-[10px] text-[var(--muted)]">
                          Tier: {me.planTier} · Source: {me.grantSource}
                        </div>
                      </div>
                      <Form route="admin.entitlements.toggle" routeParams={{ id: me.id }}>
                        <AstryxButton
                          type="submit"
                          variant={me.isEnabled ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {me.isEnabled ? 'Enabled' : 'Disabled'}
                        </AstryxButton>
                      </Form>
                    </div>
                  ))}
                </div>
              </AstryxCard>
            </div>
          </div>

          <AstryxCard
            title="Immutable Tamper-Evident Audit Trail"
            subtitle="Every privileged action is chained with a SHA-256 checksum over actor, user, entity, and before/after states"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--muted)] uppercase text-[10px]">
                    <th className="py-2 pr-2">Timestamp</th>
                    <th className="py-2 px-2">Action</th>
                    <th className="py-2 px-2">Entity</th>
                    <th className="py-2 px-2">SHA-256 Checksum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {auditLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td className="py-2.5 pr-2 mono text-[11px]">
                        {String(log.createdAt).slice(0, 19).replace('T', ' ')}
                      </td>
                      <td className="py-2.5 px-2">
                        <AstryxBadge tone="primary">{log.action}</AstryxBadge>
                      </td>
                      <td className="py-2.5 px-2 mono text-[11px]">
                        {log.entityType} ({log.entityId || '—'})
                      </td>
                      <td className="py-2.5 px-2 mono text-[10px] text-[var(--muted)]">
                        {String(log.checksum).slice(0, 24)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AstryxCard>
        </div>
      )}

      {/* =================================================================
          MODALS FOR COMPLETE CRUD FLOWS
          ================================================================= */}

      {/* 1. Manual Order Creation Modal */}
      <AstryxModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title="Create Manual Order (Modal Entry)"
        description="Creates Order header, Customer identity, Address snapshot, OrderLineItem, and computes P&L in one ACID transaction."
      >
        <Form
          route="orders.store"
          onSuccess={() => setOrderModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Order Number</label>
              <input name="orderNumber" defaultValue={`ORD-2026-${nextSeq}`} required />
            </div>
            <div className="field">
              <label>Seller Account</label>
              <select
                name="sellerAccountId"
                defaultValue={sellerAccounts[0]?.id || ''}
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                {sellerAccounts.map((sa: any) => (
                  <option key={sa.id} value={sa.id}>
                    {sa.accountName} ({sa.defaultCurrency})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Customer Full Name</label>
              <input name="customerFullName" defaultValue="Marcus Vance" required />
            </div>
            <div className="field">
              <label>Customer Email</label>
              <input type="email" name="customerEmail" defaultValue="marcus.vance@enterprise.io" />
            </div>
            <div className="field">
              <label>Shipping Address Line 1</label>
              <input name="shippingLine1" defaultValue="742 Evergreen Terrace" />
            </div>
            <div className="field">
              <label>City & Country</label>
              <input name="shippingCity" defaultValue="Seattle" />
            </div>
            <div className="field">
              <label>Currency Code</label>
              <select
                name="currencyCode"
                defaultValue="USD"
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="MXN">MXN</option>
                <option value="INR">INR</option>
              </select>
            </div>
            <div className="field">
              <label>FX Rate to USD</label>
              <input type="number" step="0.0001" name="exchangeRate" defaultValue="1.0000" />
            </div>
            <div className="field">
              <label>Variant SKU</label>
              <input name="sku" defaultValue="AST-HUB-TB4-SLV" required />
            </div>
            <div className="field">
              <label>Item Title</label>
              <input
                name="itemTitle"
                defaultValue="Astryx Pro 12-in-1 Thunderbolt 4 Dock"
                required
              />
            </div>
            <div className="field">
              <label>Quantity Ordered</label>
              <input type="number" name="quantityOrdered" defaultValue="1" min={1} required />
            </div>
            <div className="field">
              <label>Unit Selling Price</label>
              <input type="number" step="0.01" name="unitPrice" defaultValue="249.00" required />
            </div>
            <div className="field">
              <label>Unit COGS</label>
              <input type="number" step="0.01" name="unitCostAmount" defaultValue="78.50" />
            </div>
            <div className="field">
              <label>Tax Amount</label>
              <input type="number" step="0.01" name="taxAmount" defaultValue="22.41" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <AstryxButton variant="secondary" onClick={() => setOrderModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Create Order
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>

      {/* 2. Bulk JSON Order Import Modal */}
      <AstryxModal
        open={bulkImportModalOpen}
        onClose={() => setBulkImportModalOpen(false)}
        title="Idempotent Bulk JSON Marketplace Order Import"
        description="Processes an array of marketplace orders, stores raw payloads separately, skips duplicate external_order_ids, and records per-item errors."
      >
        <Form
          route="orders.bulk_import"
          onSuccess={() => setBulkImportModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Batch Idempotency Key</label>
              <input name="idempotencyKey" defaultValue={`batch-amz-2026-${nextSeq}`} required />
            </div>
            <div className="field">
              <label>Target Seller Account</label>
              <select
                name="sellerAccountId"
                defaultValue={sellerAccounts[0]?.id || ''}
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                {sellerAccounts.map((sa: any) => (
                  <option key={sa.id} value={sa.id}>
                    {sa.accountName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Orders JSON Array Payload</label>
            <textarea
              name="ordersJson"
              rows={10}
              defaultValue={sampleBulkJson}
              className="w-full p-3 rounded-xl mono text-[11px] bg-[var(--bg)] border border-[var(--line-2)]"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <AstryxButton variant="secondary" onClick={() => setBulkImportModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Run Idempotent Import
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>

      {/* 3. Create Product & SKU Modal */}
      <AstryxModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title="Create Product & Sellable Variant SKU"
        description="Supports simple products or multi-variant products with COGS, manufacturing, and packaging cost tracking."
      >
        <Form
          route="products.store"
          onSuccess={() => setProductModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Product Title</label>
              <input name="title" defaultValue="Astryx GaN 140W Travel Charger" required />
            </div>
            <div className="field">
              <label>Sellable SKU</label>
              <input name="sku" defaultValue={`AST-GAN-${products.length + 140}`} required />
            </div>
            <div className="field">
              <label>ASIN (Optional)</label>
              <input name="asin" defaultValue="B0ASTRYX99" />
            </div>
            <div className="field">
              <label>Retail Price (USD)</label>
              <input type="number" step="0.01" name="retailPrice" defaultValue="119.00" required />
            </div>
            <div className="field">
              <label>Unit COGS</label>
              <input type="number" step="0.01" name="costPrice" defaultValue="34.00" />
            </div>
            <div className="field">
              <label>Manufacturing Cost</label>
              <input type="number" step="0.01" name="manufacturingCost" defaultValue="28.00" />
            </div>
            <div className="field">
              <label>Packaging Cost</label>
              <input type="number" step="0.01" name="packagingCost" defaultValue="3.50" />
            </div>
            <div className="field">
              <label>Initial Stock On Hand</label>
              <input type="number" name="stockOnHand" defaultValue="100" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <AstryxButton variant="secondary" onClick={() => setProductModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Save Product & SKU
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>

      {/* 4. Create Customer Modal */}
      <AstryxModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Add Customer & Verified Address"
      >
        <Form
          route="customers.store"
          onSuccess={() => setCustomerModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Full Name</label>
              <input name="fullName" defaultValue="Sophia Chen" required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" defaultValue="sophia.chen@buyer.org" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input name="phone" defaultValue="+1-650-555-0144" />
            </div>
            <div className="field">
              <label>Preferred Currency</label>
              <input name="preferredCurrency" defaultValue="USD" />
            </div>
            <div className="field">
              <label>Address Line 1</label>
              <input name="line1" defaultValue="1 Hacker Way" />
            </div>
            <div className="field">
              <label>City</label>
              <input name="city" defaultValue="Menlo Park" />
            </div>
            <div className="field">
              <label>Postal Code</label>
              <input name="postalCode" defaultValue="94025" />
            </div>
            <div className="field">
              <label>Country Code</label>
              <input name="countryCode" defaultValue="US" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <AstryxButton variant="secondary" onClick={() => setCustomerModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Save Customer
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>

      {/* 5. Create Shipment Modal */}
      <AstryxModal
        open={shipmentModalOpen}
        onClose={() => setShipmentModalOpen(false)}
        title="Create Parcel Shipment (Partial or Full Fulfillment)"
      >
        <Form
          route="shipments.store"
          onSuccess={() => setShipmentModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Select Order</label>
              <select
                name="orderId"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                {orders.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} ({o.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Order Line Item</label>
              <select
                name="orderLineItemId"
                defaultValue={selectedOrder?.lineItems?.[0]?.id || ''}
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                {(selectedOrder?.lineItems || []).map((li: any) => (
                  <option key={li.id} value={li.id}>
                    {li.sku} (Ordered: {li.quantityOrdered}, Shipped: {li.quantityFulfilled})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Shipment Number</label>
              <input
                name="shipmentNumber"
                defaultValue={`SHP-2026-${shipments.length + 501}`}
                required
              />
            </div>
            <div className="field">
              <label>Quantity to Ship</label>
              <input type="number" name="quantityShipped" defaultValue="1" min={1} required />
            </div>
            <div className="field">
              <label>Carrier Code</label>
              <input name="carrierCode" defaultValue="ups" required />
            </div>
            <div className="field">
              <label>Carrier Name</label>
              <input name="carrierName" defaultValue="UPS Ground" required />
            </div>
            <div className="field">
              <label>Tracking Number</label>
              <input name="trackingNumber" defaultValue="1Z999AA10199887766" />
            </div>
            <div className="field">
              <label>Dead Weight (grams)</label>
              <input type="number" name="deadWeightGrams" defaultValue="650" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <AstryxButton variant="secondary" onClick={() => setShipmentModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Create Shipment
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>

      {/* 6. Reconcile Carrier Shipping Invoice Modal */}
      <AstryxModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Reconcile Carrier Shipping Invoice"
        description="Enforces duplicate-charge protection per (shipment_id, charge_type) and computes billing variance."
      >
        <Form
          route="shipping_invoices.store"
          onSuccess={() => setInvoiceModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Invoice Number</label>
              <input
                name="invoiceNumber"
                defaultValue={`INV-CAR-${shippingInvoices.length + 201}`}
                required
              />
            </div>
            <div className="field">
              <label>Linked Shipment</label>
              <select
                name="shipmentId"
                defaultValue={shipments[0]?.id || ''}
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                {shipments.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.shipmentNumber} ({s.trackingNumber})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Carrier Code</label>
              <input name="carrierCode" defaultValue="ups" required />
            </div>
            <div className="field">
              <label>Carrier Name</label>
              <input name="carrierName" defaultValue="UPS Inc." required />
            </div>
            <div className="field">
              <label>Charge Type</label>
              <select
                name="chargeType"
                defaultValue="dimensional_weight_adjustment"
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                <option value="base_freight">base_freight</option>
                <option value="fuel_surcharge">fuel_surcharge</option>
                <option value="residential_fee">residential_fee</option>
                <option value="dimensional_weight_adjustment">dimensional_weight_adjustment</option>
                <option value="customs_duty">customs_duty</option>
                <option value="other">other</option>
              </select>
            </div>
            <div className="field">
              <label>Invoice Date</label>
              <input type="date" name="invoiceDate" defaultValue="2026-10-17" required />
            </div>
            <div className="field">
              <label>Expected Amount ($)</label>
              <input type="number" step="0.01" name="expectedAmount" defaultValue="0.00" />
            </div>
            <div className="field">
              <label>Billed Amount ($)</label>
              <input type="number" step="0.01" name="billedAmount" defaultValue="3.50" required />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <AstryxButton variant="secondary" onClick={() => setInvoiceModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Reconcile Invoice
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>

      {/* 7. Create Return Request (RMA) Modal */}
      <AstryxModal
        open={rmaModalOpen}
        onClose={() => setRmaModalOpen(false)}
        title="Create Return Request (RMA)"
        description="Validates requested quantity against remaining returnable quantity on the order line."
      >
        <Form
          route="returns.store"
          onSuccess={() => setRmaModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Select Order</label>
              <select
                name="orderId"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                {orders.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Order Line Item</label>
              <select
                name="orderLineItemId"
                defaultValue={selectedOrder?.lineItems?.[0]?.id || ''}
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                {(selectedOrder?.lineItems || []).map((li: any) => (
                  <option key={li.id} value={li.id}>
                    {li.sku} (Ordered: {li.quantityOrdered}, Returned: {li.quantityReturned})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>RMA Number</label>
              <input
                name="rmaNumber"
                defaultValue={`RMA-2026-${returnRequests.length + 301}`}
                required
              />
            </div>
            <div className="field">
              <label>Quantity Requested</label>
              <input type="number" name="quantityRequested" defaultValue="1" min={1} required />
            </div>
            <div className="field">
              <label>Return Reason</label>
              <select
                name="returnReason"
                defaultValue="changed_mind"
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                <option value="defective">defective</option>
                <option value="wrong_item_sent">wrong_item_sent</option>
                <option value="damaged_in_transit">damaged_in_transit</option>
                <option value="not_as_described">not_as_described</option>
                <option value="changed_mind">changed_mind</option>
              </select>
            </div>
            <div className="field">
              <label>Resolution Type</label>
              <select
                name="resolutionType"
                defaultValue="partial_refund"
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                <option value="full_refund">full_refund</option>
                <option value="partial_refund">partial_refund</option>
                <option value="replacement">replacement</option>
                <option value="store_credit">store_credit</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <AstryxButton variant="secondary" onClick={() => setRmaModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Authorize RMA
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>

      {/* 8. Process Refund Modal */}
      <AstryxModal
        open={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Process Partial or Full Order Refund"
      >
        <Form
          route="refunds.store"
          onSuccess={() => setRefundModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Order</label>
              <select
                name="orderId"
                defaultValue={orders[0]?.id || ''}
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                {orders.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} (Total: {o.totalAmount} {o.currencyCode}, Refunded:{' '}
                    {o.refundedAmount})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Refund Number</label>
              <input
                name="refundNumber"
                defaultValue={`REF-2026-${refundTransactions.length + 401}`}
                required
              />
            </div>
            <div className="field">
              <label>Items Refund Amount</label>
              <input
                type="number"
                step="0.01"
                name="itemsRefundAmount"
                defaultValue="25.00"
                required
              />
            </div>
            <div className="field">
              <label>Restocking Fee Deducted</label>
              <input type="number" step="0.01" name="restockingFeeDeducted" defaultValue="0.00" />
            </div>
            <div className="field sm:col-span-2">
              <label>Refund Reason</label>
              <input name="reason" defaultValue="Customer goodwill adjustment" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <AstryxButton variant="secondary" onClick={() => setRefundModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Execute Refund
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>

      {/* 9. Post Financial Ledger Entry Modal */}
      <AstryxModal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        title="Post Multi-Currency Financial Transaction"
      >
        <Form
          route="financial_transactions.store"
          onSuccess={() => setTxModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Reference Number</label>
              <input
                name="referenceNumber"
                defaultValue={`FIN-2026-${financialTransactions.length + 601}`}
                required
              />
            </div>
            <div className="field">
              <label>Data Classification</label>
              <select
                name="dataClassification"
                defaultValue="business"
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                <option value="business">business (P&L Included)</option>
                <option value="household_personal">household_personal (Segregated)</option>
              </select>
            </div>
            <div className="field">
              <label>Transaction Type</label>
              <select
                name="transactionType"
                defaultValue="expense"
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                <option value="income">income</option>
                <option value="expense">expense</option>
                <option value="marketplace_settlement">marketplace_settlement</option>
                <option value="credit_card_payment">credit_card_payment</option>
              </select>
            </div>
            <div className="field">
              <label>Transaction Date</label>
              <input type="date" name="transactionDate" defaultValue="2026-10-17" required />
            </div>
            <div className="field">
              <label>Original Currency</label>
              <select
                name="originalCurrencyCode"
                defaultValue="USD"
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="MXN">MXN</option>
                <option value="INR">INR</option>
              </select>
            </div>
            <div className="field">
              <label>Original Amount</label>
              <input
                type="number"
                step="0.01"
                name="originalAmount"
                defaultValue="450.00"
                required
              />
            </div>
            <div className="field">
              <label>FX Rate to USD</label>
              <input type="number" step="0.0001" name="exchangeRate" defaultValue="1.0000" />
            </div>
            <div className="field">
              <label>Vendor or Payer</label>
              <input name="vendorOrPayer" defaultValue="DHL Global Forwarding" />
            </div>
            <div className="field sm:col-span-2">
              <label>Description</label>
              <input
                name="description"
                defaultValue="Air freight customs clearance & pallet handling"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <AstryxButton variant="secondary" onClick={() => setTxModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Post to Ledger
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>

      {/* 10. Register Tokenized Credit Card Modal */}
      <AstryxModal
        open={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        title="Register Tokenized Credit Card (Zero PAN / CVV)"
      >
        <Form
          route="credit_cards.store"
          onSuccess={() => setCardModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Card Label</label>
              <input name="cardLabel" defaultValue="Capital One Spark Cash Plus" required />
            </div>
            <div className="field">
              <label>Brand</label>
              <input name="brandName" defaultValue="Mastercard" required />
            </div>
            <div className="field">
              <label>Cardholder Name</label>
              <input name="cardholderName" defaultValue="ARJUN MEHTA" required />
            </div>
            <div className="field">
              <label>Last 4 Digits Only</label>
              <input name="last4Digits" defaultValue="5519" maxLength={4} minLength={4} required />
            </div>
            <div className="field">
              <label>Exp Month</label>
              <input type="number" name="expMonth" defaultValue="11" min={1} max={12} required />
            </div>
            <div className="field">
              <label>Exp Year</label>
              <input type="number" name="expYear" defaultValue="2029" min={2026} required />
            </div>
            <div className="field">
              <label>Link to Seller Account</label>
              <select
                name="sellerAccountId"
                defaultValue={sellerAccounts[0]?.id || ''}
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                <option value="">None</option>
                {sellerAccounts.map((sa: any) => (
                  <option key={sa.id} value={sa.id}>
                    {sa.accountName}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Scope</label>
              <select
                name="dataClassification"
                defaultValue="business"
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                <option value="business">business</option>
                <option value="household_personal">household_personal</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <AstryxButton variant="secondary" onClick={() => setCardModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Register Card
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>

      {/* 11. Connect Seller Account Modal */}
      <AstryxModal
        open={sellerModalOpen}
        onClose={() => setSellerModalOpen(false)}
        title="Connect Marketplace Seller Account (AES-256-GCM Encrypted)"
      >
        <Form
          route="seller_accounts.store"
          onSuccess={() => setSellerModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Sales Channel</label>
              <select
                name="salesChannelId"
                defaultValue={salesChannels[0]?.id || ''}
                className="h-9 px-3 rounded-lg bg-[var(--bg)] border border-[var(--line-2)]"
              >
                {salesChannels.map((sc: any) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Account Name</label>
              <input name="accountName" defaultValue="Astryx Gear - Amazon MX" required />
            </div>
            <div className="field">
              <label>External Merchant / Seller ID</label>
              <input
                name="externalSellerId"
                defaultValue={`A1MX-${sellerAccounts.length + 701}`}
                required
              />
            </div>
            <div className="field">
              <label>Marketplace Region</label>
              <input name="marketplaceRegion" defaultValue="MX" required />
            </div>
            <div className="field">
              <label>Default Currency</label>
              <input name="defaultCurrency" defaultValue="MXN" required />
            </div>
            <div className="field">
              <label>API Secret (Encrypted at Rest)</label>
              <input type="password" name="apiSecret" defaultValue="spapi-secret-token-mx" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <AstryxButton variant="secondary" onClick={() => setSellerModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Encrypt & Connect Account
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>

      {/* 12. Super-Admin Provision User Modal */}
      <AstryxModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title="Provision User Account (Super Administrator Only)"
        description="Public registration is disabled. Provisioning creates user, hashes password via scrypt, assigns RBAC roles, and logs an immutable audit event."
      >
        <Form
          route="admin.users.store"
          onSuccess={() => setUserModalOpen(false)}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field">
              <label>Full Name</label>
              <input name="fullName" defaultValue="Priya Nair" required />
            </div>
            <div className="field">
              <label>Work Email</label>
              <input
                type="email"
                name="email"
                defaultValue={`priya.nair.${allUsers.length + 1}@sellercore.io`}
                required
              />
            </div>
            <div className="field">
              <label>Initial Password</label>
              <input
                type="password"
                name="password"
                defaultValue="Priya@SellerCore2026!"
                required
              />
            </div>
            <div className="field">
              <label>Default Currency</label>
              <input name="defaultCurrency" defaultValue="USD" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <AstryxButton variant="secondary" onClick={() => setUserModalOpen(false)}>
              Cancel
            </AstryxButton>
            <AstryxButton type="submit" variant="primary">
              Provision User
            </AstryxButton>
          </div>
        </Form>
      </AstryxModal>
    </div>
  )
}
