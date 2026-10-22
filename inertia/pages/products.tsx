import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
  PageSection,
  RowAction,
  FormModal,
  ResponsiveDataView,
  SavedViewsBar,
  col,
  STATUS_TONES,
  money,
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import { Box } from 'lucide-react'

type Props = {
  products: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  sellerAccounts: Row[]
  orders: Row[]
  orderLineItems: Row[]
  financeCategories: Row[]
  channelListings?: Row[]
  savedViews?: Row[]
}

const PRODUCT_STATUS = ['draft', 'active', 'archived', 'discontinued']

export default function Products({
  products,
  brands,
  categories,
  sellerAccounts,
  channelListings,
  savedViews,
}: Props) {
  const [createProductOpen, setCreateProductOpen] = useState(false)
  const [editProductRow, setEditProductRow] = useState<Row | null>(null)
  const [addVariantFor, setAddVariantFor] = useState<Row | null>(null)
  const [globalAddVariantOpen, setGlobalAddVariantOpen] = useState(false)
  const [editStockRow, setEditStockRow] = useState<Row | null>(null)
  const [createBrandOpen, setCreateBrandOpen] = useState(false)
  const [editBrandRow, setEditBrandRow] = useState<Row | null>(null)
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [editCategoryRow, setEditCategoryRow] = useState<Row | null>(null)
  const [createListingOpen, setCreateListingOpen] = useState(false)

  const variantRows: Row[] = useMemo(() => {
    const out: Row[] = []
    for (const p of products) {
      for (const v of (p.variants as Row[]) ?? []) {
        out.push({ ...v, productTitle: p.title, productId: p.id })
      }
    }
    return out
  }, [products])

  const flatListings: Row[] = useMemo(() => {
    if (channelListings && channelListings.length > 0) return channelListings
    const out: Row[] = []
    for (const p of products) {
      for (const v of (p.variants as Row[]) ?? []) {
        for (const l of (v.listings as Row[]) ?? [])
          out.push({ ...l, productTitle: p.title, variantSku: v.sku })
      }
    }
    return out
  }, [channelListings, products])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products, Variants & Channel Catalog"
        description="Manage parent products, multi-dimensional SKU variants, brands, categories, and marketplace channel listings."
        icon={Box}
        badge={`${products.length} products · ${variantRows.length} variants · ${flatListings.length} listings`}
        actions={
          <>
            <Button label="+ Brand" variant="ghost" size="sm" onClick={() => setCreateBrandOpen(true)} />
            <Button
              label="+ Category"
              variant="ghost"
              size="sm"
              onClick={() => setCreateCategoryOpen(true)}
            />
            <Button
              label="+ Channel Listing"
              variant="secondary"
              size="sm"
              onClick={() => setCreateListingOpen(true)}
            />
            <Button
              label="+ Add Variant"
              variant="secondary"
              size="sm"
              onClick={() => setGlobalAddVariantOpen(true)}
            />
            <Button
              label="+ Create Product"
              variant="primary"
              size="sm"
              onClick={() => setCreateProductOpen(true)}
            />
          </>
        }
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {/* Create Product Modal */}
      <FormModal
        isOpen={createProductOpen}
        onOpenChange={setCreateProductOpen}
        title="Create Product"
        subtitle="A product supports 0..N variants. Simple products work without variation dimensions."
        submitLabel="Create Product"
        action="/products"
        fields={[
          { name: 'title', label: 'Product title', required: true },
          { name: 'sku', label: 'Default variant SKU', required: true },
          { name: 'skuPrefix', label: 'SKU Prefix (catalog label)' },
          {
            name: 'brandId',
            label: 'Brand',
            kind: 'select',
            options: brands.map((b) => ({ value: String(b.id), label: String(b.name) })),
          },
          {
            name: 'categoryId',
            label: 'Category',
            kind: 'select',
            options: categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
          },
          { name: 'retailPrice', label: 'Retail price', kind: 'number', required: true },
          { name: 'costPrice', label: 'Cost price', kind: 'number' },
          { name: 'manufacturingCost', label: 'Manufacturing cost', kind: 'number' },
          { name: 'packagingCost', label: 'Packaging cost', kind: 'number' },
          { name: 'stockOnHand', label: 'Initial stock on hand', kind: 'number', default: '25' },
          {
            name: 'variationDimensions',
            label: 'Variation dimensions (comma-separated)',
            placeholder: 'size,color',
          },
          {
            name: 'hasVariants',
            label: 'Has multiple variants',
            kind: 'select',
            default: 'false',
            options: [
              { value: 'false', label: 'No (Simple Product)' },
              { value: 'true', label: 'Yes (Multi-Variant)' },
            ],
          },
          { name: 'description', label: 'Description', kind: 'textarea', fullWidth: true },
        ]}
      />

      {/* Edit Product Modal */}
      <FormModal
        isOpen={!!editProductRow}
        onOpenChange={(o) => {
          if (!o) setEditProductRow(null)
        }}
        title={`Edit Product: ${editProductRow?.title ?? ''}`}
        submitLabel="Save Product"
        action={editProductRow ? `/products/${editProductRow.id}` : '/products/placeholder'}
        initialValues={
          editProductRow
            ? {
                title: String(editProductRow.title ?? ''),
                skuPrefix: String(editProductRow.skuPrefix ?? ''),
                description: String(editProductRow.description ?? ''),
                status: String(editProductRow.status ?? 'draft'),
                brandId: String(editProductRow.brandId ?? ''),
                categoryId: String(editProductRow.categoryId ?? ''),
              }
            : undefined
        }
        fields={[
          { name: 'title', label: 'Title', required: true },
          { name: 'skuPrefix', label: 'SKU Prefix' },
          {
            name: 'brandId',
            label: 'Brand',
            kind: 'select',
            options: brands.map((b) => ({ value: String(b.id), label: String(b.name) })),
          },
          {
            name: 'categoryId',
            label: 'Category',
            kind: 'select',
            options: categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
          },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            options: PRODUCT_STATUS.map((s) => ({ value: s, label: s })),
          },
          { name: 'description', label: 'Description', kind: 'textarea', fullWidth: true },
        ]}
      />

      {/* Row-triggered Add Variant Modal */}
      <FormModal
        isOpen={!!addVariantFor}
        onOpenChange={(o) => {
          if (!o) setAddVariantFor(null)
        }}
        title={addVariantFor ? `Add Variant to ${addVariantFor.title}` : 'Add Variant'}
        subtitle="Multi-dimensional variants with normalized attribute key-value pairs."
        submitLabel="Create Variant"
        action={
          addVariantFor
            ? `/products/${addVariantFor.id}/variants`
            : '/products/placeholder/variants'
        }
        fields={[
          { name: 'sku', label: 'Variant SKU', required: true },
          { name: 'title', label: 'Variant title', required: true },
          { name: 'retailPrice', label: 'Retail price', kind: 'number', required: true },
          { name: 'costPrice', label: 'Cost price', kind: 'number' },
          { name: 'stockOnHand', label: 'Stock on hand', kind: 'number', default: '20' },
          { name: 'attributeName', label: 'Attribute dimension (e.g. color)', placeholder: 'color' },
          { name: 'attributeValue', label: 'Attribute value (e.g. navy)', placeholder: 'navy' },
        ]}
      />

      {/* Global Add Variant Modal (with Parent Product selector) */}
      <FormModal
        isOpen={globalAddVariantOpen}
        onOpenChange={setGlobalAddVariantOpen}
        title="Add Variant SKU"
        subtitle="Select a parent product and define the new sellable SKU variant."
        submitLabel="Create Variant"
        action="/products/placeholder/variants"
        actionFor={(v) => `/products/${v.productId}/variants`}
        fields={[
          {
            name: 'productId',
            label: 'Parent Product',
            kind: 'select',
            required: true,
            fullWidth: true,
            options: products.map((p) => ({ value: String(p.id), label: String(p.title) })),
          },
          { name: 'sku', label: 'Variant SKU', required: true },
          { name: 'title', label: 'Variant title', required: true },
          { name: 'retailPrice', label: 'Retail price', kind: 'number', required: true },
          { name: 'costPrice', label: 'Cost price', kind: 'number' },
          { name: 'stockOnHand', label: 'Stock on hand', kind: 'number', default: '20' },
          { name: 'attributeName', label: 'Attribute dimension', placeholder: 'size' },
          { name: 'attributeValue', label: 'Attribute value', placeholder: 'Large' },
        ]}
      />

      {/* Adjust Stock & Price Modal */}
      <FormModal
        isOpen={!!editStockRow}
        onOpenChange={(o) => {
          if (!o) setEditStockRow(null)
        }}
        title={`Adjust Stock & Price — ${editStockRow?.sku ?? ''}`}
        subtitle={`Current stock: ${editStockRow?.stockOnHand ?? 0} · Price: ${editStockRow?.retailPrice ?? 0}`}
        submitLabel="Update Stock & Price"
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
          { name: 'retailPrice', label: 'Retail price', kind: 'number', required: true },
        ]}
      />

      {/* Create Brand Modal */}
      <FormModal
        isOpen={createBrandOpen}
        onOpenChange={setCreateBrandOpen}
        title="Create Brand"
        submitLabel="Create Brand"
        action="/brands"
        fields={[
          { name: 'name', label: 'Brand name', required: true },
          { name: 'slug', label: 'Slug' },
          { name: 'websiteUrl', label: 'Website URL', fullWidth: true },
        ]}
      />

      {/* Edit Brand Modal */}
      <FormModal
        isOpen={!!editBrandRow}
        onOpenChange={(o) => {
          if (!o) setEditBrandRow(null)
        }}
        title={`Edit Brand: ${editBrandRow?.name ?? ''}`}
        submitLabel="Save Brand"
        action={editBrandRow ? `/brands/${editBrandRow.id}` : '/brands/placeholder'}
        initialValues={
          editBrandRow
            ? {
                name: String(editBrandRow.name ?? ''),
                slug: String(editBrandRow.slug ?? ''),
                websiteUrl: String(editBrandRow.websiteUrl ?? ''),
                isActive: String(editBrandRow.isActive ?? 'true'),
              }
            : undefined
        }
        fields={[
          { name: 'name', label: 'Brand name', required: true },
          { name: 'slug', label: 'Slug' },
          { name: 'websiteUrl', label: 'Website URL' },
          {
            name: 'isActive',
            label: 'Active',
            kind: 'select',
            options: [
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ],
          },
        ]}
      />

      {/* Create Category Modal */}
      <FormModal
        isOpen={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        title="Create Category"
        submitLabel="Create Category"
        action="/categories"
        fields={[
          { name: 'name', label: 'Category name', required: true },
          { name: 'slug', label: 'Slug' },
          {
            name: 'parentCategoryId',
            label: 'Parent category',
            kind: 'select',
            fullWidth: true,
            options: categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
          },
        ]}
      />

      {/* Edit Category Modal */}
      <FormModal
        isOpen={!!editCategoryRow}
        onOpenChange={(o) => {
          if (!o) setEditCategoryRow(null)
        }}
        title={`Edit Category: ${editCategoryRow?.name ?? ''}`}
        submitLabel="Save Category"
        action={editCategoryRow ? `/categories/${editCategoryRow.id}` : '/categories/placeholder'}
        initialValues={
          editCategoryRow
            ? {
                name: String(editCategoryRow.name ?? ''),
                slug: String(editCategoryRow.slug ?? ''),
                description: String(editCategoryRow.description ?? ''),
              }
            : undefined
        }
        fields={[
          { name: 'name', label: 'Category name', required: true },
          { name: 'slug', label: 'Slug' },
          {
            name: 'isActive',
            label: 'Active',
            kind: 'select',
            options: [
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ],
          },
          { name: 'description', label: 'Description', kind: 'textarea', fullWidth: true },
        ]}
      />

      {/* Create Channel Listing Modal */}
      <FormModal
        isOpen={createListingOpen}
        onOpenChange={setCreateListingOpen}
        title="Publish Channel Listing"
        subtitle="Per-channel listing overrides with price and allocated quantity."
        submitLabel="Publish Listing"
        action="/channel-listings"
        fields={[
          {
            name: 'sellerAccountId',
            label: 'Seller account',
            kind: 'select',
            required: true,
            options: sellerAccounts.map((s) => ({
              value: String(s.id),
              label: String(s.accountName ?? s.id),
            })),
          },
          {
            name: 'productVariantId',
            label: 'Variant SKU',
            kind: 'select',
            required: true,
            options: variantRows.map((v) => ({
              value: String(v.id),
              label: `${v.productTitle} · ${v.sku}`,
            })),
          },
          { name: 'externalListingId', label: 'External listing ID / ASIN', required: true },
          { name: 'channelSku', label: 'Channel SKU override' },
          { name: 'listedPrice', label: 'Listed price', kind: 'number' },
          { name: 'allocatedQuantity', label: 'Allocated quantity', kind: 'number', default: '25' },
        ]}
      />

      <PageSection
        title="Products"
        description="Catalog parent entities with 0..N sellable variant SKUs."
      >
        <ResponsiveDataView
          rows={products}
          searchKeys={['title', 'skuPrefix', 'slug']}
          filterKey="status"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Archived' },
          ]}
          createLabel="+ Create Product"
          onCreateClick={() => setCreateProductOpen(true)}
          toCard={(row) => ({
            title: String(row.title),
            idBadge: String(row.skuPrefix ?? '—'),
            statusBadge: {
              label: String(row.status),
              variant: STATUS_TONES[String(row.status)] ?? 'neutral',
            },
            metrics: [
              { label: 'Brand', value: String((row.brand as any)?.name ?? '—') },
              { label: 'Category', value: String((row.category as any)?.name ?? '—') },
              { label: 'Variants', value: String(((row.variants as Row[]) ?? []).length) },
              { label: 'Created', value: new Date(String(row.createdAt)).toLocaleDateString() },
            ],
            actions: (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditProductRow(row)}
                />
                <Button
                  label="+ Variant"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddVariantFor(row)}
                />
                <RowAction
                  action={`/products/${row.id}/delete`}
                  label="Archive"
                  variant="ghost"
                  confirmText="Archive this product?"
                />
              </div>
            ),
          })}
          columns={[
            col.text('title', 'Title', 200),
            col.text('skuPrefix', 'SKU Prefix', 110),
            col.text('slug', 'Slug', 130),
            col.badge('status', 'Status', STATUS_TONES),
            col.text('hasVariants', 'Has Variants', 100),
            col.action('Actions', (row) => (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditProductRow(row)}
                />
                <Button
                  label="+ Variant"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddVariantFor(row)}
                />
                <RowAction
                  action={`/products/${row.id}/delete`}
                  label="Archive"
                  variant="ghost"
                  confirmText="Archive this product?"
                />
              </div>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Variants & Stock"
        description="Adjust stock levels or retail price on any sellable SKU."
      >
        <ResponsiveDataView
          rows={variantRows}
          searchKeys={['sku', 'title', 'productTitle']}
          createLabel="+ Add Variant"
          onCreateClick={() => setGlobalAddVariantOpen(true)}
          toCard={(row) => ({
            title: `${row.productTitle} — ${row.sku}`,
            statusBadge: {
              label: String(row.status ?? 'active'),
              variant: STATUS_TONES[String(row.status ?? 'active')] ?? 'neutral',
            },
            metrics: [
              { label: 'SKU', value: String(row.sku) },
              { label: 'Retail', value: money(String(row.currencyCode), row.retailPrice) },
              { label: 'On hand', value: String(row.stockOnHand) },
              { label: 'Available', value: String(row.stockAvailable ?? row.stockOnHand) },
            ],
            actions: (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  label="Adjust"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditStockRow(row)}
                />
                <RowAction
                  action={`/variants/${row.id}/delete`}
                  label="Delete"
                  variant="ghost"
                  confirmText="Delete this variant?"
                />
              </div>
            ),
          })}
          columns={[
            col.text('productTitle', 'Product', 170),
            col.text('sku', 'SKU', 130),
            col.text('title', 'Variant', 150),
            col.money('retailPrice', 'Retail', 'currencyCode'),
            col.money('costPrice', 'Cost', 'currencyCode'),
            col.text('stockOnHand', 'On hand', 80),
            col.text('stockAvailable', 'Available', 80),
            col.action('Actions', (row) => (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  label="Adjust"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditStockRow(row)}
                />
                <RowAction
                  action={`/variants/${row.id}/delete`}
                  label="Delete"
                  variant="ghost"
                  confirmText="Delete this variant?"
                />
              </div>
            )),
          ]}
        />
      </PageSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageSection title="Brands" description="Create, edit, or remove catalog brands.">
          <ResponsiveDataView
            rows={brands}
            searchKeys={['name', 'slug']}
            createLabel="+ Create Brand"
            onCreateClick={() => setCreateBrandOpen(true)}
            toCard={(row) => ({
              title: String(row.name),
              metrics: [
                { label: 'Slug', value: String(row.slug) },
                { label: 'Active', value: String(row.isActive ?? true) },
              ],
              actions: (
                <div className="flex items-center gap-2">
                  <Button
                    label="Edit"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditBrandRow(row)}
                  />
                  <RowAction
                    action={`/brands/${row.id}/delete`}
                    label="Delete"
                    variant="ghost"
                    confirmText="Delete brand?"
                  />
                </div>
              ),
            })}
            columns={[
              col.text('name', 'Name', 130),
              col.text('slug', 'Slug', 110),
              col.action('Actions', (row) => (
                <div className="flex items-center gap-1.5">
                  <Button
                    label="Edit"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditBrandRow(row)}
                  />
                  <RowAction
                    action={`/brands/${row.id}/delete`}
                    label="Delete"
                    variant="ghost"
                    confirmText="Delete brand?"
                  />
                </div>
              )),
            ]}
          />
        </PageSection>

        <PageSection
          title="Categories"
          description="Product taxonomy with optional parent categories."
        >
          <ResponsiveDataView
            rows={categories}
            searchKeys={['name', 'slug']}
            createLabel="+ Create Category"
            onCreateClick={() => setCreateCategoryOpen(true)}
            toCard={(row) => ({
              title: String(row.name),
              metrics: [{ label: 'Slug', value: String(row.slug) }],
              actions: (
                <div className="flex items-center gap-2">
                  <Button
                    label="Edit"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditCategoryRow(row)}
                  />
                  <RowAction
                    action={`/categories/${row.id}/delete`}
                    label="Delete"
                    variant="ghost"
                    confirmText="Delete category?"
                  />
                </div>
              ),
            })}
            columns={[
              col.text('name', 'Name', 130),
              col.text('slug', 'Slug', 110),
              col.action('Actions', (row) => (
                <div className="flex items-center gap-1.5">
                  <Button
                    label="Edit"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditCategoryRow(row)}
                  />
                  <RowAction
                    action={`/categories/${row.id}/delete`}
                    label="Delete"
                    variant="ghost"
                    confirmText="Delete category?"
                  />
                </div>
              )),
            ]}
          />
        </PageSection>
      </div>

      <PageSection
        title="Channel Listings"
        description="Per-channel listing overrides — publish variants to marketplace channels."
      >
        <ResponsiveDataView
          rows={flatListings}
          searchKeys={['externalListingId', 'externalSku', 'listingStatus']}
          filterKey="listingStatus"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          emptyTitle="No channel listings yet"
          emptyDescription="Publish a variant to a marketplace channel to see it here."
          createLabel="+ Publish Listing"
          onCreateClick={() => setCreateListingOpen(true)}
          toCard={(row) => ({
            title: String(row.externalListingId ?? row.externalSku ?? '—'),
            statusBadge: {
              label: String(row.listingStatus ?? 'active'),
              variant: STATUS_TONES[String(row.listingStatus ?? 'active')] ?? 'neutral',
            },
            metrics: [
              { label: 'Channel SKU', value: String(row.externalSku ?? '—') },
              {
                label: 'Price',
                value: money(String(row.currencyCode ?? 'USD'), row.listedPrice),
              },
              { label: 'Qty', value: String(row.allocatedQuantity ?? '—') },
              {
                label: 'Product',
                value: String((row.product as any)?.title ?? row.productTitle ?? '—'),
              },
            ],
            actions: (
              <RowAction
                action={`/channel-listings/${row.id}/delete`}
                label="Remove"
                variant="ghost"
                confirmText="Remove this channel listing?"
              />
            ),
          })}
          columns={[
            col.text('externalListingId', 'Listing ID', 160),
            col.text('externalSku', 'Channel SKU', 130),
            col.money('listedPrice', 'Price', 'currencyCode'),
            col.text('allocatedQuantity', 'Qty', 70),
            col.badge('listingStatus', 'Status', STATUS_TONES),
            col.badge('syncStatus', 'Sync', {
              synced: 'success',
              pending: 'warning',
              failed: 'error',
            }),
            col.action('Actions', (row) => (
              <RowAction
                action={`/channel-listings/${row.id}/delete`}
                label="Remove"
                variant="ghost"
                confirmText="Remove this channel listing?"
              />
            )),
          ]}
        />
      </PageSection>
    </div>
  )
}
