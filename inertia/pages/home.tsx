import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Grid } from '@astryxdesign/core/Grid'
import { Divider } from '@astryxdesign/core/Divider'
import { Link } from '@adonisjs/inertia/react'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/astryx_themes'
import MarketingLayout from '~/layouts/marketing'
import {
  Shield,
  Package,
  BarChart3,
  Lock,
  Zap,
  Globe,
  DollarSign,
  AlertTriangle,
  FileCheck,
  Database,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  BellRing,
} from 'lucide-react'

const FEATURES = [
  {
    icon: <Globe size={18} />,
    title: 'Multi-marketplace Sync',
    body: 'Amazon SP-API, eBay, Etsy & Shopify with idempotent bulk import and duplicate detection.',
    tone: 'blue' as const,
  },
  {
    icon: <DollarSign size={18} />,
    title: 'True Multi-Currency P&L',
    body: 'Order-level waterfall: gross → refunds → COGS → fees → shipping → net profit, per currency.',
    tone: 'green' as const,
  },
  {
    icon: <AlertTriangle size={18} />,
    title: 'Explainable Risk Signals',
    body: 'Fraud signals are explainable & reviewable — never auto-flagged. RMA guards prevent over-refunds.',
    tone: 'orange' as const,
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Deny-overrides-Allow RBAC',
    body: 'Granular roles + module entitlements + tamper-evident SHA-256 audit logs. Enforced via @adonisjs/bouncer.',
    tone: 'pink' as const,
  },
]

const PILLARS = [
  { icon: <Database size={16} />, label: '40 migrations · 40 Lucid models · 44 enums' },
  { icon: <Lock size={16} />, label: 'AES-256-GCM keyring · Scrypt passwords · 5-attempt lockout' },
  { icon: <FileCheck size={16} />, label: 'Append-only audit logs · SHA-256 checksummed' },
  {
    icon: <BellRing size={16} />,
    label: 'Sonner toasts for every action · Bouncer checks on every route',
  },
]

Home.layout = (page: React.ReactElement) => <MarketingLayout>{page}</MarketingLayout>

export default function Home() {
  return (
    <Theme theme={themes[defaultThemeSlug]}>
      <Stack gap={8}>
        {/* Hero */}
        <div style={{ padding: '42px 0 12px' }}>
          <Grid columns={{ minWidth: 380, max: 2 }} gap={6}>
            <Stack gap={4}>
              <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
                <Badge variant="info" label="Multi-user e-commerce operations platform" />
                <Badge variant="success" label="Sonner · Bouncer ready" />
              </Stack>
              <Text
                type="display-1"
                as="h1"
                weight="bold"
                style={{ lineHeight: 1.06, letterSpacing: -0.02 }}
              >
                The operations workspace your e-commerce business deserves.
              </Text>
              <Text type="large" as="p" color="secondary" style={{ maxWidth: 620 }}>
                Orders, catalog, fulfillment, returns, finance, credit cards and team access control
                — unified in one secure SaaS workspace refined on the Astryx design system.
              </Text>

              <Stack direction="horizontal" gap={3} wrap="wrap">
                <Link href="/login">
                  <Button label="Sign in" variant="primary" size="lg" />
                </Link>
                <Link href="/login?demo=admin">
                  <Button label="Seeded demo — Super Admin" variant="secondary" size="lg" />
                </Link>
              </Stack>
              <Stack direction="horizontal" gap={2} wrap="wrap" align="center">
                <Link href="/login?demo=ops">
                  <Button label="Launch demo — Operations Lead" variant="ghost" size="sm" />
                </Link>
                <Text type="supporting" as="span">
                  Pre-filled credentials · Password123!
                </Text>
                <ArrowUpRight size={14} />
              </Stack>

              <Card padding={4} variant="muted">
                <Stack gap={2}>
                  <Stack direction="horizontal" gap={2} align="center">
                    <Sparkles size={14} color="#7c3aed" />
                    <Text type="label" as="span" weight="semibold">
                      What shipped in this revision
                    </Text>
                    <Badge variant="info" label="UI polish · Toasts · Authz" />
                  </Stack>
                  {[
                    'Global Toaster + flash → Sonner bridge on every layout.',
                    'Bouncer abilities & policies enforce RBAC on every controller action.',
                    'Sharper dashboard, tighter tables/cards, and a refreshed marketing shell.',
                  ].map((line) => (
                    <Stack key={line} direction="horizontal" gap={2} align="center">
                      <CheckCircle2 size={14} color="#22c55e" />
                      <Text type="supporting" as="span">
                        {line}
                      </Text>
                    </Stack>
                  ))}
                </Stack>
              </Card>

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

            {/* Hero preview */}
            <Card padding={5} elevation="med">
              <Stack gap={4}>
                <Stack direction="horizontal" gap={2} align="center">
                  <Text type="label" as="div" weight="semibold">
                    Live P&L Waterfall Preview
                  </Text>
                  <Badge variant="success" label="Live" />
                  <Badge variant="neutral" label="Reporting USD" />
                </Stack>

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
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${row.width}%`,
                            height: '100%',
                            background: row.color,
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <Text
                        type="label"
                        as="div"
                        weight="semibold"
                        style={{ minWidth: 76, textAlign: 'right' }}
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
                  <Badge variant="success" label="Append-only audit" />
                  <Badge variant="neutral" label="SHA-256" />
                  <Badge variant="neutral" label="Sonner toasts" />
                </Stack>
              </Stack>
            </Card>
          </Grid>
        </div>

        {/* Feature grid */}
        <Stack gap={4} id="platform">
          <Stack direction="horizontal" gap={2} align="center">
            <Layers size={18} color="#7c3aed" />
            <Text type="display-2" as="h2" weight="bold">
              Four pillars. One workspace.
            </Text>
          </Stack>
          <Text type="supporting" as="p" style={{ maxWidth: 720 }}>
            Every module is built with strict user_id isolation, RBAC via @adonisjs/bouncer, and
            Sonner toasts for instant feedback — without clutter.
          </Text>
          <Grid columns={{ minWidth: 260, max: 4 }} gap={4}>
            {FEATURES.map((f) => (
              <Card key={f.title} padding={5} variant={f.tone as any} elevation="low">
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

        {/* Architecture card */}
        <Card padding={5} variant="muted" id="security">
          <Stack gap={4}>
            <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
              <Zap size={18} color="#7c3aed" />
              <Text type="display-3" as="h3" weight="bold">
                Architecture at a glance
              </Text>
              <Badge variant="info" label="AdonisJS v7 · Lucid ORM · VineJS v4" />
              <Badge variant="info" label="Bouncer 3.1 · Sonner 2.x" />
            </Stack>

            <Grid columns={{ minWidth: 200, max: 4 }} gap={3}>
              {[
                { k: '40', v: 'UUIDv7 migrations with PostgreSQL enums & constraints' },
                { k: '40', v: 'Lucid models with AES-256-GCM encryption' },
                { k: '44', v: 'TypeScript enums for every domain status' },
                {
                  k: '∞',
                  v: 'Every mutation flashes a Sonner toast; every sensitive route checks bouncer',
                },
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
              Public registration is disabled — accounts are provisioned by system Super
              Administrators only. Every query is scoped to{' '}
              <Text type="code" as="span">
                user_id = auth.user.id
              </Text>{' '}
              and protected by Bouncer abilities/policies. Super admins govern on{' '}
              <Text type="code" as="span">
                /admin
              </Text>
              .
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
