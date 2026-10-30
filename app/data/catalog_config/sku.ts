import type { SkuFormatMode } from '../../types/catalog_pipeline.js'

export const FILE_NAME_FORMAT =
  '[Gender][Category][ProductCode][Sequence]-[ColorCode]-[Material]-[Fit/Length].[FORMAT]'
export const SKU_FORMAT =
  '[ColorCode]-[Gender][Category][ProductCode][Sequence]-[ColorCode]-[Material]-[Fit/Length]-[Size]'
export const SKU_EXAMPLE = 'MJKBK01-BLK-NP-SL-XS'
export const FILE_EXAMPLE = 'MSR01-BLK-NP-RG'

export function extractSequenceNumber(catalogKey: string, fallbackIndex = 0): string {
  const match = String(catalogKey || '').match(/(\d+)/)
  if (match) {
    return match[1].padStart(2, '0').slice(-2)
  }
  return String(fallbackIndex + 1)
    .padStart(2, '0')
    .slice(-2)
}

export function buildStructuredBaseCode(params: {
  genderCode: string
  categoryCode: string
  productCode: string
  sequence: string
}): string {
  return `${params.genderCode}${params.categoryCode}${params.productCode}${params.sequence}`
}

export function formatVariantSku(params: {
  catalogKey: string
  structuredCode: string
  colorCode: string
  materialCode: string
  fitCode: string
  sizeValue: string
  skuFormat?: SkuFormatMode
}): string {
  const {
    catalogKey,
    structuredCode,
    colorCode,
    materialCode,
    fitCode,
    sizeValue,
    skuFormat = 'standard',
  } = params

  if (skuFormat === 'prefixed_color') {
    return `${colorCode}-${structuredCode}-${colorCode}-${materialCode}-${fitCode}-${sizeValue}`
  }

  if (skuFormat === 'catalog_key') {
    return `${catalogKey}-${colorCode}-${materialCode}-${fitCode}-${sizeValue}`
  }

  return `${structuredCode}-${colorCode}-${materialCode}-${fitCode}-${sizeValue}`
}
