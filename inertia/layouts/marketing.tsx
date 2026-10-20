import { type ReactElement, useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Card } from '@astryxdesign/core/Card'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/astryx_themes'
import { useFlashToasts } from '~/lib/toast'
import { Shield, Sun, Moon, ArrowUpRight } from 'lucide-react'

export default function MarketingLayout({ children }: { children: ReactElement }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  useFlashToasts()

  return (
    <Theme theme={themes[defaultThemeSlug]} mode={mode}>
      <div
        style={{
          minHeight: '100vh',
          background: mode === 'dark' ? '#0b0f1a' : 'var(--astryx-color-background-wash, #f0f2f5)',
        }}
      >
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
              maxWidth: 1180,
              margin: '0 auto',
              padding: '10px 24px',
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
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: '#0866ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={16} color="white" />
              </span>
              <strong style={{ fontSize: 14 }}>Seller Core</strong>
              <Badge variant="info" label="SaaS" />
            </Link>

            <Stack direction="horizontal" gap={2} align="center">
              <a href="#platform" style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}>
                Platform
              </a>
              <a
                href="#security"
                style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}
              >
                Security
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
                  border: '1px solid var(--astryx-color-border-default, #e5e7eb)',
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
                <Button label="Sign in" variant="primary" size="sm" />
              </Link>
              <Link href="/login?demo=admin">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Button label="Try demo" variant="secondary" size="sm" />
                  <ArrowUpRight size={14} />
                </div>
              </Link>
            </Stack>
          </div>
        </div>

        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px 48px' }}>
          <Stack gap={4}>{children}</Stack>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--astryx-color-border-default, #e5e7eb)',
            padding: '22px 24px',
            background: 'var(--astryx-color-background-surface, white)',
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Text type="supporting" as="div">
              Seller Core · AdonisJS v7 · Inertia React · Astryx (Meta) · Sonner toasts · Bouncer
              authorization (abilities & policies)
            </Text>
            <Text type="supporting" as="div">
              <Link href="/login" style={{ color: 'inherit', textDecoration: 'underline' }}>
                Sign in
              </Link>
              {' · '}
              Auth via session cookies · Scrypt · 5-attempt lockout
            </Text>
          </div>
        </div>
      </div>
    </Theme>
  )
}
