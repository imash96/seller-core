import { type ComponentType, type ReactNode } from 'react'
import { IconAvatar, type AvatarTone } from '../atoms/icon-avatar'
import { StatusBadge } from '../atoms/status-badge'

export interface StatusBarItem {
  id?: string
  label: string
  value: ReactNode
  sublabel?: ReactNode
  hint?: ReactNode
  icon?: ReactNode | ComponentType<{ className?: string }> | unknown
  tone?: AvatarTone
  badge?: { label: string; variant?: string }
  active?: boolean
  onClick?: () => void
}

export function TopStatusBar({
  items,
  columns = 4,
  className = '',
}: {
  items: StatusBarItem[]
  columns?: 3 | 4 | 5
  className?: string
}) {
  if (!items || items.length === 0) return null

  const gridCols =
    columns === 5
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div className={`grid ${gridCols} gap-3.5 ${className}`}>
      {items.map((item, idx) => {
        const isInteractive = typeof item.onClick === 'function'
        return (
          <div
            key={item.id ?? `${item.label}-${idx}`}
            onClick={item.onClick}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onKeyDown={
              isInteractive
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      item.onClick?.()
                    }
                  }
                : undefined
            }
            className={`group rounded-2xl border p-4 transition-all duration-150 flex items-start justify-between gap-3 ${
              item.active
                ? 'bg-primary-subtle border-primary ring-2 ring-primary/20 shadow-sm'
                : 'bg-card text-card-foreground border-card-border hover:border-primary/35 shadow-xs hover:shadow-md'
            } ${isInteractive ? 'cursor-pointer select-none' : ''}`}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </span>
                {item.badge && (
                  <StatusBadge label={item.badge.label} variant={item.badge.variant ?? 'info'} />
                )}
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums tracking-tight truncate">
                {item.value}
              </div>
              {(item.sublabel || item.hint) && (
                <div className="text-xs text-muted-foreground truncate">
                  {item.sublabel ?? item.hint}
                </div>
              )}
            </div>
            {item.icon ? (
              <IconAvatar icon={item.icon} tone={item.tone ?? 'primary'} size="md" />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
