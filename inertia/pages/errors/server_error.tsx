import { Link } from '@adonisjs/inertia/react'
import { AppButton } from '~/components/atoms/button'
import { StatusBadge } from '~/components/atoms/status-badge'

export default function ServerError() {
  return (
    <div className="min-h-[80dvh] flex items-center justify-center p-4 sm:p-6 bg-background text-foreground">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl p-6 sm:p-8 shadow-lg space-y-4">
        <div>
          <StatusBadge variant="error" label="Error 500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Something broke</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The server hit an unexpected error. Try again in a moment — if it persists, check the
          server logs for the underlying exception.
        </p>
        <div className="pt-2">
          <Link href="/dashboard" className="unstyled-link inline-block">
            <AppButton label="Back to dashboard" variant="primary" size="md" />
          </Link>
        </div>
      </div>
    </div>
  )
}
