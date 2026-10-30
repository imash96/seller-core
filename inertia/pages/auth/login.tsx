import { Form } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { Banner } from '@astryxdesign/core/Banner'
import { Button } from '@astryxdesign/core/Button'
import AuthLayout from '~/layouts/auth'
import { useState, useEffect } from 'react'
import { ShieldCheck, Lock } from 'lucide-react'
import { StatusBadge } from '~/components/atoms/status-badge'
import { AppInput } from '~/components/atoms/input'
import { PasswordField } from '~/components/molecules/password-field'
import { DemoCredentialCard } from '~/components/molecules/demo-credential-card'
import { Stack, VStack } from '@astryxdesign/core'

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
        <VStack gap={3}>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Quick demo access — one click to populate credentials</span>
          </div>
          <Stack gap={3} wrap="wrap" vAlign="center" hAlign="between">
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
          </Stack>
        </VStack>

        <div className="h-px bg-border" />

        <Form action="/" method="post">
          {({ errors, processing }) => (
            <VStack gap={4}>
              <AppInput
                id="field-email"
                name="email"
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@sellercore.io"
                error={errors.email}
                fullWidth
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
    </AuthLayout >
  )
}
