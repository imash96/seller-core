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

const VARIANT_CLASSES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/20',
  },
  green: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/20',
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    border: 'border-blue-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    border: 'border-blue-500/20',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-amber-500/20',
  },
  yellow: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-amber-500/20',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
    border: 'border-orange-500/20',
  },
  error: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    border: 'border-rose-500/20',
  },
  red: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    border: 'border-rose-500/20',
  },
  purple: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
    border: 'border-violet-500/20',
  },
  neutral: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
    border: 'border-slate-500/20',
  },
}

export function StatusBadge({
  label,
  variant = 'neutral',
  withDot = true,
  className = '',
}: {
  label: ReactNode
  variant?: string
  withDot?: boolean
  className?: string
}) {
  const cfg = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.neutral
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
      {typeof label === 'string' ? label.replace(/_/g, ' ') : label}
    </span>
  )
}
