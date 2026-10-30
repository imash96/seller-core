import { type ReactNode } from 'react'

export type BadgeVariant =
  | 'default'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'teal'
  | 'cyan'
  | 'pink'
  | 'primary'
  | 'accent'

const VARIANT_CLASSES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  success: {
    bg: 'bg-success-subtle',
    text: 'text-success-text',
    dot: 'bg-success',
    border: 'border-success-border',
  },
  green: {
    bg: 'bg-success-subtle',
    text: 'text-success-text',
    dot: 'bg-success',
    border: 'border-success-border',
  },
  info: {
    bg: 'bg-info-subtle',
    text: 'text-info-text',
    dot: 'bg-info',
    border: 'border-info-border',
  },
  blue: {
    bg: 'bg-info-subtle',
    text: 'text-info-text',
    dot: 'bg-info',
    border: 'border-info-border',
  },
  cyan: {
    bg: 'bg-info-subtle',
    text: 'text-info-text',
    dot: 'bg-info',
    border: 'border-info-border',
  },
  teal: {
    bg: 'bg-info-subtle',
    text: 'text-info-text',
    dot: 'bg-info',
    border: 'border-info-border',
  },
  warning: {
    bg: 'bg-warning-subtle',
    text: 'text-warning-text',
    dot: 'bg-warning',
    border: 'border-warning-border',
  },
  yellow: {
    bg: 'bg-warning-subtle',
    text: 'text-warning-text',
    dot: 'bg-warning',
    border: 'border-warning-border',
  },
  orange: {
    bg: 'bg-warning-subtle',
    text: 'text-warning-text',
    dot: 'bg-warning',
    border: 'border-warning-border',
  },
  error: {
    bg: 'bg-error-subtle',
    text: 'text-error-text',
    dot: 'bg-error',
    border: 'border-error-border',
  },
  red: {
    bg: 'bg-error-subtle',
    text: 'text-error-text',
    dot: 'bg-error',
    border: 'border-error-border',
  },
  purple: {
    bg: 'bg-accent-subtle',
    text: 'text-accent',
    dot: 'bg-accent',
    border: 'border-accent/30',
  },
  pink: {
    bg: 'bg-accent-subtle',
    text: 'text-accent',
    dot: 'bg-accent',
    border: 'border-accent/30',
  },
  accent: {
    bg: 'bg-accent-subtle',
    text: 'text-accent',
    dot: 'bg-accent',
    border: 'border-accent/30',
  },
  primary: {
    bg: 'bg-primary-subtle',
    text: 'text-primary',
    dot: 'bg-primary',
    border: 'border-primary/30',
  },
  neutral: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
    border: 'border-border',
  },
  default: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
    border: 'border-border',
  },
}

export const STATUS_TONES: Record<string, BadgeVariant> = {
  delivered: 'success',
  fulfilled: 'success',
  paid: 'success',
  processed: 'success',
  active: 'success',
  completed: 'success',
  matched: 'success',
  healthy: 'success',
  in_stock: 'success',
  won: 'success',
  confirmed: 'info',
  processing: 'info',
  in_transit: 'info',
  out_for_delivery: 'info',
  label_created: 'info',
  authorized: 'info',
  received: 'info',
  inspected: 'info',
  opened: 'info',
  under_review: 'info',
  running: 'info',
  pending: 'warning',
  unfulfilled: 'warning',
  partially_fulfilled: 'warning',
  partially_paid: 'warning',
  unpaid: 'warning',
  on_hold: 'warning',
  requested: 'warning',
  delayed: 'warning',
  warning: 'warning',
  low_stock: 'warning',
  action_required: 'warning',
  pending_setup: 'warning',
  pending_activation: 'warning',
  rate_limited: 'warning',
  frozen: 'warning',
  cancelled: 'error',
  failed: 'error',
  rejected: 'error',
  error: 'error',
  critical: 'error',
  out_of_stock: 'error',
  overdue: 'error',
  disputed: 'error',
  lost: 'error',
  suspended: 'error',
  locked: 'error',
  auth_expired: 'error',
  exception: 'error',
  refunded: 'neutral',
  closed: 'neutral',
  archived: 'neutral',
  voided: 'neutral',
  disconnected: 'neutral',
  expired: 'neutral',
}

export function statusBadgeVariant(status?: string): BadgeVariant {
  if (!status) return 'neutral'
  return STATUS_TONES[status.toLowerCase()] ?? 'neutral'
}

export function StatusBadge({
  label,
  children,
  variant = 'neutral',
  withDot = true,
  dot,
  className = '',
}: {
  label?: ReactNode
  children?: ReactNode
  variant?: string
  withDot?: boolean
  dot?: boolean
  className?: string
}) {
  const cfg = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.neutral
  const showDot = dot !== undefined ? dot : withDot
  const content = label ?? children
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize whitespace-nowrap ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />}
      {typeof content === 'string' ? content.replace(/_/g, ' ') : content}
    </span>
  )
}

export { StatusBadge as Badge }
