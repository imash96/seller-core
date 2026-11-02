import { Grid } from '@astryxdesign/core/Grid'
import { Text } from '@astryxdesign/core/Text'
import { Stack } from '@astryxdesign/core/Stack'
import { router } from '@inertiajs/react'
import { FeedbackBanner } from '~/modules/common/feedback-banner'
import { getCsrfToken } from '~/lib/cookies'
import { expandUsdPrice } from '~/lib/currency'
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
  MultiCurrencyPriceStack,
  MultiCurrencyPriceInput,
  STATUS_TONES,
  convertToLocale,
  resolvePriceMoney,
  type PriceMoney,
  type Row,
} from '~/lib/ui'
import type React from 'react'
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
import {
  GenerateListingsModal,
  EditListingModal,
  ListingDetailDrawer,
} from '~/modules/listing/index'

type SkuGroup = {
  sku: string
  productVariantId: string
  productId: string
  productTitle: string
  variantTitle: string
  brandName: string
  categoryName: string
  retailPrice: number
  prices?: PriceMoney[]
  stockOnHand: number
  platforms: Row[]
}

type Props = {
  channelListings?: Row[]
  skuGroups?: any
  products?: Row[]
  brands?: Row[]
  categories?: Row[]
  sellerAccounts?: Row[]
  salesChannels?: Row[]
  orders?: Row[]
  orderLineItems?: Row[]
  financeCategories?: Row[]
  savedViews?: Row[]
  catalogConfig?: any
  [key: string]: any
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

  // Complete Edit ChannelListing Modal state (including multi-currency prices array)
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
    prices: [] as PriceMoney[],
    allocatedQuantity: '25',
    listingStatus: 'active',
    publicationStatus: 'published',
    syncStatus: 'synced',
  })

  const [inspectListing, setInspectListing] = useState<Row | null>(null)

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
            retailPrice: Number(
              (Array.isArray(v.prices) ? (v.prices as PriceMoney[]) : []).find(
                (price) => price.currency_code === 'USD'
              )?.amount ?? 0
            ),
            prices: Array.isArray(v.prices) ? (v.prices as PriceMoney[]) : undefined,
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
          retailPrice: resolvePriceMoney(l.listedPriceMoney ?? l.listedPrice).amount,
          prices: Array.isArray(l.prices) ? (l.prices as PriceMoney[]) : undefined,
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
      const csrf = getCsrfToken()
      const res = await fetch(`/channel-listings/${listing.id}/publish`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(csrf ? { 'X-XSRF-TOKEN': csrf } : {}),
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
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Network error publishing listing.',
      })
    } finally {
      setBusyKey(null)
    }
  }

  const handlePublishEntireSku = async (sku: string) => {
    setBusyKey(`sku-${sku}`)
    setBanner(null)
    try {
      const csrf = getCsrfToken()
      const res = await fetch('/channel-listings/publish-sku', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(csrf ? { 'X-XSRF-TOKEN': csrf } : {}),
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
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Network error publishing SKU group.',
      })
    } finally {
      setBusyKey(null)
    }
  }

  const openEditModal = (listing: Row) => {
    setEditingListing(listing)
    const listed = resolvePriceMoney(listing.listedPriceMoney ?? listing.listedPrice, 'USD')
    const cur = listed.currency_code
    const baseAmt = listed.amount
    const existingPrices: PriceMoney[] =
      Array.isArray(listing.prices) && (listing.prices as PriceMoney[]).length > 0
        ? (listing.prices as PriceMoney[])
        : Array.isArray(listing.price) && (listing.price as PriceMoney[]).length > 0
          ? (listing.price as PriceMoney[])
          : expandUsdPrice(baseAmt)

    setEditForm({
      externalListingId: String(listing.externalListingId ?? ''),
      externalVariantId: String(listing.externalVariantId ?? ''),
      externalSku: String(listing.externalSku ?? ''),
      asin: String(listing.asin ?? ''),
      channelCategoryId: String(listing.channelCategoryId ?? ''),
      channelTitle: String(listing.channelTitle ?? listing.productTitle ?? ''),
      channelDescription: String(listing.channelDescription ?? ''),
      currencyCode: cur,
      listedPrice: String(baseAmt),
      prices: existingPrices,
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
      const csrf = getCsrfToken()
      const res = await fetch(`/channel-listings/${editingListing.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(csrf ? { 'X-XSRF-TOKEN': csrf } : {}),
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
          prices: editForm.prices,
          allocatedQuantity: Number(editForm.allocatedQuantity),
          listingStatus: editForm.listingStatus,
          publicationStatus: editForm.publicationStatus,
        }),
      })
      const data = await res.json()
      if (data.ok || data.success) {
        setBanner({
          tone: 'success',
          message: `Updated listing ${editForm.externalListingId} (${editForm.externalSku}) and synced ${editForm.prices.length} multi-currency ChannelListingPrice records.`,
        })
        setEditingListing(null)
        router.reload()
      } else {
        setBanner({ tone: 'error', message: data.error ?? 'Failed to update listing.' })
      }
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Network error updating listing.',
      })
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
          platform: selectedPlatforms[0] ?? 'medusa',
          productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
          sellerAccountId:
            selectedPlatforms.length === 1 ? selectedSellerAccountId || undefined : undefined,
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
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Network error generating listings.',
      })
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
        listedPriceMoney: l.listedPriceMoney,
        prices: l.prices ?? l.price,
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
    <Stack gap={6}>
      <PageHeader
        title="Platform Listings Studio (/listing)"
        description="View generated e-commerce listings grouped by Variant SKU across Medusa Website, Amazon SP-API, eBay Inventory API, and Etsy Open API v3 with multi-currency ChannelListingPrice arrays."
        icon={Globe}
        badge={`${skuGroups.length} SKUs · ${channelListings.length} platform listings · ${syncedCount} synced`}
        actions={
          <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
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
          </Stack>
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
        <FeedbackBanner
          tone={banner.tone}
          message={banner.message}
          onDismiss={() => setBanner(null)}
        />
      )}

      {/* Filter & View Switcher Toolbar + Card-Based SKU Listings */}
      <PageSection
        title="Multi-Platform Listings Grouped by SKU"
        description="Each SKU card groups its generated Medusa Website, Amazon, eBay, and Etsy listings together with multi-currency ChannelListingPrice badges, draft exports and JSON download. Marketplace publishing is not configured."
      >
        <Stack gap={4}>
          <Stack
            justify="between"
            gap={3}
            padding={3}
            className="lg:flex-row lg:items-center rounded-2xl border border-card-border bg-muted/25"
          >
            <Stack direction="horizontal" align="center" wrap="wrap" gap={2} className="flex-1">
              <Stack className="w-full sm:w-64">
                <AppInput
                  icon={Search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  placeholder="Search SKU, Product, Brand..."
                />
              </Stack>
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
              <Stack className="w-40">
                <AppSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active / Published' },
                    { value: 'draft', label: 'Draft' },
                  ]}
                />
              </Stack>
            </Stack>

            <Stack direction="horizontal" align="center" gap={2}>
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
            </Stack>
          </Stack>

          {viewMode === 'grouped' ? (
            filteredSkuGroups.length === 0 ? (
              <Stack
                gap={3}
                padding={10}
                className="rounded-2xl border border-dashed border-border text-center"
              >
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
              </Stack>
            ) : (
              <Stack gap={4}>
                {filteredSkuGroups.map((group) => (
                  <Stack
                    key={group.sku}
                    className="rounded-2xl border border-card-border bg-card overflow-hidden shadow-xs"
                  >
                    <Stack
                      justify="between"
                      gap={3}
                      paddingInline={5}
                      paddingBlock={3}
                      className="md:flex-row md:items-center border-b border-divider bg-muted/30"
                    >
                      <Stack gap={1}>
                        <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
                          <MonoBadge text={group.sku} />
                          <Badge label={`Brand: ${group.brandName}`} variant="purple" />
                          <Badge label={group.categoryName} variant="neutral" />
                          <Badge
                            label={`${group.platforms.length} Platform Listings`}
                            variant="info"
                          />
                        </Stack>
                        <Stack className="text-sm font-extrabold text-foreground">
                          {group.productTitle}{' '}
                          <Text color="secondary" weight="normal">
                            — {group.variantTitle}
                          </Text>
                        </Stack>
                      </Stack>
                      <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
                        <Stack className="text-xs text-muted-foreground mr-2">
                          Base Retail:{' '}
                          <strong className="text-price-current">
                            {convertToLocale({
                              amount: group.retailPrice,
                              currency_code: 'USD',
                            })}
                          </strong>{' '}
                          · Stock: <strong>{group.stockOnHand}</strong>
                        </Stack>
                        <AppButton
                          disabled
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
                      </Stack>
                    </Stack>

                    {group.platforms.length === 0 ? (
                      <Stack
                        direction="horizontal"
                        align="center"
                        justify="between"
                        padding={4}
                        className="text-xs text-muted-foreground"
                      >
                        <Text>No platform listings created for this SKU yet.</Text>
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
                      </Stack>
                    ) : (
                      <Grid
                        columns={{ minWidth: 220, max: 1 }}
                        className="md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-divider"
                      >
                        {group.platforms.map((listing) => {
                          const platKey = String(listing.platform ?? 'medusa').toLowerCase()
                          const platMeta = PLATFORM_BADGES[platKey] ?? {
                            label: platKey.toUpperCase(),
                            variant: 'neutral',
                          }
                          const isSynced = listing.syncStatus === 'synced'
                          const lCur = String(listing.currencyCode ?? 'USD')
                          const lPrices: PriceMoney[] = Array.isArray(listing.prices)
                            ? (listing.prices as PriceMoney[])
                            : Array.isArray(listing.price)
                              ? (listing.price as PriceMoney[])
                              : [
                                  resolvePriceMoney(
                                    listing.listedPriceMoney ?? listing.listedPrice,
                                    lCur
                                  ),
                                ]

                          return (
                            <Stack
                              justify="between"
                              gap={3}
                              padding={4}
                              key={String(listing.id)}
                              className="hover:bg-muted/15 transition-colors"
                            >
                              <Stack gap={2}>
                                <Stack
                                  direction="horizontal"
                                  align="center"
                                  justify="between"
                                  gap={2}
                                >
                                  <Badge label={platMeta.label} variant={platMeta.variant} />
                                  <Badge
                                    label={
                                      isSynced
                                        ? 'Published / Synced'
                                        : String(listing.listingStatus)
                                    }
                                    variant={isSynced ? 'success' : 'warning'}
                                  />
                                </Stack>
                                <Stack className="font-mono text-xs font-bold text-foreground break-all">
                                  ID: {String(listing.externalListingId)}
                                </Stack>
                                <Stack gap={1.5} className="pt-1">
                                  <Stack
                                    direction="horizontal"
                                    align="center"
                                    justify="between"
                                    className="text-xs text-muted-foreground"
                                  >
                                    <Text>Multi-Currency Prices:</Text>
                                    <Text>
                                      Qty:{' '}
                                      <strong className="text-foreground">
                                        {String(listing.allocatedQuantity)}
                                      </strong>
                                    </Text>
                                  </Stack>
                                  <MultiCurrencyPriceStack
                                    prices={lPrices}
                                    primaryCurrency={lCur}
                                    maxBadges={4}
                                  />
                                </Stack>
                                {listing.publishedUrl && (
                                  <Stack className="text-2xs font-mono text-success truncate">
                                    ✓ {String(listing.publishedUrl)}
                                  </Stack>
                                )}
                              </Stack>

                              <Stack
                                direction="horizontal"
                                align="center"
                                wrap="wrap"
                                gap={1.5}
                                className="pt-2.5 border-t border-divider"
                              >
                                <AppButton
                                  disabled
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
                              </Stack>
                            </Stack>
                          )
                        })}
                      </Grid>
                    )}
                  </Stack>
                ))}
              </Stack>
            )
          ) : (
            <Stack className="overflow-x-auto rounded-2xl border border-card-border bg-card shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-divider bg-muted/40 text-2xs font-bold uppercase text-muted-foreground">
                    <th className="py-3.5 px-4">Variant SKU</th>
                    <th className="py-3.5 px-4">Platform</th>
                    <th className="py-3.5 px-4">External Listing ID</th>
                    <th className="py-3.5 px-4">Product & Brand</th>
                    <th className="py-3.5 px-4">Multi-Currency Prices & Qty</th>
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
                    const lCur = String(l.currencyCode ?? 'USD')
                    const lPrices: PriceMoney[] = Array.isArray(l.prices)
                      ? (l.prices as PriceMoney[])
                      : [resolvePriceMoney(l.listedPriceMoney ?? l.listedPrice, lCur)]
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
                          <Stack className="font-bold text-foreground">
                            {String(l.productTitle)}
                          </Stack>
                          <Stack className="text-muted-foreground">
                            Brand: {String(l.brandName)}
                          </Stack>
                        </td>
                        <td className="py-3 px-4">
                          <MultiCurrencyPriceStack
                            prices={lPrices}
                            primaryCurrency={lCur}
                            maxBadges={4}
                          />
                          <Stack className="text-muted-foreground mt-1">
                            Qty: {String(l.allocatedQuantity)}
                          </Stack>
                        </td>
                        <td className="py-3 px-4">
                          <Stack direction="horizontal" align="center" gap={1.5}>
                            <Badge
                              label={String(l.listingStatus)}
                              variant={STATUS_TONES[String(l.listingStatus)] ?? 'neutral'}
                            />
                            <Badge
                              label={String(l.syncStatus)}
                              variant={l.syncStatus === 'synced' ? 'success' : 'warning'}
                            />
                          </Stack>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Stack direction="horizontal" align="center" justify="end" gap={1.5}>
                            <AppButton
                              disabled
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
                          </Stack>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Stack>
          )}
        </Stack>
      </PageSection>

      {/* =====================================================================
          MODAL 1: GENERATE MULTI-PLATFORM LISTINGS FROM PRODUCTS + BRAND
         ===================================================================== */}
      <GenerateListingsModal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        brands={brands}
        sellerAccounts={sellerAccounts}
        products={products}
        selectedBrandId={selectedBrandId}
        setSelectedBrandId={setSelectedBrandId}
        selectedSellerAccountId={selectedSellerAccountId}
        setSelectedSellerAccountId={setSelectedSellerAccountId}
        selectedPlatforms={selectedPlatforms}
        setSelectedPlatforms={setSelectedPlatforms}
        selectedProductIds={selectedProductIds}
        setSelectedProductIds={setSelectedProductIds}
        priceMultiplier={priceMultiplier}
        setPriceMultiplier={setPriceMultiplier}
        assignBrandToProduct={assignBrandToProduct}
        setAssignBrandToProduct={setAssignBrandToProduct}
        busyKey={busyKey}
        onGenerate={handleGenerateListings}
        platformBadges={PLATFORM_BADGES}
      />

      {/* =====================================================================
          MODAL 2: COMPLETE EDIT CHANNEL LISTING MODAL (WITH MULTI-CURRENCY PRICES)
         ===================================================================== */}
      <EditListingModal
        listing={editingListing}
        onClose={() => setEditingListing(null)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={handleSaveListingEdit}
      />

      {/* =====================================================================
          SLIDE-OVER DRAWER: PLATFORM LISTING JSON PAYLOAD INSPECTOR
         ===================================================================== */}
      <ListingDetailDrawer
        listing={inspectListing}
        onClose={() => setInspectListing(null)}
        onPublishListing={(item) => {
          setInspectListing(null)
          handlePublishSingleListing(item)
        }}
      />
    </Stack>
  )
}
