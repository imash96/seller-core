import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  direction?: 'left' | 'right'
  title?: string
  subtitle?: string
  widthClass?: string
  hideOnDesktop?: boolean
  className?: string
  children: ReactNode
}

export default function Drawer({
  open,
  onClose,
  direction = 'right',
  title,
  subtitle,
  widthClass = 'max-w-lg',
  hideOnDesktop = false,
  className = '',
  children,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={`fixed inset-0 z-50 ${hideOnDesktop ? 'lg:hidden' : ''}`}>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 bottom-0 ${
          direction === 'left' ? 'left-0' : 'right-0'
        } z-50 flex flex-col w-full sm:w-11/12 ${widthClass} bg-card text-card-foreground border-border ${
          direction === 'left' ? 'border-r' : 'border-l'
        } shadow-2xl overflow-hidden ${className}`}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border bg-muted/30 shrink-0">
            <div className="min-w-0">
              {title && (
                <h3 className="text-base sm:text-lg font-bold text-foreground break-words">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 break-words">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto min-w-0">{children}</div>
      </aside>
    </div>
  )
}
