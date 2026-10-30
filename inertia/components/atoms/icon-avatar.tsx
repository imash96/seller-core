import { createElement, isValidElement, type ComponentType, type ReactNode } from 'react'

export type AvatarTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'purple'

const TONE_CLASSES: Record<AvatarTone, string> = {
  primary: 'bg-primary/12 text-primary border-primary/25',
  info: 'bg-blue-500/12 text-blue-600 dark:text-blue-400 border-blue-500/25',
  success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25',
  error: 'bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/25',
  purple: 'bg-violet-500/12 text-violet-600 dark:text-violet-400 border-violet-500/25',
  neutral: 'bg-muted text-muted-foreground border-border',
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs rounded-lg',
  md: 'w-10 h-10 text-xs rounded-xl',
  lg: 'w-12 h-12 text-sm rounded-2xl',
}

/**
 * Safely renders either a ReactNode (<Icon />) or a component reference (Icon / forwardRef).
 */
export function renderIconOrNode(icon: unknown, defaultClassName = 'w-5 h-5'): ReactNode {
  if (icon === null || icon === undefined || typeof icon === 'boolean') return null
  if (isValidElement(icon)) return icon
  if (
    typeof icon === 'function' ||
    (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))
  ) {
    const Comp = icon as ComponentType<{ className?: string }>
    return createElement(Comp, { className: defaultClassName })
  }
  if (typeof icon === 'string' || typeof icon === 'number') {
    return icon
  }
  return null
}

export function IconAvatar({
  icon,
  text,
  tone = 'primary',
  size = 'md',
  className = '',
}: {
  icon?: ReactNode | ComponentType<{ className?: string }> | unknown
  text?: string
  tone?: AvatarTone
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const toneCls = TONE_CLASSES[tone] ?? TONE_CLASSES.primary
  const sizeCls = SIZE_CLASSES[size]
  const renderedIcon = renderIconOrNode(icon, size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')

  return (
    <div
      className={`inline-flex items-center justify-center font-bold border shrink-0 select-none ${sizeCls} ${toneCls} ${className}`}
    >
      {renderedIcon ?? (text ? text.slice(0, 2).toUpperCase() : 'SC')}
    </div>
  )
}
