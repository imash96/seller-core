import { router } from '@inertiajs/react'
import {
  PageHeader,
  PageSection,
  TopStatusBar,
  AppButton,
  AppInput,
  AppSelect,
  SlideOverDrawer,
  ThumbnailStack,
  RowAction,
  FormModal,
  SavedViewsBar,
  Badge,
  MonoBadge,
  STATUS_TONES,
  money,
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import {
  Box,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ExternalLink,
  Plus,
  Edit3,
  Eye,
  Tags,
  Building2,
  RefreshCw,
  Search,
} from 'lucide-react'

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
const PLATFORMS = [
  { id: 'medusa', label: 'Medusa Website (/admin/products)' },
  { id: 'amazon', label: 'Amazon SP-API (Listings Items)' },
  { id: 'ebay', label: 'eBay Sell Inventory API' },
  { id: 'etsy', label: 'Etsy Open API v3' },
] as const

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

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const [inspectProduct, setInspectProduct] = useState<Row | null>(null)

  const [convertModalProduct, setConvertModalProduct] = useState<Row | null>(null)
  const [selectedBrandId, setSelectedBrandId] = useState<string>(() =>
    brands[0]?.id ? String(brands[0].id) : ''
  )
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'medusa',
    'amazon',
    'ebay',
    'etsy',
  ])
  const [selectedSellerAccountId, setSelectedSellerAccountId] = useState<string>(() =>
    sellerAccounts[0]?.id ? String(sellerAccounts[0].id) : ''
  )
  const [priceMultiplier, setPriceMultiplier] = useState<string>('1.0')
  const [convertingListing, setConvertingListing] = useState(false)
  const [syncingCategories, setSyncingCategories] = useState(false)
  const [banner, setBanner] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)

  const variantRows: Row[] = useMemo(() => {
    const out: Row[] = []
    for (const p of products) {
      for (const v of (p.variants as Row[]) ?? []) {
        out.push({
          ...v,
          productTitle: p.title,
          productId: p.id,
          brandName: (p.brand as any)?.name ?? 'Brand-Agnostic',
          categoryName: (p.category as any)?.name ?? '—',
        })
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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter !== 'all' && String(p.status) !== statusFilter) return false
      if (brandFilter !== 'all') {
        if (brandFilter === 'unbranded' && p.brandId) return false
        if (brandFilter !== 'unbranded' && String(p.brandId ?? '') !== brandFilter) return false
      }
      if (categoryFilter !== 'all' && String(p.categoryId ?? '') !== categoryFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const hay = [
          p.title,
          p.subTitle,
          p.skuPrefix,
          p.slug,
          (p.brand as any)?.name,
          (p.category as any)?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [products, statusFilter, brandFilter, categoryFilter, searchQuery])

  const getCsrfToken = () =>
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1] ?? ''

  const openConvertToListingModal = (product: Row) => {
    setConvertModalProduct(product)
    if (product.brandId) {
      setSelectedBrandId(String(product.brandId))
    } else if (brands[0]?.id) {
      setSelectedBrandId(String(brands[0].id))
    }
    setSelectedPlatforms(['medusa', 'amazon', 'ebay', 'etsy'])
  }

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    )
  }

  const handleConvertProductToListings = async () => {
    if (!convertModalProduct) return
    if (!selectedBrandId) {
      setBanner({ tone: 'error', message: 'Please select a Brand to associate with the listing.' })
      return
    }
    if (selectedPlatforms.length === 0) {
      setBanner({ tone: 'error', message: 'Please select at least one target e-commerce platform.' })
      return
    }
    setConvertingListing(true)
    setBanner(null)
    try {
      const res = await fetch('/catalogs/generate-listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': decodeURIComponent(getCsrfToken()),
        },
        body: JSON.stringify({
          brandId: selectedBrandId,
          platforms: selectedPlatforms,
          platform: selectedPlatforms[0],
          productIds: [String(convertModalProduct.id)],
          sellerAccountId: selectedSellerAccountId || undefined,
          priceMultiplier: Number(priceMultiplier) || 1.0,
        }),
      })
      const data = await res.json()
      if (!res.ok || (!data.ok && !data.success)) {
        setBanner({ tone: 'error', message: data.error ?? 'Failed to convert product to listings.' })
      } else {
        setBanner({
          tone: 'success',
          message: `Linked "${convertModalProduct.title}" with Brand "${data.brandName}" and generated ${data.channelListingsUpserted} platform listings across ${(data.platforms ?? selectedPlatforms).join(', ').toUpperCase()}. View & publish them in /listing!`,
        })
        setConvertModalProduct(null)
        router.reload()
      }
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Network error generating listings.',
      })
    } finally {
      setConvertingListing(false)
    }
  }

  const handleSyncMedusaCategories = async () => {
    setSyncingCategories(true)
    setBanner(null)
    try {
      const res = await fetch('/catalogs/sync-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': decodeURIComponent(getCsrfToken()),
        },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.ok || data.success) {
        setBanner({
          tone: 'success',
          message: data.message || `Synced ${data.totalCategories} Medusa product categories.`,
        })
        router.reload()
      }
    } finally {
      setSyncingCategories(false)
    }
  }

  const brandLinkedCount = products.filter((p) => Boolean(p.brandId)).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products, Variants, Brands & Categories (/products)"
        description="Click any Product Card to open its Slide-Over Detail & Variants Drawer, or click 'Convert to Listing' to link a Brand and generate multi-platform listings."
        icon={Box}
        badge={`${products.length} products · ${variantRows.length} variants · ${flatListings.length} listings`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <AppButton
              label="← Catalog (/catalog)"
              variant="secondary"
              size="sm"
              onClick={() => router.visit('/catalog')}
            />
            <AppButton
              label="Listings (/listing) →"
              variant="secondary"
              size="sm"
              onClick={() => router.visit('/listing')}
            />
            <AppButton
              label="+ Brand"
              variant="outline"
              size="sm"
              icon={Building2}
              onClick={() => setCreateBrandOpen(true)}
            />
            <AppButton
              label="+ Category"
              variant="outline"
              size="sm"
              icon={Tags}
              onClick={() => setCreateCategoryOpen(true)}
            />
            <AppButton
              label="+ Add Variant"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => setGlobalAddVariantOpen(true)}
            />
            <AppButton
              label="+ Create Product"
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setCreateProductOpen(true)}
            />
          </div>
        }
      />

      {/* Top Interactive Status Bar */}
      <TopStatusBar
        columns={4}
        items={[
          {
            label: 'Parent Products',
            value: String(products.length),
            sublabel: `${brandLinkedCount} linked to Brand · ${products.length - brandLinkedCount} unbranded`,
            icon: Box,
            tone: 'primary',
            active: statusFilter === 'all' && brandFilter === 'all',
            onClick: () => {
              setStatusFilter('all')
              setBrandFilter('all')
            },
          },
          {
            label: 'Sellable Variant SKUs',
            value: String(variantRows.length),
            sublabel: 'Color × Size Cartesian SKUs',
            icon: Layers,
            tone: 'info',
          },
          {
            label: 'Active Brands',
            value: String(brands.length),
            sublabel: 'Click to filter unbranded products',
            icon: Building2,
            tone: 'warning',
            active: brandFilter === 'unbranded',
            onClick: () =>
              setBrandFilter((prev) => (prev === 'unbranded' ? 'all' : 'unbranded')),
          },
          {
            label: 'Medusa Categories',
            value: String(categories.length),
            sublabel: 'Hierarchical /store/product-categories',
            icon: Tags,
            tone: 'success',
          },
        ]}
      />

      {savedViews && savedViews.length > 0 && <SavedViewsBar views={savedViews} />}

      {banner && (
        <div
          className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm ${
            banner.tone === 'success'
              ? 'border-success/40 bg-success-subtle text-foreground'
              : 'border-error/40 bg-error-subtle text-foreground'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {banner.tone === 'error' ? (
              <AlertCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-medium">{banner.message}</p>
              {banner.tone === 'success' && (
                <button
                  type="button"
                  onClick={() => router.visit('/listing')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline cursor-pointer"
                >
                  <span>Open /listing to review & publish by SKU</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
          SECTION 1: CARD-BASED PRODUCT LIST (CLICK OPENS VARIANT DRAWER)
         ===================================================================== */}
      <PageSection
        title="Generated Products (Click Any Card to Inspect Details & Variants)"
        description="Products converted from /catalog start brand-agnostic. Click any card to open the Product & Variants Drawer, or click 'Convert to Listing' to associate a Brand and generate platform listings."
        actions={
          <div className="flex items-center gap-2">
            <AppButton
              label="+ Add Variant"
              variant="secondary"
              size="xs"
              icon={Plus}
              onClick={() => setGlobalAddVariantOpen(true)}
            />
            <AppButton
              label="+ Create Product"
              variant="primary"
              size="xs"
              icon={Plus}
              onClick={() => setCreateProductOpen(true)}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-card-border bg-muted/25 p-3.5">
            <AppInput
              label="Search Products"
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Title, SKU prefix, brand, category..."
            />

            <AppSelect
              label="Product Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
                { value: 'discontinued', label: 'Discontinued' },
              ]}
            />

            <AppSelect
              label="Brand Filter"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Brands' },
                { value: 'unbranded', label: 'Brand-Agnostic (Unlinked)' },
                ...brands.map((b) => ({ value: String(b.id), label: String(b.name) })),
              ]}
            />

            <AppSelect
              label="Medusa Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
              ]}
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
              <p className="text-sm font-bold text-foreground">
                No products match your active filters.
              </p>
              <div className="flex items-center justify-center gap-2">
                <AppButton
                  label="Convert from /catalog"
                  variant="secondary"
                  size="sm"
                  onClick={() => router.visit('/catalog')}
                />
                <AppButton
                  label="+ Create Product"
                  variant="primary"
                  size="sm"
                  onClick={() => setCreateProductOpen(true)}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const pVariants = (product.variants as Row[]) ?? []
                const pImages = Array.isArray(product.images) ? product.images : []
                const thumbItems =
                  pVariants.length > 0
                    ? pVariants.map((v, i) => ({
                        imageUrl: String(pImages[i % Math.max(1, pImages.length)] ?? ''),
                        sku: String(v.sku ?? ''),
                        title: String(v.title ?? product.title),
                      }))
                    : [
                        {
                          imageUrl: String(pImages[0] ?? ''),
                          sku: String(product.skuPrefix ?? 'PROD'),
                          title: String(product.title),
                        },
                      ]

                const prices = pVariants
                  .map((v) => Number(v.retailPrice ?? 0))
                  .filter((n) => n > 0)
                const minPrice = prices.length ? Math.min(...prices) : 0
                const maxPrice = prices.length ? Math.max(...prices) : 0
                const totalStock = pVariants.reduce(
                  (sum, v) => sum + Number(v.stockOnHand ?? 0),
                  0
                )
                const brandName = (product.brand as any)?.name
                const catName = (product.category as any)?.name ?? 'Uncategorized'
                const catPath = (product.category as any)?.taxonomyPath ?? ''

                return (
                  <div
                    key={String(product.id)}
                    onClick={() => setInspectProduct(product)}
                    className="group rounded-2xl border border-card-border bg-card text-card-foreground hover:border-primary/45 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex items-start gap-4">
                        <ThumbnailStack items={thumbItems} size="md" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <MonoBadge text={String(product.skuPrefix ?? product.slug ?? 'SKU')} />
                            <Badge
                              label={String(product.status ?? 'active')}
                              variant={STATUS_TONES[String(product.status)] ?? 'success'}
                            />
                          </div>
                          <h3 className="text-sm sm:text-base font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {String(product.title)}
                          </h3>
                          {product.subTitle && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {String(product.subTitle)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {brandName ? (
                          <Badge label={`Brand: ${brandName}`} variant="purple" />
                        ) : (
                          <Badge label="Brand-Agnostic (Link at Listing)" variant="warning" />
                        )}
                        <Badge label={catName} variant="info" />
                        {catPath && (
                          <span className="font-mono text-[10px] text-muted-foreground truncate">
                            /{catPath}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-divider text-xs">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Variants
                          </span>
                          <span className="font-extrabold text-foreground">
                            {pVariants.length} SKUs
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Tier Price
                          </span>
                          <span className="font-extrabold text-price-current tabular-nums">
                            {minPrice === maxPrice
                              ? money('USD', minPrice)
                              : `${money('USD', minPrice)}–${money('USD', maxPrice)}`}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Total Stock
                          </span>
                          <span className="font-extrabold text-foreground tabular-nums">
                            {totalStock} units
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="px-5 py-3 bg-muted/30 border-t border-divider flex items-center justify-between gap-2 flex-wrap"
                    >
                      <AppButton
                        label="Convert to Listing"
                        variant="primary"
                        size="xs"
                        icon={Sparkles}
                        onClick={() => openConvertToListingModal(product)}
                      />
                      <div className="flex items-center gap-1.5">
                        <AppButton
                          label="Variants"
                          variant="secondary"
                          size="xs"
                          icon={Eye}
                          badgeCount={pVariants.length}
                          onClick={() => setInspectProduct(product)}
                        />
                        <AppButton
                          label="Edit"
                          variant="outline"
                          size="xs"
                          icon={Edit3}
                          onClick={() => setEditProductRow(product)}
                        />
                        <AppButton
                          label="+ SKU"
                          variant="ghost"
                          size="xs"
                          onClick={() => setAddVariantFor(product)}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PageSection>

      {/* =====================================================================
          SECTION 2: BRANDS CRUD SECTION
         ===================================================================== */}
      <PageSection
        title="Brands Registry (Create, Update & Delete)"
        description="Manage e-commerce brands linked to products when generating Medusa, Amazon, eBay, and Etsy listings."
        actions={
          <AppButton
            label="+ Create Brand"
            variant="primary"
            size="xs"
            icon={Plus}
            onClick={() => setCreateBrandOpen(true)}
          />
        }
      >
        {brands.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-xs text-muted-foreground mb-2">No brands registered yet.</p>
            <AppButton
              label="+ Create First Brand"
              variant="primary"
              size="xs"
              onClick={() => setCreateBrandOpen(true)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {brands.map((brand) => (
              <div
                key={String(brand.id)}
                className="rounded-2xl border border-card-border bg-card p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-primary/35 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-foreground">
                      {String(brand.name)}
                    </span>
                    <Badge
                      label={brand.isActive !== false ? 'Active' : 'Inactive'}
                      variant={brand.isActive !== false ? 'success' : 'neutral'}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <MonoBadge text={String(brand.slug)} />
                    {brand.regNo && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Reg: {String(brand.regNo)}
                      </span>
                    )}
                    {brand.serialNo && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Ser: {String(brand.serialNo)}
                      </span>
                    )}
                  </div>
                  {brand.websiteUrl && (
                    <p className="text-xs text-link truncate">{String(brand.websiteUrl)}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-divider">
                  <AppButton
                    label="Edit Brand"
                    variant="secondary"
                    size="xs"
                    icon={Edit3}
                    onClick={() => setEditBrandRow(brand)}
                  />
                  <RowAction
                    action={`/brands/${brand.id}/delete`}
                    label="Delete"
                    variant="ghost"
                    confirmText={`Delete brand "${brand.name}"?`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </PageSection>

      {/* =====================================================================
          SECTION 3: MEDUSA PRODUCT CATEGORIES SECTION
         ===================================================================== */}
      <PageSection
        title="Medusa Product Categories (/store/product-categories)"
        description="Hierarchical product taxonomy with platform category IDs (Amazon Browse Node, eBay Category ID, Etsy Taxonomy ID, Google Category ID)."
        actions={
          <div className="flex items-center gap-2">
            <AppButton
              label={syncingCategories ? 'Syncing...' : 'Sync Medusa Categories'}
              variant="secondary"
              size="xs"
              icon={RefreshCw}
              loading={syncingCategories}
              onClick={handleSyncMedusaCategories}
            />
            <AppButton
              label="+ Create Category"
              variant="primary"
              size="xs"
              icon={Plus}
              onClick={() => setCreateCategoryOpen(true)}
            />
          </div>
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-card-border bg-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-divider bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Medusa Handle / Taxonomy Path</th>
                <th className="py-3 px-4">Platform Taxonomy Mappings</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {categories.map((cat) => {
                const schema = (cat.attributesSchema ?? {}) as Record<string, any>
                const meta = (schema.metadata ?? {}) as Record<string, any>
                return (
                  <tr key={String(cat.id)} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">{String(cat.name)}</td>
                    <td className="py-3 px-4">
                      <MonoBadge text={String(cat.taxonomyPath ?? cat.slug)} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {meta.amazon_browse_node && (
                          <Badge label={`AMZ: ${meta.amazon_browse_node}`} variant="warning" />
                        )}
                        {meta.ebay_category_id && (
                          <Badge label={`eBay: ${meta.ebay_category_id}`} variant="info" />
                        )}
                        {meta.etsy_taxonomy_id && (
                          <Badge label={`Etsy: ${meta.etsy_taxonomy_id}`} variant="success" />
                        )}
                        {meta.google_product_category_id && (
                          <Badge label={`Google: ${meta.google_product_category_id}`} variant="neutral" />
                        )}
                        {!meta.amazon_browse_node &&
                          !meta.ebay_category_id &&
                          !meta.etsy_taxonomy_id && (
                            <span className="text-muted-foreground">Standard Category</span>
                          )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        label={cat.isActive !== false ? 'Active' : 'Inactive'}
                        variant={cat.isActive !== false ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <AppButton
                          label="Edit"
                          variant="secondary"
                          size="xs"
                          icon={Edit3}
                          onClick={() => setEditCategoryRow(cat)}
                        />
                        <RowAction
                          action={`/categories/${cat.id}/delete`}
                          label="Delete"
                          variant="ghost"
                          confirmText={`Delete category "${cat.name}"?`}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </PageSection>

      {/* =====================================================================
          SLIDE-OVER DRAWER: PRODUCT DETAILS & VARIANTS INSPECTOR
         ===================================================================== */}
      <SlideOverDrawer
        open={!!inspectProduct}
        onClose={() => setInspectProduct(null)}
        title={String(inspectProduct?.title ?? 'Product Details')}
        subtitle={String(inspectProduct?.subTitle ?? inspectProduct?.description ?? '')}
        icon={Box}
        widthClass="max-w-3xl"
        badge={
          inspectProduct ? (
            <>
              <MonoBadge text={String(inspectProduct.skuPrefix ?? inspectProduct.slug)} />
              <Badge
                label={String((inspectProduct.brand as any)?.name ?? 'Brand-Agnostic')}
                variant={inspectProduct.brandId ? 'purple' : 'warning'}
              />
              <Badge
                label={String((inspectProduct.category as any)?.name ?? 'Uncategorized')}
                variant="info"
              />
            </>
          ) : null
        }
        footer={
          inspectProduct ? (
            <>
              <div className="flex items-center gap-2">
                <AppButton
                  label="Edit Product"
                  variant="secondary"
                  size="sm"
                  icon={Edit3}
                  onClick={() => {
                    const p = inspectProduct
                    setInspectProduct(null)
                    setEditProductRow(p)
                  }}
                />
                <AppButton
                  label="+ Add Variant SKU"
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    const p = inspectProduct
                    setInspectProduct(null)
                    setAddVariantFor(p)
                  }}
                />
              </div>
              <AppButton
                label="Convert Product to Platform Listings"
                variant="primary"
                size="sm"
                icon={Sparkles}
                onClick={() => {
                  const p = inspectProduct
                  setInspectProduct(null)
                  openConvertToListingModal(p)
                }}
              />
            </>
          ) : null
        }
      >
        {inspectProduct && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-card-border bg-muted/25 p-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Title (75 / 80 Char)
                </span>
                <p className="font-semibold text-foreground mt-0.5">
                  {String(inspectProduct.title80 || inspectProduct.title75 || inspectProduct.title)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Medusa Category Path
                </span>
                <p className="font-mono text-primary mt-0.5">
                  /{String((inspectProduct.category as any)?.taxonomyPath ?? inspectProduct.slug)}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  SEO Description
                </span>
                <p className="text-foreground-secondary mt-0.5 leading-relaxed">
                  {String(inspectProduct.description || inspectProduct.shortDescription || '—')}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Product Variants ({((inspectProduct.variants as Row[]) ?? []).length} SKUs)
                </h3>
                <AppButton
                  label="+ Add Variant"
                  variant="secondary"
                  size="xs"
                  icon={Plus}
                  onClick={() => {
                    const p = inspectProduct
                    setInspectProduct(null)
                    setAddVariantFor(p)
                  }}
                />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-card-border bg-card">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-muted/40 border-b border-divider text-[11px] font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2.5 px-3.5">Variant SKU</th>
                      <th className="py-2.5 px-3.5">Title (Color / Size)</th>
                      <th className="py-2.5 px-3.5">Retail Price</th>
                      <th className="py-2.5 px-3.5">Cost</th>
                      <th className="py-2.5 px-3.5">Stock</th>
                      <th className="py-2.5 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {((inspectProduct.variants as Row[]) ?? []).map((v) => (
                      <tr key={String(v.id)} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3.5">
                          <MonoBadge text={String(v.sku)} />
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-foreground">
                          {String(v.title)}
                        </td>
                        <td className="py-2.5 px-3.5 font-extrabold text-price-current tabular-nums">
                          {money(String(v.currencyCode ?? 'USD'), v.retailPrice)}
                        </td>
                        <td className="py-2.5 px-3.5 text-muted-foreground tabular-nums">
                          {money(String(v.currencyCode ?? 'USD'), v.costPrice)}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold tabular-nums">
                          {String(v.stockOnHand)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <AppButton
                              label="Adjust"
                              variant="secondary"
                              size="xs"
                              onClick={() => {
                                setInspectProduct(null)
                                setEditStockRow(v)
                              }}
                            />
                            <RowAction
                              action={`/variants/${v.id}/delete`}
                              label="Delete"
                              variant="ghost"
                              confirmText={`Delete variant ${v.sku}?`}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* =====================================================================
          MODAL: CONVERT PRODUCT TO PLATFORM LISTINGS (BRAND + MULTI-PLATFORM)
         ===================================================================== */}
      {convertModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-card-border bg-card text-foreground shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between border-b border-divider px-6 py-4 bg-muted/30">
              <div>
                <div className="flex items-center gap-2">
                  <MonoBadge text={String(convertModalProduct.skuPrefix ?? 'PRODUCT')} />
                  <Badge
                    label={`${((convertModalProduct.variants as Row[]) ?? []).length} Variants`}
                    variant="info"
                  />
                </div>
                <h2 className="text-lg font-bold text-foreground mt-1">
                  Convert Product to Platform Listings
                </h2>
                <p className="text-xs text-muted-foreground">
                  Associate <strong>{String(convertModalProduct.title)}</strong> with a Brand and generate platform-specific listings for Medusa Website, Amazon, eBay, and Etsy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalProduct(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  1. Link Brand to Product & Listings *
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedBrandId}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                    className="flex-1 rounded-xl border border-input-border bg-input-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">-- Choose a Brand --</option>
                    {brands.map((b) => (
                      <option key={String(b.id)} value={String(b.id)}>
                        {String(b.name)} ({String(b.slug)})
                      </option>
                    ))}
                  </select>
                  <AppButton
                    label="+ New Brand"
                    variant="secondary"
                    size="sm"
                    onClick={() => setCreateBrandOpen(true)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1.5">
                  2. Select Target E-Commerce Platforms *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PLATFORMS.map((plat) => {
                    const checked = selectedPlatforms.includes(plat.id)
                    return (
                      <label
                        key={plat.id}
                        className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-colors ${
                          checked
                            ? 'border-primary bg-primary-subtle text-foreground font-semibold'
                            : 'border-border bg-muted/20 text-muted-foreground'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePlatform(plat.id)}
                          className="rounded border-border"
                        />
                        <span>{plat.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">
                    Seller Account (Auto-resolved per platform if blank)
                  </label>
                  <select
                    value={selectedSellerAccountId}
                    onChange={(e) => setSelectedSellerAccountId(e.target.value)}
                    className="w-full rounded-xl border border-input-border bg-input-background px-3 py-2 text-xs text-foreground"
                  >
                    <option value="">Auto-resolve per Platform (Medusa / Amazon / eBay / Etsy)</option>
                    {sellerAccounts.map((sa) => (
                      <option key={String(sa.id)} value={String(sa.id)}>
                        {String(sa.accountName)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">
                    Channel Price Multiplier (1.0 = Catalog Tier Price)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="3.0"
                    value={priceMultiplier}
                    onChange={(e) => setPriceMultiplier(e.target.value)}
                    className="w-full rounded-xl border border-input-border bg-input-background px-3 py-2 text-xs text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-divider px-6 py-4 bg-muted/25">
              <div className="text-xs text-muted-foreground">
                Generates{' '}
                <strong>
                  {((convertModalProduct.variants as Row[]) ?? []).length *
                    selectedPlatforms.length}{' '}
                  Channel Listings
                </strong>{' '}
                grouped by SKU in <code>/listing</code>.
              </div>
              <div className="flex items-center gap-2">
                <AppButton
                  label="Cancel"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConvertModalProduct(null)}
                />
                <AppButton
                  label={
                    convertingListing
                      ? 'Generating Platform Listings...'
                      : `Generate Listings (${selectedPlatforms.length} Platforms)`
                  }
                  variant="primary"
                  size="sm"
                  loading={convertingListing}
                  onClick={handleConvertProductToListings}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MULTI-SECTION MODALS WITH ALL PRODUCT, VARIANT, BRAND & CATEGORY FIELDS
         ===================================================================== */}
      <FormModal
        isOpen={createProductOpen}
        onOpenChange={setCreateProductOpen}
        title="Create Product (Complete Specification)"
        subtitle="Create a parent product with multi-length titles, taxonomy linkage, physical dimensions, and default variant SKU."
        submitLabel="Create Product"
        action="/products"
        fields={[
          {
            name: 'title',
            label: 'Primary Title (60 chars)',
            required: true,
            section: '1. Identity & Multi-Length Titles',
          },
          {
            name: 'title75',
            label: 'Title 75 (Etsy / Amazon)',
            section: '1. Identity & Multi-Length Titles',
          },
          {
            name: 'title80',
            label: 'Title 80 (eBay)',
            section: '1. Identity & Multi-Length Titles',
          },
          {
            name: 'subTitle',
            label: 'Subtitle (60 chars)',
            section: '1. Identity & Multi-Length Titles',
          },
          {
            name: 'subTitle125',
            label: 'Extended Subtitle 125',
            section: '1. Identity & Multi-Length Titles',
          },
          {
            name: 'skuPrefix',
            label: 'SKU Prefix / Base Code (e.g. MCTDC01)',
            section: '1. Identity & Multi-Length Titles',
          },
          {
            name: 'brandId',
            label: 'Brand (Optional — can be linked at Listing stage)',
            kind: 'select',
            section: '2. Taxonomy & Classification',
            options: [
              { value: '', label: 'Brand-Agnostic (Link at Listing Stage)' },
              ...brands.map((b) => ({ value: String(b.id), label: String(b.name) })),
            ],
          },
          {
            name: 'categoryId',
            label: 'Medusa Category',
            kind: 'select',
            section: '2. Taxonomy & Classification',
            options: categories.map((c) => ({
              value: String(c.id),
              label: `${c.name} (${c.taxonomyPath ?? c.slug})`,
            })),
          },
          {
            name: 'type',
            label: 'Product Type (e.g. Duster Coat)',
            section: '2. Taxonomy & Classification',
          },
          {
            name: 'collectionName',
            label: 'Collection Name',
            section: '2. Taxonomy & Classification',
          },
          {
            name: 'hasVariants',
            label: 'Has multiple variants',
            kind: 'select',
            default: 'true',
            section: '2. Taxonomy & Classification',
            options: [
              { value: 'false', label: 'No (Simple Product)' },
              { value: 'true', label: 'Yes (Multi-Variant)' },
            ],
          },
          {
            name: 'variationDimensions',
            label: 'Variation dimensions (comma-separated)',
            default: 'color,size',
            section: '2. Taxonomy & Classification',
          },
          {
            name: 'sku',
            label: 'Default Variant SKU',
            required: true,
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'asin',
            label: 'Amazon ASIN (optional)',
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'currencyCode',
            label: 'Currency',
            default: 'USD',
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'retailPrice',
            label: 'Retail price',
            kind: 'number',
            required: true,
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'costPrice',
            label: 'Unit Cost price (COGS)',
            kind: 'number',
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'manufacturingCost',
            label: 'Manufacturing cost',
            kind: 'number',
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'packagingCost',
            label: 'Packaging cost',
            kind: 'number',
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'stockOnHand',
            label: 'Initial stock on hand',
            kind: 'number',
            default: '25',
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'weightGrams',
            label: 'Weight (grams)',
            kind: 'number',
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'shortDescription',
            label: 'Short Description (Amazon <=500 chars)',
            kind: 'textarea',
            fullWidth: true,
            section: '4. Multi-Marketplace Descriptions',
          },
          {
            name: 'description',
            label: 'SEO Description',
            kind: 'textarea',
            fullWidth: true,
            section: '4. Multi-Marketplace Descriptions',
          },
          {
            name: 'extendedDescription',
            label: 'Extended Description (eBay/Etsy <=3000 chars)',
            kind: 'textarea',
            fullWidth: true,
            section: '4. Multi-Marketplace Descriptions',
          },
        ]}
      />

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
                title75: String(editProductRow.title75 ?? editProductRow.title ?? ''),
                title80: String(editProductRow.title80 ?? editProductRow.title ?? ''),
                subTitle: String(editProductRow.subTitle ?? ''),
                subTitle125: String(editProductRow.subTitle125 ?? ''),
                skuPrefix: String(editProductRow.skuPrefix ?? ''),
                type: String(editProductRow.type ?? ''),
                collectionName: String(editProductRow.collectionName ?? ''),
                weightGrams: String(editProductRow.weightGrams ?? ''),
                shortDescription: String(editProductRow.shortDescription ?? ''),
                description: String(editProductRow.description ?? ''),
                extendedDescription: String(editProductRow.extendedDescription ?? ''),
                status: String(editProductRow.status ?? 'active'),
                brandId: String(editProductRow.brandId ?? ''),
                categoryId: String(editProductRow.categoryId ?? ''),
              }
            : undefined
        }
        fields={[
          { name: 'title', label: 'Primary Title (60c)', required: true, section: '1. Identity' },
          { name: 'title75', label: 'Title 75 (Etsy / Amazon)', section: '1. Identity' },
          { name: 'title80', label: 'Title 80 (eBay)', section: '1. Identity' },
          { name: 'subTitle', label: 'Subtitle (60c)', section: '1. Identity' },
          { name: 'subTitle125', label: 'Extended Subtitle 125', section: '1. Identity' },
          { name: 'skuPrefix', label: 'SKU Prefix', section: '1. Identity' },
          {
            name: 'brandId',
            label: 'Brand',
            kind: 'select',
            section: '2. Classification & Status',
            options: [
              { value: '', label: 'Brand-Agnostic' },
              ...brands.map((b) => ({ value: String(b.id), label: String(b.name) })),
            ],
          },
          {
            name: 'categoryId',
            label: 'Medusa Category',
            kind: 'select',
            section: '2. Classification & Status',
            options: categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
          },
          { name: 'type', label: 'Product Type', section: '2. Classification & Status' },
          { name: 'collectionName', label: 'Collection Name', section: '2. Classification & Status' },
          { name: 'weightGrams', label: 'Weight (grams)', kind: 'number', section: '2. Classification & Status' },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            section: '2. Classification & Status',
            options: PRODUCT_STATUS.map((s) => ({ value: s, label: s })),
          },
          {
            name: 'shortDescription',
            label: 'Short Description (Amazon <=500c)',
            kind: 'textarea',
            fullWidth: true,
            section: '3. Descriptions',
          },
          {
            name: 'description',
            label: 'SEO Description',
            kind: 'textarea',
            fullWidth: true,
            section: '3. Descriptions',
          },
          {
            name: 'extendedDescription',
            label: 'Extended Description (eBay/Etsy <=3000c)',
            kind: 'textarea',
            fullWidth: true,
            section: '3. Descriptions',
          },
        ]}
      />

      <FormModal
        isOpen={!!addVariantFor}
        onOpenChange={(o) => {
          if (!o) setAddVariantFor(null)
        }}
        title={addVariantFor ? `Add Variant SKU to ${addVariantFor.title}` : 'Add Variant'}
        submitLabel="Create Variant"
        action={
          addVariantFor
            ? `/products/${addVariantFor.id}/variants`
            : '/products/placeholder/variants'
        }
        fields={[
          { name: 'sku', label: 'Variant SKU', required: true, section: '1. Variant Identity' },
          { name: 'title', label: 'Variant Title (e.g. Black / Medium)', required: true, section: '1. Variant Identity' },
          { name: 'barcodeUpcEan', label: 'Barcode (UPC / EAN)', section: '1. Variant Identity' },
          { name: 'mpn', label: 'MPN', section: '1. Variant Identity' },
          { name: 'asin', label: 'Amazon ASIN', section: '1. Variant Identity' },
          { name: 'retailPrice', label: 'Retail price ($)', kind: 'number', required: true, section: '2. Pricing & Stock' },
          { name: 'compareAtPrice', label: 'Compare-at price ($)', kind: 'number', section: '2. Pricing & Stock' },
          { name: 'costPrice', label: 'Cost price (COGS $)', kind: 'number', section: '2. Pricing & Stock' },
          { name: 'manufacturingCost', label: 'Manufacturing cost ($)', kind: 'number', section: '2. Pricing & Stock' },
          { name: 'packagingCost', label: 'Packaging cost ($)', kind: 'number', section: '2. Pricing & Stock' },
          { name: 'stockOnHand', label: 'Stock on hand', kind: 'number', default: '25', section: '2. Pricing & Stock' },
          { name: 'reorderPoint', label: 'Reorder alert threshold', kind: 'number', default: '10', section: '2. Pricing & Stock' },
          { name: 'attributeName', label: 'Primary Attribute Dimension (e.g. color)', default: 'color', section: '3. Normalized Attributes' },
          { name: 'attributeValue', label: 'Primary Attribute Value (e.g. Black)', placeholder: 'Black', section: '3. Normalized Attributes' },
        ]}
      />

      <FormModal
        isOpen={globalAddVariantOpen}
        onOpenChange={setGlobalAddVariantOpen}
        title="Add Variant SKU"
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
            section: '1. Parent Product & SKU',
            options: products.map((p) => ({ value: String(p.id), label: String(p.title) })),
          },
          { name: 'sku', label: 'Variant SKU', required: true, section: '1. Parent Product & SKU' },
          { name: 'title', label: 'Variant Title (Color / Size)', required: true, section: '1. Parent Product & SKU' },
          { name: 'barcodeUpcEan', label: 'Barcode (UPC / EAN)', section: '1. Parent Product & SKU' },
          { name: 'asin', label: 'Amazon ASIN', section: '1. Parent Product & SKU' },
          { name: 'retailPrice', label: 'Retail price ($)', kind: 'number', required: true, section: '2. Pricing & Stock' },
          { name: 'costPrice', label: 'Cost price ($)', kind: 'number', section: '2. Pricing & Stock' },
          { name: 'stockOnHand', label: 'Stock on hand', kind: 'number', default: '25', section: '2. Pricing & Stock' },
          { name: 'reorderPoint', label: 'Reorder point', kind: 'number', default: '10', section: '2. Pricing & Stock' },
          { name: 'attributeName', label: 'Attribute dimension', placeholder: 'size', section: '3. Attributes' },
          { name: 'attributeValue', label: 'Attribute value', placeholder: 'Large', section: '3. Attributes' },
        ]}
      />

      <FormModal
        isOpen={!!editStockRow}
        onOpenChange={(o) => {
          if (!o) setEditStockRow(null)
        }}
        title={`Adjust Stock & Price — ${editStockRow?.sku ?? ''}`}
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
          { name: 'retailPrice', label: 'Retail price ($)', kind: 'number', required: true },
        ]}
      />

      <FormModal
        isOpen={createBrandOpen}
        onOpenChange={setCreateBrandOpen}
        title="Create Brand (Complete Registry)"
        submitLabel="Create Brand"
        action="/brands"
        fields={[
          { name: 'name', label: 'Brand Name', required: true },
          { name: 'slug', label: 'Brand Slug (e.g. artisan-hide)' },
          { name: 'regNo', label: 'Trademark Registration No. (USPTO / WIPO)' },
          { name: 'serialNo', label: 'Trademark Serial No.' },
          { name: 'logoUrl', label: 'Brand Logo URL' },
          { name: 'websiteUrl', label: 'Official Website URL' },
        ]}
      />

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
                regNo: String(editBrandRow.regNo ?? ''),
                serialNo: String(editBrandRow.serialNo ?? ''),
                logoUrl: String(editBrandRow.logoUrl ?? ''),
                websiteUrl: String(editBrandRow.websiteUrl ?? ''),
                isActive: String(editBrandRow.isActive ?? 'true'),
              }
            : undefined
        }
        fields={[
          { name: 'name', label: 'Brand Name', required: true },
          { name: 'slug', label: 'Slug' },
          { name: 'regNo', label: 'Trademark Reg No.' },
          { name: 'serialNo', label: 'Trademark Serial No.' },
          { name: 'logoUrl', label: 'Logo URL' },
          { name: 'websiteUrl', label: 'Website URL' },
          {
            name: 'isActive',
            label: 'Active Status',
            kind: 'select',
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ],
          },
        ]}
      />

      <FormModal
        isOpen={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        title="Create Medusa Product Category"
        submitLabel="Create Category"
        action="/categories"
        fields={[
          { name: 'name', label: 'Category Name', required: true, section: '1. Category Hierarchy' },
          { name: 'slug', label: 'Slug (e.g. duster)', section: '1. Category Hierarchy' },
          { name: 'taxonomyPath', label: 'Medusa Handle / Taxonomy Path (e.g. men/outerwear/coats/duster)', section: '1. Category Hierarchy' },
          {
            name: 'parentCategoryId',
            label: 'Parent Category',
            kind: 'select',
            section: '1. Category Hierarchy',
            options: [
              { value: '', label: 'Root Category (No Parent)' },
              ...categories.map((c) => ({ value: String(c.id), label: String(c.name) })),
            ],
          },
          { name: 'description', label: 'Category Description', kind: 'textarea', fullWidth: true, section: '1. Category Hierarchy' },
        ]}
      />

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
                taxonomyPath: String(editCategoryRow.taxonomyPath ?? editCategoryRow.slug ?? ''),
                description: String(editCategoryRow.description ?? ''),
                isActive: String(editCategoryRow.isActive ?? 'true'),
              }
            : undefined
        }
        fields={[
          { name: 'name', label: 'Category name', required: true },
          { name: 'slug', label: 'Slug' },
          { name: 'taxonomyPath', label: 'Medusa Handle / Taxonomy Path' },
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
    </div>
  )
}
