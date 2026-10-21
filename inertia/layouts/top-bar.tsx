import { Menu, Bell, Sun, Moon, Shield, MapPin, LogOut } from 'lucide-react'
import { Link, router } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { BreadcrumbNav } from './breadcrumb-nav'

export interface TopBarProps {
  onMenu: () => void
  user?: {
    id?: string
    email?: string
    fullName?: string
    isSuperAdmin?: boolean
  }
}

export function TopBar({ onMenu, user }: TopBarProps) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    document.cookie = `app_theme=${next ? 'dark' : 'light'}; path=/; max-age=31536000`
  }

  const getInitials = () => {
    const name = user?.fullName || user?.email || 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenu}
            className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BreadcrumbNav />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/address-cleanup"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-primary" />
            Address Cleaner
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle color theme"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            href="/tasks"
            className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Tasks & reminders"
            title="Tasks & Reminders"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
          </Link>

          <div className="hidden sm:block h-6 w-px bg-border" />

          {user && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {getInitials()}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                  {user.fullName || user.email}
                  {user.isSuperAdmin && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                  {user.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.post('/logout')}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
