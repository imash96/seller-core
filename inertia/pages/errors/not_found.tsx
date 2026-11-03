import { Link } from '@adonisjs/inertia/react'
import { AppButton } from '~/components/atoms/button'
import { StatusBadge } from '~/components/atoms/status-badge'

export default function NotFound() {
  return (
    <div className="min-h-[80dvh] flex items-center justify-center p-4 sm:p-6 bg-background text-foreground">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl p-6 sm:p-8 shadow-lg space-y-4">
        <div>
          <StatusBadge variant="warning" label="Error 404" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The route you tried to reach doesn&apos;t exist. Check the URL or head back to the
          dashboard.
        </p>
        <div className="pt-2">
          <Link href="/dashboard" className="unstyled-link inline-block">
            <AppButton label="Go to dashboard" variant="primary" size="md" />
          </Link>
        </div>
      </div>
    </div>
  )
}
