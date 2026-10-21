import { type ReactElement } from 'react'
import { Link } from '@inertiajs/react'
import { Boxes, ArrowRight } from 'lucide-react'
import { FlashMessages } from '~/components/flash-messages'

export default function MarketingLayout({ children }: { children: ReactElement }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <FlashMessages />
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 unstyled-link">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-foreground tracking-tight block leading-none">
                Seller Core
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                E-Commerce Operations & P&L
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#platform" className="hover:text-foreground transition-colors unstyled-link">
              Platform Modules
            </a>
            <a href="#analytics" className="hover:text-foreground transition-colors unstyled-link">
              P&L Waterfall
            </a>
            <a href="#security" className="hover:text-foreground transition-colors unstyled-link">
              RBAC & Audit Security
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login?demo=admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors unstyled-link"
            >
              Try Demo
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors unstyled-link"
            >
              Sign in <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">{children}</main>

      <footer className="border-t border-border py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
        Seller Core · Multi-User E-Commerce Operations, Address Cleaning & Financial Management
        Platform
      </footer>
    </div>
  )
}
