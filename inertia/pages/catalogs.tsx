import { Grid } from '@astryxdesign/core/Grid'
import { Stack, VStack, HStack } from '@astryxdesign/core/Stack'
import { Table, proportional } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { router } from '@inertiajs/react'
import { FeedbackBanner } from '~/modules/common/feedback-banner'
import { getCsrfToken } from '~/lib/cookies'
import {
  PageHeader,
  PageSection,
  TopStatusBar,
  AppButton,
  AppInput,
  AppTextarea,
  AppSelect,
  Accordion,
  AccordionItem,
  SlideOverDrawer,
  Badge,
  MonoBadge,
  MultiCurrencyPriceStack,
  MultiCurrencyPriceBadges,
  convertToLocale,
  type PriceMoney,
  type Row,
} from '~/lib/ui'
import { expandUsdPrice } from '~/lib/currency'
import type React from 'react'
import { useState, useMemo } from 'react'
import {
  Layers,
  RefreshCw,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  X,
  FileJson,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Search,
} from 'lucide-react'

type ModularConfig = {
  skuFormat: string
  fileNameFormat: string
  skuExample: string
  fileExample: string
  genders: Record<string, string>
  categories: Record<string, string>
  productCodes: Record<string, Record<string, string>>
  fits: Record<string, string>
  lengths: Record<string, string>
  leatherCodes: Record<string, string>
  colorCodes: Record<string, { name: string; colorMap: string }>
  sizeGroups: string[]
  priceTiers: Record<string, { label: string; currency: string; prices: Record<string, number> }>
}

type PreviewVariant = {
  sku: string
  title: string
  colorCode: string
  colorName: string
  colorMap: string
  sizeCode: string
  sizeLabel: string
  sizeValue?: string
  sizeKey?: string
  retailPrice: number
  prices?: PriceMoney[]
  costPrice: number
  manufacturingCost: number
  packagingCost: number
  stockOnHand: number
  barcode: string
}

type GeneratedProductPreview = {
  catalogItemId: string
  skuKey: string
  catalogKey?: string
  structuredBaseCode: string
  structuredCode?: string
  title: string
  subTitle: string
  description: string
  categoryId: string | null
  categoryName: string
  categoryHandle: string
  productType: string
  type?: string
  genderCode?: string
  gender?: string
  categoryCode?: string
  productCode?: string
  fitCode?: string
  lengthCode?: string
  leatherCode?: string
  materialCode?: string
  priceTierCode: string
  priceTier?: string
  variationDimensions?: string[]
  attributes: Record<string, unknown>
  features?: string[]
  tags: string[]
  variants: PreviewVariant[]
}

type Props = {
  catalogItems?: Row[]
  categories?: Row[]
  products?: Row[]
  brands?: Row[]
  sellerAccounts?: Row[]
  channelListings?: Row[]
  modularConfig?: ModularConfig
  catalogConfig?: any
  sampleCatalogJson?: any
  salesChannels?: Row[]
  orders?: Row[]
  orderLineItems?: Row[]
  financeCategories?: Row[]
  savedViews?: Row[]
  [key: string]: any
}

