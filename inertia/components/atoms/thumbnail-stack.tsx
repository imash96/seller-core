import { useState } from 'react'
import { Package, Layers } from 'lucide-react'

export interface ThumbnailStackItem {
  imageUrl?: string | null
  title?: string
  sku?: string
  quantity?: number
}

export interface ThumbnailStackProps {
  items: ThumbnailStackItem[]
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_DIMS = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
}

function isUsableImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false
  if (url.includes('example.com/')) return false
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/') ||
    url.startsWith('data:image/')
  )
}

function FallbackProductGraphic({
  sku,
  title,
  index = 0,
}: {
  sku?: string
  title?: string
  index?: number
}) {
  const palettes = [
    'from-primary/20 via-accent/15 to-primary/5 text-primary border-primary/30',
    'from-success/20 via-info/15 to-success/5 text-success border-success/30',
    'from-warning/20 via-accent/15 to-warning/5 text-warning border-warning/30',
  ]
  const palette = palettes[index % palettes.length]
  const code = (sku || title || 'SKU').slice(0, 6).toUpperCase()

  return (
    <div
      className={`w-full h-full rounded-xl bg-gradient-to-br ${palette} border flex flex-col items-center justify-center p-1.5 text-center select-none`}
    >
      <Package className="w-5 h-5 mb-0.5 opacity-85 shrink-0" />
      <span className="font-mono text-[9px] font-bold tracking-tight truncate max-w-full">
        {code}
      </span>
    </div>
  )
}

function SingleThumb({ item, index }: { item: ThumbnailStackItem; index: number }) {
  const [failed, setFailed] = useState(false)
  const valid = isUsableImageUrl(item.imageUrl) && !failed

  if (!valid) {
    return <FallbackProductGraphic sku={item.sku} title={item.title} index={index} />
  }

  return (
    <img
      src={item.imageUrl!}
      alt={item.title || item.sku || 'Product thumbnail'}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover rounded-xl border border-card-border bg-surface-sunken"
    />
  )
}

/**
 * ThumbnailStack Atom
 * - When `items.length <= 1`: renders a single crisp rounded product thumbnail.
 * - When `items.length > 1`: renders tilted background product thumbnails (`-rotate-6`, `rotate-6`)
 *   layered behind the primary front thumbnail plus a `+N` multi-item count pill.
 */
export function ThumbnailStack({ items, size = 'md', className = '' }: ThumbnailStackProps) {
  const list = items?.length ? items : [{ sku: 'ITEM', title: 'Product' }]
  const primary = list[0]
  const secondary = list[1]
  const tertiary = list[2]
  const extraCount = list.length - 1
  const dimCls = SIZE_DIMS[size] ?? SIZE_DIMS.md

  return (
    <div className={`relative inline-flex items-center justify-center ${dimCls} ${className}`}>
      {/* 3rd item tilted right in the back */}
      {tertiary && (
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-2.5 -translate-y-1.5 rotate-8 scale-90 opacity-75 rounded-xl shadow-sm pointer-events-none transition-transform group-hover:rotate-12 group-hover:translate-x-3"
        >
          <SingleThumb item={tertiary} index={2} />
        </div>
      )}

      {/* 2nd item tilted left in behind */}
      {secondary && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -translate-x-2 -translate-y-1 -rotate-6 scale-95 opacity-85 rounded-xl shadow-sm pointer-events-none transition-transform group-hover:-rotate-10 group-hover:-translate-x-2.5"
        >
          <SingleThumb item={secondary} index={1} />
        </div>
      )}

      {/* Primary front thumbnail */}
      <div className="relative z-10 w-full h-full rounded-xl shadow-md overflow-hidden bg-card">
        <SingleThumb item={primary} index={0} />
      </div>

      {/* Multi-item count badge */}
      {extraCount > 0 && (
        <span
          title={`${list.length} line items in this order`}
          className="absolute -bottom-1.5 -right-1.5 z-20 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-button-badge text-button-badge-foreground shadow-sm border border-card"
        >
          <Layers className="w-2.5 h-2.5" />+{extraCount}
        </span>
      )}
    </div>
  )
}
