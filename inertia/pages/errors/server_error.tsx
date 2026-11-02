import { Stack } from '@astryxdesign/core/Stack'
import { Link } from '@adonisjs/inertia/react'
import { Button } from '@astryxdesign/core/Button'
import { StatusBadge } from '~/components/atoms/status-badge'

export default function ServerError() {
  return (
    <Stack direction="horizontal" align="center" justify="center" padding={6}>
      <Stack
        gap={4}
        className="w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl p-6 sm:p-8 shadow-lg"
      >
        <StatusBadge variant="error" label="Error 500" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Something broke</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The server hit an unexpected error. Try again in a moment — if it persists, check the
          server logs for the underlying exception.
        </p>
        <Stack className="pt-2">
          <Link href="/dashboard">
            <Button label="Back to dashboard" variant="primary" />
          </Link>
        </Stack>
      </Stack>
    </Stack>
  )
}
