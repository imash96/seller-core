import { type ReactNode } from 'react'

export function MetricCell({
  label,
  value,
  icon,
  className = '',
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={`min-w-0 flex flex-col gap-0.5 ${className}`}>
      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-sm font-semibold text-foreground leading-snug break-words">
        {value ?? '—'}
      </div>
    </div>
  )
}
