import React from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import {
  AppButton,
  Badge,
  MonoBadge,
  SlideOverDrawer,
  MultiCurrencyPriceStack,
  resolvePriceMoney,
  type PriceMoney,
  type Row,
} from '~/lib/ui'
import { FileCode2, Download, Send } from 'lucide-react'

function downloadJsonFile(filename: string, payload: unknown) {
  if (typeof window === 'undefined') return
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ListingDetailDrawer({
  listing,
  onClose,
  onPublishListing,
}: {
  listing: Row | null
  onClose: () => void
  onPublishListing: (item: Row) => void
}) {
  return (
    <SlideOverDrawer
      open={!!listing}
      onClose={onClose}
      title={`Platform Endpoint JSON Payload (${String(listing?.externalListingId ?? '')})`}
      subtitle={`${String(listing?.productTitle ?? '')} · Brand: ${String(listing?.brandName ?? '')}`}
      icon={FileCode2}
      badge={
        listing ? (
          <>
            <Badge label={String(listing.platform).toUpperCase()} variant="info" />
            <MonoBadge text={String(listing.externalSku)} />
          </>
        ) : null
      }
      footer={
        listing ? (
          <>
            <AppButton
              label="Download Listing JSON"
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={() =>
                downloadJsonFile(
                  `${listing.platform}_${listing.externalSku}.json`,
                  listing.transformedPayload ?? listing
                )
              }
            />
            <AppButton
              disabled
              label="Publish on Platform Now"
              variant="primary"
              size="sm"
              icon={Send}
              onClick={() => onPublishListing(listing)}
            />
          </>
        ) : null
      }
    >
      {listing && (
        <Stack gap={4} className="text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 rounded-xl border border-card-border bg-muted/20 p-3.5">
            <Stack>
              <strong>Product:</strong> {String(listing.productTitle)}
            </Stack>
            <Stack>
              <strong>Brand:</strong> {String(listing.brandName)}
            </Stack>
            <Stack className="col-span-2">
              <strong className="block mb-1">Multi-Currency Prices (ChannelListingPrice):</strong>
              <MultiCurrencyPriceStack
                prices={
                  Array.isArray(listing.prices)
                    ? (listing.prices as PriceMoney[])
                    : [
                        resolvePriceMoney(
                          listing.listedPriceMoney ?? listing.listedPrice,
                          String(listing.currencyCode ?? 'USD')
                        ),
                      ]
                }
                primaryCurrency={String(listing.currencyCode ?? 'USD')}
                maxBadges={6}
              />
            </Stack>
            <Stack>
              <strong>Sync Status:</strong> {String(listing.syncStatus)}
            </Stack>
          </div>

          <Stack gap={1.5}>
            <Stack className="font-bold text-foreground">
              Generated Platform Transformer JSON Payload
            </Stack>
            <pre className="rounded-xl border border-card-border bg-muted/30 p-4 font-mono text-2xs text-foreground overflow-x-auto">
              {JSON.stringify(
                listing.transformedPayload ?? listing.channelAttributes ?? listing,
                null,
                2
              )}
            </pre>
          </Stack>
        </Stack>
      )}
    </SlideOverDrawer>
  )
}
