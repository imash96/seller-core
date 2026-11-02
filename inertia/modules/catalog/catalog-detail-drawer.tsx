import React from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Grid } from '@astryxdesign/core/Grid'
import { AppButton, MonoBadge, SlideOverDrawer, type Row } from '~/lib/ui'
import { Layers, Edit3, Sparkles } from 'lucide-react'

export function CatalogDetailDrawer({
  item,
  onClose,
  onEdit,
  onOpenConvertPreview,
}: {
  item: Row | null
  onClose: () => void
  onEdit: (item: Row) => void
  onOpenConvertPreview: (item: Row) => void
}) {
  return (
    <SlideOverDrawer
      open={!!item}
      onClose={onClose}
      title={String(item?.title ?? 'Catalog SKU')}
      subtitle={String(item?.subTitle ?? '')}
      icon={Layers}
      badge={
        item ? (
          <>
            <MonoBadge text={String(item.skuCode ?? item.catalogKey)} />
            <MonoBadge text={String(item.structuredBaseCode ?? item.structuredCode)} />
          </>
        ) : null
      }
      footer={
        item ? (
          <>
            <AppButton
              label="Edit Catalog SKU"
              variant="secondary"
              size="sm"
              icon={Edit3}
              onClick={() => {
                const target = item
                onClose()
                onEdit(target)
              }}
            />
            <AppButton
              label="Convert to Product (Preview & Edit)"
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => {
                const target = item
                onClose()
                onOpenConvertPreview(target)
              }}
            />
          </>
        ) : null
      }
    >
      {item && (
        <Stack gap={4} className="text-xs">
          <Stack gap={2} padding={4} className="rounded-xl border border-card-border bg-muted/20">
            <Stack className="font-bold text-foreground">Taxonomy & Modular Codes</Stack>
            <Grid columns={{ minWidth: 220, max: 2 }} className="text-muted-foreground">
              <Stack>
                <strong>Category Handle:</strong> {String(item.categoryHandle)}
              </Stack>
              <Stack>
                <strong>Product Type:</strong> {String(item.productType ?? item.type)}
              </Stack>
              <Stack>
                <strong>Gender:</strong> {String(item.gender ?? item.genderCode)}
              </Stack>
              <Stack>
                <strong>Category Code:</strong> {String(item.categoryCode)}
              </Stack>
              <Stack>
                <strong>Fit Code:</strong> {String(item.fitCode)}
              </Stack>
              <Stack>
                <strong>Material / Tier:</strong> {String(item.leatherCode ?? item.materialCode)} /
                Tier {String(item.priceTierCode ?? item.priceTier)}
              </Stack>
            </Grid>
          </Stack>

          <Stack gap={2} padding={4} className="rounded-xl border border-card-border bg-muted/20">
            <Stack className="font-bold text-foreground">Descriptions</Stack>
            <p className="text-muted-foreground">{String(item.description)}</p>
          </Stack>

          <Stack gap={2} padding={4} className="rounded-xl border border-card-border bg-muted/20">
            <Stack className="font-bold text-foreground">Raw Attributes JSON</Stack>
            <pre className="overflow-x-auto font-mono text-2xs text-foreground">
              {JSON.stringify(item.attributes ?? {}, null, 2)}
            </pre>
          </Stack>
        </Stack>
      )}
    </SlideOverDrawer>
  )
}
