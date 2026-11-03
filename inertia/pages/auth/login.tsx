import { Form } from '@adonisjs/inertia/react'
import AuthLayout from '~/layouts/auth'
import { useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { AppButton } from '~/components/atoms/button'
import { AppInput } from '~/components/atoms/input'
import { StatusBadge } from '~/components/atoms/status-badge'
import { PasswordField } from '~/components/molecules/password-field'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <AuthLayout
      title="Sign in to Seller Core"
      subtitle="Multi-channel e-commerce operations, carrier reconciliation & financial P&L suite."
    >
      <div className="space-y-5">
        <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-2">
          <div className="flex items-center flex-wrap gap-2">
            <StatusBadge variant="info" label="Admin-provisioned accounts only" />
            <StatusBadge variant="success" label="AES-256-GCM + Bouncer RBAC" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Public self-registration is disabled. Sign in with credentials provisioned by your
            System Super Administrator.
          </p>
        </div>

        <Form action="/" method="post">
          {({ errors, processing }) => (
            <div className="space-y-4">
              <AppInput
                id="field-email"
                name="email"
                type="email"
                label="Email Address"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@sellercore.io"
                error={errors.email}
              />

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
                <AppButton
                  label={processing ? 'Signing in…' : 'Sign in to Workspace'}
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={processing}
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
