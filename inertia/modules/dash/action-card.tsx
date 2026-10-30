import { Link } from '@inertiajs/react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'

export type ActionColorKey = 'blue' | 'green' | 'purple' | 'red' | 'yellow'

const STYLES: Record<ActionColorKey, { bg: string; icon: string; border: string; hover: string }> = {
  yellow: {
    bg: 'bg-warning-subtle/40',
    icon: 'text-warning bg-warning-subtle',
    border: 'border-warning/20',
    hover: 'hover:border-warning/40',
  },
  blue: {
    bg: 'bg-info-subtle/40',
    icon: 'text-info bg-info-subtle',
    border: 'border-info/20',
    hover: 'hover:border-info/40',
  },
  purple: {
    bg: 'bg-accent-subtle/40',
    icon: 'text-accent bg-accent-subtle',
    border: 'border-accent/20',
    hover: 'hover:border-accent/40',
  },
  green: {
    bg: 'bg-success-subtle/40',
    icon: 'text-success bg-success-subtle',
    border: 'border-success/20',
    hover: 'hover:border-success/40',
  },
  red: {
    bg: 'bg-error-subtle/40',
    icon: 'text-error bg-error-subtle',
    border: 'border-error/20',
    hover: 'hover:border-error/40',
  },
}

export default function ActionCard({
  label,
  count,
  color,
  icon: Icon,
  href,
}: {
  label: string
  count: number | string
  href: string
  color: ActionColorKey
  icon: LucideIcon
}) {
  const s = STYLES[color]
  return (
    <Link
      href={href}
      className={`group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 unstyled-link ${s.bg} ${s.border} ${s.hover} hover:shadow-md hover:-translate-y-0.5`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.icon} transition-transform group-hover:scale-105`}
      >
        <Icon size={20} />
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground">{count}</p>
      </div>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-foreground" />
      </div>
    </Link>
  )
}
