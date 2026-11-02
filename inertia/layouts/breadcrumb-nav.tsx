import { Text } from '@astryxdesign/core/Text'
import { Stack } from '@astryxdesign/core/Stack'
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
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Stack
          direction="horizontal"
          align="center"
          gap={2}
          className="text-foreground font-semibold"
        >
          <Home className="w-4 h-4 text-primary" />
          <Text>Dashboard</Text>
        </Stack>
      </nav>
    )
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm flex-wrap" aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
        <Text className="hidden sm:inline">Dashboard</Text>
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
          <Stack direction="horizontal" align="center" gap={1.5} key={href}>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            {isLast ? (
              <Text color="primary" weight="semibold" aria-current="page">
                {label}
              </Text>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </Stack>
        )
      })}
    </nav>
  )
}
