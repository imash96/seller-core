import { Link } from '@adonisjs/inertia/react'
import { Button } from '@astryxdesign/core/Button'
import { StatusBadge } from '~/components/atoms/status-badge'

export default function ServerError() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl p-6 sm:p-8 shadow-lg space-y-4">
        <StatusBadge variant="error" label="Error 500" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Something broke</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The server hit an unexpected error. Try again in a moment — if it persists, check the
          server logs for the underlying exception.
        </p>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button label="Back to dashboard" variant="primary" />
          </Link>
        </div>
      </div>
    </div>
  )
}
