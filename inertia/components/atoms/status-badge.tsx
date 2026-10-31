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

const VARIANT_CLASSES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  success: {
    bg: 'bg-emerald-500/12',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/25',
  },
  green: {
    bg: 'bg-emerald-500/12',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/25',
  },
  info: {
    bg: 'bg-blue-500/12',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    border: 'border-blue-500/25',
  },
  blue: {
    bg: 'bg-blue-500/12',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    border: 'border-blue-500/25',
  },
  cyan: {
    bg: 'bg-cyan-500/12',
    text: 'text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
    border: 'border-cyan-500/25',
  },
  teal: {
    bg: 'bg-teal-500/12',
    text: 'text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
    border: 'border-teal-500/25',
  },
  warning: {
    bg: 'bg-amber-500/12',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-amber-500/25',
  },
  yellow: {
    bg: 'bg-amber-500/12',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-amber-500/25',
  },
  orange: {
    bg: 'bg-orange-500/12',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
    border: 'border-orange-500/25',
  },
  error: {
    bg: 'bg-rose-500/12',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    border: 'border-rose-500/25',
  },
  red: {
    bg: 'bg-rose-500/12',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    border: 'border-rose-500/25',
  },
  purple: {
    bg: 'bg-violet-500/12',
    text: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
    border: 'border-violet-500/25',
  },
  pink: {
    bg: 'bg-pink-500/12',
    text: 'text-pink-700 dark:text-pink-300',
    dot: 'bg-pink-500',
    border: 'border-pink-500/25',
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
