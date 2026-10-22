import { Form } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import AuthLayout from '~/layouts/auth'
import { useState, useEffect } from 'react'
import { ShieldCheck, Lock } from 'lucide-react'
import { StatusBadge } from '~/components/atoms/status-badge'
import { PasswordField } from '~/components/molecules/password-field'
import { DemoCredentialCard } from '~/components/molecules/demo-credential-card'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const page = usePage() as any
  const flash = (page.flash ?? page.props?.flash) as
    | { error?: string; success?: string }
    | undefined

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const demo = params.get('demo')
    if (demo === 'admin') {
      setEmail('admin@sellercore.io')
      setPassword('Password123!')
    } else if (demo === 'ops') {
      setEmail('ops@sellercore.io')
      setPassword('Password123!')
    }
  }, [])

  const fillAdmin = () => {
    setEmail('admin@sellercore.io')
    setPassword('Password123!')
  }
  const fillOps = () => {
    setEmail('ops@sellercore.io')
    setPassword('Password123!')
  }

  return (
    <AuthLayout
      title="Sign in to Seller Core"
      subtitle="Multi-channel e-commerce operations, carrier reconciliation & financial P&L suite."
    >
      <div className="space-y-5">
        {flash?.error && (
          <Banner status="error" title="Authentication notice" description={flash.error} />
        )}
        {flash?.success && (
          <Banner status="success" title="Success" description={flash.success} />
        )}

        <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge variant="info" label="Admin-provisioned accounts only" />
            <StatusBadge variant="success" label="AES-256-GCM + Bouncer RBAC" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Public self-registration is disabled. Sign in with credentials provisioned by your
            System Super Administrator or select a 1-click demo workspace below.
          </p>
        </div>

        {/* One-Click Demo Switcher Cards */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Quick demo access — one click to populate credentials</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <DemoCredentialCard
              roleTitle="Super Admin"
              email="admin@sellercore.io"
              password="Password123!"
              variant="admin"
              isActive={email === 'admin@sellercore.io'}
              onSelect={fillAdmin}
            />
            <DemoCredentialCard
              roleTitle="Operations Lead"
              email="ops@sellercore.io"
              password="Password123!"
              variant="ops"
              isActive={email === 'ops@sellercore.io'}
              onSelect={fillOps}
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        <Form action="/" method="post">
          {({ errors, processing }) => (
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5 w-full">
                <label
                  htmlFor="field-email"
                  className="text-xs font-semibold text-foreground flex items-center gap-1"
                >
                  <span>Email Address</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="field-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@sellercore.io"
                  className={`w-full h-10 px-3.5 rounded-xl border text-sm bg-background text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.email ? 'border-rose-500 focus:ring-rose-500/30' : 'border-border'
                  }`}
                />
                {errors.email && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {errors.email}
                  </p>
                )}
              </div>

              <PasswordField
                label="Password"
                name="password"
                value={password}
                onChange={setPassword}
                required
                placeholder="Enter your password"
                error={errors.password}
              />

              <div className="pt-1">
                <Button
                  label={processing ? 'Signing in…' : 'Sign in to Workspace'}
                  type="submit"
                  variant="primary"
                  size="lg"
                  width="100%"
                  isDisabled={processing}
                />
              </div>

              <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground leading-relaxed">
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                <span>
                  Sessions are secured with SHA-256 token hashes and a 2-hour idle expiry. Brute
                  force lockout engages after 5 failed attempts.
                </span>
              </div>
            </div>
          )}
        </Form>
      </div>
    </AuthLayout>
  )
}
