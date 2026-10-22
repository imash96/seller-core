import { type ReactNode } from 'react'

export function MonoBadge({
  children,
  className = '',
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-medium bg-muted text-foreground border border-border truncate max-w-full ${className}`}
    >
      {children}
    </span>
  )
}
