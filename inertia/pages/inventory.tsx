import { Head, router } from '@inertiajs/react'
import { useState, useMemo } from 'react'
import {
  Warehouse,
  AlertTriangle,
  PackageCheck,
  Plus,
  Search,
  SlidersHorizontal,
  Box,
  CheckCircle2,
} from 'lucide-react'
import {
  PageHeader,
  PageSection,
  TopStatusBar,
  AppButton,
  AppInput,
  AppSelect,
  MonoBadge,
  StatusBadge,
  ProgressMeter,
  FormModal,
  PaginationBar,
  money,
  type Row,
} from '~/lib/ui'

type Props = {
  products: Row[]
  sellerAccounts?: Row[]
  channelListings?: Row[]
  savedViews?: Row[]
  brands?: Row[]
  categories?: Row[]
  salesChannels?: Row[]
  orders?: Row[]
  orderLineItems?: Row[]
  financeCategories?: Row[]
}

export default function InventoryPage({ products = [] }: Props) {
  const [editStockRow, setEditStockRow] = useState<Row | null>(null)
  const [addVariantOpen, setAddVariantOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [healthFilter, setHealthFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const variantRows = useMemo(() => {
    const list: Row[] = []
    for (const p of products) {
      for (const v of (p.variants as Row[]) ?? []) {
        const onHand = Number(v.stockOnHand ?? 0)
        const reserved = Number(v.stockReserved ?? 0)
        const available = Math.max(0, onHand - reserved)
        const reorderPoint = Number(v.reorderPoint ?? 15)
        const stockHealth =
          available <= 0 ? 'out_of_stock' : available <= reorderPoint ? 'low_stock' : 'in_stock'
        list.push({
          ...v,
          productTitle: p.title,
          productId: p.id,
          brandName: (p.brand as any)?.name ?? 'Brand-Agnostic',
          stockAvailable: available,
          reorderPoint,
          stockHealth,
          inventoryValue: (onHand * Number(v.costPrice ?? 0)).toFixed(2),
        })
      }
    }
    return list
  }, [products])

  const totalUnits = variantRows.reduce((s, v) => s + Number(v.stockOnHand ?? 0), 0)
  const totalAvailable = variantRows.reduce((s, v) => s + Number(v.stockAvailable ?? 0), 0)
  const totalValue = variantRows.reduce((s, v) => s + Number(v.inventoryValue ?? 0), 0)
  const inStockCount = variantRows.filter((v) => v.stockHealth === 'in_stock').length
  const lowStockCount = variantRows.filter((v) => v.stockHealth !== 'in_stock').length

  const filteredRows = useMemo(() => {
    return variantRows.filter((row) => {
      if (healthFilter !== 'all' && String(row.stockHealth) !== healthFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const hay = [row.sku, row.title, row.productTitle, row.brandName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [variantRows, healthFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, currentPage])

  return (
    <>
      <Head title="Inventory & Stock Control" />
      <div className="space-y-6">
        <PageHeader
          title="Inventory & Warehouse Stock Control (/inventory)"
          description="Monitor real-time SKU stock levels, reorder alerts, reserved units, and cost valuation across all products and variants."
          icon={Warehouse}
          badge={`${variantRows.length} active SKUs · ${totalUnits.toLocaleString()} units`}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <AppButton
                label="← Products (/products)"
                variant="secondary"
                size="sm"
                onClick={() => router.visit('/products')}
              />
              <AppButton
                label="+ Add Variant SKU"
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setAddVariantOpen(true)}
              />
            </div>
          }
        />

        {/* Top Status Bar with Click-to-Filter */}
        <TopStatusBar
          columns={4}
          items={[
            {
              label: 'Total Units on Hand',
              value: totalUnits.toLocaleString(),
              sublabel: `${totalAvailable.toLocaleString()} available · ${variantRows.length} SKUs`,
              icon: Warehouse,
              tone: 'primary',
              active: healthFilter === 'all',
              onClick: () => setHealthFilter('all'),
            },
            {
              label: 'Inventory Cost Valuation',
              value: money('USD', totalValue),
              sublabel: 'Based on unit COGS × On Hand',
              icon: PackageCheck,
              tone: 'info',
            },
            {
              label: 'Healthy In-Stock SKUs',
              value: String(inStockCount),
              sublabel: 'Click to filter healthy SKUs',
              icon: CheckCircle2,
              tone: 'success',
              active: healthFilter === 'in_stock',
              onClick: () => setHealthFilter((prev) => (prev === 'in_stock' ? 'all' : 'in_stock')),
            },
            {
              label: 'Low / Out-of-Stock Alerts',
              value: String(lowStockCount),
              sublabel: 'Click to filter SKUs at reorder point',
              icon: AlertTriangle,
              tone: lowStockCount > 0 ? 'warning' : 'neutral',
              active: healthFilter === 'low_stock' || healthFilter === 'out_of_stock',
              onClick: () =>
                setHealthFilter((prev) => (prev === 'low_stock' ? 'all' : 'low_stock')),
            },
          ]}
        />

        {/* Inventory Table Section with Generous Padding & Polished Action Buttons */}
        <PageSection
          title="Warehouse SKU Stock & Valuation Ledger"
          description="Filter by stock health or search any SKU to adjust on-hand inventory and retail price."
          actions={
            <AppButton
              label="+ Add Variant SKU"
              variant="primary"
              size="xs"
              icon={Plus}
              onClick={() => setAddVariantOpen(true)}
            />
          }
        >
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl border border-card-border bg-muted/25 p-3.5">
              <div className="md:col-span-2">
                <AppInput
                  label="Search SKU / Product / Variant"
                  icon={Search}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  onClear={() => setSearchQuery('')}
                  placeholder="Filter by SKU code, product title, color or size..."
                />
              </div>
              <AppSelect
                label="Stock Health Filter"
                value={healthFilter}
                onChange={(e) => {
                  setHealthFilter(e.target.value)
                  setPage(1)
                }}
                options={[
                  { value: 'all', label: `All SKUs (${variantRows.length})` },
                  { value: 'in_stock', label: `In Stock (${inStockCount})` },
                  { value: 'low_stock', label: 'Low Stock (Below Reorder Point)' },
                  { value: 'out_of_stock', label: 'Out of Stock (0 Available)' },
                ]}
              />
            </div>

            {paginatedRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
                <p className="text-sm font-bold text-foreground">
                  No inventory SKUs match your active filters.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <AppButton
                    label="Reset Filters"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setHealthFilter('all')
                    }}
                  />
                  <AppButton
                    label="+ Add Variant SKU"
                    variant="primary"
                    size="sm"
                    onClick={() => setAddVariantOpen(true)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-card-border bg-card shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-divider bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3.5 px-4">Variant SKU</th>
                        <th className="py-3.5 px-4">Parent Product & Variant</th>
                        <th className="py-3.5 px-4">Stock Health</th>
                        <th className="py-3.5 px-4 text-right">On Hand</th>
                        <th className="py-3.5 px-4 text-right">Available</th>
                        <th className="py-3.5 px-4 text-right">Unit Cost</th>
                        <th className="py-3.5 px-4 text-right">Retail Price</th>
                        <th className="py-3.5 px-4 text-right">Stock Valuation</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {paginatedRows.map((row) => {
                        const avail = Number(row.stockAvailable ?? 0)
                        const pct = Math.min(100, Math.round((avail / 40) * 100))
                        const healthTone =
                          row.stockHealth === 'in_stock'
                            ? 'success'
                            : row.stockHealth === 'low_stock'
                              ? 'warning'
                              : 'error'

                        return (
                          <tr key={String(row.id)} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3.5 px-4 align-middle">
                              <MonoBadge text={String(row.sku)} />
                            </td>
                            <td className="py-3.5 px-4 align-middle max-w-xs">
                              <div className="font-bold text-foreground truncate">
                                {String(row.productTitle)}
                              </div>
                              <div className="text-muted-foreground truncate mt-0.5">
                                {String(row.title)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 align-middle">
                              <div className="space-y-1.5 w-32">
                                <StatusBadge
                                  label={String(row.stockHealth).replace(/_/g, ' ')}
                                  variant={healthTone}
                                />
                                <ProgressMeter value={pct} tone={healthTone} />
                              </div>
                            </td>
                            <td className="py-3.5 px-4 align-middle text-right font-bold text-foreground tabular-nums">
                              {String(row.stockOnHand ?? 0)}
                            </td>
                            <td className="py-3.5 px-4 align-middle text-right font-extrabold text-foreground tabular-nums">
                              {String(row.stockAvailable ?? 0)}
                            </td>
                            <td className="py-3.5 px-4 align-middle text-right text-muted-foreground tabular-nums">
                              {money(String(row.currencyCode || 'USD'), row.costPrice)}
                            </td>
                            <td className="py-3.5 px-4 align-middle text-right font-bold text-price-current tabular-nums">
                              {money(String(row.currencyCode || 'USD'), row.retailPrice)}
                            </td>
                            <td className="py-3.5 px-4 align-middle text-right font-extrabold text-foreground tabular-nums">
                              {money('USD', row.inventoryValue)}
                            </td>
                            <td className="py-3.5 px-4 align-middle text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <AppButton
                                  label="Adjust Stock & Price"
                                  variant="primary"
                                  size="xs"
                                  icon={SlidersHorizontal}
                                  onClick={() => setEditStockRow(row)}
                                />
                                <AppButton
                                  label="Product"
                                  variant="outline"
                                  size="xs"
                                  icon={Box}
                                  onClick={() => router.visit('/products')}
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={filteredRows.length}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </PageSection>

        {/* Modals */}
        <FormModal
          isOpen={!!editStockRow}
          onOpenChange={(o) => {
            if (!o) setEditStockRow(null)
          }}
          title={`Adjust Stock & Price: ${String(editStockRow?.sku ?? '')}`}
          subtitle="Updates stock_on_hand and retail_price with non-negative CHECK protection."
          submitLabel="Save Stock & Price"
          action={
            editStockRow ? `/variants/${editStockRow.id}/stock` : '/variants/placeholder/stock'
          }
          initialValues={
            editStockRow
              ? {
                  stockOnHand: String(editStockRow.stockOnHand ?? 0),
                  retailPrice: String(editStockRow.retailPrice ?? 0),
                }
              : undefined
          }
          fields={[
            { name: 'stockOnHand', label: 'Stock on hand', kind: 'number', required: true },
            { name: 'retailPrice', label: 'Retail price (USD)', kind: 'number', required: true },
          ]}
        />

        <FormModal
          isOpen={addVariantOpen}
          onOpenChange={setAddVariantOpen}
          title="Add Product Variant SKU"
          submitLabel="Create Variant"
          action="/products/placeholder/variants"
          actionFor={(v) => `/products/${v.productId}/variants`}
          fields={[
            {
              name: 'productId',
              label: 'Parent Product',
              kind: 'select',
              required: true,
              options: products.map((p) => ({ value: String(p.id), label: String(p.title) })),
            },
            { name: 'sku', label: 'Variant SKU', required: true },
            { name: 'title', label: 'Variant title', required: true },
            { name: 'retailPrice', label: 'Retail price', kind: 'number', required: true },
            { name: 'costPrice', label: 'Unit cost price', kind: 'number' },
            { name: 'stockOnHand', label: 'Initial stock on hand', kind: 'number', default: '25' },
            { name: 'attributeName', label: 'Attribute dimension (e.g. color)' },
            { name: 'attributeValue', label: 'Attribute value (e.g. Obsidian)' },
          ]}
        />
      </div>
    </>
  )
}
