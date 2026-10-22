import { Head } from '@inertiajs/react'
import { useState, useMemo } from 'react'
import { Warehouse, AlertTriangle, PackageCheck, Plus } from 'lucide-react'
import { ModulePageHeader, StatsCard } from '~/modules/common/module-page-header'
import { FormModal, ResponsiveDataView, col, money, type Row } from '~/lib/ui'
import { Button } from '@astryxdesign/core/Button'

type Props = {
  products: Row[]
  sellerAccounts: Row[]
  channelListings?: Row[]
}

export default function InventoryPage({ products }: Props) {
  const [editStockRow, setEditStockRow] = useState<Row | null>(null)
  const [addVariantOpen, setAddVariantOpen] = useState(false)

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
  const totalValue = variantRows.reduce((s, v) => s + Number(v.inventoryValue ?? 0), 0)
  const lowStockCount = variantRows.filter((v) => v.stockHealth !== 'in_stock').length

  return (
    <>
      <Head title="Inventory & Stock Control" />
      <div className="space-y-6">
        <ModulePageHeader
          title="Inventory & Warehouse Stock Control"
          description="Monitor real-time SKU stock levels, reorder alerts, reserved units, and cost valuation across all products and variants."
          icon={Warehouse}
          actions={
            <Button
              label="+ Add Variant SKU"
              variant="primary"
              onClick={() => setAddVariantOpen(true)}
            />
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Units on Hand"
            value={totalUnits.toLocaleString()}
            icon={Warehouse}
            description={`${variantRows.length} active SKUs tracked`}
          />
          <StatsCard
            title="Inventory Cost Valuation"
            value={money('USD', totalValue)}
            icon={PackageCheck}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600"
            description="Based on unit cost price"
          />
          <StatsCard
            title="Low / Out-of-Stock Alerts"
            value={lowStockCount}
            icon={AlertTriangle}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600"
            description="SKUs at or below reorder point"
          />
        </div>

        <FormModal
          isOpen={!!editStockRow}
          onOpenChange={(o) => {
            if (!o) setEditStockRow(null)
          }}
          title={`Adjust Stock & Price: ${String(editStockRow?.sku ?? '')}`}
          subtitle="Updates stock_on_hand and retail_price with non-negative CHECK protection."
          submitLabel="Save stock & price"
          action={editStockRow ? `/variants/${editStockRow.id}/stock` : '/variants/placeholder/stock'}
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
          submitLabel="Create variant"
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

        <ResponsiveDataView
          rows={variantRows}
          searchKeys={['sku', 'title', 'productTitle']}
          filterKey="stockHealth"
          filterPills={[
            { value: 'all', label: 'All SKUs' },
            { value: 'in_stock', label: 'In Stock' },
            { value: 'low_stock', label: 'Low Stock' },
            { value: 'out_of_stock', label: 'Out of Stock' },
          ]}
          createLabel="+ Add Variant SKU"
          onCreateClick={() => setAddVariantOpen(true)}
          toCard={(row) => ({
            title: String(row.sku),
            subtitle: String(row.title || row.productTitle),
            statusBadge: {
              label: String(row.stockHealth).replace(/_/g, ' '),
              variant:
                row.stockHealth === 'in_stock'
                  ? 'success'
                  : row.stockHealth === 'low_stock'
                    ? 'warning'
                    : 'error',
            },
            metrics: [
              { label: 'On Hand / Available', value: `${row.stockOnHand ?? 0} / ${row.stockAvailable ?? 0}` },
              { label: 'Retail Price', value: money(String(row.currencyCode || 'USD'), row.retailPrice) },
              { label: 'Unit Cost', value: money(String(row.currencyCode || 'USD'), row.costPrice) },
              { label: 'Stock Value', value: money('USD', row.inventoryValue) },
            ],
            actions: (
              <Button
                label="Adjust Stock / Price"
                variant="secondary"
                size="sm"
                onClick={() => setEditStockRow(row)}
              />
            ),
          })}
          columns={[
            col.text('sku', 'SKU', 150),
            col.text('productTitle', 'Product', 190),
            col.text('title', 'Variant', 180),
            col.badge('stockHealth', 'Health', {
              in_stock: 'success',
              low_stock: 'warning',
              out_of_stock: 'error',
            }),
            col.text('stockOnHand', 'On Hand', 85),
            col.text('stockAvailable', 'Available', 85),
            col.money('costPrice', 'Cost', 'currencyCode'),
            col.money('retailPrice', 'Retail', 'currencyCode'),
            col.action('Actions', (row) => (
              <Button
                label="Adjust Stock"
                variant="secondary"
                size="sm"
                onClick={() => setEditStockRow(row)}
              />
            )),
          ]}
        />
      </div>
    </>
  )
}
