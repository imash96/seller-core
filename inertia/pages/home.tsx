import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Grid } from '@astryxdesign/core/Grid'
import { Divider } from '@astryxdesign/core/Divider'
import { Banner } from '@astryxdesign/core/Banner'
import { Link } from '@adonisjs/inertia/react'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/astryx_themes'
import MarketingLayout from '~/layouts/marketing'
import {
  TrendingUp,
  Shield,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Lock,
  Zap,
  Globe,
  DollarSign,
  AlertTriangle,
  FileCheck,
  Database,
} from 'lucide-react'

const FEATURES = [
  {
    icon: <Globe size={20} />,
    title: 'Multi-marketplace Sync',
    body: 'Amazon SP-API, eBay, Etsy & Shopify with idempotent bulk import and duplicate detection.',
    accent: 'blue',
  },
  {
    icon: <DollarSign size={20} />,
    title: 'True Multi-Currency P&L',
    body: 'Order-level waterfall: gross → refunds → COGS → fees → shipping → net profit, per currency.',
    accent: 'green',
  },
  {
    icon: <AlertTriangle size={20} />,
    title: 'Explainable Risk Signals',
    body: 'Fraud signals are explainable & reviewable — never auto-flagged. RMA guards prevent over-refunds.',
    accent: 'orange',
  },
  {
    icon: <Shield size={20} />,
    title: 'Deny-overrides-Allow RBAC',
    body: 'Granular roles + module entitlements + tamper-evident SHA-256 audit logs.',
    accent: 'pink',
  },
]

const PILLARS = [
  { icon: <Database size={18} />, label: '40 migrations · 40 Lucid models · 44 enums' },
  { icon: <Lock size={18} />, label: 'AES-256-GCM keyring · Scrypt passwords · 5-attempt lockout' },
  { icon: <FileCheck size={18} />, label: 'Append-only audit logs · SHA-256 checksummed' },
  {
    icon: <BarChart3 size={18} />,
    label: 'P&L waterfall · carrier reconciliation · credit utilization',
  },
]

Home.layout = (page: React.ReactElement) => <MarketingLayout>{page}</MarketingLayout>

