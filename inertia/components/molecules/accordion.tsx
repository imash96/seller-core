import { useState, type ComponentType, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { renderIconOrNode } from '../atoms/icon-avatar'
import { StatusBadge } from '../atoms/status-badge'

export interface AccordionItemProps {
  id?: string
  title: string
  subtitle?: string
  icon?: ReactNode | ComponentType<{ className?: string }> | unknown
  badge?: string
  badgeVariant?: string
  defaultOpen?: boolean
  children: ReactNode
}

export function AccordionItem({
  title,
  subtitle,
  icon,
  badge,
  badgeVariant = 'info',
  defaultOpen = false,
  children,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  const renderedIcon = renderIconOrNode(icon, 'w-4 h-4 text-primary shrink-0')

  return (
    <div className="rounded-2xl border border-card-border bg-card text-card-foreground overflow-hidden shadow-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          {renderedIcon && (
            <div className="w-8 h-8 rounded-xl bg-primary-subtle flex items-center justify-center shrink-0">
              {renderedIcon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground">{title}</span>
              {badge && <StatusBadge label={badge} variant={badgeVariant} />}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-foreground' : ''
          }`}
        />
      </button>
      {open && <div className="px-5 py-4 border-t border-divider bg-surface/50">{children}</div>}
    </div>
  )
}

export function Accordion({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`space-y-3 ${className}`}>{children}</div>
}
