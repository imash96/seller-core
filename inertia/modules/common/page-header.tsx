import { type ReactNode } from 'react'
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  icon?: LucideIcon
  badge?: ReactNode
}

export function ModulePageHeader({
  title,
  description,
  actions,
  icon: Icon,
  badge,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-muted-foreground mt-1 text-sm max-w-3xl">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

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
  iconBg = 'bg-indigo-500/10',
  iconColor = 'text-indigo-600 dark:text-indigo-400',
}: StatsCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground truncate">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          {change && (
            <div
              className={`flex items-center gap-1 text-xs font-semibold mt-2 ${
                change.trend === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {change.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
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
