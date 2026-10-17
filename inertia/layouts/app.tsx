import { type ReactElement, useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'
import { Link, Form } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { toast, Toaster } from 'sonner'
import { ChevronDown, LogOut, Moon, Sun, ShieldCheck, Layers, Lock } from 'lucide-react'
import { AstryxBadge } from '~/components/astryx'

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function AppLayout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const { props, flash } = usePage<Data.SharedProps>()
  const { user } = props
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    toast.dismiss()
    if (flash?.error) {
      toast.error(flash.error)
    }
    if (flash?.success) {
      toast.success(flash.success)
    }
  }, [flash])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      <header className="sticky top-0 z-30 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link route="home" className="flex items-center gap-2.5 font-semibold text-base">
              <div className="w-8 h-8 rounded-lg bg-[#0866FF] text-white flex items-center justify-center shadow-xs">
                <Layers size={18} />
              </div>
              <div className="flex flex-col">
                <span className="leading-none tracking-tight font-bold">
                  SellerCore <span className="text-[#0866FF]">Astryx</span>
                </span>
                <span className="text-[10px] text-[var(--muted)] mono mt-0.5">
                  E-COMMERCE OPERATIONS & P&L SAAS
                </span>
              </div>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-2">
                <Link
                  route="dashboard"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50/70 text-[#0866FF] dark:bg-blue-950/40 dark:text-blue-300"
                >
                  Operations Console
                </Link>
                <AstryxBadge tone="primary">UUIDv7 PKs</AstryxBadge>
                <AstryxBadge tone="success">Strict user_id Isolation</AstryxBadge>
                {user.isSuperAdmin && (
                  <AstryxBadge tone="purple">
                    <ShieldCheck size={12} /> Super Admin
                  </AstryxBadge>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end text-right mr-1">
                  <span className="text-xs font-semibold leading-tight">
                    {user.fullName ?? user.email}
                  </span>
                  <span className="text-[11px] text-[var(--muted)] mono">
                    {user.email} · {user.defaultCurrency || 'USD'}
                  </span>
                </div>
                <details className="user-menu">
                  <summary className="user-trigger">
                    <span className="avatar" style={{ background: '#0866FF' }}>
                      {user.initials}
                    </span>
                    <ChevronDown size={14} className="chev" />
                  </summary>
                  <div className="menu-panel">
                    <div className="menu-meta">
                      <div className="name">{user.fullName ?? 'User'}</div>
                      <div className="email">{user.email}</div>
                    </div>
                    <Link route="dashboard" className="menu-item">
                      <span>Operations Console</span>
                    </Link>
                    <Form route="session.destroy">
                      <button type="submit" className="menu-item">
                        <span>Log out</span>
                        <LogOut size={14} />
                      </button>
                    </Form>
                  </div>
                </details>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-[var(--muted)] px-2.5 py-1 rounded-md border border-[var(--line)]">
                  <Lock size={12} /> Admin-Provisioned Access Only
                </span>
                <Link
                  route="session.create"
                  className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-xs font-semibold bg-[#0866FF] hover:bg-[#0756D8] text-white transition"
                >
                  Log in
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="iconbtn"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Toaster position="top-center" richColors />
    </div>
  )
}
