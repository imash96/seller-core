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
  const renderedIcon = renderIconOrNode(icon, 'w-4.5 h-4.5 text-primary shrink-0')

  return (
    <div className="rounded-2xl border border-card-border bg-card text-card-foreground overflow-hidden shadow-2xs transition-all duration-150">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-muted/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {renderedIcon && (
            <div className="w-9 h-9 rounded-xl bg-primary-subtle border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
              {renderedIcon}
            </div>
          )}
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground tracking-tight">{title}</span>
              {badge && <StatusBadge label={badge} variant={badgeVariant} />}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ease-in-out ${
            open ? 'rotate-180 text-foreground' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-5 py-4 border-t border-border-subtle bg-surface/50 leading-relaxed">
          {children}
        </div>
      )}
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
  return <div className={`space-y-3.5 ${className}`}>{children}</div>
}
