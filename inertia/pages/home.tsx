import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Divider } from '@astryxdesign/core/Divider'
import { Link } from '@adonisjs/inertia/react'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/astryx_themes'

const FEATURES = [
  {
    title: 'Multi-marketplace operations',
    body: 'Orders, inventory, shipments and returns across Amazon, eBay, Shopify and more — with idempotent bulk imports and duplicate detection.',
  },
  {
    title: 'Multi-user RBAC with explicit deny',
    body: 'Roles, permissions and module entitlements. DENY always wins over ALLOW, and module access is gated independently from role permissions.',
  },
  {
    title: 'Finance that survives an audit',
    body: 'Numeric(14,2) precision multi-currency ledger, P&L per order, business vs household classification, PCI-safe credit cards and carrier invoice reconciliation.',
  },
  {
    title: 'Security first',
    body: 'No public registration — super admins provision every user. Credentials are AES-256-GCM encrypted; audit history is append-only and checksummed.',
  },
]

export default function Home() {
  return (
    <Theme theme={themes[defaultThemeSlug]}>
      <div
        style={{ minHeight: '100vh', background: 'var(--astryx-color-background-wash, #f0f2f5)' }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
          <Stack gap={6}>
            <Stack gap={3}>
              <Badge variant="info" label="Multi-user e-commerce operations platform" />
              <Text type="display-1" as="h1" weight="bold">
                Seller Core
              </Text>
              <Text type="large" as="p" color="secondary">
                The complete business-management workspace for e-commerce operators: orders,
                catalog, fulfillment, returns, finance, credit cards and team access control — built
                on the Astryx design system.
              </Text>
              <Stack direction="horizontal" gap={3} wrap="wrap">
                <Link href="/login">
                  <Button label="Sign in" variant="primary" size="lg" />
                </Link>
                <Link href="/login">
                  <Button label="View seeded demo" variant="secondary" size="lg" />
                </Link>
              </Stack>
              <Text type="supporting" as="p">
                Public registration is disabled — accounts are provisioned by system super
                administrators only.
              </Text>
            </Stack>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
              }}
            >
              {FEATURES.map((f) => (
                <Card key={f.title} padding={5}>
                  <Stack gap={2}>
                    <Text type="label" as="div" weight="semibold">
                      {f.title}
                    </Text>
                    <Text type="supporting" as="div">
                      {f.body}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </div>

            <Divider />
            <Text type="supporting" as="p">
              Seller Core · AdonisJS v7 · Inertia React · Astryx Design System (Meta)
            </Text>
          </Stack>
        </div>
      </div>
    </Theme>
  )
}
