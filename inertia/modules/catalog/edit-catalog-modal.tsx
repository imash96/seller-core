import React from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { AppButton, AppInput, AppSelect, AppTextarea, type Row } from '~/lib/ui'
import { X } from 'lucide-react'

export function EditCatalogModal({
  isOpen,
  onClose,
  editingCatalogItem,
  formState,
  setFormState,
  categories = [],
  busyId,
  onSubmit,
}: {
  isOpen: boolean
  onClose: () => void
  editingCatalogItem: Row | null
  formState: any
  setFormState: React.Dispatch<React.SetStateAction<any>>
  categories?: Row[]
  busyId: string | null
  onSubmit: (e: React.FormEvent) => void
}) {
  if (!isOpen) return null

  return (
    <Stack
      direction="horizontal"
      align="center"
      justify="center"
      padding={4}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-5xl rounded-2xl border border-card-border bg-card text-foreground shadow-2xl max-h-[90dvh] flex flex-col"
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
              Complete 4-section specification covering Multi-Length Titles, Modular Taxonomy Codes,
              Cartesian Variant Matrix, and Garment Construction Attributes.
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

        <Stack gap={6} padding={6} className="flex-1 overflow-y-auto text-xs">
          {/* SECTION 1: IDENTITY & MULTI-LENGTH TITLES */}
          <Stack gap={3} padding={4} className="rounded-2xl border border-card-border bg-muted/20">
            <Stack className="text-xs font-extrabold uppercase tracking-wider text-primary">
              1. Catalog Identity & Multi-Length Marketplace Titles
            </Stack>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
            </div>
          </Stack>

          {/* SECTION 2: MEDUSA TAXONOMY & MODULAR SKU CODES */}
          <Stack gap={3} padding={4} className="rounded-2xl border border-card-border bg-muted/20">
            <Stack className="text-xs font-extrabold uppercase tracking-wider text-primary">
              2. Medusa Category Taxonomy & Modular SKU Code Segments
            </Stack>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
                  onChange={(e) => setFormState({ ...formState, categoryHandle: e.target.value })}
                  placeholder="men/outerwear/coats/duster"
                />
              </Stack>
              <AppSelect
                label="Resolved Medusa Category"
                value={formState.resolvedCategoryId}
                onChange={(e) => setFormState({ ...formState, resolvedCategoryId: e.target.value })}
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
            </div>
          </Stack>

          {/* SECTION 3: CARTESIAN VARIANT MATRIX & MEDIA */}
          <Stack gap={3} padding={4} className="rounded-2xl border border-card-border bg-muted/20">
            <Stack className="text-xs font-extrabold uppercase tracking-wider text-primary">
              3. Cartesian Variant Matrix (Colors × Sizes), Stock & Media
            </Stack>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
            </div>
          </Stack>

          {/* SECTION 4: GARMENT CONSTRUCTION ATTRIBUTES & DESCRIPTIONS */}
          <Stack gap={3} padding={4} className="rounded-2xl border border-card-border bg-muted/20">
            <Stack className="text-xs font-extrabold uppercase tracking-wider text-primary">
              4. Garment Construction Attributes & Multi-Marketplace Copy
            </Stack>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
                onChange={(e) => setFormState({ ...formState, coatSilhouetteType: e.target.value })}
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
                onChange={(e) => setFormState({ ...formState, careInstructions: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 pt-2 gap-3.5">
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
            </div>
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
          <AppButton label="Cancel" variant="ghost" size="sm" onClick={onClose} />
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
  )
}
