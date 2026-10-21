import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Heading } from '@astryxdesign/core/Heading'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Grid } from '@astryxdesign/core/Grid'
import { Divider } from '@astryxdesign/core/Divider'

import {
  PageSection,
  DataTable,
  SmartForm,
  RowAction,
  StatusForm,
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
  const [editStockRow, setEditStockRow] = useState<Row | null>(null)
  const [createBrandOpen, setCreateBrandOpen] = useState(false)
  const [editBrandRow, setEditBrandRow] = useState<Row | null>(null)
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [editCategoryRow, setEditCategoryRow] = useState<Row | null>(null)
  const [createListingOpen, setCreateListingOpen] = useState(false)

  const variantRows: Row[] = []
  for (const p of products) {
    for (const v of (p.variants as Row[]) ?? []) {
      variantRows.push({ ...v, productTitle: p.title, productId: p.id })
    }
  }

  // Flatten channel listings from prop or from nested variants
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
    <Stack gap={4}>
      <Card padding={4}>
        <Stack direction="horizontal" gap={3} wrap="wrap" align="center">
          <Button
            label="+ Create Product"
            variant="primary"
            onClick={() => setCreateProductOpen(true)}
          />
          <Button label="+ Brand" variant="secondary" onClick={() => setCreateBrandOpen(true)} />
          <Button
            label="+ Category"
            variant="secondary"
            onClick={() => setCreateCategoryOpen(true)}
          />
          <Button
            label="+ Channel Listing"
            variant="ghost"
            onClick={() => setCreateListingOpen(true)}
          />
          <Text type="supporting" as="div">
            {products.length} products · {variantRows.length} variants · {flatListings.length}{' '}
            listings
          </Text>
        </Stack>
      </Card>
      {savedViews && savedViews.length > 0 ? <SavedViewsBar views={savedViews} /> : null}

      {/* Create Product Modal */}
      <FormModal
        isOpen={createProductOpen}
        onOpenChange={setCreateProductOpen}
        title="Create product"
        subtitle="A product supports 0..N variants. Simple products work without variation dimensions."
        submitLabel="Create product"
        action="/products"
        fields={[
          { name: 'title', label: 'Title', required: true },
          { name: 'sku', label: 'SKU prefix', required: true },
          { name: 'skuPrefix', label: 'SKU Prefix (stock label)' },
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
          { name: 'manufacturingCost', label: 'Mfg cost', kind: 'number' },
          { name: 'packagingCost', label: 'Packaging', kind: 'number' },
          { name: 'stockOnHand', label: 'Stock on hand', kind: 'number' },
          {
            name: 'variationDimensions',
            label: 'Variation dims (comma sep)',
            placeholder: 'size,color',
          },
          {
            name: 'hasVariants',
            label: 'Has variants',
            kind: 'select',
            default: 'false',
            options: [
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ],
          },
        ]}
      />

      {/* Edit Product Modal */}
      <FormModal
        isOpen={!!editProductRow}
        onOpenChange={(o) => {
          if (!o) setEditProductRow(null)
        }}
        title={`Edit product: ${editProductRow?.title ?? ''}`}
        submitLabel="Save product"
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
          { name: 'title', label: 'Title' },
          { name: 'skuPrefix', label: 'SKU Prefix' },
          {
            name: 'brandId',
            label: 'Brand',
            kind: 'select',
            options: [
              { value: '', label: '— unchanged —' },
              ...brands.map((b) => ({ value: String(b.id), label: String(b.name) })),
            ],
          },
          {
            name: 'categoryId',
            label: 'Category',
            kind: 'select',
            options: [
              { value: '', label: '— unchanged —' },
              ...categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
            ],
          },
          { name: 'description', label: 'Description', kind: 'textarea' },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            options: PRODUCT_STATUS.map((s) => ({ value: s, label: s })),
          },
        ]}
      />

      {/* Add Variant Modal */}
      <FormModal
        isOpen={!!addVariantFor || (createProductOpen === false && !!addVariantFor)}
        onOpenChange={(o) => {
          if (!o) setAddVariantFor(null)
        }}
        title={addVariantFor ? `Add variant to ${addVariantFor.title}` : 'Add variant'}
        subtitle="Multi-dimensional variants with normalized attributes."
        submitLabel="Create variant"
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
          { name: 'stockOnHand', label: 'Stock', kind: 'number' },
          { name: 'attributeName', label: 'Attribute name', placeholder: 'color' },
          { name: 'attributeValue', label: 'Attribute value', placeholder: 'navy' },
        ]}
      />

      {/* Generic Add Variant (product selector) */}
      <FormModal
        isOpen={false}
        onOpenChange={() => {}}
        title="Add variant"
        submitLabel="Create variant"
        action="/products/placeholder/variants"
        fields={[]}
      />

      {/* Adjust Stock Modal */}
      <FormModal
        isOpen={!!editStockRow}
        onOpenChange={(o) => {
          if (!o) setEditStockRow(null)
        }}
        title={`Adjust stock & price — ${editStockRow?.sku ?? ''}`}
        subtitle={`Current stock: ${editStockRow?.stockOnHand ?? 0} · Price: ${editStockRow?.retailPrice ?? 0}`}
        submitLabel="Update"
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
        title="Create brand"
        submitLabel="Create brand"
        action="/brands"
        fields={[
          { name: 'name', label: 'Brand name', required: true },
          { name: 'slug', label: 'Slug' },
          { name: 'websiteUrl', label: 'Website URL' },
        ]}
      />

      {/* Edit Brand Modal */}
      <FormModal
        isOpen={!!editBrandRow}
        onOpenChange={(o) => {
          if (!o) setEditBrandRow(null)
        }}
        title={`Edit brand: ${editBrandRow?.name ?? ''}`}
        submitLabel="Save brand"
        action={editBrandRow ? `/brands/${editBrandRow.id}` : '/brands/placeholder'}
        initialValues={
          editBrandRow
            ? {
                name: String(editBrandRow.name ?? ''),
                slug: String(editBrandRow.slug ?? ''),
                websiteUrl: String(editBrandRow.websiteUrl ?? ''),
              }
            : undefined
        }
        fields={[
          { name: 'name', label: 'Brand name' },
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
        title="Create category"
        submitLabel="Create category"
        action="/categories"
        fields={[
          { name: 'name', label: 'Category name', required: true },
          { name: 'slug', label: 'Slug' },
          {
            name: 'parentCategoryId',
            label: 'Parent',
            kind: 'select',
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
        title={`Edit category: ${editCategoryRow?.name ?? ''}`}
        submitLabel="Save category"
        action={editCategoryRow ? `/categories/${editCategoryRow.id}` : '/categories/placeholder'}
        initialValues={
          editCategoryRow
            ? { name: String(editCategoryRow.name ?? ''), slug: String(editCategoryRow.slug ?? '') }
            : undefined
        }
        fields={[
          { name: 'name', label: 'Category name' },
          { name: 'slug', label: 'Slug' },
          { name: 'description', label: 'Description', kind: 'textarea' },
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

      {/* Create Channel Listing Modal */}
      <FormModal
        isOpen={createListingOpen}
        onOpenChange={setCreateListingOpen}
        title="Publish channel listing"
        subtitle="Per-channel listing overrides with price and allocated quantity."
        submitLabel="Create listing"
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
            label: 'Variant',
            kind: 'select',
            required: true,
            options: variantRows.map((v) => ({
              value: String(v.id),
              label: `${v.productTitle} · ${v.sku}`,
            })),
          },
          { name: 'externalListingId', label: 'External listing ID', required: true },
          { name: 'channelSku', label: 'Channel SKU' },
          { name: 'listedPrice', label: 'Listed price', kind: 'number' },
          { name: 'allocatedQuantity', label: 'Allocated qty', kind: 'number', default: '0' },
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
              <Stack direction="horizontal" gap={2} wrap="wrap">
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
              </Stack>
            ),
          })}
          columns={[
            col.text('title', 'Title', 200),
            col.text('skuPrefix', 'SKU Prefix', 100),
            col.text('slug', 'Slug', 120),
            col.badge('status', 'Status', STATUS_TONES),
            col.text('hasVariants', 'Variants', 80),
            col.action('Actions', (row) => (
              <Stack direction="horizontal" gap={2} wrap="wrap">
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
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Variants & stock"
        description="Adjust stock levels or remove a variant — supports any quantity, not just fixed presets."
      >
        <ResponsiveDataView
          rows={variantRows}
          searchKeys={['sku', 'title', 'productTitle']}
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
              <Stack direction="horizontal" gap={2} wrap="wrap">
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
              </Stack>
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
              <Stack direction="horizontal" gap={2} wrap="wrap">
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
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <Grid columns={{ minWidth: 360, max: 2 }} gap={4}>
        <PageSection title="Brands" description="Create, edit, or remove brands.">
          <Stack gap={3}>
            <Button
              label="+ Create Brand"
              variant="primary"
              size="sm"
              onClick={() => setCreateBrandOpen(true)}
            />
            <ResponsiveDataView
              rows={brands}
              searchKeys={['name', 'slug']}
              toCard={(row) => ({
                title: String(row.name),
                metrics: [
                  { label: 'Slug', value: String(row.slug) },
                  { label: 'Active', value: String(row.isActive ?? true) },
                ],
                actions: (
                  <Stack direction="horizontal" gap={2}>
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
                  </Stack>
                ),
              })}
              columns={[
                col.text('name', 'Name', 130),
                col.text('slug', 'Slug', 110),
                col.action('Actions', (row) => (
                  <Stack direction="horizontal" gap={2}>
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
                  </Stack>
                )),
              ]}
            />
          </Stack>
        </PageSection>

        <PageSection
          title="Categories"
          description="Product taxonomy with optional parent categories."
        >
          <Stack gap={3}>
            <Button
              label="+ Create Category"
              variant="primary"
              size="sm"
              onClick={() => setCreateCategoryOpen(true)}
            />
            <ResponsiveDataView
              rows={categories}
              searchKeys={['name', 'slug']}
              toCard={(row) => ({
                title: String(row.name),
                metrics: [{ label: 'Slug', value: String(row.slug) }],
                actions: (
                  <Stack direction="horizontal" gap={2}>
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
                  </Stack>
                ),
              })}
              columns={[
                col.text('name', 'Name', 130),
                col.text('slug', 'Slug', 110),
                col.action('Actions', (row) => (
                  <Stack direction="horizontal" gap={2}>
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
                  </Stack>
                )),
              ]}
            />
          </Stack>
        </PageSection>
      </Grid>

      <PageSection
        title="Channel listings"
        description="Per-channel listing overrides — publish variants to marketplace channels."
      >
        <Stack gap={3}>
          <Button
            label="+ Publish Listing"
            variant="primary"
            size="sm"
            onClick={() => setCreateListingOpen(true)}
          />
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
        </Stack>
      </PageSection>
    </Stack>
  )
}
