import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { ChevronRight, Home } from 'lucide-react'
import { ROUTE_LABELS } from '~/lib/constants'

export function BreadcrumbNav() {
  const { url } = usePage()
  const pathname = (url || '/')
    .split('?')[0]
    .replace(/^\/app\/?/, '')
    .replace(/^\//, '')
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return (
      <nav className="flex items-center gap-2 text-sm min-w-0" aria-label="Breadcrumb">
        <div className="flex items-center gap-2 text-foreground font-semibold truncate">
          <Home className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">Dashboard</span>
        </div>
      </nav>
    )
  }

  return (
    <nav
      className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0 overflow-hidden"
      aria-label="Breadcrumb"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0 unstyled-link"
      >
        <Home className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>

      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`
        const label =
          ROUTE_LABELS[segment] ||
          (segment.match(/^[a-z0-9-_]+$/i)
            ? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/[-_]/g, ' ')
            : 'Details')
        const isLast = index === segments.length - 1

        return (
          <div className="flex items-center gap-1.5 min-w-0" key={href}>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            {isLast ? (
              <span className="font-semibold text-foreground truncate" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate unstyled-link"
              >
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
