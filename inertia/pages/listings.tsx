import { router } from '@inertiajs/react'
import {
  PageHeader,
  PageSection,
  TopStatusBar,
  AppButton,
  AppInput,
  AppTextarea,
  AppSelect,
  SlideOverDrawer,
  Badge,
  MonoBadge,
  RowAction,
  STATUS_TONES,
  money,
  type Row,
} from '~/lib/ui'
import { useState, useMemo } from 'react'
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Layers,
  Box,
  Sparkles,
  X,
  Send,
  Download,
  FileCode2,
  Edit3,
  Plus,
  Search,
} from 'lucide-react'

type SkuGroup = {
  sku: string
  productVariantId: string
  productId: string
  productTitle: string
  variantTitle: string
  brandName: string
  categoryName: string
  retailPrice: number
  stockOnHand: number
  platforms: Row[]
}

type Props = {
  channelListings?: Row[]
  skuGroups?: SkuGroup[]
  products?: Row[]
  brands?: Row[]
  categories?: Row[]
  sellerAccounts?: Row[]
  savedViews?: Row[]
  catalogConfig?: any
  salesChannels?: Row[]
  orders?: Row[]
  orderLineItems?: Row[]
  financeCategories?: Row[]
}

const PLATFORM_BADGES: Record<
  string,
  { label: string; variant: 'info' | 'warning' | 'success' | 'neutral' | 'purple' }
> = {
  medusa: { label: 'Medusa Website', variant: 'purple' },
  amazon: { label: 'Amazon SP-API', variant: 'warning' },
  ebay: { label: 'eBay Inventory API', variant: 'info' },
  etsy: { label: 'Etsy Open API v3', variant: 'success' },
}

