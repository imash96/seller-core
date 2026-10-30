import { type ButtonHTMLAttributes, type ComponentType, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { renderIconOrNode } from './icon-avatar'

export type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'cart'
  | 'wishlist'

export type AppButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon'

export interface AppButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label?: string
  children?: ReactNode
  variant?: AppButtonVariant
  size?: AppButtonSize
  icon?: ReactNode | ComponentType<{ className?: string }> | unknown
  trailingIcon?: ReactNode | ComponentType<{ className?: string }> | unknown
  badgeCount?: number | string
  loading?: boolean
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<AppButtonVariant, string> = {
  primary:
    'bg-button-primary text-button-primary-foreground hover:bg-button-primary-hover active:bg-button-primary-active border-transparent shadow-xs',
  secondary:
    'bg-button-secondary text-button-secondary-foreground hover:bg-button-secondary-hover active:bg-button-secondary-active border-border',
  accent:
    'bg-button-accent text-button-accent-foreground hover:bg-button-accent-hover active:bg-button-accent-active border-transparent shadow-xs',
  destructive:
    'bg-button-destructive text-button-destructive-foreground hover:bg-button-destructive-hover active:bg-button-destructive-active border-transparent shadow-xs',
  outline:
    'bg-button-outline text-button-outline-foreground border-button-outline-border hover:bg-button-outline-hover hover:text-button-outline-hover-foreground',
  ghost:
    'bg-transparent text-button-ghost-foreground hover:bg-button-ghost-hover active:bg-button-ghost-active border-transparent',
  cart:
    'bg-button-cart text-button-cart-foreground hover:bg-button-cart-hover border-transparent shadow-xs',
  wishlist:
    'bg-button-wishlist text-button-wishlist-foreground hover:bg-button-wishlist-hover border-transparent',
}

const SIZE_CLASSES: Record<AppButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[11px] gap-1.5 rounded-lg',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-xs sm:text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-sm gap-2.5 rounded-xl',
  icon: 'h-9 w-9 p-0 rounded-xl justify-center',
}

export function AppButton({
  label,
  children,
  variant = 'primary',
  size = 'sm',
  icon,
  trailingIcon,
  badgeCount,
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  type = 'button',
  ...rest
}: AppButtonProps) {
  const variantCls = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary
  const sizeCls = SIZE_CLASSES[size] ?? SIZE_CLASSES.sm
  const iconSizeCls = size === 'xs' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const leadingEl = loading ? (
    <Loader2 className={`${iconSizeCls} animate-spin shrink-0`} />
  ) : (
    renderIconOrNode(icon, `${iconSizeCls} shrink-0`)
  )
  const trailingEl = renderIconOrNode(trailingIcon, `${iconSizeCls} shrink-0`)

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold border transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-55 disabled:pointer-events-none ${sizeCls} ${variantCls} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {leadingEl}
      {(label || children) && <span className="truncate">{label ?? children}</span>}
      {badgeCount !== undefined && badgeCount !== null && (
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-button-badge text-button-badge-foreground leading-none">
          {badgeCount}
        </span>
      )}
      {trailingEl}
    </button>
  )
}

export const ActionButton = AppButton
