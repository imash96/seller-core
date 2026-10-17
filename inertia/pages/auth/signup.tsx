import { Link } from '@adonisjs/inertia/react'
import { ShieldAlert } from 'lucide-react'

export default function SignupDisabled() {
  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-[var(--card)] border border-[var(--line-2)] rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
          <ShieldAlert size={18} />
          <span>Public Registration Disabled</span>
        </div>
        <h1 className="text-xl font-bold text-[var(--ink)]">
          Super Administrator Provisioning Required
        </h1>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          Self-service registration is prohibited. Only authenticated System Super Administrators
          can create user accounts and assign RBAC roles or module entitlements.
        </p>
        <Link
          route="session.create"
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-[#0866FF] text-white text-xs font-semibold"
        >
          Return to Sign In
        </Link>
      </div>
    </div>
  )
}