export default function Listings({
  channelListings = [],
  skuGroups: serverSkuGroups,
  products = [],
  brands = [],
  sellerAccounts = [],
}: Props) {
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped')
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [banner, setBanner] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)

  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [selectedBrandId, setSelectedBrandId] = useState<string>(() =>
    brands[0]?.id ? String(brands[0].id) : ''
  )
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'medusa',
    'amazon',
    'ebay',
    'etsy',
  ])
  const [selectedSellerAccountId, setSelectedSellerAccountId] = useState<string>('')
  const [priceMultiplier, setPriceMultiplier] = useState<string>('1.0')
  const [assignBrandToProduct, setAssignBrandToProduct] = useState(true)

  // Complete 4-Section Edit ChannelListing Modal state (all ChannelListing columns)
  const [editingListing, setEditingListing] = useState<Row | null>(null)
  const [editForm, setEditForm] = useState({
    externalListingId: '',
    externalVariantId: '',
    externalSku: '',
    asin: '',
    channelCategoryId: '',
    channelTitle: '',
    channelDescription: '',
    currencyCode: 'USD',
    listedPrice: '229.99',
    allocatedQuantity: '25',
    listingStatus: 'active',
    publicationStatus: 'published',
    syncStatus: 'synced',
  })

  const [inspectListing, setInspectListing] = useState<Row | null>(null)

  const getCsrfToken = () =>
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1] ?? ''

  const skuGroups: SkuGroup[] = useMemo(() => {
    if (serverSkuGroups && serverSkuGroups.length > 0) return serverSkuGroups
    const map = new Map<string, SkuGroup>()
    for (const p of products) {
      for (const v of (p.variants as Row[]) ?? []) {
        const sku = String(v.sku)
        if (!map.has(sku)) {
          map.set(sku, {
            sku,
            productVariantId: String(v.id),
            productId: String(p.id),
            productTitle: String(p.title),
            variantTitle: String(v.title),
            brandName: String((p.brand as any)?.name ?? 'Brand-Agnostic'),
            categoryName: String((p.category as any)?.name ?? 'Outerwear'),
            retailPrice: Number(v.retailPrice ?? 0),
            stockOnHand: Number(v.stockOnHand ?? 0),
            platforms: [],
          })
        }
      }
    }
    for (const l of channelListings) {
      const sku = String(l.externalSku || 'SKU')
      if (!map.has(sku)) {
        map.set(sku, {
          sku,
          productVariantId: String(l.productVariantId ?? ''),
          productId: String(l.productId ?? ''),
          productTitle: String(l.productTitle ?? (l.product as any)?.title ?? '—'),
          variantTitle: String(l.variantTitle ?? sku),
          brandName: String(l.brandName ?? 'Artisan Hide'),
          categoryName: String(l.categoryName ?? 'Outerwear'),
          retailPrice: Number(l.listedPrice ?? 0),
          stockOnHand: Number(l.allocatedQuantity ?? 0),
          platforms: [],
        })
      }
      map.get(sku)!.platforms.push(l)
    }
    return Array.from(map.values())
  }, [serverSkuGroups, products, channelListings])

  const filteredSkuGroups = useMemo(() => {
    return skuGroups
      .map((group) => {
        const matchingPlatforms = group.platforms.filter((p) => {
          if (platformFilter !== 'all' && String(p.platform) !== platformFilter) return false
          if (statusFilter !== 'all' && String(p.listingStatus) !== statusFilter) return false
          return true
        })
        return {
          ...group,
          platforms: matchingPlatforms,
        }
      })
      .filter((group) => {
        if ((platformFilter !== 'all' || statusFilter !== 'all') && group.platforms.length === 0) {
          return false
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const hay = [
            group.sku,
            group.productTitle,
            group.variantTitle,
            group.brandName,
            group.categoryName,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
  }, [skuGroups, platformFilter, statusFilter, searchQuery])

  const filteredFlatListings = useMemo(() => {
    return channelListings.filter((l) => {
      if (platformFilter !== 'all' && String(l.platform) !== platformFilter) return false
      if (statusFilter !== 'all' && String(l.listingStatus) !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const hay = [l.externalSku, l.externalListingId, l.productTitle, l.brandName, l.platform]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [channelListings, platformFilter, statusFilter, searchQuery])

  const handlePublishSingleListing = async (listing: Row) => {
    setBusyKey(`pub-${listing.id}`)
    setBanner(null)
    try {
      const res = await fetch(`/channel-listings/${listing.id}/publish`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-XSRF-TOKEN': decodeURIComponent(getCsrfToken()),
        },
      })
      const data = await res.json()
      if (!res.ok || (!data.ok && !data.success)) {
        setBanner({ tone: 'error', message: data.error ?? 'Failed to publish listing.' })
      } else {
        setBanner({
          tone: 'success',
          message:
            data.message ||
            `Published SKU ${data.listing?.externalSku ?? listing.externalSku} on ${String(data.listing?.platform ?? listing.platform ?? 'platform').toUpperCase()}.`,
        })
        router.reload()
      }
    } finally {
      setBusyKey(null)
    }
  }

  const handlePublishEntireSku = async (sku: string) => {
    setBusyKey(`sku-${sku}`)
    setBanner(null)
    try {
      const res = await fetch('/channel-listings/publish-sku', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': decodeURIComponent(getCsrfToken()),
        },
        body: JSON.stringify({ sku }),
      })
      const data = await res.json()
      if (!res.ok || (!data.ok && !data.success)) {
        setBanner({ tone: 'error', message: data.error ?? 'Failed to publish SKU group.' })
      } else {
        setBanner({
          tone: 'success',
          message:
            data.message ||
            `Published ${data.publishedCount ?? 1} platform listings for SKU ${sku}.`,
        })
        router.reload()
      }
    } finally {
      setBusyKey(null)
    }
  }

  const openEditModal = (listing: Row) => {
    setEditingListing(listing)
    setEditForm({
      externalListingId: String(listing.externalListingId ?? ''),
      externalVariantId: String(listing.externalVariantId ?? ''),
      externalSku: String(listing.externalSku ?? ''),
      asin: String(listing.asin ?? ''),
      channelCategoryId: String(listing.channelCategoryId ?? ''),
      channelTitle: String(listing.channelTitle ?? listing.productTitle ?? ''),
      channelDescription: String(listing.channelDescription ?? ''),
      currencyCode: String(listing.currencyCode ?? 'USD'),
      listedPrice: String(listing.listedPrice ?? 229.99),
      allocatedQuantity: String(listing.allocatedQuantity ?? 25),
      listingStatus: String(listing.listingStatus ?? 'active'),
      publicationStatus: String(listing.publicationStatus ?? 'published'),
      syncStatus: String(listing.syncStatus ?? 'synced'),
    })
  }

  const handleSaveListingEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingListing) return
    setBusyKey(`edit-${editingListing.id}`)
    try {
      const res = await fetch(`/channel-listings/${editingListing.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': decodeURIComponent(getCsrfToken()),
        },
        body: JSON.stringify({
          externalListingId: editForm.externalListingId,
          externalVariantId: editForm.externalVariantId,
          externalSku: editForm.externalSku,
          asin: editForm.asin,
          channelCategoryId: editForm.channelCategoryId,
          channelTitle: editForm.channelTitle,
          channelDescription: editForm.channelDescription,
          currencyCode: editForm.currencyCode,
          listedPrice: Number(editForm.listedPrice),
          allocatedQuantity: Number(editForm.allocatedQuantity),
          listingStatus: editForm.listingStatus,
          publicationStatus: editForm.publicationStatus,
        }),
      })
      const data = await res.json()
      if (data.ok || data.success) {
        setBanner({
          tone: 'success',
          message: `Updated listing ${editForm.externalListingId} (${editForm.externalSku}).`,
        })
        setEditingListing(null)
        router.reload()
      }
    } finally {
      setBusyKey(null)
    }
  }

  const handleGenerateListings = async () => {
    if (!selectedBrandId) {
      setBanner({ tone: 'error', message: 'Please select a Brand.' })
      return
    }
    setBusyKey('gen-listings')
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
          platform: selectedPlatforms[0] ?? 'medusa',
          productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
          sellerAccountId: selectedSellerAccountId || undefined,
          assignBrandToProduct,
          priceMultiplier: Number(priceMultiplier) || 1.0,
        }),
      })
      const data = await res.json()
      if (!res.ok || (!data.ok && !data.success)) {
        setBanner({ tone: 'error', message: data.error ?? 'Failed to generate listings.' })
      } else {
        setBanner({
          tone: 'success',
          message: `Generated ${data.channelListingsUpserted ?? data.listingsPersisted ?? 0} platform listings for Brand "${data.brandName ?? data.brand?.name ?? ''}" across ${(data.platforms ?? data.platformsGenerated ?? selectedPlatforms).join(', ').toUpperCase()}.`,
        })
        setGenerateModalOpen(false)
        router.reload()
      }
    } finally {
      setBusyKey(null)
    }
  }

  const downloadJsonFile = (filename: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPlatformBundle = (platform: string) => {
    const matching = channelListings.filter(
      (l) => platform === 'all' || String(l.platform) === platform
    )
    const bundle = {
      exportedAt: new Date().toISOString(),
      platform,
      totalListings: matching.length,
      listings: matching.map((l) => ({
        externalListingId: l.externalListingId,
        sku: l.externalSku,
        platform: l.platform,
        brandName: l.brandName,
        productTitle: l.productTitle,
        listedPrice: l.listedPrice,
        allocatedQuantity: l.allocatedQuantity,
        listingStatus: l.listingStatus,
        syncStatus: l.syncStatus,
        payload: l.transformedPayload ?? l.channelAttributes ?? {},
      })),
    }
    downloadJsonFile(`${platform}_listings_bundle_${Date.now()}.json`, bundle)
  }

  const syncedCount = channelListings.filter((l) => l.syncStatus === 'synced').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Listings Studio (/listings)"
        description="View generated e-commerce listings grouped by Variant SKU across Medusa Website, Amazon SP-API, eBay Inventory API, and Etsy Open API v3. Inspect transformed JSON payloads and publish per SKU or per platform."
        icon={Globe}
        badge={`${skuGroups.length} SKUs · ${channelListings.length} platform listings · ${syncedCount} synced`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <AppButton
              label="← Catalog (/catalog)"
              variant="ghost"
              size="sm"
              onClick={() => router.visit('/catalog')}
            />
            <AppButton
              label="← Products (/products)"
              variant="secondary"
              size="sm"
              onClick={() => router.visit('/products')}
            />
            <AppButton
              label="Export All JSON"
              variant="outline"
              size="sm"
              icon={Download}
              onClick={() => handleDownloadPlatformBundle(platformFilter)}
            />
            <AppButton
              label="+ Generate Platform Listings"
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setGenerateModalOpen(true)}
            />
          </div>
        }
      />

      {/* Top Interactive Status Bar */}
      <TopStatusBar
        columns={4}
        items={[
          {
            label: 'Grouped Variant SKUs',
            value: String(skuGroups.length),
            sublabel: 'Multi-platform SKU groups',
            icon: Box,
            tone: 'primary',
            active: platformFilter === 'all',
            onClick: () => setPlatformFilter('all'),
          },
          {
            label: 'Total Platform Listings',
            value: String(channelListings.length),
            sublabel: 'Medusa · Amazon · eBay · Etsy',
            icon: Layers,
            tone: 'info',
          },
          {
            label: 'Published & Synced',
            value: `${syncedCount} / ${channelListings.length}`,
            sublabel: 'Live on target endpoints',
            icon: CheckCircle2,
            tone: 'success',
            active: statusFilter === 'active',
            onClick: () => setStatusFilter((p) => (p === 'active' ? 'all' : 'active')),
          },
          {
            label: 'Active Brands Linked',
            value: String(brands.length),
            sublabel: 'Brand-associated channel listings',
            icon: Sparkles,
            tone: 'warning',
          },
        ]}
      />

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
            <p className="font-medium">{banner.message}</p>
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

      {/* Filter & View Switcher Toolbar + Card-Based SKU Listings */}
      <PageSection
        title="Multi-Platform Listings Grouped by SKU"
        description="Each SKU card groups its generated Medusa Website, Amazon, eBay, and Etsy listings together with one-click 'Publish on Platform' and JSON download."
      >
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-card-border bg-muted/25 p-3.5">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="w-full sm:w-64">
                <AppInput
                  icon={Search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  placeholder="Search SKU, Product, Brand..."
                />
              </div>
              {(['all', 'medusa', 'amazon', 'ebay', 'etsy'] as const).map((plat) => (
                <button
                  key={plat}
                  type="button"
                  onClick={() => setPlatformFilter(plat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    platformFilter === plat
                      ? 'bg-button-primary text-button-primary-foreground shadow-xs'
                      : 'bg-card border border-input-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {plat === 'all' ? 'All Platforms' : plat.toUpperCase()}
                </button>
              ))}
              <div className="w-40">
                <AppSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active / Published' },
                    { value: 'draft', label: 'Draft' },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AppButton
                label={`Grouped by SKU (${filteredSkuGroups.length})`}
                variant={viewMode === 'grouped' ? 'primary' : 'outline'}
                size="xs"
                onClick={() => setViewMode('grouped')}
              />
              <AppButton
                label={`Flat Table (${filteredFlatListings.length})`}
                variant={viewMode === 'flat' ? 'primary' : 'outline'}
                size="xs"
                onClick={() => setViewMode('flat')}
              />
            </div>
          </div>

          {viewMode === 'grouped' ? (
            filteredSkuGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-3">
                <p className="text-sm font-bold text-foreground">
                  No platform listings generated yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Convert a Product to Platform Listings from <code>/products</code> or click
                  &ldquo;+ Generate Platform Listings&rdquo; below.
                </p>
                <AppButton
                  label="+ Generate Platform Listings"
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setGenerateModalOpen(true)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSkuGroups.map((group) => (
                  <div
                    key={group.sku}
                    className="rounded-2xl border border-card-border bg-card overflow-hidden shadow-xs"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-divider bg-muted/30 px-5 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <MonoBadge text={group.sku} />
                          <Badge label={`Brand: ${group.brandName}`} variant="purple" />
                          <Badge label={group.categoryName} variant="neutral" />
                          <Badge
                            label={`${group.platforms.length} Platform Listings`}
                            variant="info"
                          />
                        </div>
                        <div className="text-sm font-extrabold text-foreground">
                          {group.productTitle}{' '}
                          <span className="text-muted-foreground font-normal">
                            — {group.variantTitle}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-xs text-muted-foreground mr-2">
                          Base Retail:{' '}
                          <strong className="text-price-current">
                            {money('USD', group.retailPrice)}
                          </strong>{' '}
                          · Stock: <strong>{group.stockOnHand}</strong>
                        </div>
                        <AppButton
                          label={
                            busyKey === `sku-${group.sku}`
                              ? 'Publishing All...'
                              : 'Publish SKU on All Platforms'
                          }
                          variant="primary"
                          size="xs"
                          icon={Send}
                          loading={busyKey === `sku-${group.sku}`}
                          onClick={() => handlePublishEntireSku(group.sku)}
                        />
                        <AppButton
                          label="Download SKU JSON"
                          variant="secondary"
                          size="xs"
                          icon={Download}
                          onClick={() =>
                            downloadJsonFile(`${group.sku}_multi_platform.json`, group)
                          }
                        />
                      </div>
                    </div>

                    {group.platforms.length === 0 ? (
                      <div className="p-4 text-xs text-muted-foreground flex items-center justify-between">
                        <span>No platform listings created for this SKU yet.</span>
                        <AppButton
                          label="+ Generate Platform Listings"
                          variant="secondary"
                          size="xs"
                          icon={Plus}
                          onClick={() => {
                            if (group.productId) {
                              setSelectedProductIds([group.productId])
                            }
                            setGenerateModalOpen(true)
                          }}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-divider">
                        {group.platforms.map((listing) => {
                          const platKey = String(listing.platform ?? 'medusa').toLowerCase()
                          const platMeta = PLATFORM_BADGES[platKey] ?? {
                            label: platKey.toUpperCase(),
                            variant: 'neutral',
                          }
                          const isSynced = listing.syncStatus === 'synced'
                          return (
                            <div
                              key={String(listing.id)}
                              className="p-4 flex flex-col justify-between space-y-3 hover:bg-muted/15 transition-colors"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <Badge label={platMeta.label} variant={platMeta.variant} />
                                  <Badge
                                    label={
                                      isSynced
                                        ? 'Published / Synced'
                                        : String(listing.listingStatus)
                                    }
                                    variant={isSynced ? 'success' : 'warning'}
                                  />
                                </div>
                                <div className="font-mono text-xs font-bold text-foreground break-all">
                                  ID: {String(listing.externalListingId)}
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                                  <div>
                                    Price:{' '}
                                    <strong className="text-price-current">
                                      {money(
                                        String(listing.currencyCode ?? 'USD'),
                                        listing.listedPrice
                                      )}
                                    </strong>
                                  </div>
                                  <div>
                                    Qty:{' '}
                                    <strong className="text-foreground">
                                      {String(listing.allocatedQuantity)}
                                    </strong>
                                  </div>
                                </div>
                                {listing.publishedUrl && (
                                  <div className="text-[11px] font-mono text-success truncate">
                                    ✓ {String(listing.publishedUrl)}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-divider">
                                <AppButton
                                  label={
                                    busyKey === `pub-${listing.id}`
                                      ? 'Publishing...'
                                      : isSynced
                                        ? 'Re-Publish'
                                        : 'Publish on Platform'
                                  }
                                  variant="primary"
                                  size="xs"
                                  icon={Send}
                                  loading={busyKey === `pub-${listing.id}`}
                                  onClick={() => handlePublishSingleListing(listing)}
                                />
                                <AppButton
                                  label="JSON"
                                  variant="secondary"
                                  size="xs"
                                  icon={FileCode2}
                                  onClick={() => setInspectListing(listing)}
                                />
                                <AppButton
                                  label="Edit"
                                  variant="outline"
                                  size="xs"
                                  icon={Edit3}
                                  onClick={() => openEditModal(listing)}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-card-border bg-card shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-divider bg-muted/40 text-[11px] font-bold uppercase text-muted-foreground">
                    <th className="py-3.5 px-4">Variant SKU</th>
                    <th className="py-3.5 px-4">Platform</th>
                    <th className="py-3.5 px-4">External Listing ID</th>
                    <th className="py-3.5 px-4">Product & Brand</th>
                    <th className="py-3.5 px-4">Price & Qty</th>
                    <th className="py-3.5 px-4">Status / Sync</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {filteredFlatListings.map((l) => {
                    const platKey = String(l.platform ?? 'medusa').toLowerCase()
                    const platMeta = PLATFORM_BADGES[platKey] ?? {
                      label: platKey.toUpperCase(),
                      variant: 'neutral',
                    }
                    return (
                      <tr key={String(l.id)} className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          {String(l.externalSku)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge label={platMeta.label} variant={platMeta.variant} />
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {String(l.externalListingId)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground">{String(l.productTitle)}</div>
                          <div className="text-muted-foreground">Brand: {String(l.brandName)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-price-current">
                            {money(String(l.currencyCode ?? 'USD'), l.listedPrice)}
                          </div>
                          <div className="text-muted-foreground">
                            Qty: {String(l.allocatedQuantity)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              label={String(l.listingStatus)}
                              variant={STATUS_TONES[String(l.listingStatus)] ?? 'neutral'}
                            />
                            <Badge
                              label={String(l.syncStatus)}
                              variant={l.syncStatus === 'synced' ? 'success' : 'warning'}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <AppButton
                              label={
                                busyKey === `pub-${l.id}` ? 'Publishing...' : 'Publish on Platform'
                              }
                              variant="primary"
                              size="xs"
                              icon={Send}
                              loading={busyKey === `pub-${l.id}`}
                              onClick={() => handlePublishSingleListing(l)}
                            />
                            <AppButton
                              label="JSON"
                              variant="secondary"
                              size="xs"
                              icon={FileCode2}
                              onClick={() => setInspectListing(l)}
                            />
                            <AppButton
                              label="Edit"
                              variant="outline"
                              size="xs"
                              icon={Edit3}
                              onClick={() => openEditModal(l)}
                            />
                            <RowAction
                              action={`/channel-listings/${l.id}/delete`}
                              label="Delete"
                              variant="ghost"
                              confirmText="Remove this platform listing?"
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageSection>

      {/* =====================================================================
          MODAL 1: GENERATE MULTI-PLATFORM LISTINGS FROM PRODUCTS + BRAND
         ===================================================================== */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-card-border bg-card text-foreground shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-divider px-6 py-4 bg-muted/30">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Generate Multi-Platform Listings
                </h2>
                <p className="text-xs text-muted-foreground">
                  Link Products & Variants with a Brand and run platform transformers for Medusa,
                  Amazon, eBay, and Etsy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGenerateModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AppSelect
                  label="1. Select Brand *"
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  options={[
                    { value: '', label: '-- Select Brand --' },
                    ...brands.map((b) => ({ value: String(b.id), label: String(b.name) })),
                  ]}
                />
                <AppSelect
                  label="Seller Account (Optional Override)"
                  value={selectedSellerAccountId}
                  onChange={(e) => setSelectedSellerAccountId(e.target.value)}
                  options={[
                    { value: '', label: 'Auto-resolve per Platform' },
                    ...sellerAccounts.map((sa) => ({
                      value: String(sa.id),
                      label: String(sa.accountName),
                    })),
                  ]}
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1.5">
                  2. Target E-Commerce Platforms *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['medusa', 'amazon', 'ebay', 'etsy'] as const).map((plat) => {
                    const checked = selectedPlatforms.includes(plat)
                    return (
                      <label
                        key={plat}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer ${
                          checked
                            ? 'border-primary bg-primary-subtle text-foreground font-semibold'
                            : 'border-border bg-muted/20 text-muted-foreground'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedPlatforms((prev) =>
                              prev.includes(plat) ? prev.filter((x) => x !== plat) : [...prev, plat]
                            )
                          }
                        />
                        <span>{PLATFORM_BADGES[plat].label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  3. Filter Products (Leave unchecked to include all {products.length} products)
                </label>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-input-border bg-muted/20 p-2.5 space-y-1.5">
                  {products.map((p) => {
                    const id = String(p.id)
                    const checked = selectedProductIds.includes(id)
                    return (
                      <label key={id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedProductIds((prev) =>
                              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                            )
                          }
                        />
                        <span className="text-foreground font-medium">{String(p.title)}</span>
                        <span className="font-mono text-muted-foreground">
                          ({String(p.skuPrefix ?? '')})
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <AppInput
                  label="Channel Price Multiplier (1.0 = Base Tier Price)"
                  type="number"
                  step="0.05"
                  value={priceMultiplier}
                  onChange={(e) => setPriceMultiplier(e.target.value)}
                />
                <label className="flex items-center gap-2 cursor-pointer pt-4">
                  <input
                    type="checkbox"
                    checked={assignBrandToProduct}
                    onChange={(e) => setAssignBrandToProduct(e.target.checked)}
                  />
                  <span className="text-foreground font-medium">
                    Also set selected Brand on Parent Product
                  </span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-divider px-6 py-4 bg-muted/25">
              <AppButton
                label="Cancel"
                variant="ghost"
                size="sm"
                onClick={() => setGenerateModalOpen(false)}
              />
              <AppButton
                label={busyKey === 'gen-listings' ? 'Generating...' : 'Generate Platform Listings'}
                variant="primary"
                size="sm"
                loading={busyKey === 'gen-listings'}
                onClick={handleGenerateListings}
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: COMPLETE EDIT CHANNEL LISTING MODAL (ALL DB COLUMNS)
         ===================================================================== */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveListingEdit}
            className="relative w-full max-w-2xl rounded-2xl border border-card-border bg-card text-foreground shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-divider px-6 py-4 bg-muted/30">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Edit Platform Listing ({String(editingListing.platform).toUpperCase()})
                </h2>
                <p className="text-xs text-muted-foreground font-mono">
                  SKU: {String(editingListing.externalSku)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AppInput
                  label="External Listing ID / Offer ID *"
                  required
                  value={editForm.externalListingId}
                  onChange={(e) => setEditForm({ ...editForm, externalListingId: e.target.value })}
                />
                <AppInput
                  label="External Variant ID"
                  value={editForm.externalVariantId}
                  onChange={(e) => setEditForm({ ...editForm, externalVariantId: e.target.value })}
                />
                <AppInput
                  label="Channel SKU Override"
                  value={editForm.externalSku}
                  onChange={(e) => setEditForm({ ...editForm, externalSku: e.target.value })}
                />
                <AppInput
                  label="Amazon ASIN"
                  value={editForm.asin}
                  onChange={(e) => setEditForm({ ...editForm, asin: e.target.value })}
                />
                <AppInput
                  label="Channel Category / Browse Node ID"
                  value={editForm.channelCategoryId}
                  onChange={(e) => setEditForm({ ...editForm, channelCategoryId: e.target.value })}
                />
                <AppInput
                  label="Currency Code"
                  value={editForm.currencyCode}
                  onChange={(e) => setEditForm({ ...editForm, currencyCode: e.target.value })}
                />
                <AppInput
                  label="Listed Price ($)"
                  type="number"
                  step="0.01"
                  value={editForm.listedPrice}
                  onChange={(e) => setEditForm({ ...editForm, listedPrice: e.target.value })}
                />
                <AppInput
                  label="Allocated Quantity"
                  type="number"
                  value={editForm.allocatedQuantity}
                  onChange={(e) => setEditForm({ ...editForm, allocatedQuantity: e.target.value })}
                />
                <AppSelect
                  label="Listing Status"
                  value={editForm.listingStatus}
                  onChange={(e) => setEditForm({ ...editForm, listingStatus: e.target.value })}
                  options={[
                    { value: 'active', label: 'active' },
                    { value: 'draft', label: 'draft' },
                    { value: 'inactive', label: 'inactive' },
                    { value: 'suppressed', label: 'suppressed' },
                  ]}
                />
                <AppSelect
                  label="Publication Status"
                  value={editForm.publicationStatus}
                  onChange={(e) => setEditForm({ ...editForm, publicationStatus: e.target.value })}
                  options={[
                    { value: 'published', label: 'published' },
                    { value: 'draft', label: 'draft' },
                    { value: 'queued', label: 'queued' },
                    { value: 'failed', label: 'failed' },
                  ]}
                />
                <div className="sm:col-span-2">
                  <AppInput
                    label="Channel Title Override"
                    value={editForm.channelTitle}
                    onChange={(e) => setEditForm({ ...editForm, channelTitle: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <AppTextarea
                    label="Channel Description Override"
                    rows={3}
                    value={editForm.channelDescription}
                    onChange={(e) =>
                      setEditForm({ ...editForm, channelDescription: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-divider px-6 py-4 bg-muted/25">
              <AppButton
                label="Cancel"
                variant="ghost"
                size="sm"
                onClick={() => setEditingListing(null)}
              />
              <AppButton label="Save Listing Changes" variant="primary" size="sm" type="submit" />
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          SLIDE-OVER DRAWER: PLATFORM LISTING JSON PAYLOAD INSPECTOR
         ===================================================================== */}
      <SlideOverDrawer
        open={!!inspectListing}
        onClose={() => setInspectListing(null)}
        title={`Platform Endpoint JSON Payload (${String(inspectListing?.externalListingId ?? '')})`}
        subtitle={`${String(inspectListing?.productTitle ?? '')} · Brand: ${String(inspectListing?.brandName ?? '')}`}
        icon={FileCode2}
        badge={
          inspectListing ? (
            <>
              <Badge label={String(inspectListing.platform).toUpperCase()} variant="info" />
              <MonoBadge text={String(inspectListing.externalSku)} />
            </>
          ) : null
        }
        footer={
          inspectListing ? (
            <>
              <AppButton
                label="Download Listing JSON"
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() =>
                  downloadJsonFile(
                    `${inspectListing.platform}_${inspectListing.externalSku}.json`,
                    inspectListing.transformedPayload ?? inspectListing
                  )
                }
              />
              <AppButton
                label="Publish on Platform Now"
                variant="primary"
                size="sm"
                icon={Send}
                onClick={() => {
                  const item = inspectListing
                  setInspectListing(null)
                  handlePublishSingleListing(item)
                }}
              />
            </>
          ) : null
        }
      >
        {inspectListing && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-card-border bg-muted/20 p-3.5">
              <div>
                <strong>Product:</strong> {String(inspectListing.productTitle)}
              </div>
              <div>
                <strong>Brand:</strong> {String(inspectListing.brandName)}
              </div>
              <div>
                <strong>Listed Price:</strong>{' '}
                {money(String(inspectListing.currencyCode ?? 'USD'), inspectListing.listedPrice)}
              </div>
              <div>
                <strong>Sync Status:</strong> {String(inspectListing.syncStatus)}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-foreground">
                Generated Platform Transformer JSON Payload
              </div>
              <pre className="rounded-xl border border-card-border bg-muted/30 p-4 font-mono text-[11px] text-foreground overflow-x-auto">
                {JSON.stringify(
                  inspectListing.transformedPayload ??
                    inspectListing.channelAttributes ??
                    inspectListing,
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  )
}
