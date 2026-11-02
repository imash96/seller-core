import { Grid } from '@astryxdesign/core/Grid'
import { Text } from '@astryxdesign/core/Text'
import { Stack } from '@astryxdesign/core/Stack'
import { router } from '@inertiajs/react'
import { FeedbackBanner } from '~/modules/common/feedback-banner'
import { getCsrfToken } from '~/lib/cookies'
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
  MultiCurrencyPriceStack,
  STATUS_TONES,
  convertToLocale,
  resolvePriceMoney,
  moneyAmountString,
  type PriceMoney,
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
import { ProductDetailDrawer, ConvertToListingModal } from '~/modules/product/index'

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
  catalogConfig?: any
  sampleCatalogJson?: any
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
      setBanner({
        tone: 'error',
        message: 'Please select at least one target e-commerce platform.',
      })
      return
    }
    setConvertingListing(true)
    setBanner(null)
    try {
      const csrf = getCsrfToken()
      const res = await fetch('/catalogs/generate-listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(csrf ? { 'X-XSRF-TOKEN': csrf } : {}),
        },
        body: JSON.stringify({
          brandId: selectedBrandId,
          persistChannelListings: true,
          platforms: selectedPlatforms,
          platform: selectedPlatforms[0],
          productIds: [String(convertModalProduct.id)],
          sellerAccountId:
            selectedPlatforms.length === 1 ? selectedSellerAccountId || undefined : undefined,
          priceMultiplier: Number(priceMultiplier) || 1.0,
        }),
      })
      const data = await res.json()
      if (!res.ok || (!data.ok && !data.success)) {
        setBanner({
          tone: 'error',
          message: data.error ?? 'Failed to convert product to listings.',
        })
      } else {
        setBanner({
          tone: 'success',
          message: `Linked "${convertModalProduct.title}" with Brand "${data.brandName}" and generated ${data.channelListingsUpserted} platform listings across ${(data.platforms ?? selectedPlatforms).join(', ').toUpperCase()}. View & publish them in /listings!`,
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
      const csrf = getCsrfToken()
      const res = await fetch('/catalogs/sync-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(csrf ? { 'X-XSRF-TOKEN': csrf } : {}),
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
      } else {
        setBanner({
          tone: 'error',
          message: data.error ?? 'Failed to sync Medusa categories.',
        })
      }
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Network error syncing categories.',
      })
    } finally {
      setSyncingCategories(false)
    }
  }

  const brandLinkedCount = products.filter((p) => Boolean(p.brandId)).length

  return (
    <Stack gap={6}>
      <PageHeader
        title="Products, Variants, Brands & Categories (/products)"
        description="Click any Product Card to open its Slide-Over Detail & Multi-Currency Variants Drawer, or click 'Convert to Listing' to link a Brand and generate multi-platform listings."
        icon={Box}
        badge={`${products.length} products · ${variantRows.length} variants · ${flatListings.length} listings`}
        actions={
          <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
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
          </Stack>
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
            onClick: () => setBrandFilter((prev) => (prev === 'unbranded' ? 'all' : 'unbranded')),
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
        <FeedbackBanner
          tone={banner.tone}
          message={banner.message}
          onDismiss={() => setBanner(null)}
          action={
            banner.tone === 'success' ? (
              <AppButton
                variant="outline"
                size="xs"
                icon={ExternalLink}
                onClick={() => router.visit('/listing')}
              >
                Review &amp; publish
              </AppButton>
            ) : undefined
          }
        />
      )}

      {/* =====================================================================
          SECTION 1: CARD-BASED PRODUCT LIST (CLICK OPENS VARIANT DRAWER)
         ===================================================================== */}
      <PageSection
        title="Generated Products (Click Any Card to Inspect Details & Multi-Currency Variants)"
        description="Products converted from /catalog carry multi-currency ProductPrice & ProductVariantPrice arrays (USD, INR, EUR, GBP, CAD, MXN). Click any card to inspect variants or convert to listings."
        actions={
          <Stack direction="horizontal" align="center" gap={2}>
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
          </Stack>
        }
      >
        <Stack gap={4}>
          <Grid
            columns={{ minWidth: 220, max: 1 }}
            className="md:grid-cols-2 lg:grid-cols-4 rounded-2xl border border-card-border bg-muted/25 p-3.5"
          >
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
          </Grid>

          {filteredProducts.length === 0 ? (
            <Stack
              gap={3}
              padding={10}
              className="rounded-2xl border border-dashed border-border text-center"
            >
              <p className="text-sm font-bold text-foreground">
                No products match your active filters.
              </p>
              <Stack direction="horizontal" align="center" justify="center" gap={2}>
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
              </Stack>
            </Stack>
          ) : (
            <Grid columns={{ minWidth: 220, max: 1 }} className="md:grid-cols-2 xl:grid-cols-3">
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

                const productPrices: PriceMoney[] = Array.isArray(product.prices)
                  ? (product.prices as PriceMoney[])
                  : Array.isArray(product.price)
                    ? (product.price as PriceMoney[])
                    : Array.isArray(pVariants[0]?.prices)
                      ? (pVariants[0].prices as PriceMoney[])
                      : []

                const totalStock = pVariants.reduce((sum, v) => sum + Number(v.stockOnHand ?? 0), 0)
                const brandName = (product.brand as any)?.name
                const catName = (product.category as any)?.name ?? 'Uncategorized'
                const catPath = (product.category as any)?.taxonomyPath ?? ''

                return (
                  <Stack
                    justify="between"
                    key={String(product.id)}
                    onClick={() => setInspectProduct(product)}
                    className="group rounded-2xl border border-card-border bg-card text-card-foreground hover:border-primary/45 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
                  >
                    <Stack gap={4} padding={5}>
                      <Stack direction="horizontal" align="start" gap={4}>
                        <ThumbnailStack items={thumbItems} size="md" />
                        <Stack direction="horizontal" gap={1.5} className="min-w-0 flex-1">
                          <Stack
                            direction="horizontal"
                            align="center"
                            justify="between"
                            wrap="wrap"
                            gap={2}
                          >
                            <MonoBadge text={String(product.skuPrefix ?? product.slug ?? 'SKU')} />
                            <Badge
                              label={String(product.status ?? 'active')}
                              variant={STATUS_TONES[String(product.status)] ?? 'success'}
                            />
                          </Stack>
                          <h3 className="text-sm sm:text-base font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {String(product.title)}
                          </h3>
                          {product.subTitle && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {String(product.subTitle)}
                            </p>
                          )}
                        </Stack>
                      </Stack>

                      <Stack direction="horizontal" align="center" wrap="wrap" gap={1.5}>
                        {brandName ? (
                          <Badge label={`Brand: ${brandName}`} variant="purple" />
                        ) : (
                          <Badge label="Brand-Agnostic (Link at Listing)" variant="warning" />
                        )}
                        <Badge label={catName} variant="info" />
                        {catPath && (
                          <Text size="3xs" color="secondary" maxLines={1} className="font-mono">
                            /{catPath}
                          </Text>
                        )}
                      </Stack>

                      <Stack gap={2} className="pt-3 border-t border-divider text-xs">
                        <Stack direction="horizontal" align="center" justify="between" gap={2}>
                          <Stack>
                            <Text
                              size="3xs"
                              color="secondary"
                              weight="bold"
                              className="block uppercase tracking-wider"
                            >
                              Variants
                            </Text>
                            <Text color="primary" className="font-extrabold">
                              {pVariants.length} SKUs
                            </Text>
                          </Stack>
                          <Stack className="text-right">
                            <Text
                              size="3xs"
                              color="secondary"
                              weight="bold"
                              className="block uppercase tracking-wider"
                            >
                              Total Stock
                            </Text>
                            <Text color="primary" hasTabularNumbers className="font-extrabold">
                              {totalStock} units
                            </Text>
                          </Stack>
                        </Stack>

                        <Stack padding={2} className="rounded-xl border border-divider bg-muted/20">
                          <Text
                            size="3xs"
                            color="secondary"
                            weight="bold"
                            className="block uppercase tracking-wider mb-1"
                          >
                            Multi-Currency Prices (ProductPrice)
                          </Text>
                          <MultiCurrencyPriceStack
                            prices={productPrices}
                            primaryCurrency="USD"
                            maxBadges={5}
                          />
                        </Stack>
                      </Stack>
                    </Stack>

                    <Stack
                      direction="horizontal"
                      align="center"
                      justify="between"
                      wrap="wrap"
                      gap={2}
                      paddingInline={5}
                      paddingBlock={3}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-muted/30 border-t border-divider"
                    >
                      <AppButton
                        label="Convert to Listing"
                        variant="primary"
                        size="xs"
                        icon={Sparkles}
                        onClick={() => openConvertToListingModal(product)}
                      />
                      <Stack direction="horizontal" align="center" gap={1.5}>
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
                      </Stack>
                    </Stack>
                  </Stack>
                )
              })}
            </Grid>
          )}
        </Stack>
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
          <Stack padding={6} className="rounded-xl border border-dashed border-border text-center">
            <p className="text-xs text-muted-foreground mb-2">No brands registered yet.</p>
            <AppButton
              label="+ Create First Brand"
              variant="primary"
              size="xs"
              onClick={() => setCreateBrandOpen(true)}
            />
          </Stack>
        ) : (
          <Grid columns={{ minWidth: 220, max: 1 }} className="sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <Stack
                justify="between"
                gap={3}
                padding={4}
                key={String(brand.id)}
                className="rounded-2xl border border-card-border bg-card shadow-xs hover:border-primary/35 transition-all"
              >
                <Stack gap={1.5}>
                  <Stack direction="horizontal" align="center" justify="between" gap={2}>
                    <Text size="sm" color="primary" className="font-extrabold">
                      {String(brand.name)}
                    </Text>
                    <Badge
                      label={brand.isActive !== false ? 'Active' : 'Inactive'}
                      variant={brand.isActive !== false ? 'success' : 'neutral'}
                    />
                  </Stack>
                  <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
                    <MonoBadge text={String(brand.slug)} />
                    {brand.regNo && (
                      <Text size="2xs" color="secondary" className="font-mono">
                        Reg: {String(brand.regNo)}
                      </Text>
                    )}
                    {brand.serialNo && (
                      <Text size="2xs" color="secondary" className="font-mono">
                        Ser: {String(brand.serialNo)}
                      </Text>
                    )}
                  </Stack>
                  {brand.websiteUrl && (
                    <p className="text-xs text-link truncate">{String(brand.websiteUrl)}</p>
                  )}
                </Stack>

                <Stack
                  direction="horizontal"
                  align="center"
                  justify="end"
                  gap={2}
                  className="pt-2.5 border-t border-divider"
                >
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
                </Stack>
              </Stack>
            ))}
          </Grid>
        )}
      </PageSection>

      {/* =====================================================================
          SECTION 3: MEDUSA PRODUCT CATEGORIES SECTION
         ===================================================================== */}
      <PageSection
        title="Medusa Product Categories (/store/product-categories)"
        description="Hierarchical product taxonomy with platform category IDs (Amazon Browse Node, eBay Category ID, Etsy Taxonomy ID, Google Category ID)."
        actions={
          <Stack direction="horizontal" align="center" gap={2}>
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
          </Stack>
        }
      >
        <Stack className="overflow-x-auto rounded-2xl border border-card-border bg-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-divider bg-muted/40 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
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
                      <Stack direction="horizontal" align="center" wrap="wrap" gap={1.5}>
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
                          <Badge
                            label={`Google: ${meta.google_product_category_id}`}
                            variant="neutral"
                          />
                        )}
                        {!meta.amazon_browse_node &&
                          !meta.ebay_category_id &&
                          !meta.etsy_taxonomy_id && (
                            <Text color="secondary">Standard Category</Text>
                          )}
                      </Stack>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        label={cat.isActive !== false ? 'Active' : 'Inactive'}
                        variant={cat.isActive !== false ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Stack direction="horizontal" align="center" justify="end" gap={1.5}>
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
                      </Stack>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Stack>
      </PageSection>

      {/* =====================================================================
          SLIDE-OVER DRAWER: PRODUCT DETAILS & VARIANTS INSPECTOR
         ===================================================================== */}
      <ProductDetailDrawer
        product={inspectProduct}
        onClose={() => setInspectProduct(null)}
        onEditProduct={(p) => {
          setInspectProduct(null)
          setEditProductRow(p)
        }}
        onAddVariant={(p) => {
          setInspectProduct(null)
          setAddVariantFor(p)
        }}
        onOpenConvertToListing={(p) => {
          setInspectProduct(null)
          openConvertToListingModal(p)
        }}
        onEditStock={(v) => {
          setInspectProduct(null)
          setEditStockRow(v)
        }}
      />

      {/* =====================================================================
          MODAL: CONVERT PRODUCT TO PLATFORM LISTINGS (BRAND + MULTI-PLATFORM)
         ===================================================================== */}
      <ConvertToListingModal
        product={convertModalProduct}
        onClose={() => setConvertModalProduct(null)}
        brands={brands}
        sellerAccounts={sellerAccounts}
        selectedBrandId={selectedBrandId}
        setSelectedBrandId={setSelectedBrandId}
        selectedPlatforms={selectedPlatforms}
        togglePlatform={togglePlatform}
        selectedSellerAccountId={selectedSellerAccountId}
        setSelectedSellerAccountId={setSelectedSellerAccountId}
        priceMultiplier={priceMultiplier}
        setPriceMultiplier={setPriceMultiplier}
        onCreateBrandOpen={() => setCreateBrandOpen(true)}
        convertingListing={convertingListing}
        onConfirmConvert={handleConvertProductToListings}
        platforms={PLATFORMS}
      />

      {/* =====================================================================
          MULTI-SECTION MODALS WITH ALL PRODUCT, VARIANT, BRAND & CATEGORY FIELDS
         ===================================================================== */}
      <FormModal
        isOpen={createProductOpen}
        onOpenChange={setCreateProductOpen}
        title="Create Product (Complete Specification + Multi-Currency Prices)"
        subtitle="Create a parent product with multi-length titles, taxonomy linkage, physical dimensions, default variant SKU, and multi-currency ProductPrice & ProductVariantPrice records."
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
            name: 'priceUsd',
            label: 'Retail price (USD — the anchor the other currencies convert from)',
            kind: 'number',
            required: true,
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'costPrice',
            label: 'Unit Cost price (COGS)',
            kind: 'money',
            defaultCurrency: 'USD',
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'manufacturingCost',
            label: 'Manufacturing cost',
            kind: 'money',
            defaultCurrency: 'USD',
            section: '3. Default Variant Pricing & Stock',
          },
          {
            name: 'packagingCost',
            label: 'Packaging cost',
            kind: 'money',
            defaultCurrency: 'USD',
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
            name: 'pricesJson',
            label: 'Multi-Currency Price Array (ProductPrice & ProductVariantPrice)',
            kind: 'prices',
            fullWidth: true,
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
                pricesJson: JSON.stringify(
                  Array.isArray(editProductRow.prices) ? editProductRow.prices : []
                ),
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
          {
            name: 'collectionName',
            label: 'Collection Name',
            section: '2. Classification & Status',
          },
          {
            name: 'weightGrams',
            label: 'Weight (grams)',
            kind: 'number',
            section: '2. Classification & Status',
          },
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            section: '2. Classification & Status',
            options: PRODUCT_STATUS.map((s) => ({ value: s, label: s })),
          },
          {
            name: 'pricesJson',
            label: 'Multi-Currency Price Array (ProductPrice)',
            kind: 'prices',
            fullWidth: true,
            section: '2. Classification & Status',
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
          {
            name: 'title',
            label: 'Variant Title (e.g. Black / Medium)',
            required: true,
            section: '1. Variant Identity',
          },
          { name: 'barcodeUpcEan', label: 'Barcode (UPC / EAN)', section: '1. Variant Identity' },
          { name: 'mpn', label: 'MPN', section: '1. Variant Identity' },
          { name: 'asin', label: 'Amazon ASIN', section: '1. Variant Identity' },
          {
            name: 'priceUsd',
            label: 'Retail price (USD — the anchor the other currencies convert from)',
            kind: 'number',
            required: true,
            section: '2. Pricing & Stock',
          },
          {
            name: 'costPrice',
            label: 'Cost price (COGS)',
            kind: 'money',
            defaultCurrency: 'USD',
            section: '2. Pricing & Stock',
          },
          {
            name: 'manufacturingCost',
            label: 'Manufacturing cost',
            kind: 'number',
            section: '2. Pricing & Stock',
          },
          {
            name: 'packagingCost',
            label: 'Packaging cost',
            kind: 'number',
            section: '2. Pricing & Stock',
          },
          {
            name: 'stockOnHand',
            label: 'Stock on hand',
            kind: 'number',
            default: '25',
            section: '2. Pricing & Stock',
          },
          {
            name: 'reorderPoint',
            label: 'Reorder alert threshold',
            kind: 'number',
            default: '10',
            section: '2. Pricing & Stock',
          },
          {
            name: 'pricesJson',
            label: 'Multi-Currency Price Array (ProductVariantPrice)',
            kind: 'prices',
            fullWidth: true,
            section: '2. Pricing & Stock',
          },
          {
            name: 'attributeName',
            label: 'Primary Attribute Dimension (e.g. color)',
            default: 'color',
            section: '3. Normalized Attributes',
          },
          {
            name: 'attributeValue',
            label: 'Primary Attribute Value (e.g. Black)',
            placeholder: 'Black',
            section: '3. Normalized Attributes',
          },
        ]}
      />

      <FormModal
        isOpen={globalAddVariantOpen}
        onOpenChange={setGlobalAddVariantOpen}
        title="Add Variant SKU (with Multi-Currency Prices)"
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
          {
            name: 'title',
            label: 'Variant Title (Color / Size)',
            required: true,
            section: '1. Parent Product & SKU',
          },
          {
            name: 'barcodeUpcEan',
            label: 'Barcode (UPC / EAN)',
            section: '1. Parent Product & SKU',
          },
          { name: 'asin', label: 'Amazon ASIN', section: '1. Parent Product & SKU' },
          {
            name: 'priceUsd',
            label: 'Retail price (USD — the anchor the other currencies convert from)',
            kind: 'number',
            required: true,
            section: '2. Pricing & Stock',
          },
          {
            name: 'costPrice',
            label: 'Cost price',
            kind: 'money',
            defaultCurrency: 'USD',
            section: '2. Pricing & Stock',
          },
          {
            name: 'stockOnHand',
            label: 'Stock on hand',
            kind: 'number',
            default: '25',
            section: '2. Pricing & Stock',
          },
          {
            name: 'reorderPoint',
            label: 'Reorder point',
            kind: 'number',
            default: '10',
            section: '2. Pricing & Stock',
          },
          {
            name: 'pricesJson',
            label: 'Multi-Currency Price Array (ProductVariantPrice)',
            kind: 'prices',
            fullWidth: true,
            section: '2. Pricing & Stock',
          },
          {
            name: 'attributeName',
            label: 'Attribute dimension',
            placeholder: 'size',
            section: '3. Attributes',
          },
          {
            name: 'attributeValue',
            label: 'Attribute value',
            placeholder: 'Large',
            section: '3. Attributes',
          },
        ]}
      />

      <FormModal
        isOpen={!!editStockRow}
        onOpenChange={(o) => {
          if (!o) setEditStockRow(null)
        }}
        title={`Adjust Stock & Multi-Currency Prices — ${editStockRow?.sku ?? ''}`}
        submitLabel="Update Stock & Prices"
        action={editStockRow ? `/variants/${editStockRow.id}/stock` : '/variants/placeholder/stock'}
        initialValues={
          editStockRow
            ? {
                stockOnHand: String(editStockRow.stockOnHand ?? 0),
                retailPrice: moneyAmountString(
                  editStockRow.retailPriceMoney ?? editStockRow.retailPrice
                ),
                pricesJson: JSON.stringify(
                  Array.isArray(editStockRow.prices) ? editStockRow.prices : []
                ),
              }
            : undefined
        }
        fields={[
          { name: 'stockOnHand', label: 'Stock on hand', kind: 'number', required: true },
          {
            name: 'retailPrice',
            label: 'Retail price (USD)',
            kind: 'number',
            required: true,
            description:
              'Prices in INR, EUR, GBP, CAD and MXN are derived from this amount unless overridden below.',
          },
          {
            name: 'pricesJson',
            label: 'Multi-Currency Price Array (ProductVariantPrice)',
            kind: 'prices',
            fullWidth: true,
          },
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
        isOpen={editBrandRow !== null}
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
          {
            name: 'name',
            label: 'Category Name',
            required: true,
            section: '1. Category Hierarchy',
          },
          { name: 'slug', label: 'Slug (e.g. duster)', section: '1. Category Hierarchy' },
          {
            name: 'taxonomyPath',
            label: 'Medusa Handle / Taxonomy Path (e.g. men/outerwear/coats/duster)',
            section: '1. Category Hierarchy',
          },
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
          {
            name: 'description',
            label: 'Category Description',
            kind: 'textarea',
            fullWidth: true,
            section: '1. Category Hierarchy',
          },
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
    </Stack>
  )
}
