import { isValidElement, type ReactNode } from 'react'

export function MonoBadge({
  children,
  text,
  className = '',
  title,
}: {
  children?: ReactNode
  text?: ReactNode
  className?: string
  title?: string
}) {
  const raw = children ?? text
  const content: ReactNode =
    raw === null || raw === undefined
      ? '—'
      : isValidElement(raw) || typeof raw === 'string' || typeof raw === 'number'
        ? raw
        : String(raw)

  return (
    <span
      title={title}
      className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-medium bg-muted text-foreground border border-border truncate max-w-full ${className}`}
    >
      {content}
    </span>
  )
}
