import { type ReactNode } from 'react'
import { StatusBadge } from '../atoms/status-badge'
import { MonoBadge } from '../atoms/mono-badge'
import { IconAvatar, type AvatarTone } from '../atoms/icon-avatar'
import { MetricCell } from '../atoms/metric-cell'

export type CardData = {
  title: string
  subtitle?: string
  idBadge?: string
  avatarText?: string
  statusBadge?: { label: string; variant: string }
  metrics: Array<{ label: string; value: ReactNode; icon?: ReactNode }>
  actions?: ReactNode
}

const ACCENT_STRIP_CLASSES: Record<string, string> = {
  success: 'bg-emerald-500',
  green: 'bg-emerald-500',
  error: 'bg-rose-500',
  red: 'bg-rose-500',
  warning: 'bg-amber-500',
  yellow: 'bg-amber-500',
  orange: 'bg-orange-500',
  info: 'bg-blue-500',
  blue: 'bg-blue-500',
  purple: 'bg-violet-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  neutral: 'bg-border',
}

function variantToAvatarTone(variant?: string): AvatarTone {
  if (!variant) return 'primary'
  if (variant === 'success' || variant === 'green') return 'success'
  if (variant === 'error' || variant === 'red') return 'error'
  if (variant === 'warning' || variant === 'yellow' || variant === 'orange') return 'warning'
  if (variant === 'info' || variant === 'blue' || variant === 'cyan' || variant === 'teal')
    return 'info'
  if (variant === 'purple') return 'purple'
  return 'neutral'
}

export function RecordCard({ card }: { card: CardData }) {
  const variant = card.statusBadge?.variant ?? 'neutral'
  const stripClass = ACCENT_STRIP_CLASSES[variant] ?? ACCENT_STRIP_CLASSES.neutral
  const initials = (card.avatarText ?? card.title ?? 'SC').slice(0, 2).toUpperCase()

  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl overflow-hidden flex flex-col shadow-xs hover:shadow-md hover:border-primary/35 transition-all duration-150">
      <div className={`h-1 w-full ${stripClass}`} />

      <div className="p-4 sm:p-5 flex flex-col gap-3.5 flex-1">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <IconAvatar text={initials} tone={variantToAvatarTone(variant)} size="md" />
            <div className="min-w-0 flex-1">
              <div
                title={card.title}
                className="text-sm sm:text-base font-bold text-foreground truncate leading-snug"
              >
                {card.title}
              </div>
              {card.subtitle ? (
                <div
                  title={card.subtitle}
                  className="text-xs text-muted-foreground truncate mt-0.5"
                >
                  {card.subtitle}
                </div>
              ) : card.idBadge ? (
                <div className="mt-1">
                  <MonoBadge>{card.idBadge}</MonoBadge>
                </div>
              ) : null}
            </div>
          </div>

          {card.statusBadge && (
            <div className="shrink-0">
              <StatusBadge
                label={card.statusBadge.label}
                variant={card.statusBadge.variant}
              />
            </div>
          )}
        </div>

        {/* Card Body (2x2 Metric Grid) */}
        {card.metrics && card.metrics.length > 0 && (
          <>
            <div className="h-px bg-border/80" />
            <div className="grid grid-cols-2 gap-3">
              {card.metrics.map((m, idx) => (
                <MetricCell key={idx} label={m.label} value={m.value} icon={m.icon} />
              ))}
            </div>
          </>
        )}

        {/* Card Footer Actions */}
        {card.actions && (
          <div className="mt-auto pt-3 border-t border-border/80 flex items-center justify-end gap-2 flex-wrap">
            {card.actions}
          </div>
        )}
      </div>
    </div>
  )
}
