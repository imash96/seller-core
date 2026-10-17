import { usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import {
  ShieldCheck,
  Database,
  ShoppingCart,
  Package,
  Truck,
  RotateCcw,
  DollarSign,
  CreditCard as CreditCardIcon,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { AstryxBadge } from '~/components/astryx'

export default function Home() {
  const { user } = usePage<Data.SharedProps>().props

  const modules = [
    {
      icon: <ShoppingCart size={18} />,
      title: 'Orders & Idempotent Bulk Import',
      desc: 'Manual modal order entry, bulk JSON marketplace import with idempotency keys, duplicate detection, and raw payload separation.',
    },
    {
      icon: <Package size={18} />,
      title: 'Products, Variants & Channel Listings',
      desc: '0, 1, or N-dimensional product variations, sellable SKUs, ASIN/MPN/GTIN identifiers, and multi-marketplace channel sync.',
    },
    {
      icon: <Truck size={18} />,
      title: 'Split Shipments & Carrier Invoices',
      desc: 'Many-to-many shipment items, volumetric weight calculation, carrier invoice reconciliation, and duplicate billing protection.',
    },
    {
      icon: <RotateCcw size={18} />,
      title: 'Returns (RMA), Refunds & Claims',
      desc: 'Remaining-returnable quantity checks, full RMA lifecycle, partial refunds, restocking fees, and A-to-z/chargeback claims.',
    },
    {
      icon: <DollarSign size={18} />,
      title: 'Multi-Currency Ledger & Order P&L',
      desc: 'Precision decimal(19,4) accounting across USD, CAD, MXN, INR with Business vs Household/Personal expense separation.',
    },
    {
      icon: <CreditCardIcon size={18} />,
      title: 'Tokenized Credit Cards & Reminders',
      desc: 'Safe last-4 + vault token storage (zero PAN/CVV), seller account card linking, and automated payment due reminders.',
    },
  ]

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-12">
      <section className="bg-[var(--card)] border border-[var(--line-2)] rounded-2xl p-8 md:p-12 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <AstryxBadge tone="primary">AdonisJS v7.6 + Lucid v22.4 + PostgreSQL 18</AstryxBadge>
          <AstryxBadge tone="success">UUIDv7 Primary Keys</AstryxBadge>
          <AstryxBadge tone="purple">40 Normalized Tables · 44 Native Enums</AstryxBadge>
          <AstryxBadge tone="warning">Facebook Astryx UI Design System</AstryxBadge>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--ink)] max-w-4xl leading-tight">
          Multi-User E-Commerce Operations & Business Management SaaS
        </h1>

        <p className="text-base md:text-lg text-[var(--muted)] mt-4 max-w-3xl leading-relaxed">
          Enterprise-grade database architecture and full-stack operations workspace with strict{' '}
          <code className="mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
            user_id
          </code>{' '}
          data isolation, explicit deny-overrides-allow RBAC, independent module entitlements,
          multi-currency P&L accounting, and tamper-evident audit logging.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {user ? (
            <Link
              route="dashboard"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#0866FF] hover:bg-[#0756D8] text-white font-semibold text-sm shadow-sm transition"
            >
              <span>Open Operations Console</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              route="session.create"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#0866FF] hover:bg-[#0756D8] text-white font-semibold text-sm shadow-sm transition"
            >
              <span>Sign in to Operations Console</span>
              <ArrowRight size={16} />
            </Link>
          )}

          <div className="flex items-center gap-2 text-xs text-[var(--muted)] px-4 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line)]">
            <Lock size={14} className="text-[#0866FF]" />
            <span>
              Demo Super Admin:{' '}
              <strong className="mono text-[var(--ink)]">admin@sellercore.io</strong> /{' '}
              <strong className="mono text-[var(--ink)]">Admin@SellerCore2026!</strong>
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((m) => (
          <div
            key={m.title}
            className="bg-[var(--card)] border border-[var(--line-2)] rounded-xl p-6 space-y-3 hover:border-[#0866FF]/50 transition"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0866FF] flex items-center justify-center">
              {m.icon}
            </div>
            <h3 className="text-base font-semibold text-[var(--ink)]">{m.title}</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">{m.desc}</p>
          </div>
        ))}
      </section>

      <section className="bg-[var(--card)] border border-[var(--line-2)] rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)] mb-4">
          <Database size={18} className="text-[#0866FF]" />
          <span>Architectural Guarantees & Verification Status</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
              <CheckCircle2 size={14} /> No Public Signup
            </div>
            <p className="text-[var(--muted)]">
              Public registration is blocked. Users are provisioned exclusively by System Super
              Administrators with audit trails.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
              <CheckCircle2 size={14} /> Explicit Deny RBAC + Entitlements
            </div>
            <p className="text-[var(--muted)]">
              Role permissions support explicit <code className="mono">allow</code> /{' '}
              <code className="mono">deny</code> precedence alongside independent per-user{' '}
              <code className="mono">module_entitlements</code>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
              <CheckCircle2 size={14} /> Exact Decimal Monetary Columns
            </div>
            <p className="text-[var(--muted)]">
              All monetary fields use PostgreSQL <code className="mono">numeric(19,4)</code> and FX
              rates use <code className="mono">numeric(19,8)</code> — zero floating-point drift.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
              <ShieldCheck size={14} /> Zero Plaintext Secrets
            </div>
            <p className="text-[var(--muted)]">
              Passwords hashed via scrypt, marketplace credentials encrypted with AES-256-GCM, and
              cards restricted to last-4 + vault tokens.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
