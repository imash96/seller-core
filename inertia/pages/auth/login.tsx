import { useState, useEffect, useRef } from 'react'
import { Form } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { useToast } from '@astryxdesign/core/Toast'
import { Card } from '@astryxdesign/core/Card'
import { HStack, VStack } from '@astryxdesign/core/Stack'
import AuthLayout from '~/layouts/auth'
import { Mail, KeyRound, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import { StatusBadge } from '~/components/atoms/status-badge'
import { AppInput } from '~/components/atoms/input'
import { PasswordField } from '~/components/molecules/password-field'
import { AppButton } from '~/components/atoms/button'

function FormErrorToaster({ errors }: { errors: Record<string, string | undefined> }) {
  const toast = useToast()
  const prevErrorsRef = useRef<string>('')

  useEffect(() => {
    const errorEntries = Object.entries(errors).filter(([_, v]) => Boolean(v))
    if (errorEntries.length === 0) return
    const key = errorEntries.map(([k, v]) => `${k}:${v}`).join('|')
    if (key === prevErrorsRef.current) return
    prevErrorsRef.current = key

    const firstMsg = errorEntries[0][1]
    if (firstMsg) {
      toast({
        body: firstMsg,
        type: 'error',
        isAutoHide: false,
        uniqueID: 'login-validation-error',
        collisionBehavior: 'overwrite',
      })
    }
  }, [errors, toast])

  return null
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const toast = useToast()
  const page = usePage() as any
  const flash = (page.flash ?? page.props?.flash) as
    { error?: string; success?: string; info?: string } | undefined
  const prevFlashRef = useRef<string>('')

  useEffect(() => {
    const key = `${flash?.success ?? ''}|${flash?.error ?? ''}|${flash?.info ?? ''}`
    if (key === prevFlashRef.current || key === '||') return
    prevFlashRef.current = key

    if (flash?.error) {
      toast({
        body: flash.error,
        type: 'error',
        isAutoHide: false,
        uniqueID: 'login-flash-error',
        collisionBehavior: 'overwrite',
      })
    }
    if (flash?.success) {
      toast({
        body: flash.success,
        type: 'info',
        autoHideDuration: 5000,
        uniqueID: 'login-flash-success',
        collisionBehavior: 'overwrite',
      })
    }
    if (flash?.info) {
      toast({
        body: flash.info,
        type: 'info',
        autoHideDuration: 5000,
        uniqueID: 'login-flash-info',
        collisionBehavior: 'overwrite',
      })
    }
  }, [flash, toast])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const demo = params.get('demo')
      if (demo === 'admin') {
        setEmail('admin@sellercore.io')
        setPassword('Password123!')
      } else if (demo === 'ops') {
        setEmail('ops@sellercore.io')
        setPassword('Password123!')
      }
    }
  }, [])

  return (
    <AuthLayout
      title="Sign in to Workspace"
      subtitle="Enter your authorized credentials to access multi-channel operations."
    >
      <VStack gap={5}>
        {/* Enterprise Security Access Note */}
        <Card
          variant="muted"
          padding={3}
          className="border border-border/70 bg-muted/40 shadow-2xs"
        >
          <HStack gap={3} vAlign="start">
            <span className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 inline-flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <VStack gap={1} className="min-w-0">
              <HStack gap={2} wrap="wrap" vAlign="center">
                <span className="text-xs font-semibold text-foreground">
                  Restricted Enterprise Portal
                </span>
                <StatusBadge variant="info" label="Admin Provisioned" />
              </HStack>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Public self-registration is closed. Sign in with credentials issued by your System
                Super Administrator.
              </p>
            </VStack>
          </HStack>
        </Card>

        {/* Authentication Card */}
        <Card variant="default" padding={5} className="border border-card-border bg-card shadow-xs">
          <Form action="/" method="post">
            {({ errors, processing }) => (
              <VStack gap={4}>
                <FormErrorToaster errors={errors} />

                <AppInput
                  id="field-email"
                  name="email"
                  type="email"
                  label="Work Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@sellercore.io"
                  icon={Mail}
                  error={errors.email}
                  fullWidth
                />

                <PasswordField
                  label="Password"
                  name="password"
                  value={password}
                  onChange={setPassword}
                  required
                  placeholder="••••••••••••"
                  icon={KeyRound}
                  error={errors.password}
                />

                {/* Session Security Reminders */}
                <HStack
                  gap={2}
                  vAlign="center"
                  hAlign="between"
                  className="text-xs text-muted-foreground pt-0.5"
                >
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
                    2-Hour Session Expiry
                  </span>
                  <span className="text-muted-foreground/80">5 Max Retries Before Lockout</span>
                </HStack>

                {/* Redesigned Sign In Button */}
                <AppButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={processing}
                  disabled={processing}
                  icon={Lock}
                  trailingIcon={ArrowRight}
                  label={processing ? 'Authenticating credentials…' : 'Sign in to Workspace'}
                  className="h-12 mt-1 text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer group"
                />
              </VStack>
            )}
          </Form>
        </Card>

        {/* Trust & Compliance Footnote */}
        <HStack
          gap={2}
          vAlign="center"
          hAlign="center"
          className="text-xs text-muted-foreground px-2 text-center"
        >
          <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>AES-256-GCM encryption · Rate-limited lockout protection · SHA-256 audit logs</span>
        </HStack>
      </VStack>
    </AuthLayout>
  )
}
