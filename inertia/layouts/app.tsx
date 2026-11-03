import { type ReactNode } from 'react'
import { Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { Box, LogOut } from 'lucide-react'
import { NAVIGATION, type NavItem } from '~/lib/constants'
import { useToggle } from '~/hooks/use_toggle'
import { TopBar } from './top-bar'
import MobileMenu from './mobile-menu'
import { FlashMessages } from '~/modules/common/flash-messages'
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
      ? currentPath === '/dashboard'
      : currentPath === href || currentPath.startsWith(href + '/')

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all unstyled-link ${
        isActive
          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-xs'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground font-medium'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isActive
                ? 'text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground'
            }`}
          />
        )}
        <span className="truncate">{label}</span>
      </div>

      {badge && (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
            isActive
              ? 'bg-white/20 text-sidebar-primary-foreground'
              : 'bg-sidebar-accent text-sidebar-accent-foreground'
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <MobileMenu open={drawerOpen} close={closeDrawer} logout={handleLogout} />
      <FlashMessages />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-68 xl:w-72 lg:flex-col">
        <div className="flex flex-col grow gap-y-5 overflow-y-auto bg-sidebar text-sidebar-foreground border-r border-sidebar-border px-4 pb-4">
          <div className="flex items-center h-16 px-1 border-b border-sidebar-border shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3 group unstyled-link min-w-0">
              <div className="w-9 h-9 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0">
                <Box className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div className="min-w-0">
                <span className="text-base font-bold text-sidebar-foreground tracking-tight block leading-none truncate">
                  Seller Core
                </span>
                <span className="text-[11px] text-sidebar-foreground/65 block mt-1 truncate">
                  Multi-Channel Operations
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col justify-between gap-6">
            <div className="space-y-5">
              {NAVIGATION.map((section) => (
                <div key={section.title} className="space-y-1.5">
                  <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/55">
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

            <div className="pt-4 border-t border-sidebar-border">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-error w-full hover:bg-error-subtle rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign out</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-68 xl:pl-72 min-h-screen flex flex-col flex-1 min-w-0">
        <TopBar onMenu={toggleDrawer} user={user} />
        <main className="flex-1 w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
