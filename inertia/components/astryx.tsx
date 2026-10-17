import { type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Facebook / Meta Astryx Design System Component Primitives
 * Reference: https://astryx.atmeta.com/components
 */

export type AstryxBadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'purple'

export function AstryxBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: AstryxBadgeTone
}) {
  const toneClasses: Record<AstryxBadgeTone, string> = {
    neutral:
      'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    primary:
      'bg-blue-50 text-[#0866FF] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    warning:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    danger:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    purple:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}

export function statusTone(status: string): AstryxBadgeTone {
  const s = (status || '').toLowerCase()
  if (
    [
      'active',
      'healthy',
      'paid',
      'fulfilled',
      'delivered',
      'completed',
      'matched',
      'reconciled',
      'settled',
      'authorized',
      'published',
      'synced',
      'allow',
      'cleared',
      'low',
    ].includes(s)
  ) {
    return 'success'
  }
  if (
    [
      'pending',
      'processing',
      'partially_fulfilled',
      'Partially_paid',
      'in_transit',
      'label_created',
      'warning',
      'medium',
      'under_review',
      'pending_review',
      'requested',
      'unreconciled',
      'queued',
      'running',
    ].includes(s)
  ) {
    return 'warning'
  }
  if (
    [
      'cancelled',
      'failed',
      'error',
      'suspended',
      'locked',
      'critical',
      'high',
      'urgent',
      'deny',
      'rejected',
      'chargeback',
      'overdue',
      'variance_detected',
      'confirmed_risk',
    ].includes(s)
  ) {
    return 'danger'
  }
  if (['confirmed', 'business', 'marketplace_import', 'enterprise'].includes(s)) {
    return 'primary'
  }
  return 'neutral'
}

export function AstryxKpiCard({
  label,
  value,
  subtext,
  icon,
  tone = 'primary',
}: {
  label: string
  value: string | number
  subtext?: string
  icon?: ReactNode
  tone?: AstryxBadgeTone
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--line-2)] rounded-xl p-4 shadow-xs flex flex-col justify-between gap-2 transition hover:border-[#0866FF]/40">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          {label}
        </span>
        {icon && <div className="text-[#0866FF]">{icon}</div>}
      </div>
      <div className="text-2xl font-bold tracking-tight text-[var(--ink)] mono">{value}</div>
      {subtext && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <AstryxBadge tone={tone}>{subtext}</AstryxBadge>
        </div>
      )}
    </div>
  )
}

export function AstryxCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--line-2)] rounded-xl overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--ink)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function AstryxModal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[var(--card)] border border-[var(--line-2)] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
            {description && <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="iconbtn" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function AstryxButton({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}) {
  const variantStyles = {
    primary: 'bg-[#0866FF] hover:bg-[#0756D8] text-white border-transparent shadow-xs',
    secondary: 'bg-[var(--card)] hover:bg-[var(--paper)] text-[var(--ink)] border-[var(--line-2)]',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
    ghost:
      'bg-transparent hover:bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] border-transparent',
  }
  const sizeStyles = {
    sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
    md: 'h-9 px-4 text-sm rounded-lg gap-2',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium border transition cursor-pointer disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </button>
  )
}
