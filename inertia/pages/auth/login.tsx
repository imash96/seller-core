import { Form, Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import type { Data } from '@generated/data'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Divider } from '@astryxdesign/core/Divider'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/astryx_themes'
import AuthLayout from '~/layouts/auth'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Shield, Zap, Crown, UserCheck } from 'lucide-react'

export default function Login() {
  const { props, flash } = usePage<Data.SharedProps>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Read ?demo=admin or ?demo=ops
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
          {flash?.error ? (
            <Banner status="error" title={flash.error} isDismissable container="card" />
          ) : null}
          {flash?.success ? (
            <Banner status="success" title={flash.success} isDismissable container="card" />
          ) : null}

          <Card padding={3} variant="muted">
            <Stack gap={2}>
              <Badge variant="info" label="Admin-provisioned accounts only" />
              <Text type="supporting" as="p">
                Public self-registration is disabled. Use credentials provisioned by your system
                super administrator.
              </Text>
            </Stack>
          </Card>

          {/* One-click demo switcher */}
          <Stack gap={2}>
            <Text type="label" as="div" weight="semibold">
              Quick demo access — one click to fill
            </Text>
            <Stack direction="horizontal" gap={3} wrap="wrap">
              <button
                onClick={fillAdmin}
                style={{
                  flex: '1 1 180px',
                  padding: 16,
                  borderRadius: 12,
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
                        borderRadius: 8,
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
                  flex: '1 1 180px',
                  padding: 16,
                  borderRadius: 12,
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
                        borderRadius: 8,
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
                      top: 36,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: 0.6,
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
                  Public registration is disabled — accounts are provisioned by Super Administrators
                  only. Your session is secured with SHA-256 tokens and 2-hour expiry.
                </Text>
              </Stack>
            )}
          </Form>

          <Stack direction="horizontal" gap={2}>
            <Link href="/">
              <Button label="← Back to home" variant="ghost" size="sm" />
            </Link>
          </Stack>
        </Stack>
      </AuthLayout>
    </Theme>
  )
}
