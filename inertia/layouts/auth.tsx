import { Grid } from '@astryxdesign/core/Grid'
import { Text } from '@astryxdesign/core/Text'
import { Stack } from '@astryxdesign/core/Stack'
import { type ReactElement } from 'react'
import { Boxes, Globe, ShieldCheck, Zap, Lock } from 'lucide-react'
import { FlashMessages } from '~/modules/common/flash-messages'
import { ThemeToggleButton } from '~/components/atoms/theme-toggle-button'

/**
 * Split-screen authentication shell on `/` with theme mode toggle.
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactElement
}) {
  return (
    <Stack direction="horizontal" className="min-h-screen bg-background text-foreground">
      <FlashMessages />

      {/* Left Branding Panel */}
      <Stack
        align="center"
        justify="center"
        padding={10}
        className="hidden lg:flex lg:w-1/2 bg-sidebar text-sidebar-foreground relative overflow-hidden border-r border-sidebar-border"
      >
        <Stack className="absolute inset-0 opacity-25 pointer-events-none">
          <Stack className="absolute -top-16 -left-16 w-1/2 h-1/2 bg-indigo-500/30 rounded-full blur-3xl" />
          <Stack className="absolute -bottom-16 -right-16 w-1/2 h-1/2 bg-blue-500/25 rounded-full blur-3xl" />
        </Stack>

        <Stack className="relative z-10 max-w-lg w-full">
          <Stack direction="horizontal" align="center" gap={3} className="mb-10">
            <Stack padding={2} className="bg-sidebar-primary rounded-xl shadow-lg">
              <Boxes className="h-7 w-7 text-sidebar-primary-foreground" />
            </Stack>
            <Stack>
              <Text
                size="2xl"
                weight="bold"
                className="text-sidebar-foreground tracking-tight block leading-none"
              >
                Seller Core
              </Text>
              <Text size="xsm" className="text-sidebar-foreground/65">
                Enterprise Operations & P&L Platform
              </Text>
            </Stack>
          </Stack>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-sidebar-foreground mb-5 leading-tight">
            The modern system for{' '}
            <Text className="text-indigo-400">multi-channel fulfillment & P&L.</Text>
          </h1>
          <p className="text-base text-sidebar-foreground/80 mb-10 leading-relaxed">
            Streamline orders, inventory, carrier invoice reconciliation, RMA returns, and
            multi-currency financial ledgers with strict per-user isolation and tamper-evident
            auditing.
          </p>

          <Grid columns={{ minWidth: 220, max: 1 }}>
            <Stack direction="horizontal" align="start" gap={4}>
              <Stack
                padding={2}
                className="bg-sidebar-accent rounded-xl border border-sidebar-border shrink-0"
              >
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
              </Stack>
              <Stack>
                <h3 className="font-semibold text-sidebar-foreground text-sm mb-0.5">
                  Multi-Carrier Tracking & Invoice Reconciliation
                </h3>
                <p className="text-xs text-sidebar-foreground/70">
                  Split shipments, volumetric weight checks, and duplicate carrier charge guards.
                </p>
              </Stack>
            </Stack>
            <Stack direction="horizontal" align="start" gap={4}>
              <Stack
                padding={2}
                className="bg-sidebar-accent rounded-xl border border-sidebar-border shrink-0"
              >
                <Zap className="h-5 w-5 text-emerald-400" />
              </Stack>
              <Stack>
                <h3 className="font-semibold text-sidebar-foreground text-sm mb-0.5">
                  True Order-Level P&L & Multi-Currency Ledger
                </h3>
                <p className="text-xs text-sidebar-foreground/70">
                  Numeric(14,2) precision across USD, CAD, INR, EUR & MXN with Business vs.
                  Household segregation.
                </p>
              </Stack>
            </Stack>
            <Stack direction="horizontal" align="start" gap={4}>
              <Stack
                padding={2}
                className="bg-sidebar-accent rounded-xl border border-sidebar-border shrink-0"
              >
                <Lock className="h-5 w-5 text-amber-400" />
              </Stack>
              <Stack>
                <h3 className="font-semibold text-sidebar-foreground text-sm mb-0.5">
                  AES-256-GCM Keyring & Deny-Overrides-Allow RBAC
                </h3>
                <p className="text-xs text-sidebar-foreground/70">
                  Admin-provisioned accounts, 5-attempt lockout protection, and SHA-256 audit
                  trails.
                </p>
              </Stack>
            </Stack>
            <Stack direction="horizontal" align="start" gap={4}>
              <Stack
                padding={2}
                className="bg-sidebar-accent rounded-xl border border-sidebar-border shrink-0"
              >
                <Globe className="h-5 w-5 text-sky-400" />
              </Stack>
              <Stack>
                <h3 className="font-semibold text-sidebar-foreground text-sm mb-0.5">
                  Built-In FedEx/Carrier Address Cleaner
                </h3>
                <p className="text-xs text-sidebar-foreground/70">
                  Automatic 35-character line wrapping, state code normalization, and CSV export.
                </p>
              </Stack>
            </Stack>
          </Grid>
        </Stack>
      </Stack>

      {/* Right Authentication Form Panel */}
      <Stack align="center" justify="center" className="flex-1 p-6 sm:p-10 bg-background relative">
        <Stack className="absolute top-5 right-5">
          <ThemeToggleButton />
        </Stack>

        <Stack className="w-full max-w-md">
          <Stack
            direction="horizontal"
            align="center"
            justify="center"
            gap={2}
            className="lg:hidden mb-8"
          >
            <Stack padding={2} className="bg-primary rounded-xl">
              <Boxes className="h-6 w-6 text-primary-foreground" />
            </Stack>
            <Text size="xl" color="primary" weight="bold" className="tracking-tight">
              Seller Core
            </Text>
          </Stack>

          <Stack className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </Stack>

          {children}
        </Stack>
      </Stack>
    </Stack>
  )
}
