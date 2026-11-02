import { Stack } from '@astryxdesign/core/Stack'
import { Link } from '@adonisjs/inertia/react'
import { Button } from '@astryxdesign/core/Button'
import { StatusBadge } from '~/components/atoms/status-badge'

export default function NotFound() {
  return (
    <Stack direction="horizontal" align="center" justify="center" padding={6}>
      <Stack
        gap={4}
        className="w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl p-6 sm:p-8 shadow-lg"
      >
        <StatusBadge variant="warning" label="Error 404" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The route you tried to reach doesn&apos;t exist. Check the URL or head back to the
          dashboard.
        </p>
        <Stack className="pt-2">
          <Link href="/dashboard">
            <Button label="Go to dashboard" variant="primary" />
          </Link>
        </Stack>
      </Stack>
    </Stack>
  )
}
