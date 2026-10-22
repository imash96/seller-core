import { Link } from '@adonisjs/inertia/react'
import { Button } from '@astryxdesign/core/Button'
import { StatusBadge } from '~/components/atoms/status-badge'

export default function SignupDisabled() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl p-6 sm:p-8 shadow-lg space-y-4">
        <StatusBadge variant="error" label="Registration disabled" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Public sign-up is disabled
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          For security, Seller Core has no public registration. User accounts can only be
          provisioned by a System Super Administrator. If you need access, contact your
          administrator.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button label="Go to sign in" variant="primary" />
          </Link>
        </div>
      </div>
    </div>
  )
}
