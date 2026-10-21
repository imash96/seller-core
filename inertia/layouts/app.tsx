import { type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { Box, LogOut } from 'lucide-react'
import { NAVIGATION, type NavItem } from '~/lib/constants'
import { useToggle } from '~/hooks/use_toggle'
import { TopBar } from './top-bar'
import MobileMenu from './mobile-menu'
import { FlashMessages } from '~/components/flash-messages'
import { router, usePage } from '@inertiajs/react'

export function SidebarLink({
  href,
  label,
  icon: Icon,
  badge,
  onClick,
}: NavItem & { onClick?: () => void }) {
  const { url } = usePage()
  const currentPath = (url || '/').split('?')[0]
  const isActive =
    href === '/dashboard'
      ? currentPath === '/dashboard' || currentPath === '/'
      : currentPath === href || currentPath.startsWith(href + '/')

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all unstyled-link ${
        isActive
          ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/25'
          : 'text-slate-300 hover:bg-white/8 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
            }`}
          />
        )}
        <span className="truncate">{label}</span>
      </div>

      {badge && (
        <span
          className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
            isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { props } = usePage<Data.SharedProps>()
  const user = props.user as any
  const { open: drawerOpen, onToggle: toggleDrawer, onClose: closeDrawer } = useToggle(false)

  const handleLogout = () => {
    router.post('/logout')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MobileMenu open={drawerOpen} close={closeDrawer} logout={handleLogout} />
      <FlashMessages />

      {/* Desktop Sidebar (ported from inertia-old/layout/app-layout.tsx) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-950 text-slate-100 border-r border-slate-800 px-5 pb-4">
          <div className="h-16 border-b border-slate-800/80 flex items-center">
            <Link href="/dashboard" className="flex items-center gap-3 group unstyled-link">
              <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
                <Box className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight block leading-none">
                  Seller Core
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Multi-Channel Operations
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col justify-between">
            <div className="space-y-6">
              {NAVIGATION.map((section) => (
                <div key={section.title}>
                  <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400/80">
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <SidebarLink key={item.href} {...item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-400 w-full hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <TopBar onMenu={toggleDrawer} user={user} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
