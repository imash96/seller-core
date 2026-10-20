import { type ReactElement } from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Divider } from '@astryxdesign/core/Divider'
import { Link } from '@adonisjs/inertia/react'
import { Shield, Lock, KeyRound, Eye } from 'lucide-react'

/** Split-screen shell for authentication: brand panel + auth card. */
export default function AuthLayout({ title, children }: { title: string; children: ReactElement }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left — Brand Panel (hidden on mobile) */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 48,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0866ff 100%)',
          color: 'white',
          gap: 32,
        }}
        className="auth-brand-panel"
      >
        <Stack gap={4}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={22} color="white" />
            </span>
            <Text type="display-2" as="span" weight="bold" style={{ color: 'white' }}>
              Seller Core
            </Text>
          </Link>
          <Text type="display-1" as="h1" weight="bold" style={{ color: 'white', lineHeight: 1.2 }}>
            Secure operations start here.
          </Text>
          <Text type="large" as="p" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Multi-marketplace P&L, fulfillment, finance and team governance — protected by
            enterprise-grade security.
          </Text>
        </Stack>

        <Stack gap={3}>
          {[
            {
              icon: <Lock size={18} />,
              title: 'AES-256-GCM encryption',
              desc: 'All credentials encrypted at rest with dedicated keyring',
            },
            {
              icon: <KeyRound size={18} />,
              title: 'Scrypt password hashing',
              desc: 'Military-grade hashing with brute-force lockout protection',
            },
            {
              icon: <Eye size={18} />,
              title: 'Tamper-evident audit trail',
              desc: 'SHA-256 checksummed append-only logs for compliance',
            },
          ].map((item) => (
            <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.12)',
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
                <Text type="supporting" as="div" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {item.desc}
                </Text>
              </Stack>
            </div>
          ))}
        </Stack>

        <Card variant="transparent" padding={3}>
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
            <Text type="supporting" as="span" style={{ color: 'rgba(255,255,255,0.8)' }}>
              All systems operational · Strict user_id isolation · No public registration
            </Text>
          </Stack>
        </Card>
      </div>

      {/* Right — Auth Card */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          background: 'var(--astryx-color-background-wash, #f0f2f5)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          <Stack gap={4}>
            <Text type="display-2" as="h1" weight="bold">
              {title}
            </Text>
            {children}
          </Stack>
        </div>
      </div>

      <style>{`@media (max-width: 768px) { .auth-brand-panel { display: none !important; } }`}</style>
    </div>
  )
}
