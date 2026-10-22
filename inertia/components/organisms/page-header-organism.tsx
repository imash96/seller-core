import { type ReactNode } from 'react'
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { StatusBadge } from '../atoms/status-badge'

export interface PageHeaderProps {
  title: string
  description?: string
  subtitle?: string
  eyebrow?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
  icon?: LucideIcon
  badge?: ReactNode | string
}

export function PageHeader({
  title,
  description,
  subtitle,
  eyebrow,
  actions,
  meta,
  icon: Icon,
  badge,
}: PageHeaderProps) {
  const desc = description ?? subtitle
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1">
      <div className="flex items-start gap-3.5 min-w-0">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-primary/12 border border-primary/25 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="space-y-1 min-w-0">
          {eyebrow && <div className="flex items-center gap-2 flex-wrap">{eyebrow}</div>}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {typeof badge === 'string' ? (
              <StatusBadge label={badge} variant="info" />
            ) : (
              badge
            )}
            {meta}
          </div>
          {desc && (
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">{desc}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  )
}

export const ModulePageHeader = PageHeader

export interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down'
  }
  icon: LucideIcon
  description?: string
  iconBg?: string
  iconColor?: string
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  iconBg = 'bg-primary/12',
  iconColor = 'text-primary',
}: StatsCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-5 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums truncate">
            {value}
          </p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          {change && (
            <div
              className={`flex items-center gap-1 text-xs font-semibold mt-2 ${
                change.trend === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {change.trend === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{Math.abs(change.value)}%</span>
              <span className="text-muted-foreground font-normal">vs last period</span>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}

export function PageSection({
  id,
  title,
  description,
  actions,
  children,
}: {
  id?: string
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="bg-card text-card-foreground border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div className="space-y-0.5 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">{title}</h2>
          {description && <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
      </div>
      <div>{children}</div>
    </section>
  )
}
