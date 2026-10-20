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
  type Row,
} from '~/lib/ui'

type Props = {
  products: Row[]
  brands: Row[]
  categories: Row[]
  salesChannels: Row[]
  sellerAccounts: Row[]
  orders: Row[]
  orderLineItems: Row[]
  financeCategories: Row[]
}

Products.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

const PRODUCT_STATUS = ['draft', 'active', 'archived', 'discontinued']

export default function Products({ products, brands, categories, sellerAccounts }: Props) {
  const variantRows: Row[] = []
  for (const p of products) {
    for (const v of (p.variants as Row[]) ?? []) {
      variantRows.push({ ...v, productTitle: p.title })
    }
  }

  return (
    <Stack gap={4}>
      <PageSection
        title="Create product"
        description="A product supports 0..N variants. Simple products work without any variation dimensions."
      >
        <SmartForm
          action="/products"
          submitLabel="Create product"
          fields={[
            { name: 'title', label: 'Title', required: true, width: 240 },
            { name: 'sku', label: 'SKU prefix', required: true, width: 150 },
            {
              name: 'brandId',
              label: 'Brand',
              kind: 'select',
              width: 170,
              options: brands.map((b) => ({ value: String(b.id), label: String(b.name) })),
            },
            {
              name: 'categoryId',
              label: 'Category',
              kind: 'select',
              width: 170,
              options: categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
            },
            {
              name: 'retailPrice',
              label: 'Retail price',
              kind: 'number',
              required: true,
              width: 120,
            },
            { name: 'costPrice', label: 'Cost price', kind: 'number', width: 110 },
            { name: 'manufacturingCost', label: 'Mfg cost', kind: 'number', width: 110 },
            { name: 'packagingCost', label: 'Packaging', kind: 'number', width: 110 },
            { name: 'stockOnHand', label: 'Stock on hand', kind: 'number', width: 120 },
            {
              name: 'hasVariants',
              label: 'Has variants',
              kind: 'select',
              width: 120,
              options: [
                { value: 'false', label: 'Simple product' },
                { value: 'true', label: 'With variants' },
              ],
            },
            {
              name: 'variationDimensions',
              label: 'Variation dimensions (comma separated)',
              width: 220,
              placeholder: 'size,color',
            },
            { name: 'description', label: 'Description', kind: 'textarea', width: 320 },
          ]}
        />
      </PageSection>

      <PageSection
        title="Products"
        description="Update catalog fields, change status, or delete a product."
      >
        <DataTable
          rows={products}
          empty="No products yet."
          columns={[
            col.text('title', 'Title', 200),
            col.text('skuPrefix', 'SKU prefix', 110),
            col.badge('status', 'Status', STATUS_TONES),
            col.text('hasVariants', 'Variants', 80),
            col.action('Actions', (row) => (
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <StatusForm
                  action={`/products/${row.id}`}
                  fieldName="status"
                  label="Status"
                  current={String(row.status ?? 'draft')}
                  options={PRODUCT_STATUS.map((s) => ({ value: s, label: s }))}
                />
                <RowAction
                  action={`/products/${row.id}/delete`}
                  label="Delete"
                  variant="ghost"
                  confirmText="Delete this product?"
                />
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Update product details"
        description="Pick a product and change brand, category, description or status in one save."
      >
        <SmartForm
          action="/products"
          actionFor={(v) => `/products/${v.id}`}
          submitLabel="Update product"
          fields={[
            {
              name: 'id',
              label: 'Product',
              kind: 'select',
              required: true,
              width: 240,
              options: products.map((p) => ({ value: String(p.id), label: String(p.title) })),
            },
            { name: 'title', label: 'Title', width: 220 },
            {
              name: 'brandId',
              label: 'Brand',
              kind: 'select',
              width: 160,
              options: [
                { value: '', label: '— unchanged —' },
                ...brands.map((b) => ({ value: String(b.id), label: String(b.name) })),
              ],
            },
            {
              name: 'categoryId',
              label: 'Category',
              kind: 'select',
              width: 160,
              options: [
                { value: '', label: '— unchanged —' },
                ...categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
              ],
            },
            { name: 'description', label: 'Description', kind: 'textarea', width: 300 },
          ]}
        />
      </PageSection>

      <PageSection
        title="Add variant"
        description="Multi-dimensional variants with normalized attributes (attribute_name / attribute_value)."
      >
        <SmartForm
          action="/products/ID/variants"
          actionFor={(v) => `/products/${v.id}/variants`}
          submitLabel="Create variant"
          fields={[
            {
              name: 'id',
              label: 'Product',
              kind: 'select',
              required: true,
              width: 230,
              options: products.map((p) => ({ value: String(p.id), label: String(p.title) })),
            },
            { name: 'sku', label: 'Variant SKU', required: true, width: 160 },
            { name: 'title', label: 'Variant title', required: true, width: 200 },
            {
              name: 'retailPrice',
              label: 'Retail price',
              kind: 'number',
              required: true,
              width: 110,
            },
            { name: 'costPrice', label: 'Cost price', kind: 'number', width: 110 },
            { name: 'stockOnHand', label: 'Stock', kind: 'number', width: 90 },
            { name: 'attributeName', label: 'Attribute name', width: 140, placeholder: 'color' },
            { name: 'attributeValue', label: 'Attribute value', width: 140, placeholder: 'navy' },
          ]}
        />
      </PageSection>

      <PageSection title="Variants & stock" description="Adjust stock levels or remove a variant.">
        <DataTable
          rows={variantRows}
          empty="No variants defined (simple products don't need any)."
          columns={[
            col.text('productTitle', 'Product', 170),
            col.text('sku', 'SKU', 130),
            col.text('title', 'Variant', 150),
            col.money('retailPrice', 'Retail', 'currencyCode'),
            col.money('costPrice', 'Cost', 'currencyCode'),
            col.text('stockOnHand', 'On hand', 80),
            col.text('stockAvailable', 'Available', 80),
            col.action('Stock / delete', (row) => (
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <StatusForm
                  action={`/variants/${row.id}/stock`}
                  fieldName="stockOnHand"
                  label="Set stock on hand"
                  current={String(row.stockOnHand ?? 0)}
                  options={[0, 5, 10, 25, 50, 100, 250, 500].map((n) => ({
                    value: String(n),
                    label: String(n),
                  }))}
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 16,
        }}
      >
        <PageSection title="Brands" description="Create, rename, or remove brands.">
          <SmartForm
            action="/brands"
            submitLabel="Create brand"
            fields={[
              { name: 'name', label: 'Brand name', required: true, width: 180 },
              { name: 'slug', label: 'Slug', width: 150 },
            ]}
          />
          <div style={{ height: 12 }} />
          <DataTable
            rows={brands}
            empty="No brands yet."
            columns={[
              col.text('name', 'Name', 130),
              col.text('slug', 'Slug', 110),
              col.action('Actions', (row) => (
                <Stack direction="horizontal" gap={2} wrap="wrap">
                  <RowAction
                    action={`/brands/${row.id}`}
                    label="Rename to 'updated'"
                    fields={[{ name: 'name', value: `${row.name}` }]}
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
          <div style={{ height: 12 }} />
          <SmartForm
            action="/brands"
            actionFor={(v) => `/brands/${v.id}`}
            submitLabel="Update brand"
            compact
            fields={[
              {
                name: 'id',
                label: 'Brand',
                kind: 'select',
                required: true,
                options: brands.map((b) => ({ value: String(b.id), label: String(b.name) })),
              },
              { name: 'name', label: 'New name', width: '100%' },
            ]}
          />
        </PageSection>

        <PageSection
          title="Categories"
          description="Product taxonomy with optional parent categories."
        >
          <SmartForm
            action="/categories"
            submitLabel="Create category"
            fields={[
              { name: 'name', label: 'Category name', required: true, width: 180 },
              { name: 'slug', label: 'Slug', width: 150 },
              {
                name: 'parentCategoryId',
                label: 'Parent',
                kind: 'select',
                width: 160,
                options: categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
              },
            ]}
          />
          <div style={{ height: 12 }} />
          <DataTable
            rows={categories}
            empty="No categories yet."
            columns={[
              col.text('name', 'Name', 130),
              col.text('slug', 'Slug', 110),
              col.action('Delete', (row) => (
                <RowAction
                  action={`/categories/${row.id}/delete`}
                  label="Delete"
                  variant="ghost"
                  confirmText="Delete category?"
                />
              )),
            ]}
          />
          <div style={{ height: 12 }} />
          <SmartForm
            action="/categories"
            actionFor={(v) => `/categories/${v.id}`}
            submitLabel="Update category"
            compact
            fields={[
              {
                name: 'id',
                label: 'Category',
                kind: 'select',
                required: true,
                options: categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
              },
              { name: 'name', label: 'New name', width: '100%' },
            ]}
          />
        </PageSection>
      </div>

      <PageSection
        title="Channel listings"
        description="Publish variants to marketplace channels with per-channel price and allocated quantity."
      >
        <SmartForm
          action="/channel-listings"
          submitLabel="Create listing"
          fields={[
            {
              name: 'sellerAccountId',
              label: 'Seller account',
              kind: 'select',
              required: true,
              width: 200,
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
              width: 200,
              options: variantRows.map((v) => ({
                value: String(v.id),
                label: `${v.productTitle} · ${v.sku}`,
              })),
            },
            { name: 'externalListingId', label: 'External listing ID', required: true, width: 170 },
            { name: 'listedPrice', label: 'Listed price', kind: 'number', width: 110 },
            {
              name: 'allocatedQuantity',
              label: 'Allocated qty',
              kind: 'number',
              default: '0',
              width: 110,
            },
          ]}
        />
      </PageSection>
    </Stack>
  )
}
