import type { PriceMoney, Row } from '~/lib/ui'

export type ModularConfig = {
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

export type PreviewVariant = {
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

export type GeneratedProductPreview = {
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

export type CatalogItemRow = Row
