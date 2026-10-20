import { Form } from '@adonisjs/inertia/react'
import { Link } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Divider } from '@astryxdesign/core/Divider'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/astryx_themes'
import AuthLayout from '~/layouts/auth'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Crown, UserCheck, ArrowUpRight, ShieldCheck } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
    <Theme theme={themes[defaultThemeSlug]}>
      <AuthLayout title="Sign in to Seller Core">
        <Stack gap={4}>
          <Card padding={3} variant="muted">
            <Stack gap={2}>
              <Stack direction="horizontal" gap={2} align="center">
                <Badge variant="info" label="Admin-provisioned accounts only" />
                <Badge variant="success" label="Sonner + Bouncer" />
              </Stack>
              <Text type="supporting" as="p">
                Public self-registration is disabled. Use credentials provisioned by your system
                Super Administrator — session flash now surfaces as Sonner toasts.
              </Text>
            </Stack>
          </Card>

          {/* Demo switcher */}
          <Stack gap={2}>
            <Stack direction="horizontal" gap={2} align="center">
              <ShieldCheck size={14} />
              <Text type="label" as="div" weight="semibold">
                Quick demo access — one click to fill
              </Text>
            </Stack>
            <Stack direction="horizontal" gap={3} wrap="wrap">
              <button
                onClick={fillAdmin}
                style={{
                  flex: '1 1 190px',
                  padding: 16,
                  borderRadius: 14,
                  border:
                    email === 'admin@sellercore.io'
                      ? '2px solid #0866ff'
                      : '1px solid var(--astryx-color-border-default, #d1d5db)',
                  background:
                    email === 'admin@sellercore.io'
                      ? 'var(--astryx-color-background-accent-subtle, #eef4ff)'
                      : 'var(--astryx-color-background-surface, white)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Stack gap={1}>
                  <Stack direction="horizontal" gap={2} align="center">
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: '#7c3aed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Crown size={16} color="white" />
                    </span>
                    <Text type="label" as="span" weight="semibold">
                      Super Admin
                    </Text>
                  </Stack>
                  <Text type="supporting" as="div">
                    admin@sellercore.io
                  </Text>
                  <Text type="code" as="div">
                    Password123!
                  </Text>
                </Stack>
              </button>
              <button
                onClick={fillOps}
                style={{
                  flex: '1 1 190px',
                  padding: 16,
                  borderRadius: 14,
                  border:
                    email === 'ops@sellercore.io'
                      ? '2px solid #0866ff'
                      : '1px solid var(--astryx-color-border-default, #d1d5db)',
                  background:
                    email === 'ops@sellercore.io'
                      ? 'var(--astryx-color-background-accent-subtle, #eef4ff)'
                      : 'var(--astryx-color-background-surface, white)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Stack gap={1}>
                  <Stack direction="horizontal" gap={2} align="center">
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: '#0891b2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UserCheck size={16} color="white" />
                    </span>
                    <Text type="label" as="span" weight="semibold">
                      Operations Lead
                    </Text>
                  </Stack>
                  <Text type="supporting" as="div">
                    ops@sellercore.io
                  </Text>
                  <Text type="code" as="div">
                    Password123!
                  </Text>
                </Stack>
              </button>
            </Stack>
          </Stack>

          <Divider />

          <Form action="/login" method="post">
            {({ errors, processing }) => (
              <Stack gap={3}>
                <TextInput
                  label="Email"
                  type="email"
                  htmlName="email"
                  value={email}
                  onChange={setEmail}
                  isRequired
                  width="100%"
                  status={errors.email ? { type: 'error', message: errors.email } : undefined}
                />
                <div style={{ position: 'relative', width: '100%' }}>
                  <TextInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    htmlName="password"
                    value={password}
                    onChange={setPassword}
                    isRequired
                    width="100%"
                    status={
                      errors.password ? { type: 'error', message: errors.password } : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 34,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: 0.6,
                      display: 'flex',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Button
                  label="Sign in"
                  type="submit"
                  variant="primary"
                  size="lg"
                  isDisabled={processing}
                />
                <Text type="supporting" as="div">
                  Session secured with SHA-256 tokens and 2-hour expiry. Lockout after 5 failed
                  attempts. Authorization checks use @adonisjs/bouncer abilities and policies.
                </Text>
              </Stack>
            )}
          </Form>

          <Stack direction="horizontal" gap={2} align="center">
            <Link href="/">
              <Button label="← Back to home" variant="ghost" size="sm" />
            </Link>
            <a
              href="/login?demo=admin"
              onClick={(e) => {
                e.preventDefault()
                fillAdmin()
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}
            >
              Prefill Super Admin demo <ArrowUpRight size={14} />
            </a>
          </Stack>
        </Stack>
      </AuthLayout>
    </Theme>
  )
}