export default function Catalogs({
  catalogItems = [],
  categories = [],
  products = [],
  brands = [],
  sellerAccounts = [],
  modularConfig,
  sampleCatalogJson = {},
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [banner, setBanner] = useState<{
    tone: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [importJsonModalOpen, setImportJsonModalOpen] = useState(false)
  const [importTier, setImportTier] = useState('01')
  const [importSkuFormat, setImportSkuFormat] = useState('standard')
  const [importStock, setImportStock] = useState('25')
  const [listingBrand, setListingBrand] = useState('')
  const [listingPlatform, setListingPlatform] = useState('medusa')
  const [listingAccount, setListingAccount] = useState('')
  const [listingProductIds, setListingProductIds] = useState<string[]>([])
  const [assignDefaultBrand, setAssignDefaultBrand] = useState(false)
  const [listingPreview, setListingPreview] = useState<{
    filename: string
    payload: unknown
  } | null>(null)
  const [catalogJsonText, setCatalogJsonText] = useState<string>(() =>
    JSON.stringify(sampleCatalogJson, null, 2)
  )
  const [editCatalogModalOpen, setEditCatalogModalOpen] = useState(false)
  const [editingCatalogItem, setEditingCatalogItem] = useState<Row | null>(null)
  const [detailDrawerItem, setDetailDrawerItem] = useState<Row | null>(null)

  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewData, setPreviewData] = useState<GeneratedProductPreview | null>(null)
  const [convertingProduct, setConvertingProduct] = useState(false)

  // Complete Form State covering 100% of CatalogItem + CatalogAttributes fields
  const [formState, setFormState] = useState({
    id: '',
    skuCode: '',
    structuredCode: '',
    fileName: '',
    status: 'draft',
    title: '',
    subTitle: '',
    productType: 'Duster Coat',
    categoryHandle: 'mens/apparel/outerwear/coats/duster-coats',
    resolvedCategoryId: '',
    genderCode: 'M',
    lengthCode: 'MX',
    leatherCode: 'NP',
    priceTierCode: '01',
    pattern: 'Solid',
    sizeGroup: 'alpha',
    colorCodes: 'BLK, BLU',
    sizeCodes: 'S, M, L, XL, 2XL',
    stockPerVariant: '25',
    costPrice: '95',
    manufacturingCost: '80',
    packagingCost: '15',
    imagesCsv: 'https://example.com/image1.jpg, https://example.com/image2.jpg',
    tagsCsv: 'leather, outerwear, duster coat',
    material: 'Leather',
    fabric: '100% Lambskin Leather',
    lining: 'Polyester',
    hardware: 'Durable Black Matte Buttons',
    closure: 'Single-Breasted Front Button Closure',
    closureTypeCsv: 'Zipper, Snap',
    coatSilhouetteType: 'Overcoat',
    collar: 'Classic Notch Lapel Collar with Button-Up Throat Latch',
    collarType: 'Notch Collar',
    sleeveLength: 'Long Sleeve',
    sleeveType: 'Cuff Sleeve',
    pocketDescription:
      'Two external waist-level flap pockets and two internal pockets for secure storage.',
    pocketsCsv: 'Welt Pocket, Utility Pocket, Flap Pocket, Slit Pocket',
    modelName: 'Velocity Long Duster Coat',
    sizeType: 'regular',
    ageGroup: 'adult',
    careInstructions: 'Professional Leather Clean Only',
    description: '',
    featuresLines:
      'PREMIUM LAMBSKIN LEATHER: Crafted from supple 100% real lambskin leather\nICONIC DUSTER DESIGN & FIT: Full-length western duster silhouette\nCLASSIC BUTTON CLOSURE: Durable matte hardware with storm flap\nVERSATILE COLLAR & POCKETS: Multi-pocket interior & exterior storage',
    keywordsLines:
      'mens real leather duster coat; full length leather trench coat; western duster overcoat',
    specialFeaturesLines:
      'Snap-adjustable hem\nSnap-adjustable cuffs\nMultiple zip and utility pockets\nStand collar with snap closure',
  })

  const availableTypes = useMemo(() => {
    const set = new Set<string>()
    for (const item of catalogItems) {
      const t = item.productType || item.type
      if (t) set.add(String(t))
    }
    return Array.from(set)
  }, [catalogItems])

  const filteredItems = useMemo(() => {
    return catalogItems.filter((item) => {
      const itemGenderCode = String(item.genderCode || item.gender || '')
      const itemCategoryCode = String(item.categoryCode || '')
      const itemType = String(item.productType || item.type || '')
      const itemStatus = String(item.status || 'draft')

      if (
        genderFilter !== 'all' &&
        itemGenderCode !== genderFilter &&
        String(item.gender || '').toLowerCase() !== genderFilter.toLowerCase()
      ) {
        return false
      }
      if (categoryFilter !== 'all' && itemCategoryCode !== categoryFilter) return false
      if (typeFilter !== 'all' && itemType !== typeFilter) return false
      if (statusFilter !== 'all') {
        if (statusFilter === 'ready' && itemStatus === 'converted') return false
        if (statusFilter === 'converted' && itemStatus !== 'converted') return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const hay = [
          item.skuCode,
          item.catalogKey,
          item.structuredBaseCode,
          item.structuredCode,
          item.title,
          item.productType,
          item.type,
          item.categoryHandle,
          item.categoryName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [catalogItems, genderFilter, categoryFilter, typeFilter, statusFilter, searchQuery])

  const openCreateModal = () => {
    setEditingCatalogItem(null)
    const nextNum = catalogItems.length + 1
    const seq = String(nextNum).padStart(2, '0')
    setFormState({
      id: '',
      skuCode: `SKU${nextNum}`,
      structuredCode: `MJKBK${seq}`,
      fileName: `MJKBK${seq}-BLK-NP-SL`,
      status: 'draft',
      title: '',
      subTitle: '',
      productType: 'Biker Jacket',
      categoryHandle: 'men/outerwear/jackets/biker-motorcycle',
      resolvedCategoryId: '',
      genderCode: 'M',
      lengthCode: 'XX',
      leatherCode: 'NP',
      priceTierCode: '02',
      pattern: 'Solid',
      sizeGroup: 'alpha',
      colorCodes: 'BLK, BRN',
      sizeCodes: 'S, M, L, XL, 2XL',
      stockPerVariant: '25',
      costPrice: '85',
      manufacturingCost: '70',
      packagingCost: '15',
      imagesCsv: 'https://example.com/image1.jpg, https://example.com/image2.jpg',
      tagsCsv: 'leather, jacket, biker, motorcycle',
      material: 'Leather',
      fabric: '100% Lambskin Leather',
      lining: 'Soft Quilted Polyester',
      hardware: 'Antique Brass YKK Zippers',
      closure: 'Asymmetrical Front Zipper Closure',
      closureTypeCsv: 'Zipper, Snap',
      coatSilhouetteType: 'Motorcycle Jacket',
      collar: 'Snap-Down Lapel Collar',
      collarType: 'Notch Lapel',
      sleeveLength: 'Long Sleeve',
      sleeveType: 'Zipper Gusset Cuff Sleeve',
      pocketDescription:
        'Three external zippered pockets and two internal leather-trimmed pockets.',
      pocketsCsv: 'Zip Pocket, Coin Flap Pocket, Interior Welt Pocket',
      modelName: 'Apex Moto Biker Jacket',
      sizeType: 'regular',
      ageGroup: 'adult',
      careInstructions: 'Professional Leather Clean Only',
      description: 'Premium handcrafted genuine lambskin leather motorcycle jacket.',
      featuresLines:
        '100% Genuine Lambskin Leather\nHeavy-Duty YKK Zippers\nInterior & Exterior Security Pockets\nBreathable Quilted Liner',
      keywordsLines: 'biker leather jacket; mens motorcycle jacket; lambskin moto jacket',
      specialFeaturesLines:
        'Zippered cuffs\nAction back bi-swing shoulders\nReinforced elbow panels',
    })
    setEditCatalogModalOpen(true)
  }

  const openEditModal = (item: Row) => {
    setEditingCatalogItem(item)
    const attrs = (item.attributes as Record<string, any>) ?? {}
    const variantsConfig =
      (item.variantsConfig as Record<string, any>) ??
      (item.variantsSpec as Record<string, any>) ??
      {}
    const colors = Array.isArray(item.colorCodes)
      ? item.colorCodes
      : Array.isArray(variantsConfig.color)
        ? variantsConfig.color
        : ['BLK']
    const sizes = Array.isArray(item.sizeCodes)
      ? item.sizeCodes
      : Array.isArray(variantsConfig.size)
        ? variantsConfig.size
        : ['S', 'M', 'L', 'XL']

    setFormState({
      id: String(item.id),
      skuCode: String(item.skuCode ?? item.catalogKey ?? ''),
      structuredCode: String(item.structuredBaseCode ?? item.structuredCode ?? ''),
      fileName: String(item.fileName ?? ''),
      status: String(item.status ?? 'draft'),
      title: String(item.title ?? ''),
      subTitle: String(item.subTitle ?? ''),
      productType: String(item.productType ?? item.type ?? 'Duster Coat'),
      categoryHandle: String(item.categoryHandle ?? 'men/outerwear/coats/duster'),
      resolvedCategoryId: String(item.resolvedCategoryId ?? ''),
      genderCode: String(item.genderCode ?? 'M'),
      lengthCode: String(item.lengthCode ?? 'MX'),
      leatherCode: String(item.leatherCode ?? item.materialCode ?? 'NP'),
      priceTierCode: String(item.priceTierCode ?? item.priceTier ?? '01'),
      pattern: String(item.pattern ?? 'Solid'),
      sizeGroup: String(variantsConfig.sizeGroup ?? variantsConfig.size_group ?? 'alpha'),
      colorCodes: colors.join(', '),
      sizeCodes: sizes.join(', '),
      stockPerVariant: '25',
      costPrice: '95',
      manufacturingCost: '80',
      packagingCost: '15',
      imagesCsv: Array.isArray(item.images) ? item.images.join(', ') : '',
      tagsCsv: Array.isArray(item.tags) ? item.tags.join(', ') : '',
      material: String(attrs.material ?? 'Leather'),
      fabric: String(attrs.fabric ?? '100% Lambskin Leather'),
      lining: String(attrs.lining ?? 'Polyester'),
      hardware: String(attrs.hardware ?? 'Durable Black Matte Buttons'),
      closure: String(attrs.closure ?? 'Single-Breasted Front Button Closure'),
      closureTypeCsv: Array.isArray(attrs.closure_type)
        ? attrs.closure_type.join(', ')
        : 'Zipper, Snap',
      coatSilhouetteType: String(attrs.coat_silhouette_type ?? 'Overcoat'),
      collar: String(attrs.collar ?? 'Classic Notch Lapel Collar'),
      collarType: String(attrs.collar_type ?? 'Notch Collar'),
      sleeveLength: String(attrs.sleeve_length ?? 'Long Sleeve'),
      sleeveType: String(attrs.sleeve_type ?? 'Cuff Sleeve'),
      pocketDescription: String(attrs.pocket_description ?? ''),
      pocketsCsv: Array.isArray(attrs.pockets) ? attrs.pockets.join(', ') : '',
      modelName: String(attrs.model_name ?? item.title ?? ''),
      sizeType: String(attrs.size_type ?? 'regular'),
      ageGroup: String(attrs.age_group ?? 'adult'),
      careInstructions: String(attrs.care_instructions ?? 'Professional Leather Clean Only'),
      description: String(item.description ?? ''),
      featuresLines: Array.isArray(attrs.bullets)
        ? attrs.bullets.join('\n')
        : Array.isArray(item.features)
          ? item.features.join('\n')
          : '',
      keywordsLines: Array.isArray(attrs.generic_keyword) ? attrs.generic_keyword.join('\n') : '',
      specialFeaturesLines: Array.isArray(attrs.special_feature)
        ? attrs.special_feature.join('\n')
        : '',
    })
    setEditCatalogModalOpen(true)
  }

  const handleSaveCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusyId('save-catalog')
    setBanner(null)
    try {
      const endpoint = formState.id ? `/catalog-items/${formState.id}` : '/catalog-items'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          ...formState,
          catalogKey: formState.skuCode,
          type: formState.productType,
          gender: formState.genderCode,
          priceTier: formState.priceTierCode,
          colorsCsv: formState.colorCodes,
          sizesCsv: formState.sizeCodes,
          bulletsText: formState.featuresLines,
          keywordsText: formState.keywordsLines,
        }),
      })
      const data = await res.json()
      if (!res.ok || (!data.ok && !data.success)) {
        setBanner({ tone: 'error', message: data.error ?? 'Failed to save catalog SKU.' })
      } else {
        setBanner({
          tone: 'success',
          message: `Saved Catalog SKU ${data.item?.skuCode ?? formState.skuCode} (${data.item?.structuredBaseCode ?? ''}).`,
        })
        setEditCatalogModalOpen(false)
        router.reload()
      }
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Network error saving catalog item.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleDeleteCatalogItem = async (item: Row) => {
    setBusyId(`del-${item.id}`)
    setBanner(null)
    try {
      const csrf = getCsrfToken()
      const res = await fetch(`/catalog-items/${item.id}/delete`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(csrf ? { 'X-XSRF-TOKEN': csrf } : {}),
        },
      })
      const data = await res.json()
      if (data.ok || data.success) {
        setBanner({
          tone: 'info',
          message: `Deleted catalog SKU ${item.skuCode ?? item.catalogKey}.`,
        })
        if (detailDrawerItem?.id === item.id) setDetailDrawerItem(null)
        router.reload()
      } else {
        setBanner({ tone: 'error', message: data.error ?? 'Failed to delete catalog item.' })
      }
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Network error deleting catalog item.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleSyncCategories = async (source: 'configured' | 'built-in' = 'configured') => {
    setBusyId('sync-cat')
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
        body: JSON.stringify({ source }),
      })
      const data = await res.json()
      if (data.ok || data.success) {
        setBanner({
          tone: 'success',
          message:
            data.message ||
            `Synced ${data.totalCategories ?? 0} hierarchical Medusa product categories.`,
        })
        router.reload()
      } else {
        setBanner({ tone: 'error', message: data.error ?? 'Category sync failed.' })
      }
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Network error syncing categories.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleImportCatalogJson = async () => {
    setBusyId('import-json')
    setBanner(null)
    try {
      const parsed = JSON.parse(catalogJsonText)
      const res = await fetch('/catalogs/import-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          catalogPayload: parsed,
          priceTier: importTier,
          skuFormat: importSkuFormat,
          defaultStockOnHand: Number(importStock),
          convertImmediately: true,
        }),
      })
      const data = await res.json()
      if (!res.ok || (!data.ok && !data.success)) {
        setBanner({ tone: 'error', message: data.error ?? 'Catalog JSON import failed.' })
      } else {
        setBanner({
          tone: 'success',
          message:
            data.message ||
            `Imported ${data.savedCatalogCount ?? data.catalogItemsSaved ?? 0} Catalog SKUs into database.`,
        })
        setImportJsonModalOpen(false)
        router.reload()
      }
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Invalid JSON syntax.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleGenerateListings = async (persist: boolean) => {
    if (!listingBrand) {
      setBanner({ tone: 'error', message: 'Select a brand first.' })
      return
    }
    setBusyId('listing-generator')
    try {
      const res = await fetch('/catalogs/generate-listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          brandId: listingBrand,
          platform: listingPlatform,
          productIds: listingProductIds,
          sellerAccountId: listingAccount || undefined,
          assignBrandToProduct: persist && assignDefaultBrand,
          persistChannelListings: persist,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Listing generation failed.')
      setListingPreview({ filename: data.filename, payload: data.payload })
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data.payload, null, 2)], { type: 'application/json' })
      )
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = data.filename
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setBanner({
        tone: 'success',
        message: persist
          ? `Saved ${data.listingsPersisted} draft listings; download is ready.`
          : 'Preview generated without changing products or listings.',
      })
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Listing generation failed.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleOpenConvertPreview = async (item: Row) => {
    setBusyId(`preview-${item.id}`)
    setBanner(null)
    try {
      const res = await fetch(`/catalog-items/${item.id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
      })
      const data = await res.json()
      if (!res.ok || !data.preview) {
        setBanner({ tone: 'error', message: data.error ?? 'Failed to build product preview.' })
      } else {
        const rawPrev = data.preview
        setPreviewData({
          ...rawPrev,
          skuKey: rawPrev.skuKey || rawPrev.catalogKey || String(item.skuCode ?? item.catalogKey),
          structuredBaseCode:
            rawPrev.structuredBaseCode ||
            rawPrev.structuredCode ||
            String(item.structuredBaseCode ?? item.structuredCode ?? ''),
          priceTierCode: rawPrev.priceTierCode || rawPrev.priceTier || '01',
          variants: (rawPrev.variants ?? []).map((v: any, idx: number) => ({
            ...v,
            sizeCode: v.sizeCode || v.sizeValue || 'M',
            sizeLabel: v.sizeLabel || v.sizeKey || 'Medium',
            barcode: v.barcode || `299000${idx + 1}`,
          })),
        })
        setPreviewModalOpen(true)
      }
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Failed to load preview.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const updatePreviewVariant = (
    idx: number,
    field: keyof PreviewVariant,
    value: string | number
  ) => {
    if (!previewData) return
    const nextVariants = [...previewData.variants]
    const current = nextVariants[idx]
    nextVariants[idx] = {
      ...current,
      [field]: value,
      ...(field === 'sizeLabel' ? { sizeKey: String(value) } : {}),
      ...(field === 'sizeCode' ? { sizeValue: String(value) } : {}),
      // The catalog only edits the USD anchor; the price array is derived from it.
      ...(field === 'retailPrice'
        ? { prices: expandUsdPrice(Number(value), { existing: current.prices }) }
        : {}),
    }
    setPreviewData({
      ...previewData,
      variants: nextVariants,
    })
  }

  const removePreviewVariant = (idx: number) => {
    if (!previewData) return
    setPreviewData({
      ...previewData,
      variants: previewData.variants.filter((_, i) => i !== idx),
    })
  }

  const addBlankPreviewVariant = () => {
    if (!previewData) return
    const seq = previewData.variants.length + 1
    setPreviewData({
      ...previewData,
      variants: [
        ...previewData.variants,
        {
          sku: `${previewData.structuredBaseCode}-BLK-NP-RG-C${seq}`,
          title: `${previewData.title} — Black / Custom ${seq}`,
          colorCode: 'BLK',
          colorName: 'Black',
          colorMap: 'Black',
          sizeCode: 'CS',
          sizeLabel: `Custom ${seq}`,
          sizeValue: 'CS',
          sizeKey: `Custom ${seq}`,
          retailPrice: previewData.variants[0]?.retailPrice ?? 229.99,
          costPrice: previewData.variants[0]?.costPrice ?? 95,
          manufacturingCost: previewData.variants[0]?.manufacturingCost ?? 80,
          packagingCost: previewData.variants[0]?.packagingCost ?? 15,
          stockOnHand: 20,
          barcode: `299000${seq}`,
        },
      ],
    })
  }

  const handleConfirmConvertToProduct = async () => {
    if (!previewData) return
    setConvertingProduct(true)
    setBanner(null)
    try {
      const res = await fetch(`/catalog-items/${previewData.catalogItemId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          preview: previewData,
        }),
      })
      const data = await res.json()
      if (!res.ok || (!data.ok && !data.success)) {
        setBanner({ tone: 'error', message: data.error ?? 'Conversion to Product failed.' })
      } else {
        setBanner({
          tone: 'success',
          message: `Created Product "${previewData.title}" with ${data.variantsCreated} variants (Brand-Agnostic). Ready to link with Brand and convert to platform listings in /products!`,
        })
        setPreviewModalOpen(false)
        setPreviewData(null)
        router.reload()
      }
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Network error converting product.',
      })
    } finally {
      setConvertingProduct(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setCatalogJsonText(text)
  }

  const convertedCount = catalogItems.filter((i) => i.status === 'converted').length
  const readyCount = catalogItems.length - convertedCount

  return (
    <Stack gap={6}>
      <PageHeader
        title="Master Catalog Studio (/catalog)"
        description="Brand-agnostic master catalog stored in PostgreSQL with modular SKU/Color/Size/Price config, multi-facet filtering, complete 4-section CRUD modals, and interactive Product & Variant Preview before conversion."
        icon={Layers}
        badge={`${catalogItems.length} catalog SKUs · ${convertedCount} converted · ${categories.length} categories`}
        actions={
          <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
            <AppButton
              label={busyId === 'sync-cat' ? 'Syncing...' : 'Sync Medusa Categories'}
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={busyId === 'sync-cat'}
              onClick={() => handleSyncCategories()}
            />
            <AppButton
              label="Sync built-in taxonomy"
              variant="secondary"
              size="sm"
              loading={busyId === 'sync-cat'}
              onClick={() => handleSyncCategories('built-in')}
            />
            <AppButton
              label="Import Catalog JSON"
              variant="outline"
              size="sm"
              icon={Upload}
              onClick={() => setImportJsonModalOpen(true)}
            />
            <AppButton
              label="+ New Catalog SKU"
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openCreateModal}
            />
            <AppButton
              label="Products (/products) →"
              variant="secondary"
              size="sm"
              onClick={() => router.visit('/products')}
            />
          </Stack>
        }
      />

      <PageSection
        title="Catalog-to-listing pipeline"
        description="Sync categories, import and convert your catalog, then generate listing drafts."
      >
        <VStack gap={4} width="100%">
          <Text type="supporting">
            1. Sync the server-configured Medusa endpoint or bundled taxonomy. 2. Import JSON. 3.
            Review the variant matrix below. 4. Select a brand and export listing drafts.
          </Text>
          <Accordion>
            <AccordionItem title={`Synced category taxonomy (${categories.length})`}>
              <Table
                data={categories}
                idKey={(row: Row) => String(row.id)}
                density="compact"
                textOverflow="truncate"
                columns={[
                  {
                    key: 'name',
                    header: 'Category',
                    width: proportional(1),
                    renderCell: (row: Row) => String(row.name ?? ''),
                  },
                  {
                    key: 'taxonomyPath',
                    header: 'Handle',
                    width: proportional(2),
                    renderCell: (row: Row) => String(row.taxonomyPath || row.slug || ''),
                  },
                  {
                    key: 'taxonomy',
                    header: 'Platform taxonomy',
                    width: proportional(2),
                    renderCell: (row: Row) => {
                      const raw = row.attributesSchema
                      const m = (Array.isArray(raw) ? raw[0] : raw)?.metadata ?? {}
                      return (
                        [
                          'amazon_browse_node',
                          'ebay_category_id',
                          'etsy_taxonomy_id',
                          'google_product_category_id',
                        ]
                          .map((key) => m[key])
                          .filter(Boolean)
                          .join(' / ') || '—'
                      )
                    },
                  },
                ]}
              />
            </AccordionItem>
          </Accordion>
          <Text type="body" weight="semibold">
            4. Brand and listing export
          </Text>
          <Stack direction="horizontal" gap={3} wrap="wrap">
            <AppSelect
              label="Brand"
              value={listingBrand}
              onChange={(e) => setListingBrand(e.target.value)}
              options={[
                { value: '', label: 'Select a brand' },
                ...brands.map((brand) => ({ value: String(brand.id), label: String(brand.name) })),
              ]}
            />
            <AppSelect
              label="Platform"
              value={listingPlatform}
              onChange={(e) => {
                setListingPlatform(e.target.value)
                setListingAccount('')
              }}
              options={[
                { value: 'medusa', label: 'Medusa Website' },
                { value: 'amazon', label: 'Amazon SP-API' },
                { value: 'ebay', label: 'eBay Inventory API' },
                { value: 'etsy', label: 'Etsy Open API v3' },
              ]}
            />
            <AppSelect
              label="Seller account (optional)"
              value={listingAccount}
              onChange={(e) => setListingAccount(e.target.value)}
              options={[
                { value: '', label: 'Use a matching account' },
                ...sellerAccounts.map((account) => ({
                  value: String(account.id),
                  label: String(account.accountName),
                })),
              ]}
            />
          </Stack>
          <Text type="supporting">
            Select products below, or leave all unchecked to use all products with variants.
          </Text>
          <Stack direction="horizontal" wrap="wrap" gap={3}>
            {products.map((product) => (
              <Stack as="label" direction="horizontal" gap={1} key={String(product.id)}>
                <input
                  type="checkbox"
                  checked={listingProductIds.includes(String(product.id))}
                  onChange={(e) =>
                    setListingProductIds((ids) =>
                      e.target.checked
                        ? [...ids, String(product.id)]
                        : ids.filter((id) => id !== String(product.id))
                    )
                  }
                />
                <Text type="body" size="sm">
                  {String(product.title)}
                </Text>
              </Stack>
            ))}
          </Stack>
          <Stack as="label" direction="horizontal" gap={2}>
            <input
              type="checkbox"
              checked={assignDefaultBrand}
              onChange={(e) => setAssignDefaultBrand(e.target.checked)}
            />
            <Text type="body" size="sm">
              Also set as default product brand when saving
            </Text>
          </Stack>
          <HStack gap={2} wrap="wrap">
            <AppButton
              label="Preview & Download Listing JSON"
              variant="secondary"
              size="sm"
              loading={busyId === 'listing-generator'}
              onClick={() => handleGenerateListings(false)}
            />
            <AppButton
              label="Save draft listings & Download"
              variant="primary"
              size="sm"
              loading={busyId === 'listing-generator'}
              onClick={() => handleGenerateListings(true)}
            />
          </HStack>
          {listingPreview && (
            <VStack gap={2} isScrollable>
              <Text type="body" weight="semibold">
                {listingPreview.filename}
              </Text>
              <pre className="overflow-auto whitespace-pre-wrap break-words text-xs">
                {JSON.stringify(listingPreview.payload, null, 2)}
              </pre>
            </VStack>
          )}
        </VStack>
      </PageSection>

      {/* Top Interactive Status Bar */}
      <TopStatusBar
        columns={4}
        items={[
          {
            label: 'Master Catalog SKUs',
            value: String(catalogItems.length),
            sublabel: 'Brand-agnostic SKUs in DB',
            icon: FileJson,
            tone: 'primary',
            active: statusFilter === 'all',
            onClick: () => setStatusFilter('all'),
          },
          {
            label: 'Ready to Convert',
            value: String(readyCount),
            sublabel: 'Click to filter ready SKUs',
            icon: Sparkles,
            tone: 'warning',
            active: statusFilter === 'ready',
            onClick: () => setStatusFilter((p) => (p === 'ready' ? 'all' : 'ready')),
          },
          {
            label: 'Converted to Products',
            value: `${convertedCount} / ${catalogItems.length}`,
            sublabel: `${products.length} total parent products`,
            icon: PackageCheck,
            tone: 'success',
            active: statusFilter === 'converted',
            onClick: () => setStatusFilter((p) => (p === 'converted' ? 'all' : 'converted')),
          },
          {
            label: 'Synced Medusa Categories',
            value: String(categories.length),
            sublabel: 'From /store/product-categories',
            icon: RefreshCw,
            tone: 'info',
          },
        ]}
      />

      {/* Feedback Banner */}
      {banner && (
        <FeedbackBanner
          tone={banner.tone}
          message={banner.message}
          onDismiss={() => setBanner(null)}
        />
      )}

      {/* Collapsible Accordion for Modular Catalog Config Reference */}
      {modularConfig && (
        <Accordion>
          <AccordionItem
            title="Modular Catalog Config Reference (app/data/catalog_config/*)"
            subtitle="Inspect split SKU format, 38 color codes, alpha/numeric size matrices, and 3 price tiers."
            icon={Sparkles}
            badge={`${Object.keys(modularConfig.colorCodes).length} Colors · 3 Tiers`}
            badgeVariant="info"
          >
            <Grid
              columns={{ minWidth: 220, max: 1 }}
              className="md:grid-cols-2 lg:grid-cols-4 text-xs"
            >
              <Stack gap={2} padding={3} className="rounded-xl border border-card-border bg-card">
                <Stack
                  direction="horizontal"
                  align="center"
                  justify="between"
                  className="font-bold text-foreground"
                >
                  <Text>sku.ts & taxonomy.ts</Text>
                  <MonoBadge text="SKU Format" />
                </Stack>
                <p className="font-mono text-2xs text-primary break-all">
                  {modularConfig.skuFormat}
                </p>
                <Stack gap={1} className="text-muted-foreground">
                  <Stack>
                    <strong>Genders:</strong>{' '}
                    {Object.entries(modularConfig.genders)
                      .map(([code, label]) => `${label} (${code})`)
                      .join(', ')}
                  </Stack>
                  <Stack>
                    <strong>Categories:</strong>{' '}
                    {Object.entries(modularConfig.categories)
                      .map(([code, label]) => `${label} (${code})`)
                      .join(', ')}
                  </Stack>
                  <Stack>
                    <strong>Fits:</strong>{' '}
                    {Object.entries(modularConfig.fits)
                      .map(([code, label]) => `${label} (${code})`)
                      .join(', ')}
                  </Stack>
                </Stack>
              </Stack>

              <Stack gap={2} padding={3} className="rounded-xl border border-card-border bg-card">
                <Stack
                  direction="horizontal"
                  align="center"
                  justify="between"
                  className="font-bold text-foreground"
                >
                  <Text>colors.ts</Text>
                  <Badge
                    label={`${Object.keys(modularConfig.colorCodes).length} Colors`}
                    variant="info"
                  />
                </Stack>
                <Stack gap={1} className="max-h-36 overflow-y-auto pr-1">
                  {Object.entries(modularConfig.colorCodes).map(([code, c]) => (
                    <Stack
                      direction="horizontal"
                      align="center"
                      justify="between"
                      key={code}
                      className="text-2xs"
                    >
                      <Text color="primary" weight="semibold" className="font-mono">
                        {code}
                      </Text>
                      <Text color="secondary">
                        {c.name} ({c.colorMap})
                      </Text>
                    </Stack>
                  ))}
                </Stack>
              </Stack>

              <Stack gap={2} padding={3} className="rounded-xl border border-card-border bg-card">
                <Stack
                  direction="horizontal"
                  align="center"
                  justify="between"
                  className="font-bold text-foreground"
                >
                  <Text>prices.ts</Text>
                  <Badge label="Tier Pricing" variant="success" />
                </Stack>
                <Stack gap={2}>
                  {Object.entries(modularConfig.priceTiers).map(([tier, data]) => (
                    <Stack
                      padding={2}
                      key={tier}
                      className="rounded-lg border border-divider bg-muted/20"
                    >
                      <Stack className="font-semibold text-foreground">
                        Tier {tier} — {data.label}
                      </Stack>
                      <Stack className="text-2xs text-muted-foreground mt-0.5">
                        S: ${data.prices.S ?? 229.99} · M: ${data.prices.M ?? 239.99} · XL: $
                        {data.prices.XL ?? 239.99} · 3XL: ${data.prices['3XL'] ?? 259.99}
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              </Stack>

              <Stack gap={2} padding={3} className="rounded-xl border border-card-border bg-card">
                <Stack
                  direction="horizontal"
                  align="center"
                  justify="between"
                  className="font-bold text-foreground"
                >
                  <Text>leatherCodes & sizes.ts</Text>
                  <Badge label="Materials & Sizes" variant="warning" />
                </Stack>
                <Stack gap={1} className="text-muted-foreground">
                  <Stack>
                    <strong>Materials:</strong>{' '}
                    {Object.entries(modularConfig.leatherCodes)
                      .map(([code, label]) => `${label} (${code})`)
                      .join(', ')}
                  </Stack>
                  <Stack>
                    <strong>Size Systems:</strong> {modularConfig.sizeGroups.join(', ')}
                  </Stack>
                </Stack>
              </Stack>
            </Grid>
          </AccordionItem>
        </Accordion>
      )}

      {/* Multi-Facet Filter Bar + Table-Based Catalog List */}
      <PageSection
        title="Master Catalog Items (Table-Based CRUD & Product Converter)"
        description="Filter catalog SKUs by gender, category, product type, or conversion status. Click 'Convert to Product' on any SKU to preview and edit generated variants before creating the Product."
      >
        <Stack gap={4}>
          <Grid
            columns={{ minWidth: 220, max: 1 }}
            className="md:grid-cols-2 lg:grid-cols-5 rounded-2xl border border-card-border bg-muted/25 p-3.5"
          >
            <AppInput
              label="Search SKU / Title / Handle"
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="e.g. SKU1, Duster, Biker..."
            />

            <AppSelect
              label="Filter by Gender"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Genders' },
                ...Object.entries(
                  modularConfig?.genders ?? { M: 'Men', W: 'Women', K: 'Kids', U: 'Unisex' }
                ).map(([code, label]) => ({
                  value: code,
                  label: `${label} (${code})`,
                })),
              ]}
            />

            <AppSelect
              label="Filter by Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...Object.entries(
                  modularConfig?.categories ?? { CT: 'Coat', JK: 'Jacket', PT: 'Pants' }
                ).map(([code, label]) => ({
                  value: code,
                  label: `${label} (${code})`,
                })),
              ]}
            />

            <AppSelect
              label="Filter by Product Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: `All Product Types (${availableTypes.length})` },
                ...availableTypes.map((t) => ({ value: t, label: t })),
              ]}
            />

            <AppSelect
              label="Conversion Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'ready', label: 'Ready to Convert' },
                { value: 'converted', label: 'Converted to Product' },
              ]}
            />
          </Grid>

          {filteredItems.length === 0 ? (
            <Stack
              gap={3}
              padding={10}
              className="rounded-2xl border border-dashed border-border text-center"
            >
              <p className="text-sm font-bold text-foreground">
                No Catalog SKUs match your current filters.
              </p>
              <Stack direction="horizontal" align="center" justify="center" gap={2}>
                <AppButton
                  label="+ New Catalog SKU"
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={openCreateModal}
                />
                <AppButton
                  label="Import Sample Catalog JSON"
                  variant="secondary"
                  size="sm"
                  icon={Upload}
                  onClick={() => setImportJsonModalOpen(true)}
                />
              </Stack>
            </Stack>
          ) : (
            <Stack className="overflow-x-auto rounded-2xl border border-card-border bg-card shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-divider bg-muted/40 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3.5 px-4">SKU & Structured Code</th>
                    <th className="py-3.5 px-4">Catalog Title & Subtitle</th>
                    <th className="py-3.5 px-4">Gender / Category / Type</th>
                    <th className="py-3.5 px-4">Colors × Sizes</th>
                    <th className="py-3.5 px-4">Tier & Est. Variants</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions & Convert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {filteredItems.map((item) => {
                    const varSpec = (item.variantsSpec ?? item.variantsConfig ?? {}) as Record<
                      string,
                      any
                    >
                    const colors = Array.isArray(item.colorCodes)
                      ? (item.colorCodes as string[])
                      : Array.isArray(varSpec.color)
                        ? (varSpec.color as string[])
                        : ['BLK']
                    const sizes = Array.isArray(item.sizeCodes)
                      ? (item.sizeCodes as string[])
                      : Array.isArray(varSpec.size)
                        ? (varSpec.size as string[])
                        : ['S', 'M', 'L', 'XL']
                    const isConverted = item.status === 'converted'
                    const skuKey = String(item.skuCode ?? item.catalogKey ?? '')
                    const baseCode = String(item.structuredBaseCode ?? item.structuredCode ?? '')
                    const prodType = String(item.productType ?? item.type ?? 'Outerwear')

                    return (
                      <tr key={String(item.id)} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4 align-top">
                          <Stack className="font-mono font-extrabold text-sm text-foreground">
                            {skuKey}
                          </Stack>
                          <Stack className="font-mono text-2xs text-primary mt-0.5">
                            {baseCode}
                          </Stack>
                        </td>
                        <td className="py-3.5 px-4 align-top max-w-xs">
                          <Stack className="font-bold text-foreground line-clamp-1">
                            {String(item.title)}
                          </Stack>
                          <Stack className="text-muted-foreground line-clamp-1 mt-0.5">
                            {String(item.subTitle || '—')}
                          </Stack>
                          <Stack className="text-2xs font-mono text-muted-foreground mt-1">
                            /{String(item.categoryHandle ?? '')}
                          </Stack>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <Stack direction="horizontal" align="center" wrap="wrap" gap={1.5}>
                            <Badge
                              label={`Gender: ${item.genderCode ?? item.gender ?? 'M'}`}
                              variant="info"
                            />
                            <Badge label={`Cat: ${item.categoryCode ?? 'CT'}`} variant="neutral" />
                            <Badge label={prodType} variant="purple" />
                          </Stack>
                          <Stack className="text-2xs text-muted-foreground mt-1">
                            Fit: {String(item.fitCode ?? 'RG')} · Mat:{' '}
                            {String(item.leatherCode ?? item.materialCode ?? 'NP')}
                          </Stack>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <Stack className="text-foreground font-medium">
                            Colors ({colors.length}):{' '}
                            <Text color="accent" className="font-mono">
                              {colors.join(', ')}
                            </Text>
                          </Stack>
                          <Stack className="text-muted-foreground mt-0.5 line-clamp-1">
                            Sizes ({sizes.length}):{' '}
                            <Text className="font-mono">{sizes.join(', ')}</Text>
                          </Stack>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <Stack className="font-bold text-price-current">
                            Tier {String(item.priceTierCode ?? item.priceTier ?? '01')}
                          </Stack>
                          <Stack className="text-muted-foreground mt-0.5">
                            {String(item.estimatedVariantCount ?? colors.length * sizes.length)}{' '}
                            variants
                          </Stack>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <Badge
                            label={isConverted ? 'Converted' : 'Ready'}
                            variant={isConverted ? 'success' : 'warning'}
                          />
                          {item.convertedProductTitle && (
                            <Stack className="text-2xs text-success font-medium mt-1 line-clamp-1">
                              → {String(item.convertedProductTitle)}
                            </Stack>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-top text-right">
                          <Stack
                            direction="horizontal"
                            align="center"
                            justify="end"
                            wrap="wrap"
                            gap={1.5}
                          >
                            <AppButton
                              label={
                                busyId === `preview-${item.id}`
                                  ? 'Building Preview...'
                                  : isConverted
                                    ? 'Re-Convert / Preview'
                                    : 'Convert to Product'
                              }
                              variant="primary"
                              size="xs"
                              icon={Sparkles}
                              loading={busyId === `preview-${item.id}`}
                              onClick={() => handleOpenConvertPreview(item)}
                            />
                            <AppButton
                              label="Inspect"
                              variant="secondary"
                              size="xs"
                              icon={Eye}
                              onClick={() => setDetailDrawerItem(item)}
                            />
                            <AppButton
                              label="Edit"
                              variant="outline"
                              size="xs"
                              icon={Edit3}
                              onClick={() => openEditModal(item)}
                            />
                            <AppButton
                              label="Delete"
                              variant="ghost"
                              size="xs"
                              icon={Trash2}
                              onClick={() => handleDeleteCatalogItem(item)}
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
          MODAL 1: CONVERT TO PRODUCT — GENERATED PREVIEW & INLINE EDIT MODAL
         ===================================================================== */}
      {previewModalOpen && previewData && (
        <Stack
          direction="horizontal"
          align="center"
          justify="center"
          padding={4}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <Stack className="relative w-full max-w-5xl rounded-2xl border border-card-border bg-card text-foreground shadow-2xl">
            <Stack
              direction="horizontal"
              align="start"
              justify="between"
              gap={4}
              paddingInline={6}
              paddingBlock={4}
              className="border-b border-divider bg-muted/30"
            >
              <Stack>
                <Stack direction="horizontal" align="center" gap={2}>
                  <Badge label={`Catalog ${previewData.skuKey}`} variant="info" />
                  <MonoBadge text={previewData.structuredBaseCode} />
                  <Badge
                    label={`${previewData.variants.length} Generated Variants`}
                    variant="success"
                  />
                </Stack>
                <h2 className="text-lg font-bold text-foreground mt-1">
                  Generated Product & Variants Preview (Editable Before Creation)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Review and customize all generated parent Product metadata, multi-length titles,
                  category linkage, and individual Cartesian (Color × Size) variant SKUs before
                  saving to `/products`.
                </p>
              </Stack>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </Stack>

            <Stack direction="horizontal" gap={6} padding={6} className="flex-1 overflow-y-auto">
              <Stack
                gap={4}
                padding={4}
                className="rounded-xl border border-card-border bg-muted/20"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Parent Product Metadata (Brand-Agnostic)
                </h3>
                <Grid columns={{ minWidth: 220, max: 1 }} className="md:grid-cols-3">
                  <Stack className="md:col-span-2">
                    <AppInput
                      label="Product Title (channel caps applied at publish)"
                      value={previewData.title}
                      onChange={(e) => setPreviewData({ ...previewData, title: e.target.value })}
                    />
                  </Stack>
                  <Stack>
                    <AppInput
                      label="Structured Base Code (SKU Prefix)"
                      value={previewData.structuredBaseCode}
                      onChange={(e) =>
                        setPreviewData({
                          ...previewData,
                          structuredBaseCode: e.target.value,
                          structuredCode: e.target.value,
                        })
                      }
                    />
                  </Stack>
                  <Stack>
                    <AppSelect
                      label="Medusa Category"
                      value={previewData.categoryId ?? ''}
                      onChange={(e) =>
                        setPreviewData({
                          ...previewData,
                          categoryId: e.target.value || null,
                        })
                      }
                      options={[
                        { value: '', label: `Auto-resolved (${previewData.categoryName})` },
                        ...categories.map((c) => ({
                          value: String(c.id),
                          label: `${c.name} (${c.taxonomyPath ?? c.slug})`,
                        })),
                      ]}
                    />
                  </Stack>
                  <Stack>
                    <AppInput
                      label="Subtitle (60c)"
                      value={previewData.subTitle}
                      onChange={(e) => setPreviewData({ ...previewData, subTitle: e.target.value })}
                    />
                  </Stack>
                  <Stack className="md:col-span-3">
                    <AppTextarea
                      label="SEO Description (the single canonical copy)"
                      rows={3}
                      value={previewData.description}
                      onChange={(e) =>
                        setPreviewData({ ...previewData, description: e.target.value })
                      }
                    />
                  </Stack>
                </Grid>
              </Stack>

              <Stack gap={3}>
                <Stack direction="horizontal" align="center" justify="between">
                  <Stack>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      2. Generated Product Variants ({previewData.variants.length} SKUs from Color ×
                      Size)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Edit any SKU, Variant Title, Color, Size, Retail Tier Price, Cost Price, or
                      Initial Stock before saving.
                    </p>
                  </Stack>
                  <AppButton
                    label="+ Add Custom Variant Row"
                    variant="secondary"
                    size="xs"
                    icon={Plus}
                    onClick={addBlankPreviewVariant}
                  />
                </Stack>

                <Stack className="overflow-x-auto rounded-xl border border-card-border bg-card max-h-80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-muted border-b border-divider text-2xs font-bold uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-3">Generated Variant SKU</th>
                        <th className="py-2.5 px-3">Variant Title</th>
                        <th className="py-2.5 px-3">Color</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Retail Price & Multi-Currency</th>
                        <th className="py-2.5 px-3">Cost ($)</th>
                        <th className="py-2.5 px-3">Stock</th>
                        <th className="py-2.5 px-3 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {previewData.variants.map((v, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => updatePreviewVariant(idx, 'sku', e.target.value)}
                              className="w-56 rounded border border-input-border bg-input-background px-2 py-1 font-mono text-2xs text-foreground"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={v.title}
                              onChange={(e) => updatePreviewVariant(idx, 'title', e.target.value)}
                              className="w-52 rounded border border-input-border bg-input-background px-2 py-1 text-xs text-foreground"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={v.colorName}
                              onChange={(e) =>
                                updatePreviewVariant(idx, 'colorName', e.target.value)
                              }
                              className="w-24 rounded border border-input-border bg-input-background px-2 py-1 text-xs text-foreground"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={v.sizeLabel}
                              onChange={(e) =>
                                updatePreviewVariant(idx, 'sizeLabel', e.target.value)
                              }
                              className="w-20 rounded border border-input-border bg-input-background px-2 py-1 text-xs text-foreground"
                            />
                          </td>
                          <td className="py-2 px-3 space-y-1">
                            <input
                              type="number"
                              step="0.01"
                              value={v.retailPrice}
                              onChange={(e) =>
                                updatePreviewVariant(idx, 'retailPrice', Number(e.target.value))
                              }
                              className="w-24 rounded border border-input-border bg-input-background px-2 py-1 text-xs font-bold text-price-current"
                            />
                            <MultiCurrencyPriceBadges
                              prices={v.prices?.length ? v.prices : expandUsdPrice(v.retailPrice)}
                              primaryCurrency="USD"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="0.01"
                              value={v.costPrice}
                              onChange={(e) =>
                                updatePreviewVariant(idx, 'costPrice', Number(e.target.value))
                              }
                              className="w-20 rounded border border-input-border bg-input-background px-2 py-1 text-xs text-foreground"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={v.stockOnHand}
                              onChange={(e) =>
                                updatePreviewVariant(idx, 'stockOnHand', Number(e.target.value))
                              }
                              className="w-16 rounded border border-input-border bg-input-background px-2 py-1 text-xs text-foreground"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => removePreviewVariant(idx)}
                              className="text-error hover:underline text-xs font-semibold"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Stack>
              </Stack>
            </Stack>

            <Stack
              direction="horizontal"
              align="center"
              justify="between"
              paddingInline={6}
              paddingBlock={4}
              className="border-t border-divider bg-muted/25"
            >
              <Stack className="text-xs text-muted-foreground">
                Creates <strong>1 Parent Product</strong> +{' '}
                <strong>{previewData.variants.length} ProductVariants</strong> with normalized color
                & size attributes.
              </Stack>
              <Stack direction="horizontal" align="center" gap={2}>
                <AppButton
                  label="Cancel"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewModalOpen(false)}
                />
                <AppButton
                  label={
                    convertingProduct
                      ? 'Creating Product & Variants...'
                      : `Confirm & Create Product (${previewData.variants.length} Variants)`
                  }
                  variant="primary"
                  size="sm"
                  loading={convertingProduct}
                  onClick={handleConfirmConvertToProduct}
                />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      )}

      {/* =====================================================================
          MODAL 2: COMPLETE 4-SECTION CREATE / EDIT CATALOG SKU MODAL (ALL DB FIELDS)
         ===================================================================== */}
      {editCatalogModalOpen && (
        <Stack
          direction="horizontal"
          align="center"
          justify="center"
          padding={4}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto"
        >
          <form
            onSubmit={handleSaveCatalogItem}
            className="relative w-full max-w-5xl rounded-2xl border border-card-border bg-card text-foreground shadow-2xl max-h-screen flex flex-col"
          >
            <Stack
              direction="horizontal"
              align="center"
              justify="between"
              paddingInline={6}
              paddingBlock={4}
              className="border-b border-divider bg-muted/30"
            >
              <Stack>
                <h2 className="text-lg font-bold text-foreground">
                  {editingCatalogItem
                    ? `Edit Master Catalog SKU: ${editingCatalogItem.skuCode ?? editingCatalogItem.catalogKey}`
                    : 'Create New Master Catalog SKU (Complete Specification)'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Complete 4-section specification covering Multi-Length Titles, Modular Taxonomy
                  Codes, Cartesian Variant Matrix, and Garment Construction Attributes.
                </p>
              </Stack>
              <button
                type="button"
                onClick={() => setEditCatalogModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </Stack>

            <Stack
              direction="horizontal"
              gap={6}
              padding={6}
              className="flex-1 overflow-y-auto text-xs"
            >
              {/* SECTION 1: IDENTITY & MULTI-LENGTH TITLES */}
              <Stack
                gap={3}
                padding={4}
                className="rounded-2xl border border-card-border bg-muted/20"
              >
                <Stack className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  1. Catalog Identity & Multi-Length Marketplace Titles
                </Stack>
                <Grid columns={{ minWidth: 220, max: 1 }} className="sm:grid-cols-2 lg:grid-cols-4">
                  <AppInput
                    label="Catalog SKU Key *"
                    required
                    value={formState.skuCode}
                    onChange={(e) => setFormState({ ...formState, skuCode: e.target.value })}
                    placeholder="SKU1"
                  />
                  <AppInput
                    label="Structured Base Code"
                    value={formState.structuredCode}
                    onChange={(e) => setFormState({ ...formState, structuredCode: e.target.value })}
                    placeholder="MCTDC01 (Auto if blank)"
                  />
                  <AppInput
                    label="Catalog File Name"
                    value={formState.fileName}
                    onChange={(e) => setFormState({ ...formState, fileName: e.target.value })}
                    placeholder="MCTDC01-BLK-NP-RG"
                  />
                  <AppSelect
                    label="Catalog Status"
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                    options={[
                      { value: 'draft', label: 'Draft / Ready' },
                      { value: 'ready', label: 'Ready to Convert' },
                      { value: 'converted', label: 'Converted to Product' },
                    ]}
                  />
                  <Stack className="sm:col-span-2">
                    <AppInput
                      label="Primary Title (Max 60 chars) *"
                      required
                      maxLength={60}
                      value={formState.title}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      placeholder="Men's Black Lambskin Leather Duster Coat"
                    />
                  </Stack>
                  <Stack className="sm:col-span-2">
                    <AppInput
                      label="Subtitle (Max 60 chars)"
                      maxLength={60}
                      value={formState.subTitle}
                      onChange={(e) => setFormState({ ...formState, subTitle: e.target.value })}
                    />
                  </Stack>
                </Grid>
              </Stack>

              {/* SECTION 2: MEDUSA TAXONOMY & MODULAR SKU CODES */}
              <Stack
                gap={3}
                padding={4}
                className="rounded-2xl border border-card-border bg-muted/20"
              >
                <Stack className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  2. Medusa Category Taxonomy & Modular SKU Code Segments
                </Stack>
                <Grid columns={{ minWidth: 220, max: 1 }} className="sm:grid-cols-2 lg:grid-cols-4">
                  <AppInput
                    label="Product Type *"
                    required
                    value={formState.productType}
                    onChange={(e) => setFormState({ ...formState, productType: e.target.value })}
                    placeholder="Duster Coat"
                  />
                  <Stack className="sm:col-span-2">
                    <AppInput
                      label="Medusa Category Handle *"
                      required
                      value={formState.categoryHandle}
                      onChange={(e) =>
                        setFormState({ ...formState, categoryHandle: e.target.value })
                      }
                      placeholder="men/outerwear/coats/duster"
                    />
                  </Stack>
                  <AppSelect
                    label="Resolved Medusa Category"
                    value={formState.resolvedCategoryId}
                    onChange={(e) =>
                      setFormState({ ...formState, resolvedCategoryId: e.target.value })
                    }
                    options={[
                      { value: '', label: 'Auto-Resolve from Handle / Type' },
                      ...categories.map((c) => ({
                        value: String(c.id),
                        label: `${c.name} (${c.taxonomyPath ?? c.slug})`,
                      })),
                    ]}
                  />
                  <AppSelect
                    label="Gender Code"
                    value={formState.genderCode}
                    onChange={(e) => setFormState({ ...formState, genderCode: e.target.value })}
                    options={[
                      { value: 'M', label: 'M — Men' },
                      { value: 'W', label: 'W — Women' },
                      { value: 'U', label: 'U — Unisex' },
                      { value: 'K', label: 'K — Kids' },
                    ]}
                  />
                  <AppSelect
                    label="Material / Leather Code"
                    value={formState.leatherCode}
                    onChange={(e) => setFormState({ ...formState, leatherCode: e.target.value })}
                    options={[
                      { value: 'NP', label: 'NP — Nappa / Lambskin Leather' },
                      { value: 'SU', label: 'SU — Suede Leather' },
                      { value: 'FG', label: 'FG — Full-Grain Leather' },
                      { value: 'NB', label: 'NB — Nubuck Leather' },
                      { value: 'SH', label: 'SH — Shearling' },
                      { value: 'CW', label: 'CW — Cowhide' },
                      { value: 'GT', label: 'GT — Goat Leather' },
                      { value: 'BF', label: 'BF — Buffalo Leather' },
                    ]}
                  />
                  <AppSelect
                    label="Length Code"
                    value={formState.lengthCode}
                    onChange={(e) => setFormState({ ...formState, lengthCode: e.target.value })}
                    options={[
                      { value: 'MX', label: 'MX — Maxi / Full Length' },
                      { value: 'MD', label: 'MD — Midi / Mid Length' },
                      { value: 'MN', label: 'MN — Mini / Short' },
                      { value: 'XX', label: 'XX — Standard' },
                    ]}
                  />
                  <AppSelect
                    label="Price Tier (LIST PRICE)"
                    value={formState.priceTierCode}
                    onChange={(e) => setFormState({ ...formState, priceTierCode: e.target.value })}
                    options={[
                      { value: '01', label: 'Tier 01 ($229.99–$289.99)' },
                      { value: '02', label: 'Tier 02 ($269.99–$339.99)' },
                      { value: '03', label: 'Tier 03 ($239.99–$309.99)' },
                    ]}
                  />
                  <AppInput
                    label="Pattern"
                    value={formState.pattern}
                    onChange={(e) => setFormState({ ...formState, pattern: e.target.value })}
                    placeholder="Solid"
                  />
                </Grid>
              </Stack>

              {/* SECTION 3: CARTESIAN VARIANT MATRIX & MEDIA */}
              <Stack
                gap={3}
                padding={4}
                className="rounded-2xl border border-card-border bg-muted/20"
              >
                <Stack className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  3. Cartesian Variant Matrix (Colors × Sizes), Stock & Media
                </Stack>
                <Grid columns={{ minWidth: 220, max: 1 }} className="sm:grid-cols-2 lg:grid-cols-4">
                  <Stack className="sm:col-span-2">
                    <AppInput
                      label="Color Codes (comma-separated 3-letter codes)"
                      value={formState.colorCodes}
                      onChange={(e) => setFormState({ ...formState, colorCodes: e.target.value })}
                      placeholder="BLK, BLU, BRN, TAN, MAR, OGR"
                    />
                  </Stack>
                  <AppSelect
                    label="Size System Group"
                    value={formState.sizeGroup}
                    onChange={(e) => setFormState({ ...formState, sizeGroup: e.target.value })}
                    options={[
                      { value: 'alpha', label: 'Alpha (2XS..5XL, CS)' },
                      { value: 'numeric', label: 'Numeric (28..60, CS)' },
                      { value: 'age', label: 'Kids Age (0-3M..16-18Y)' },
                      { value: 'pillowCover', label: 'Pillow Cover Dimensions' },
                    ]}
                  />
                  <AppInput
                    label="Size Codes (comma-separated)"
                    value={formState.sizeCodes}
                    onChange={(e) => setFormState({ ...formState, sizeCodes: e.target.value })}
                    placeholder="S, M, L, XL, 2XL"
                  />
                  <Stack className="sm:col-span-2">
                    <AppInput
                      label="Product Image URLs (comma-separated)"
                      value={formState.imagesCsv}
                      onChange={(e) => setFormState({ ...formState, imagesCsv: e.target.value })}
                      placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                    />
                  </Stack>
                  <Stack className="sm:col-span-2">
                    <AppInput
                      label="SEO Tags (comma-separated)"
                      value={formState.tagsCsv}
                      onChange={(e) => setFormState({ ...formState, tagsCsv: e.target.value })}
                      placeholder="leather, duster coat, outerwear, mens"
                    />
                  </Stack>
                </Grid>
              </Stack>

              {/* SECTION 4: GARMENT CONSTRUCTION ATTRIBUTES & DESCRIPTIONS */}
              <Stack
                gap={3}
                padding={4}
                className="rounded-2xl border border-card-border bg-muted/20"
              >
                <Stack className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  4. Garment Construction Attributes & Multi-Marketplace Copy
                </Stack>
                <Grid columns={{ minWidth: 220, max: 1 }} className="sm:grid-cols-2 lg:grid-cols-4">
                  <AppInput
                    label="Outer Material"
                    value={formState.material}
                    onChange={(e) => setFormState({ ...formState, material: e.target.value })}
                  />
                  <AppInput
                    label="Fabric Type"
                    value={formState.fabric}
                    onChange={(e) => setFormState({ ...formState, fabric: e.target.value })}
                  />
                  <AppInput
                    label="Inner Lining"
                    value={formState.lining}
                    onChange={(e) => setFormState({ ...formState, lining: e.target.value })}
                  />
                  <AppInput
                    label="Hardware"
                    value={formState.hardware}
                    onChange={(e) => setFormState({ ...formState, hardware: e.target.value })}
                  />
                  <AppInput
                    label="Closure Description"
                    value={formState.closure}
                    onChange={(e) => setFormState({ ...formState, closure: e.target.value })}
                  />
                  <AppInput
                    label="Closure Types (comma-separated)"
                    value={formState.closureTypeCsv}
                    onChange={(e) => setFormState({ ...formState, closureTypeCsv: e.target.value })}
                  />
                  <AppInput
                    label="Coat Silhouette Type"
                    value={formState.coatSilhouetteType}
                    onChange={(e) =>
                      setFormState({ ...formState, coatSilhouetteType: e.target.value })
                    }
                  />
                  <AppInput
                    label="Model Name"
                    value={formState.modelName}
                    onChange={(e) => setFormState({ ...formState, modelName: e.target.value })}
                  />
                  <AppInput
                    label="Collar Description"
                    value={formState.collar}
                    onChange={(e) => setFormState({ ...formState, collar: e.target.value })}
                  />
                  <AppInput
                    label="Collar Style / Type"
                    value={formState.collarType}
                    onChange={(e) => setFormState({ ...formState, collarType: e.target.value })}
                  />
                  <AppInput
                    label="Sleeve Length"
                    value={formState.sleeveLength}
                    onChange={(e) => setFormState({ ...formState, sleeveLength: e.target.value })}
                  />
                  <AppInput
                    label="Sleeve Type"
                    value={formState.sleeveType}
                    onChange={(e) => setFormState({ ...formState, sleeveType: e.target.value })}
                  />
                  <Stack className="sm:col-span-2">
                    <AppInput
                      label="Pocket Description"
                      value={formState.pocketDescription}
                      onChange={(e) =>
                        setFormState({ ...formState, pocketDescription: e.target.value })
                      }
                    />
                  </Stack>
                  <AppInput
                    label="Pocket Types (comma-separated)"
                    value={formState.pocketsCsv}
                    onChange={(e) => setFormState({ ...formState, pocketsCsv: e.target.value })}
                  />
                  <AppInput
                    label="Care Instructions"
                    value={formState.careInstructions}
                    onChange={(e) =>
                      setFormState({ ...formState, careInstructions: e.target.value })
                    }
                  />
                </Grid>

                <Grid columns={{ minWidth: 220, max: 1 }} className="md:grid-cols-3 pt-2">
                  <AppTextarea
                    label="SEO Product Description"
                    rows={3}
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  />
                  <AppTextarea
                    label="Bullet Points (1 per line)"
                    rows={3}
                    value={formState.featuresLines}
                    onChange={(e) => setFormState({ ...formState, featuresLines: e.target.value })}
                  />
                  <AppTextarea
                    label="Generic Search Keywords (1 per line)"
                    rows={3}
                    value={formState.keywordsLines}
                    onChange={(e) => setFormState({ ...formState, keywordsLines: e.target.value })}
                  />
                  <AppTextarea
                    label="Special Features (1 per line)"
                    rows={3}
                    value={formState.specialFeaturesLines}
                    onChange={(e) =>
                      setFormState({ ...formState, specialFeaturesLines: e.target.value })
                    }
                  />
                </Grid>
              </Stack>
            </Stack>

            <Stack
              direction="horizontal"
              align="center"
              justify="end"
              gap={2}
              paddingInline={6}
              paddingBlock={4}
              className="border-t border-divider bg-muted/25"
            >
              <AppButton
                label="Cancel"
                variant="ghost"
                size="sm"
                onClick={() => setEditCatalogModalOpen(false)}
              />
              <AppButton
                label={busyId === 'save-catalog' ? 'Saving...' : 'Save Complete Catalog SKU'}
                variant="primary"
                size="sm"
                loading={busyId === 'save-catalog'}
                type="submit"
              />
            </Stack>
          </form>
        </Stack>
      )}

      {/* =====================================================================
          MODAL 3: IMPORT BULK CATALOG JSON MODAL
         ===================================================================== */}
      {importJsonModalOpen && (
        <Stack
          direction="horizontal"
          align="center"
          justify="center"
          padding={4}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
        >
          <Stack className="relative w-full max-w-3xl rounded-2xl border border-card-border bg-card text-foreground shadow-2xl">
            <Stack
              direction="horizontal"
              align="center"
              justify="between"
              paddingInline={6}
              paddingBlock={4}
              className="border-b border-divider bg-muted/30"
            >
              <Stack>
                <h2 className="text-lg font-bold text-foreground">
                  Import Brand-Agnostic Master Catalog JSON
                </h2>
                <p className="text-xs text-muted-foreground">
                  Upload or paste a Catalog JSON file (keyed by SKU1, SKU2, etc.) to store in the
                  database.
                </p>
              </Stack>
              <button
                type="button"
                onClick={() => setImportJsonModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </Stack>
            <Stack gap={4} padding={6} className="overflow-y-auto">
              <Stack direction="horizontal" align="center" justify="between" wrap="wrap" gap={2}>
                <label className="inline-flex items-center gap-2 rounded-xl border border-input-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground cursor-pointer hover:bg-muted">
                  <Upload className="h-3.5 w-3.5" />
                  <Text>Upload .json File</Text>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <AppButton
                  label="Load Sample Catalog"
                  variant="ghost"
                  size="xs"
                  onClick={() => setCatalogJsonText(JSON.stringify(sampleCatalogJson, null, 2))}
                />
              </Stack>
              <Stack direction="horizontal" gap={3} wrap="wrap">
                <AppSelect
                  label="Price tier"
                  value={importTier}
                  onChange={(e) => setImportTier(e.target.value)}
                  options={['01', '02', '03'].map((tier) => ({
                    value: tier,
                    label: `Tier ${tier}`,
                  }))}
                />
                <AppSelect
                  label="SKU format"
                  value={importSkuFormat}
                  onChange={(e) => setImportSkuFormat(e.target.value)}
                  options={[
                    { value: 'standard', label: 'Standard' },
                    { value: 'prefixed_color', label: 'Color-prefixed' },
                    { value: 'catalog_key', label: 'Catalog key' },
                  ]}
                />
                <AppInput
                  id="catalog-import-stock"
                  label="Initial stock per variant"
                  type="number"
                  min="0"
                  step="1"
                  value={importStock}
                  onChange={(e) => setImportStock(e.target.value)}
                />
              </Stack>
              <textarea
                rows={14}
                value={catalogJsonText}
                onChange={(e) => setCatalogJsonText(e.target.value)}
                spellCheck={false}
                className="w-full rounded-xl border border-input-border bg-muted/30 p-3 font-mono text-xs text-foreground"
              />
            </Stack>
            <Stack
              direction="horizontal"
              align="center"
              justify="end"
              gap={2}
              paddingInline={6}
              paddingBlock={4}
              className="border-t border-divider bg-muted/25"
            >
              <AppButton
                label="Cancel"
                variant="ghost"
                size="sm"
                onClick={() => setImportJsonModalOpen(false)}
              />
              <AppButton
                label={busyId === 'import-json' ? 'Importing...' : 'Import & Convert Catalog'}
                variant="primary"
                size="sm"
                loading={busyId === 'import-json'}
                onClick={handleImportCatalogJson}
              />
            </Stack>
          </Stack>
        </Stack>
      )}

      {/* =====================================================================
          SLIDE-OVER DRAWER: CATALOG ITEM INSPECTOR
         ===================================================================== */}
      <SlideOverDrawer
        open={!!detailDrawerItem}
        onClose={() => setDetailDrawerItem(null)}
        title={String(detailDrawerItem?.title ?? 'Catalog SKU')}
        subtitle={String(detailDrawerItem?.subTitle ?? '')}
        icon={Layers}
        badge={
          detailDrawerItem ? (
            <>
              <MonoBadge text={String(detailDrawerItem.skuCode ?? detailDrawerItem.catalogKey)} />
              <MonoBadge
                text={String(
                  detailDrawerItem.structuredBaseCode ?? detailDrawerItem.structuredCode
                )}
              />
            </>
          ) : null
        }
        footer={
          detailDrawerItem ? (
            <>
              <AppButton
                label="Edit Catalog SKU"
                variant="secondary"
                size="sm"
                icon={Edit3}
                onClick={() => {
                  const item = detailDrawerItem
                  setDetailDrawerItem(null)
                  openEditModal(item)
                }}
              />
              <AppButton
                label="Convert to Product (Preview & Edit)"
                variant="primary"
                size="sm"
                icon={Sparkles}
                onClick={() => {
                  const item = detailDrawerItem
                  setDetailDrawerItem(null)
                  handleOpenConvertPreview(item)
                }}
              />
            </>
          ) : null
        }
      >
        {detailDrawerItem && (
          <Stack gap={4} className="text-xs">
            <Stack gap={2} padding={4} className="rounded-xl border border-card-border bg-muted/20">
              <Stack className="font-bold text-foreground">Taxonomy & Modular Codes</Stack>
              <Grid columns={{ minWidth: 220, max: 2 }} className="text-muted-foreground">
                <Stack>
                  <strong>Category Handle:</strong> {String(detailDrawerItem.categoryHandle)}
                </Stack>
                <Stack>
                  <strong>Product Type:</strong>{' '}
                  {String(detailDrawerItem.productType ?? detailDrawerItem.type)}
                </Stack>
                <Stack>
                  <strong>Gender:</strong>{' '}
                  {String(detailDrawerItem.gender ?? detailDrawerItem.genderCode)}
                </Stack>
                <Stack>
                  <strong>Category Code:</strong> {String(detailDrawerItem.categoryCode)}
                </Stack>
                <Stack>
                  <strong>Fit Code:</strong> {String(detailDrawerItem.fitCode)}
                </Stack>
                <Stack>
                  <strong>Material / Tier:</strong>{' '}
                  {String(detailDrawerItem.leatherCode ?? detailDrawerItem.materialCode)} / Tier{' '}
                  {String(detailDrawerItem.priceTierCode ?? detailDrawerItem.priceTier)}
                </Stack>
              </Grid>
            </Stack>

            <Stack gap={2} padding={4} className="rounded-xl border border-card-border bg-muted/20">
              <Stack className="font-bold text-foreground">Descriptions</Stack>
              <p className="text-muted-foreground">{String(detailDrawerItem.description)}</p>
            </Stack>

            <Stack gap={2} padding={4} className="rounded-xl border border-card-border bg-muted/20">
              <Stack className="font-bold text-foreground">Raw Attributes JSON</Stack>
              <pre className="overflow-x-auto font-mono text-2xs text-foreground">
                {JSON.stringify(detailDrawerItem.attributes ?? {}, null, 2)}
              </pre>
            </Stack>
          </Stack>
        )}
      </SlideOverDrawer>
    </Stack>
  )
}
