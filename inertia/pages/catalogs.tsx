import { Head, router } from '@inertiajs/react'
import { useState, useMemo } from 'react'
import { Tags, Globe, Layers } from 'lucide-react'
import { ModulePageHeader } from '~/modules/common/module-page-header'
import { FormModal, ResponsiveDataView, PageSection, col, money, type Row } from '~/lib/ui'
import { Button } from '@astryxdesign/core/Button'
import { Stack } from '@astryxdesign/core/Stack'

type Props = {
  products: Row[]
  brands: Row[]
  categories: Row[]
  sellerAccounts: Row[]
  channelListings?: Row[]
}

export default function CatalogsPage({
  products,
  brands,
  categories,
  sellerAccounts,
  channelListings = [],
}: Props) {
  const [createBrandOpen, setCreateBrandOpen] = useState(false)
  const [editBrandRow, setEditBrandRow] = useState<Row | null>(null)
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [editCategoryRow, setEditCategoryRow] = useState<Row | null>(null)
  const [createListingOpen, setCreateListingOpen] = useState(false)

  const variantRows = useMemo(() => {
    const out: Row[] = []
    for (const p of products) {
      for (const v of (p.variants as Row[]) ?? []) {
        out.push({ ...v, productTitle: p.title })
      }
    }
    return out
  }, [products])

  return (
    <>
      <Head title="Catalogs, Brands & Channel Listings" />
      <div className="space-y-6">
        <ModulePageHeader
          title="Catalogs, Taxonomy & Channel Listings"
          description="Manage registered brands, hierarchical product categories, and marketplace channel listings."
          icon={Tags}
          actions={
            <Stack direction="horizontal" gap={2} wrap="wrap">
              <Button label="+ New Brand" variant="primary" onClick={() => setCreateBrandOpen(true)} />
              <Button label="+ New Category" variant="secondary" onClick={() => setCreateCategoryOpen(true)} />
              <Button label="+ Publish Listing" variant="secondary" onClick={() => setCreateListingOpen(true)} />
            </Stack>
          }
        />

        {/* Modals */}
        <FormModal
          isOpen={createBrandOpen}
          onOpenChange={setCreateBrandOpen}
          title="Create brand"
          submitLabel="Create brand"
          action="/brands"
          fields={[
            { name: 'name', label: 'Brand name', required: true },
            { name: 'slug', label: 'Slug (optional)' },
            { name: 'websiteUrl', label: 'Website URL' },
          ]}
        />

        <FormModal
          isOpen={!!editBrandRow}
          onOpenChange={(o) => {
            if (!o) setEditBrandRow(null)
          }}
          title={`Edit brand: ${String(editBrandRow?.name ?? '')}`}
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
            { name: 'name', label: 'Brand name', required: true },
            { name: 'slug', label: 'Slug' },
            { name: 'websiteUrl', label: 'Website URL' },
          ]}
        />

        <FormModal
          isOpen={createCategoryOpen}
          onOpenChange={setCreateCategoryOpen}
          title="Create product category"
          submitLabel="Create category"
          action="/categories"
          fields={[
            { name: 'name', label: 'Category name', required: true },
            { name: 'slug', label: 'Slug (optional)' },
            {
              name: 'parentCategoryId',
              label: 'Parent category',
              kind: 'select',
              options: categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
            },
          ]}
        />

        <FormModal
          isOpen={!!editCategoryRow}
          onOpenChange={(o) => {
            if (!o) setEditCategoryRow(null)
          }}
          title={`Edit category: ${String(editCategoryRow?.name ?? '')}`}
          submitLabel="Save category"
          action={editCategoryRow ? `/categories/${editCategoryRow.id}` : '/categories/placeholder'}
          initialValues={
            editCategoryRow
              ? {
                name: String(editCategoryRow.name ?? ''),
                slug: String(editCategoryRow.slug ?? ''),
              }
              : undefined
          }
          fields={[
            { name: 'name', label: 'Category name', required: true },
            { name: 'slug', label: 'Slug' },
          ]}
        />

        <FormModal
          isOpen={createListingOpen}
          onOpenChange={setCreateListingOpen}
          title="Publish Marketplace Channel Listing"
          submitLabel="Publish listing"
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
              label: 'Product variant SKU',
              kind: 'select',
              required: true,
              options: variantRows.map((v) => ({
                value: String(v.id),
                label: `${v.productTitle} · ${v.sku}`,
              })),
            },
            { name: 'externalListingId', label: 'External Listing ID / ASIN', required: true },
            { name: 'listedPrice', label: 'Listed price', kind: 'number', required: true },
            { name: 'allocatedQuantity', label: 'Allocated qty', kind: 'number', default: '25' },
          ]}
        />

        <PageSection
          title="Marketplace Channel Listings"
          description="Published SKU listings across connected Amazon, eBay, Etsy, and Direct storefronts."
        >
          <ResponsiveDataView
            rows={channelListings}
            searchKeys={['externalListingId', 'externalSku', 'listingStatus']}
            createLabel="+ Publish Listing"
            onCreateClick={() => setCreateListingOpen(true)}
            toCard={(row) => ({
              title: String(row.externalListingId || row.externalSku),
              subtitle: `SKU: ${String(row.externalSku ?? '—')}`,
              statusBadge: {
                label: String(row.listingStatus ?? 'active'),
                variant: 'success',
              },
              metrics: [
                { label: 'Listed Price', value: money(String(row.currencyCode || 'USD'), row.listedPrice) },
                { label: 'Allocated Qty', value: String(row.allocatedQuantity ?? 0) },
                { label: 'Sync Status', value: String(row.syncStatus ?? 'synced') },
              ],
              actions: (
                <Button
                  label="Remove"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Remove this channel listing?')) {
                      router.post(`/channel-listings/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
              ),
            })}
            columns={[
              col.text('externalListingId', 'Listing ID', 160),
              col.text('externalSku', 'Channel SKU', 150),
              col.money('listedPrice', 'Listed Price', 'currencyCode'),
              col.text('allocatedQuantity', 'Allocated Qty', 110),
              col.badge('syncStatus', 'Sync', { synced: 'success', pending: 'warning' }),
              col.action('Actions', (row) => (
                <Button
                  label="Remove"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Remove this channel listing?')) {
                      router.post(`/channel-listings/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
              )),
            ]}
          />
        </PageSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PageSection title="Brands" description="Registered brand entities in your catalog.">
            <ResponsiveDataView
              rows={brands}
              searchKeys={['name', 'slug']}
              createLabel="+ New Brand"
              onCreateClick={() => setCreateBrandOpen(true)}
              toCard={(row) => ({
                title: String(row.name),
                subtitle: String(row.slug),
                metrics: [{ label: 'Website', value: String(row.websiteUrl || '—') }],
                actions: (
                  <Stack direction="horizontal" gap={2}>
                    <Button label="Edit" variant="secondary" size="sm" onClick={() => setEditBrandRow(row)} />
                    <Button
                      label="Delete"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete brand "${row.name}"?`)) {
                          router.post(`/brands/${row.id}/delete`, {}, { preserveScroll: true })
                        }
                      }}
                    />
                  </Stack>
                ),
              })}
              columns={[
                col.text('name', 'Name', 150),
                col.text('slug', 'Slug', 140),
                col.action('Actions', (row) => (
                  <Stack direction="horizontal" gap={2}>
                    <Button label="Edit" variant="secondary" size="sm" onClick={() => setEditBrandRow(row)} />
                    <Button
                      label="Delete"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete brand "${row.name}"?`)) {
                          router.post(`/brands/${row.id}/delete`, {}, { preserveScroll: true })
                        }
                      }}
                    />
                  </Stack>
                )),
              ]}
            />
          </PageSection>

          <PageSection title="Categories" description="Product taxonomy categories.">
            <ResponsiveDataView
              rows={categories}
              searchKeys={['name', 'slug', 'taxonomyPath']}
              createLabel="+ New Category"
              onCreateClick={() => setCreateCategoryOpen(true)}
              toCard={(row) => ({
                title: String(row.name),
                subtitle: String(row.taxonomyPath || row.slug),
                metrics: [{ label: 'Slug', value: String(row.slug) }],
                actions: (
                  <Stack direction="horizontal" gap={2}>
                    <Button label="Edit" variant="secondary" size="sm" onClick={() => setEditCategoryRow(row)} />
                    <Button
                      label="Delete"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete category "${row.name}"?`)) {
                          router.post(`/categories/${row.id}/delete`, {}, { preserveScroll: true })
                        }
                      }}
                    />
                  </Stack>
                ),
              })}
              columns={[
                col.text('name', 'Name', 150),
                col.text('slug', 'Slug', 140),
                col.action('Actions', (row) => (
                  <Stack direction="horizontal" gap={2}>
                    <Button label="Edit" variant="secondary" size="sm" onClick={() => setEditCategoryRow(row)} />
                    <Button
                      label="Delete"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete category "${row.name}"?`)) {
                          router.post(`/categories/${row.id}/delete`, {}, { preserveScroll: true })
                        }
                      }}
                    />
                  </Stack>
                )),
              ]}
            />
          </PageSection>
        </div>
      </div>
    </>
  )
}
