import { Form } from '@adonisjs/inertia/react'
import { Button } from '@astryxdesign/core/Button'
import AuthLayout from '~/layouts/auth'
import { useState } from 'react'
import { Lock } from 'lucide-react'
import { StatusBadge } from '~/components/atoms/status-badge'
import { PasswordField } from '~/components/molecules/password-field'
import { VStack } from '@astryxdesign/core'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <AuthLayout
      title="Sign in to Seller Core"
      subtitle="Multi-channel e-commerce operations, carrier reconciliation & financial P&L suite."
    >
      <div className="space-y-5">
        <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
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
            <VStack gap={4}>
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
            </VStack>
          )}
        </Form>
      </div>
    </AuthLayout>
  )
}
