import React from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import {
  Badge,
  MonoBadge,
  AppButton,
  AppInput,
  AppSelect,
  AppTextarea,
  MultiCurrencyPriceBadges,
  type Row,
} from '~/lib/ui'
import { expandUsdPrice } from '~/lib/currency'
import { Plus, X } from 'lucide-react'
import type { GeneratedProductPreview, PreviewVariant } from './types.js'

export function ProductPreviewModal({
  isOpen,
  onClose,
  previewData,
  setPreviewData,
  categories = [],
  convertingProduct,
  onConfirmConvert,
  onUpdateVariant,
  onRemoveVariant,
  onAddBlankVariant,
}: {
  isOpen: boolean
  onClose: () => void
  previewData: GeneratedProductPreview | null
  setPreviewData: React.Dispatch<React.SetStateAction<GeneratedProductPreview | null>>
  categories?: Row[]
  convertingProduct: boolean
  onConfirmConvert: () => void
  onUpdateVariant: (idx: number, field: keyof PreviewVariant, value: string | number) => void
  onRemoveVariant: (idx: number) => void
  onAddBlankVariant: () => void
}) {
  if (!isOpen || !previewData) return null

  return (
    <Stack
      direction="horizontal"
      align="center"
      justify="center"
      padding={4}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <Stack className="relative w-full max-w-5xl max-h-[90dvh] flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card text-foreground shadow-2xl">
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
              category linkage, and individual Cartesian (Color × Size) variant SKUs before saving
              to `/products`.
            </p>
          </Stack>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </Stack>

        <Stack gap={6} padding={6} className="flex-1 overflow-y-auto">
          <Stack gap={4} padding={4} className="rounded-xl border border-card-border bg-muted/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Parent Product Metadata (Brand-Agnostic)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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
                  onChange={(e) => setPreviewData({ ...previewData, description: e.target.value })}
                />
              </Stack>
            </div>
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
                onClick={onAddBlankVariant}
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
                          onChange={(e) => onUpdateVariant(idx, 'sku', e.target.value)}
                          className="w-56 rounded border border-input-border bg-input-background px-2 py-1 font-mono text-2xs text-foreground"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.title}
                          onChange={(e) => onUpdateVariant(idx, 'title', e.target.value)}
                          className="w-52 rounded border border-input-border bg-input-background px-2 py-1 text-xs text-foreground"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.colorName}
                          onChange={(e) => onUpdateVariant(idx, 'colorName', e.target.value)}
                          className="w-24 rounded border border-input-border bg-input-background px-2 py-1 text-xs text-foreground"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.sizeLabel}
                          onChange={(e) => onUpdateVariant(idx, 'sizeLabel', e.target.value)}
                          className="w-20 rounded border border-input-border bg-input-background px-2 py-1 text-xs text-foreground"
                        />
                      </td>
                      <td className="py-2 px-3 space-y-1">
                        <input
                          type="number"
                          step="0.01"
                          value={v.retailPrice}
                          onChange={(e) =>
                            onUpdateVariant(idx, 'retailPrice', Number(e.target.value))
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
                            onUpdateVariant(idx, 'costPrice', Number(e.target.value))
                          }
                          className="w-20 rounded border border-input-border bg-input-background px-2 py-1 text-xs text-foreground"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={v.stockOnHand}
                          onChange={(e) =>
                            onUpdateVariant(idx, 'stockOnHand', Number(e.target.value))
                          }
                          className="w-16 rounded border border-input-border bg-input-background px-2 py-1 text-xs text-foreground"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onRemoveVariant(idx)}
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
            <strong>{previewData.variants.length} ProductVariants</strong> with normalized color &
            size attributes.
          </Stack>
          <Stack direction="horizontal" align="center" gap={2}>
            <AppButton label="Cancel" variant="ghost" size="sm" onClick={onClose} />
            <AppButton
              label={
                convertingProduct
                  ? 'Creating Product & Variants...'
                  : `Confirm & Create Product (${previewData.variants.length} Variants)`
              }
              variant="primary"
              size="sm"
              loading={convertingProduct}
              onClick={onConfirmConvert}
            />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
