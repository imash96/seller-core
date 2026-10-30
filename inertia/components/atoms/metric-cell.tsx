import { isValidElement, type ComponentType, type ReactNode } from 'react'
import { renderIconOrNode } from './icon-avatar'

export function MetricCell({
  label,
  value,
  icon,
  className = '',
}: {
  label: string
  value: ReactNode
  icon?: ReactNode | ComponentType<{ className?: string }> | unknown
  className?: string
}) {
  const renderedIcon = renderIconOrNode(icon, 'w-3.5 h-3.5')
  const safeValue: ReactNode =
    value === null || value === undefined
      ? '—'
      : isValidElement(value) ||
          typeof value === 'string' ||
          typeof value === 'number' ||
          Array.isArray(value)
        ? value
        : typeof value === 'boolean'
          ? String(value)
          : JSON.stringify(value)

  return (
    <div className={`min-w-0 flex flex-col gap-0.5 ${className}`}>
      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
        {renderedIcon}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-sm font-semibold text-foreground leading-snug break-words">
        {safeValue}
      </div>
    </div>
  )
}
