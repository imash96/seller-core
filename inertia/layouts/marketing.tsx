import { type ReactElement, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Card } from '@astryxdesign/core/Card'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/astryx_themes'
import { Shield, Sparkles, Sun, Moon } from 'lucide-react'

/** Marketing shell: sticky top nav + centered content. */
export default function MarketingLayout({ children }: { children: ReactElement }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  return (
    <Theme theme={themes[defaultThemeSlug]} mode={mode}>
      <div
        style={{ minHeight: '100vh', background: 'var(--astryx-color-background-wash, #f0f2f5)' }}
      >
        {/* Sticky Top Nav */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'var(--astryx-color-background-surface, white)',
            borderBottom: '1px solid var(--astryx-color-border-default, #e5e7eb)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: 1200,
              margin: '0 auto',
              padding: '12px 24px',
              gap: 16,
            }}
          >
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#0866ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={18} color="white" />
              </span>
              <Text type="label" weight="bold">
                Seller Core
              </Text>
              <Badge variant="info" label="SaaS" />
            </Link>
            <Stack direction="horizontal" gap={3} align="center">
              <a
                href="#platform"
                style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}
              >
                Platform
              </a>
              <a
                href="#analytics"
                style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}
              >
                P&L Analytics
              </a>
              <a
                href="#security"
                style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}
              >
                RBAC & Security
              </a>
              <a
                href="#integrations"
                style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}
              >
                Multi-Channel
              </a>
              <button
                onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
                style={{
                  background: 'none',
                  border: '1px solid var(--astryx-color-border-default, #d1d5db)',
                  borderRadius: 8,
                  padding: 6,
                  cursor: 'pointer',
                  display: 'flex',
                }}
                aria-label="Toggle theme"
              >
                {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <Link href="/login">
                <Button label="Sign In" variant="primary" size="sm" />
              </Link>
            </Stack>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
          <Stack gap={4}>{children}</Stack>
        </div>
        <div
          style={{
            borderTop: '1px solid var(--astryx-color-border-default, #e5e7eb)',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <Text type="supporting" as="div">
            Seller Core · AdonisJS v7 · Inertia React · Astryx Design System (Meta) · AES-256-GCM ·
            SHA-256 Audit
          </Text>
        </div>
      </div>
    </Theme>
  )
}