export default function Home() {
  return (
    <Theme theme={themes[defaultThemeSlug]}>
      <Stack gap={8}>
        {/* Hero Section */}
        <div style={{ padding: '48px 0 24px' }}>
          <Grid columns={{ minWidth: 380, max: 2 }} gap={6}>
            {/* Hero Copy */}
            <Stack gap={4}>
              <Badge variant="info" label="Multi-user e-commerce operations platform" />
              <Text type="display-1" as="h1" weight="bold" style={{ lineHeight: 1.1 }}>
                The operations workspace your e-commerce business deserves.
              </Text>
              <Text type="large" as="p" color="secondary">
                Orders, catalog, fulfillment, returns, finance, credit cards and team access control
                — unified in one secure SaaS workspace built on the Astryx design system.
              </Text>
              <Stack direction="horizontal" gap={3} wrap="wrap">
                <Link href="/login">
                  <Button label="Sign in" variant="primary" size="lg" />
                </Link>
                <Link href="/login?demo=admin">
                  <Button label="Launch Seeded Demo — Super Admin" variant="secondary" size="lg" />
                </Link>
              </Stack>
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <Link href="/login?demo=ops">
                  <Button label="Launch Demo — Operations Lead" variant="ghost" size="sm" />
                </Link>
                <Text type="supporting" as="span">
                  Pre-filled demo credentials · Password123!
                </Text>
              </Stack>
              <Stack gap={2}>
                {PILLARS.map((p) => (
                  <Stack key={p.label} direction="horizontal" gap={2} align="center">
                    <span style={{ color: '#0866ff' }}>{p.icon}</span>
                    <Text type="supporting" as="span">
                      {p.label}
                    </Text>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            {/* Hero Preview Card */}
            <Card padding={5} elevation="med">
              <Stack gap={4}>
                <Stack direction="horizontal" gap={2} align="center">
                  <Text type="label" as="div" weight="semibold">
                    Live P&L Waterfall Preview
                  </Text>
                  <Badge variant="success" label="Live" />
                </Stack>
                {/* Mini waterfall bar */}
                <Stack gap={2}>
                  {[
                    { label: 'Gross Sales', amount: '$42,800', width: 100, color: '#0866ff' },
                    { label: '− Refunds', amount: '−$1,240', width: 14, color: '#ef4444' },
                    { label: 'Net Sales', amount: '$41,560', width: 97, color: '#22c55e' },
                    { label: '− COGS', amount: '−$18,320', width: 43, color: '#f59e0b' },
                    { label: 'Net Profit', amount: '$14,220', width: 33, color: '#7c3aed' },
                  ].map((row) => (
                    <Stack key={row.label} direction="horizontal" gap={2} align="center">
                      <Text type="supporting" as="div" style={{ minWidth: 90 }}>
                        {row.label}
                      </Text>
                      <div
                        style={{
                          flex: 1,
                          height: 14,
                          background: '#f0f2f5',
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${row.width}%`,
                            height: '100%',
                            background: row.color,
                            borderRadius: 4,
                          }}
                        />
                      </div>
                      <Text
                        type="label"
                        as="div"
                        weight="semibold"
                        style={{ minWidth: 70, textAlign: 'right' }}
                      >
                        {row.amount}
                      </Text>
                    </Stack>
                  ))}
                </Stack>
                <Divider />
                <Stack gap={2}>
                  <Text type="label" as="div" weight="semibold">
                    Marketplace Sync Health
                  </Text>
                  <Grid columns={4} gap={2}>
                    {[
                      { name: 'Amazon', status: 'healthy' },
                      { name: 'eBay', status: 'healthy' },
                      { name: 'Etsy', status: 'warning' },
                      { name: 'Shopify', status: 'healthy' },
                    ].map((m) => (
                      <Card
                        key={m.name}
                        padding={2}
                        variant={m.status === 'healthy' ? 'green' : 'orange'}
                      >
                        <Stack gap={1} align="center">
                          <Text type="label" as="div" weight="medium">
                            {m.name}
                          </Text>
                          <Badge
                            variant={m.status === 'healthy' ? 'success' : 'warning'}
                            label={m.status}
                          />
                        </Stack>
                      </Card>
                    ))}
                  </Grid>
                </Stack>
                <Stack direction="horizontal" gap={2} wrap="wrap">
                  <Badge variant="info" label="AES-256-GCM" />
                  <Badge variant="success" label="Append-Only Audit" />
                  <Badge variant="neutral" label="SHA-256 Checksums" />
                </Stack>
              </Stack>
            </Card>
          </Grid>
        </div>

        {/* Feature Bento Grid */}
        <Stack gap={4} id="platform">
          <Stack gap={1}>
            <Text type="display-2" as="h2" weight="bold">
              Four pillars. One workspace.
            </Text>
            <Text type="supporting" as="p">
              Every module is built with strict user_id isolation, RBAC enforcement, and audit-grade
              precision.
            </Text>
          </Stack>
          <Grid columns={{ minWidth: 260, max: 4 }} gap={4}>
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                padding={5}
                variant={(f.accent as any) ?? 'default'}
                elevation="low"
              >
                <Stack gap={3}>
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0866ff',
                    }}
                  >
                    {f.icon}
                  </span>
                  <Text type="label" as="div" weight="semibold">
                    {f.title}
                  </Text>
                  <Text type="supporting" as="div">
                    {f.body}
                  </Text>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>

        {/* Architecture Highlights */}
        <Card padding={5} variant="muted">
          <Stack gap={4}>
            <Stack direction="horizontal" gap={2} align="center">
              <Zap size={18} color="#7c3aed" />
              <Text type="display-3" as="h3" weight="bold">
                Architecture at a glance
              </Text>
              <Badge variant="info" label="AdonisJS v7 · Lucid ORM · VineJS v4" />
            </Stack>
            <Grid columns={{ minWidth: 200, max: 4 }} gap={3}>
              {[
                { k: '40', v: 'UUIDv7 migrations with PostgreSQL enums & CHECK constraints' },
                { k: '40', v: 'Lucid models with AES-256-GCM encryption & normalization' },
                { k: '44', v: 'TypeScript enum constants for every domain status' },
                { k: '12', v: 'Automated Japa tests — all green before handover' },
              ].map((item) => (
                <Stack key={item.v} gap={1}>
                  <Text type="display-1" as="div" weight="bold">
                    {item.k}
                  </Text>
                  <Text type="supporting" as="div">
                    {item.v}
                  </Text>
                </Stack>
              ))}
            </Grid>
            <Divider />
            <Text type="supporting" as="p">
              Public registration is disabled — accounts are provisioned by system super
              administrators only. Every query is scoped to{' '}
              <Text type="code">user_id = auth.user.id</Text>. Super admins see aggregated
              governance views on <Text type="code">/admin</Text>.
            </Text>
            <Stack direction="horizontal" gap={2} wrap="wrap">
              <Link href="/login">
                <Button label="Sign in to your workspace" variant="primary" />
              </Link>
              <Link href="/login?demo=admin">
                <Button label="Try the demo — no signup needed" variant="secondary" />
              </Link>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Theme>
  )
}
