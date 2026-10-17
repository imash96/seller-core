import { Form } from '@adonisjs/inertia/react'
import { ShieldCheck, Lock } from 'lucide-react'
import { AstryxBadge } from '~/components/astryx'

export default function Login() {
  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="bg-[var(--card)] border border-[var(--line-2)] rounded-2xl p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AstryxBadge tone="primary">
              <ShieldCheck size={12} /> Admin-Provisioned Auth
            </AstryxBadge>
            <AstryxBadge tone="neutral">Astryx Security</AstryxBadge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Sign in to SellerCore
          </h1>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Public self-registration is disabled by security policy. Enter credentials provisioned
            by your System Super Administrator.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-1.5">
          <div className="font-semibold text-[#0866FF] dark:text-blue-300 flex items-center gap-1.5">
            <Lock size={13} /> Seeded Accounts (Ready for Verification)
          </div>
          <div className="mono text-[11px] text-[var(--ink)]">
            <div>
              <strong>Super Admin:</strong> admin@sellercore.io / Admin@SellerCore2026!
            </div>
            <div>
              <strong>Ops Operator:</strong> ops.merchant@sellercore.io / Ops@SellerCore2026!
            </div>
          </div>
        </div>

        <Form route="session.store" className="space-y-4">
          {({ errors, processing }) => (
            <>
              <div className="field">
                <label htmlFor="email">Work Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  defaultValue="admin@sellercore.io"
                  autoComplete="username"
                  data-invalid={errors.email ? 'true' : undefined}
                  required
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  defaultValue="Admin@SellerCore2026!"
                  autoComplete="current-password"
                  data-invalid={errors.password ? 'true' : undefined}
                  required
                />
                {errors.password && <p className="field-error">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full h-10 rounded-xl bg-[#0866FF] hover:bg-[#0756D8] text-white font-semibold text-sm transition cursor-pointer disabled:opacity-50"
              >
                {processing ? 'Authenticating...' : 'Sign in to Operations Console'}
              </button>
            </>
          )}
        </Form>
      </div>
    </div>
  )
}
