import { type ReactElement } from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Link } from '@adonisjs/inertia/react'
import { useFlashToasts } from '~/lib/toast'
import { Shield, Lock, KeyRound, Eye, Sparkles } from 'lucide-react'

export default function AuthLayout({ title, children }: { title: string; children: ReactElement }) {
  useFlashToasts()
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left — Brand panel */}
      <div
        style={{
          flex: '0 0 46%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 44px',
          background:
            'radial-gradient(1200px 700px at 20% 10%, #1e3a5f 0%, #0f172a 55%, #0b1220 100%)',
          color: 'white',
        }}
        className="auth-brand-panel"
      >
        <Stack gap={5}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={20} color="white" />
            </span>
            <strong style={{ color: 'white' }}>Seller Core</strong>
            <Badge variant="info" label="SaaS" />
          </Link>

          <Stack gap={3}>
            <Text type="display-1" as="h1" weight="bold" style={{ color: 'white', lineHeight: 1.08 }}>
              Secure operations start here.
            </Text>
            <Text type="large" as="p" style={{ color: 'rgba(255,255,255,0.78)', maxWidth: 520 }}>
              Multi-marketplace P&L, fulfillment, finance and team governance — protected by
              enterprise-grade security and deny-overrides-allow RBAC. Managed via @adonisjs/bouncer.
            </Text>
          </Stack>

          <Stack gap={3}>
            {[
              {
                icon: <Lock size={16} />,
                title: 'AES-256-GCM encryption',
                desc: 'Credentials encrypted at rest with dedicated keyring.',
              },
              {
                icon: <KeyRound size={16} />,
                title: 'Scrypt password hashing',
                desc: 'Brute-force lockout after 5 failed attempts.',
              },
              {
                icon: <Eye size={16} />,
                title: 'Tamper-evident audit trail',
                desc: 'Append-only logs with SHA-256 checksums for compliance.',
              },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                <Stack gap={1}>
                  <Text type="label" as="div" weight="semibold" style={{ color: 'white' }}>
                    {item.title}
                  </Text>
                  <Text type="supporting" as="div" style={{ color: 'rgba(255,255,255,0.68)' }}>
                    {item.desc}
                  </Text>
                </Stack>
              </div>
            ))}
          </Stack>
        </Stack>

        <Stack gap={2}>
          <Card variant="transparent" padding={3}>
            <Stack gap={1}>
              <Stack direction="horizontal" gap={2} align="center">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'inline-block',
                  }}
                />
                <Text type="label" as="span" weight="semibold" style={{ color: 'white' }}>
                  All systems operational
                </Text>
                <Badge variant="success" label="SHA-256" />
              </Stack>
              <Text type="supporting" as="span" style={{ color: 'rgba(255,255,255,0.66)' }}>
                Strict user_id isolation · No public registration · SuperAdmin provisioning
              </Text>
            </Stack>
          </Card>
          <Text type="supporting" as="div" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            Sonner toasts for instant feedback · Bouncer abilities & policies for authorization
          </Text>
        </Stack>
      </div>

      {/* Right — Auth card */}
      <div
        style={{
          flex: '1 1 54%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 28,
          background: 'var(--astryx-color-background-wash, #f0f2f5)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 460 }}>
          <Stack gap={3}>
            <Stack gap={1}>
              <Text type="supporting" as="div">
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                  ← Home
                </Link>
              </Text>
              <Stack direction="horizontal" gap={2} align="center">
                <Text type="display-2" as="h1" weight="bold">
                  {title}
                </Text>
                <Sparkles size={18} color="#7c3aed" />
              </Stack>
              <Text type="supporting" as="p">
                Accounts are provisioned by System Super Administrators. Use the seeded demo
                accounts below.
              </Text>
            </Stack>
            {children}
          </Stack>
        </div>
      </div>
    </div>
  )
}
