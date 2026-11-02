import { Stack } from '@astryxdesign/core/Stack'
import { Link } from '@adonisjs/inertia/react'
import { Button } from '@astryxdesign/core/Button'
import { StatusBadge } from '~/components/atoms/status-badge'

export default function SignupDisabled() {
  return (
    <Stack
      direction="horizontal"
      align="center"
      justify="center"
      padding={6}
      className="min-h-screen bg-background text-foreground"
    >
      <Stack
        gap={4}
        className="w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl p-6 sm:p-8 shadow-lg"
      >
        <StatusBadge variant="error" label="Registration disabled" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Public sign-up is disabled
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          For security, Seller Core has no public registration. User accounts can only be
          provisioned by a System Super Administrator. If you need access, contact your
          administrator.
        </p>
        <Stack className="pt-2">
          <Link href="/">
            <Button label="Go to sign in" variant="primary" />
          </Link>
        </Stack>
      </Stack>
    </Stack>
  )
}
