import React from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Grid } from '@astryxdesign/core/Grid'
import { Text } from '@astryxdesign/core/Text'
import { AppButton, MonoBadge, Badge, type Row } from '~/lib/ui'
import { X } from 'lucide-react'

export function ConvertToListingModal({
  product,
  onClose,
  brands = [],
  sellerAccounts = [],
  selectedBrandId,
  setSelectedBrandId,
  selectedPlatforms,
  togglePlatform,
  selectedSellerAccountId,
  setSelectedSellerAccountId,
  priceMultiplier,
  setPriceMultiplier,
  onCreateBrandOpen,
  convertingListing,
  onConfirmConvert,
  platforms,
}: {
  product: Row | null
  onClose: () => void
  brands?: Row[]
  sellerAccounts?: Row[]
  selectedBrandId: string
  setSelectedBrandId: (v: string) => void
  selectedPlatforms: string[]
  togglePlatform: (id: string) => void
  selectedSellerAccountId: string
  setSelectedSellerAccountId: (v: string) => void
  priceMultiplier: string
  setPriceMultiplier: (v: string) => void
  onCreateBrandOpen: () => void
  convertingListing: boolean
  onConfirmConvert: () => void
  platforms: readonly { id: string; label: string }[] | { id: string; label: string }[]
}) {
  if (!product) return null

  return (
    <Stack
      direction="horizontal"
      align="center"
      justify="center"
      padding={4}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
    >
      <Stack className="relative w-full max-w-2xl rounded-2xl border border-card-border bg-card text-foreground shadow-2xl overflow-hidden">
        <Stack
          direction="horizontal"
          align="start"
          justify="between"
          paddingInline={6}
          paddingBlock={4}
          className="border-b border-divider bg-muted/30"
        >
          <Stack>
            <Stack direction="horizontal" align="center" gap={2}>
              <MonoBadge text={String(product.skuPrefix ?? 'PRODUCT')} />
              <Badge
                label={`${((product.variants as Row[]) ?? []).length} Variants`}
                variant="info"
              />
            </Stack>
            <h2 className="text-lg font-bold text-foreground mt-1">
              Convert Product to Platform Listings
            </h2>
            <p className="text-xs text-muted-foreground">
              Associate <strong>{String(product.title)}</strong> with a Brand and generate
              platform-specific listings (with multi-currency ChannelListingPrice arrays) for Medusa
              Website, Amazon, eBay, and Etsy.
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
          <Stack>
            <label className="block font-semibold text-foreground mb-1">
              1. Link Brand to Product & Listings *
            </label>
            <Stack direction="horizontal" align="center" gap={2}>
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
                onClick={onCreateBrandOpen}
              />
            </Stack>
          </Stack>

          <Stack>
            <label className="block font-semibold text-foreground mb-1.5">
              2. Select Target E-Commerce Platforms *
            </label>
            <Grid columns={{ minWidth: 220, max: 1 }} className="sm:grid-cols-2">
              {platforms.map((plat) => {
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
                    <Text>{plat.label}</Text>
                  </label>
                )
              })}
            </Grid>
          </Stack>

          <Grid columns={{ minWidth: 220, max: 1 }} className="sm:grid-cols-2">
            <Stack>
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
            </Stack>
            <Stack>
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
            </Stack>
          </Grid>
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
            Generates{' '}
            <strong>
              {((product.variants as Row[]) ?? []).length * selectedPlatforms.length} Channel
              Listings
            </strong>{' '}
            grouped by SKU in <code>/listing</code>.
          </Stack>
          <Stack direction="horizontal" align="center" gap={2}>
            <AppButton label="Cancel" variant="ghost" size="sm" onClick={onClose} />
            <AppButton
              label={
                convertingListing
                  ? 'Generating Platform Listings...'
                  : `Generate Listings (${selectedPlatforms.length} Platforms)`
              }
              variant="primary"
              size="sm"
              loading={convertingListing}
              onClick={onConfirmConvert}
            />
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
