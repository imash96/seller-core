import { Link } from '@inertiajs/react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'

export type ActionColorKey = 'blue' | 'green' | 'purple' | 'red' | 'yellow'

const STYLES: Record<ActionColorKey, { bg: string; icon: string; border: string; hover: string }> = {
  yellow: {
    bg: 'bg-amber-500/5',
    icon: 'text-amber-600 dark:text-amber-400 bg-amber-500/15',
    border: 'border-amber-500/20',
    hover: 'hover:border-amber-500/40',
  },
  blue: {
    bg: 'bg-blue-500/5',
    icon: 'text-blue-600 dark:text-blue-400 bg-blue-500/15',
    border: 'border-blue-500/20',
    hover: 'hover:border-blue-500/40',
  },
  purple: {
    bg: 'bg-violet-500/5',
    icon: 'text-violet-600 dark:text-violet-400 bg-violet-500/15',
    border: 'border-violet-500/20',
    hover: 'hover:border-violet-500/40',
  },
  green: {
    bg: 'bg-emerald-500/5',
    icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15',
    border: 'border-emerald-500/20',
    hover: 'hover:border-emerald-500/40',
  },
  red: {
    bg: 'bg-rose-500/5',
    icon: 'text-rose-600 dark:text-rose-400 bg-rose-500/15',
    border: 'border-rose-500/20',
    hover: 'hover:border-rose-500/40',
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
