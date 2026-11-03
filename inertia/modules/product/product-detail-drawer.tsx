import React from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import {
  AppButton,
  MonoBadge,
  Badge,
  SlideOverDrawer,
  MultiCurrencyPriceStack,
  RowAction,
  convertToLocale,
  resolvePriceMoney,
  type PriceMoney,
  type Row,
} from '~/lib/ui'
import { Box, Edit3, Plus, Sparkles } from 'lucide-react'

export function ProductDetailDrawer({
  product,
  onClose,
  onEditProduct,
  onAddVariant,
  onOpenConvertToListing,
  onEditStock,
}: {
  product: Row | null
  onClose: () => void
  onEditProduct: (p: Row) => void
  onAddVariant: (p: Row) => void
  onOpenConvertToListing: (p: Row) => void
  onEditStock: (v: Row) => void
}) {
  return (
    <SlideOverDrawer
      open={!!product}
      onClose={onClose}
      title={String(product?.title ?? 'Product Details')}
      subtitle={String(product?.subTitle ?? product?.description ?? '')}
      icon={Box}
      widthClass="max-w-3xl"
      badge={
        product ? (
          <>
            <MonoBadge text={String(product.skuPrefix ?? product.slug)} />
            <Badge
              label={String((product.brand as any)?.name ?? 'Brand-Agnostic')}
              variant={product.brandId ? 'purple' : 'warning'}
            />
            <Badge
              label={String((product.category as any)?.name ?? 'Uncategorized')}
              variant="info"
            />
          </>
        ) : null
      }
      footer={
        product ? (
          <>
            <Stack direction="horizontal" align="center" gap={2}>
              <AppButton
                label="Edit Product"
                variant="secondary"
                size="sm"
                icon={Edit3}
                onClick={() => onEditProduct(product)}
              />
              <AppButton
                label="+ Add Variant SKU"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => onAddVariant(product)}
              />
            </Stack>
            <AppButton
              label="Convert Product to Platform Listings"
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => onOpenConvertToListing(product)}
            />
          </>
        ) : null
      }
    >
      {product && (
        <Stack gap={5} className="text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 rounded-2xl border border-card-border bg-muted/25 p-4 gap-3.5">
            <Stack>
              <Text size="3xs" color="secondary" weight="bold" className="uppercase block">
                Title (75 / 80 Char)
              </Text>
              <p className="font-semibold text-foreground mt-0.5">
                {String(product.title80 || product.title75 || product.title)}
              </p>
            </Stack>
            <Stack>
              <Text size="3xs" color="secondary" weight="bold" className="uppercase block">
                Medusa Category Path
              </Text>
              <p className="font-mono text-primary mt-0.5">
                /{String((product.category as any)?.taxonomyPath ?? product.slug)}
              </p>
            </Stack>
            <Stack className="sm:col-span-2">
              <Text size="3xs" color="secondary" weight="bold" className="uppercase block mb-1">
                Parent Product Multi-Currency Prices (ProductPrice)
              </Text>
              <MultiCurrencyPriceStack
                prices={Array.isArray(product.prices) ? (product.prices as PriceMoney[]) : []}
                primaryCurrency="USD"
                maxBadges={6}
              />
            </Stack>
            <Stack className="sm:col-span-2">
              <Text size="3xs" color="secondary" weight="bold" className="uppercase block">
                SEO Description
              </Text>
              <p className="text-foreground-secondary mt-0.5 leading-relaxed">
                {String(product.description || product.shortDescription || '—')}
              </p>
            </Stack>
          </div>

          <Stack gap={2}>
            <Stack direction="horizontal" align="center" justify="between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Product Variants ({((product.variants as Row[]) ?? []).length} SKUs)
              </h3>
              <AppButton
                label="+ Add Variant"
                variant="secondary"
                size="xs"
                icon={Plus}
                onClick={() => onAddVariant(product)}
              />
            </Stack>

            <Stack className="overflow-x-auto rounded-2xl border border-card-border bg-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-muted/40 border-b border-divider text-2xs font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-3.5">Variant SKU</th>
                    <th className="py-2.5 px-3.5">Title (Color / Size)</th>
                    <th className="py-2.5 px-3.5">Multi-Currency Prices</th>
                    <th className="py-2.5 px-3.5">Cost</th>
                    <th className="py-2.5 px-3.5">Stock</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {((product.variants as Row[]) ?? []).map((v) => {
                    const vCur = String(v.currencyCode ?? 'USD')
                    const costMoney = resolvePriceMoney(v.costPriceMoney ?? v.costPrice, vCur)
                    const vPrices = Array.isArray(v.prices)
                      ? (v.prices as PriceMoney[])
                      : [resolvePriceMoney(v.retailPriceMoney ?? v.retailPrice, vCur)]
                    return (
                      <tr key={String(v.id)} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3.5">
                          <MonoBadge text={String(v.sku)} />
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-foreground">
                          {String(v.title)}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <MultiCurrencyPriceStack
                            prices={vPrices}
                            primaryCurrency={vCur}
                            maxBadges={4}
                          />
                        </td>
                        <td className="py-2.5 px-3.5 text-muted-foreground tabular-nums">
                          {convertToLocale(costMoney)}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold tabular-nums">
                          {String(v.stockOnHand)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <Stack direction="horizontal" align="center" justify="end" gap={1.5}>
                            <AppButton
                              label="Adjust"
                              variant="secondary"
                              size="xs"
                              onClick={() => onEditStock(v)}
                            />
                            <RowAction
                              action={`/variants/${v.id}/delete`}
                              label="Delete"
                              variant="ghost"
                              confirmText={`Delete variant ${v.sku}?`}
                            />
                          </Stack>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Stack>
          </Stack>
        </Stack>
      )}
    </SlideOverDrawer>
  )
}
