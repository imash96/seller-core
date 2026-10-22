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
    <div className="flex min-h-screen bg-background text-foreground">
      <FlashMessages />

      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-sidebar text-sidebar-foreground p-14 items-center justify-center relative overflow-hidden border-r border-sidebar-border">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-500/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-500/25 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-lg w-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-sidebar-primary p-2.5 rounded-xl shadow-lg">
              <Boxes className="h-7 w-7 text-sidebar-primary-foreground" />
            </div>
            <div>
              <span className="text-2xl font-bold text-sidebar-foreground tracking-tight block leading-none">
                Seller Core
              </span>
              <span className="text-xs text-sidebar-foreground/65">
                Enterprise Operations & P&L Platform
              </span>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-sidebar-foreground mb-5 leading-tight">
            The modern system for{' '}
            <span className="text-indigo-400">multi-channel fulfillment & P&L.</span>
          </h1>
          <p className="text-base text-sidebar-foreground/80 mb-10 leading-relaxed">
            Streamline orders, inventory, carrier invoice reconciliation, RMA returns, and
            multi-currency financial ledgers with strict per-user isolation and tamper-evident
            auditing.
          </p>

          <div className="grid grid-cols-1 gap-5">
            <div className="flex items-start gap-4">
              <div className="bg-sidebar-accent p-2.5 rounded-xl border border-sidebar-border shrink-0">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sidebar-foreground text-sm mb-0.5">
                  Multi-Carrier Tracking & Invoice Reconciliation
                </h3>
                <p className="text-xs text-sidebar-foreground/70">
                  Split shipments, volumetric weight checks, and duplicate carrier charge guards.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-sidebar-accent p-2.5 rounded-xl border border-sidebar-border shrink-0">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sidebar-foreground text-sm mb-0.5">
                  True Order-Level P&L & Multi-Currency Ledger
                </h3>
                <p className="text-xs text-sidebar-foreground/70">
                  Numeric(14,2) precision across USD, CAD, INR, EUR & MXN with Business vs.
                  Household segregation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-sidebar-accent p-2.5 rounded-xl border border-sidebar-border shrink-0">
                <Lock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sidebar-foreground text-sm mb-0.5">
                  AES-256-GCM Keyring & Deny-Overrides-Allow RBAC
                </h3>
                <p className="text-xs text-sidebar-foreground/70">
                  Admin-provisioned accounts, 5-attempt lockout protection, and SHA-256 audit
                  trails.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-sidebar-accent p-2.5 rounded-xl border border-sidebar-border shrink-0">
                <Globe className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sidebar-foreground text-sm mb-0.5">
                  Built-In FedEx/Carrier Address Cleaner
                </h3>
                <p className="text-xs text-sidebar-foreground/70">
                  Automatic 35-character line wrapping, state code normalization, and CSV export.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background relative">
        <div className="absolute top-5 right-5">
          <ThemeToggleButton />
        </div>

        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="bg-primary p-2 rounded-xl">
              <Boxes className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Seller Core</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
