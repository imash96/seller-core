import React from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { AppButton, AppInput, AppSelect, type Row } from '~/lib/ui'
import { X } from 'lucide-react'

export function GenerateListingsModal({
  isOpen,
  onClose,
  brands = [],
  sellerAccounts = [],
  products = [],
  selectedBrandId,
  setSelectedBrandId,
  selectedSellerAccountId,
  setSelectedSellerAccountId,
  selectedPlatforms,
  setSelectedPlatforms,
  selectedProductIds,
  setSelectedProductIds,
  priceMultiplier,
  setPriceMultiplier,
  assignBrandToProduct,
  setAssignBrandToProduct,
  busyKey,
  onGenerate,
  platformBadges,
}: {
  isOpen: boolean
  onClose: () => void
  brands?: Row[]
  sellerAccounts?: Row[]
  products?: Row[]
  selectedBrandId: string
  setSelectedBrandId: (v: string) => void
  selectedSellerAccountId: string
  setSelectedSellerAccountId: (v: string) => void
  selectedPlatforms: string[]
  setSelectedPlatforms: React.Dispatch<React.SetStateAction<string[]>>
  selectedProductIds: string[]
  setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>>
  priceMultiplier: string
  setPriceMultiplier: (v: string) => void
  assignBrandToProduct: boolean
  setAssignBrandToProduct: (v: boolean) => void
  busyKey: string | null
  onGenerate: () => void
  platformBadges: Record<string, { label: string }>
}) {
  if (!isOpen) return null

  return (
    <Stack
      direction="horizontal"
      align="center"
      justify="center"
      padding={4}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
    >
      <Stack className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card text-foreground shadow-2xl">
        <Stack
          direction="horizontal"
          align="center"
          justify="between"
          paddingInline={6}
          paddingBlock={4}
          className="border-b border-divider bg-muted/30"
        >
          <Stack>
            <h2 className="text-lg font-bold text-foreground">Generate Multi-Platform Listings</h2>
            <p className="text-xs text-muted-foreground">
              Link Products & Variants with a Brand and run platform transformers (including
              multi-currency ChannelListingPrice arrays) for Medusa, Amazon, eBay, and Etsy.
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
        <Stack gap={4} padding={6} className="text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

          <Stack>
            <label className="block font-semibold text-foreground mb-1.5">
              2. Target E-Commerce Platforms *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    <Text>{platformBadges[plat]?.label ?? plat}</Text>
                  </label>
                )
              })}
            </div>
          </Stack>

          <Stack>
            <label className="block font-semibold text-foreground mb-1">
              3. Filter Products (Leave unchecked to include all {products.length} products)
            </label>
            <Stack
              gap={1.5}
              padding={2}
              className="max-h-36 overflow-y-auto rounded-xl border border-input-border bg-muted/20"
            >
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
                    <Text color="primary" weight="medium">
                      {String(p.title)}
                    </Text>
                    <Text color="secondary" className="font-mono">
                      ({String(p.skuPrefix ?? '')})
                    </Text>
                  </label>
                )
              })}
            </Stack>
          </Stack>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              <Text color="primary" weight="medium">
                Also set selected Brand on Parent Product
              </Text>
            </label>
          </div>
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
            label={busyKey === 'gen-listings' ? 'Generating...' : 'Generate Platform Listings'}
            variant="primary"
            size="sm"
            loading={busyKey === 'gen-listings'}
            onClick={onGenerate}
          />
        </Stack>
      </Stack>
    </Stack>
  )
}
