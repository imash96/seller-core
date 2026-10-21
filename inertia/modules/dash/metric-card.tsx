import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '~/ui/card'

export interface MetricCardProps {
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

export default function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  iconBg = 'bg-blue-500/10',
  iconColor = 'text-blue-600 dark:text-blue-400',
}: MetricCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow" rounded>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1 truncate">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {change && (
              <div
                className={`flex items-center gap-1 text-xs font-medium mt-2 ${
                  change.trend === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {change.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{Math.abs(change.value)}%</span>
                <span className="text-muted-foreground">margin / health</span>
              </div>
            )}
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
