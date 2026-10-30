import { useEffect, type ComponentType, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { renderIconOrNode } from '../atoms/icon-avatar'

export interface SlideOverDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  badge?: ReactNode
  icon?: ReactNode | ComponentType<{ className?: string }> | unknown
  widthClass?: string
  footer?: ReactNode
  children: ReactNode
}

export function SlideOverDrawer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  icon,
  widthClass = 'max-w-2xl',
  footer,
  children,
}: SlideOverDrawerProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const renderedIcon = renderIconOrNode(icon, 'w-5 h-5 text-primary')

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${widthClass} bg-card text-card-foreground border-l border-card-border h-full flex flex-col shadow-2xl`}
      >
        {/* Sticky Header */}
        <div className="flex items-start justify-between gap-4 border-b border-divider px-6 py-4 bg-muted/30">
          <div className="flex items-start gap-3 min-w-0">
            {renderedIcon && (
              <div className="w-10 h-10 rounded-xl bg-primary-subtle border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                {renderedIcon}
              </div>
            )}
            <div className="min-w-0 space-y-1">
              {badge && <div className="flex items-center gap-2 flex-wrap">{badge}</div>}
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                {title}
              </h2>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>

        {/* Sticky Footer */}
        {footer && (
          <div className="border-t border-divider px-6 py-4 bg-muted/25 flex items-center justify-between gap-3 flex-wrap">
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}

export const AppDrawer = SlideOverDrawer
