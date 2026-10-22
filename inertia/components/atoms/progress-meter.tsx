export function ProgressMeter({
  value,
  label,
  showValue = false,
  variant = 'info',
  size = 'md',
}: {
  value: number
  label?: string
  showValue?: boolean
  variant?: 'info' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const barColor =
    variant === 'success'
      ? 'bg-emerald-500'
      : variant === 'warning'
        ? 'bg-amber-500'
        : variant === 'error'
          ? 'bg-rose-500'
          : 'bg-primary'
  const heightCls = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className="w-full space-y-1">
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label && <span className="text-muted-foreground truncate">{label}</span>}
          {showValue && (
            <span className="font-semibold text-foreground tabular-nums">
              {clamped.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${heightCls} rounded-full bg-muted overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
