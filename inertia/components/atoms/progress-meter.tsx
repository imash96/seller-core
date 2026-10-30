export interface ProgressMeterProps {
  value: number
  label?: string
  showValue?: boolean
  variant?: 'info' | 'success' | 'warning' | 'error' | 'primary' | 'accent'
  tone?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const BAR_COLORS: Record<string, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  destructive: 'bg-error',
  info: 'bg-info',
  accent: 'bg-accent',
  primary: 'bg-primary',
}

export function ProgressMeter({
  value,
  label,
  showValue = false,
  variant,
  tone,
  size = 'md',
  className = '',
}: ProgressMeterProps) {
  const effectiveVariant = variant ?? (tone as ProgressMeterProps['variant']) ?? 'primary'
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const barColor = BAR_COLORS[effectiveVariant] ?? 'bg-primary'
  const heightCls = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2'

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label && <span className="text-muted-foreground truncate font-medium">{label}</span>}
          {showValue && (
            <span className="font-semibold text-foreground tabular-nums font-mono">
              {clamped.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${heightCls} rounded-full bg-surface-sunken border border-border-subtle overflow-hidden p-0.5`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
