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
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      <FlashMessages />

      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-slate-50 relative overflow-hidden border-r border-border items-center justify-center p-10 xl:p-14">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-1/2 h-1/2 bg-indigo-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-1/2 h-1/2 bg-blue-500/25 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-lg w-full space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg">
              <Boxes className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white tracking-tight block leading-none">
                Seller Core
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                Enterprise Operations & P&L Platform
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight">
              The modern system for{' '}
              <span className="text-indigo-400">multi-channel fulfillment & P&L.</span>
            </h1>
            <p className="text-sm xl:text-base text-slate-300 leading-relaxed">
              Streamline orders, inventory, carrier invoice reconciliation, RMA returns, and
              multi-currency financial ledgers with strict per-user isolation and tamper-evident
              auditing.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/75 border border-slate-800">
              <div className="p-2 bg-indigo-500/15 rounded-xl border border-indigo-500/25 shrink-0">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-0.5">
                  Multi-Carrier Tracking & Invoice Reconciliation
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Split shipments, volumetric weight checks, and duplicate carrier charge guards.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/75 border border-slate-800">
              <div className="p-2 bg-emerald-500/15 rounded-xl border border-emerald-500/25 shrink-0">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-0.5">
                  True Order-Level P&L & Self-Contained PriceMoney Ledger
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Exact multi-currency accounting across USD, CAD, INR, EUR, GBP & MXN with Business
                  vs. Household segregation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/75 border border-slate-800">
              <div className="p-2 bg-amber-500/15 rounded-xl border border-amber-500/25 shrink-0">
                <Lock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-0.5">
                  AES-256-GCM Keyring & Deny-Overrides-Allow RBAC
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Admin-provisioned accounts, 5-attempt lockout protection, and SHA-256 audit
                  trails.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/75 border border-slate-800">
              <div className="p-2 bg-sky-500/15 rounded-xl border border-sky-500/25 shrink-0">
                <Globe className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-0.5">
                  Built-In FedEx/Carrier Address Cleaner
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatic 35-character line wrapping, state code normalization, and CSV/DOCX
                  export.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 bg-background relative min-h-screen lg:min-h-0">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggleButton />
        </div>

        <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="flex items-center justify-center gap-2.5 lg:hidden mb-6">
            <div className="p-2 bg-primary rounded-xl">
              <Boxes className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">Seller Core</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
