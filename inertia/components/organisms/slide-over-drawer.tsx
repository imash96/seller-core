import { useEffect, type ComponentType, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { renderIconOrNode } from '../atoms/icon-avatar'

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

const SIZE_MAP: Record<DrawerSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  full: 'max-w-5xl',
}

export interface SlideOverDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  badge?: ReactNode
  badges?: ReactNode
  icon?: ReactNode | ComponentType<{ className?: string }> | unknown
  size?: DrawerSize
  width?: string
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
  badges,
  icon,
  size = 'xl',
  width,
  widthClass,
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
  const badgeContent = badges ?? badge
  const resolvedWidth = widthClass ?? width ?? SIZE_MAP[size] ?? 'max-w-2xl'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Scrim Overlay */}
      <div
        className="fixed inset-0 bg-scrim backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${resolvedWidth} bg-card text-card-foreground border-l border-border h-full flex flex-col shadow-2xl transition-transform duration-200 ease-in-out`}
      >
        {/* Sticky Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 bg-surface-elevated shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            {renderedIcon && (
              <div className="w-10 h-10 rounded-xl bg-primary-subtle border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                {renderedIcon}
              </div>
            )}
            <div className="min-w-0 space-y-1">
              {badgeContent && (
                <div className="flex items-center gap-2 flex-wrap mb-1">{badgeContent}</div>
              )}
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug tracking-tight">
                {title}
              </h2>
              {subtitle && <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer select-none"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>

        {/* Sticky Footer */}
        {footer && (
          <div className="border-t border-border px-6 py-4 bg-surface-sunken flex items-center justify-between gap-3 shrink-0 flex-wrap">
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}

export const AppDrawer = SlideOverDrawer
