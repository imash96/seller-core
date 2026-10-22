import { type ReactNode } from 'react'
import { StatusBadge } from '../atoms/status-badge'
import { IconAvatar, type AvatarTone } from '../atoms/icon-avatar'

export function KpiScorecard({
  title,
  value,
  subtitle,
  badge,
  icon,
  tone = 'primary',
  children,
}: {
  title: string
  value: ReactNode
  subtitle?: ReactNode
  badge?: { label: string; variant?: string }
  icon?: ReactNode
  tone?: AvatarTone
  children?: ReactNode
}) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
            {badge && <StatusBadge label={badge.label} variant={badge.variant ?? 'info'} />}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums truncate">
            {value}
          </div>
          {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
        </div>
        {icon && <IconAvatar icon={icon} tone={tone} size="md" />}
      </div>
      {children && <div className="pt-2 border-t border-border/70">{children}</div>}
    </div>
  )
}

export function KpiCard({
  label,
  value,
  sublabel,
  trend,
}: {
  label: string
  value: string
  tone?: string
  sublabel?: string
  trend?: string
}) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl p-4 shadow-xs flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">{value}</span>
      {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
      {trend && (
        <div className="mt-1">
          <StatusBadge
            variant={
              trend.startsWith('+') || trend.startsWith('↑')
                ? 'success'
                : trend.startsWith('-') || trend.startsWith('↓')
                  ? 'error'
                  : 'neutral'
            }
            label={trend}
          />
        </div>
      )}
    </div>
  )
}

export function StatStrip({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; hint?: string }>
}) {
  if (!items?.length) return null
  return (
    <div className="bg-muted/45 border border-border rounded-xl p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              {it.label}
            </span>
            <span className="text-lg sm:text-xl font-bold text-foreground tabular-nums truncate">
              {it.value}
            </span>
            {it.hint && <span className="text-[11px] text-muted-foreground truncate">{it.hint}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
