import React from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Grid } from '@astryxdesign/core/Grid'
import {
  AppButton,
  AppInput,
  AppSelect,
  AppTextarea,
  MultiCurrencyPriceInput,
  type Row,
} from '~/lib/ui'
import { expandUsdPrice } from '~/lib/currency'
import { X } from 'lucide-react'

export function EditListingModal({
  listing,
  onClose,
  editForm,
  setEditForm,
  onSubmit,
}: {
  listing: Row | null
  onClose: () => void
  editForm: any
  setEditForm: React.Dispatch<React.SetStateAction<any>>
  onSubmit: (e: React.FormEvent) => void
}) {
  if (!listing) return null

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
        className="relative w-full max-w-2xl rounded-2xl border border-card-border bg-card text-foreground shadow-2xl overflow-hidden max-h-screen flex flex-col"
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
            <h2 className="text-base font-bold text-foreground">
              Edit Platform Listing ({String(listing.platform).toUpperCase()})
            </h2>
            <p className="text-xs text-muted-foreground font-mono">
              SKU: {String(listing.externalSku)}
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
        <Stack
          direction="horizontal"
          gap={4}
          padding={6}
          className="flex-1 overflow-y-auto text-xs"
        >
          <Grid columns={{ minWidth: 220, max: 1 }} className="sm:grid-cols-2">
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
              label="Listed price (USD — anchor for the other currencies)"
              type="number"
              step="0.01"
              value={editForm.listedPrice}
              onChange={(e) => {
                const usd = Number(e.target.value)
                setEditForm({
                  ...editForm,
                  listedPrice: e.target.value,
                  currencyCode: 'USD',
                  prices: expandUsdPrice(Number.isFinite(usd) ? usd : 0, {
                    existing: editForm.prices,
                    preserveOverrides: true,
                  }),
                })
              }}
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
              disabled
              label="Publication Status (marketplace integration not configured)"
              value={editForm.publicationStatus}
              onChange={(e) => setEditForm({ ...editForm, publicationStatus: e.target.value })}
              options={[
                { value: 'published', label: 'published' },
                { value: 'unpublished', label: 'unpublished' },
                { value: 'draft', label: 'draft' },
                { value: 'queued', label: 'queued' },
                { value: 'failed', label: 'failed' },
              ]}
            />
            <Stack className="sm:col-span-2">
              <MultiCurrencyPriceInput
                label="Multi-Currency Listing Prices (ChannelListingPrice)"
                value={editForm.prices}
                onChange={(nextPrices) => {
                  const primary =
                    nextPrices.find((p) => p.currency_code === editForm.currencyCode) ??
                    nextPrices[0]
                  setEditForm({
                    ...editForm,
                    prices: nextPrices,
                    ...(primary
                      ? {
                          currencyCode: primary.currency_code,
                          listedPrice: String(primary.amount),
                        }
                      : {}),
                  })
                }}
              />
            </Stack>
            <Stack className="sm:col-span-2">
              <AppInput
                label="Channel Title Override"
                value={editForm.channelTitle}
                onChange={(e) => setEditForm({ ...editForm, channelTitle: e.target.value })}
              />
            </Stack>
            <Stack className="sm:col-span-2">
              <AppTextarea
                label="Channel Description Override"
                rows={3}
                value={editForm.channelDescription}
                onChange={(e) => setEditForm({ ...editForm, channelDescription: e.target.value })}
              />
            </Stack>
          </Grid>
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
          <AppButton label="Save Listing Changes" variant="primary" size="sm" type="submit" />
        </Stack>
      </form>
    </Stack>
  )
}
