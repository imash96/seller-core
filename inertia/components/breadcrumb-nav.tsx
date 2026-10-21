import { Link, usePage } from '@inertiajs/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Icon } from '@astryxdesign/core/Icon'
import { ROUTE_LABELS } from '~/lib/constants'
import { Home, ChevronRight } from 'lucide-react'

/**
 * Auto-generated breadcrumb navigation based on the current URL.
 * Resolves human-readable labels from ROUTE_LABELS, with fallback
 * to capitalized segment names.
 *
 * Uses ChevronRight separators and a Home icon (ported from old UI).
 */
export function BreadcrumbNav() {
  const { url } = usePage()
  const pathname = url.split('?')[0].replace(/^\/app\/?/, '').replace(/^\//, '')
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return (
      <Stack direction="horizontal" gap={2} align="center">
        <Icon icon={Home} size="sm" />
        <Text type="label" weight="semibold">
          Dashboard
        </Text>
      </Stack>
    )
  }

  return (
    <nav aria-label="Breadcrumb">
      <Stack direction="horizontal" gap={1} align="center" wrap="wrap">
        <Link href="/dashboard" className="unstyled-link">
          <Stack direction="horizontal" gap={1} align="center">
            <Icon icon={Home} size="sm" color="secondary" />
            <Text type="supporting" as="span" color="secondary">
              Dashboard
            </Text>
          </Stack>
        </Link>

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`
          const label =
            ROUTE_LABELS[segment] ||
            (segment.match(/^[a-z0-9-_]+$/i)
              ? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
              : 'Details')
          const isLast = index === segments.length - 1

          return (
            <Stack key={segment} direction="horizontal" gap={1} align="center">
              <Icon icon={ChevronRight} size="sm" color="secondary" />
              {isLast ? (
                <Text type="label" as="span" weight="semibold" aria-current="page">
                  {label}
                </Text>
              ) : (
                <Link href={href} className="unstyled-link">
                  <Text type="supporting" as="span" color="secondary">
                    {label}
                  </Text>
                </Link>
              )}
            </Stack>
          )
        })}
      </Stack>
    </nav>
  )
}
