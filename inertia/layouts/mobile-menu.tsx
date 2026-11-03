import { Link } from '@adonisjs/inertia/react'
import { Box, LogOut, X } from 'lucide-react'
import Drawer from '~/ui/drawer'
import { NAVIGATION } from '~/lib/constants'
import { SidebarLink } from './app'

export interface MobileMenuProps {
  open: boolean
  close: () => void
  logout: () => void
}

export default function MobileMenu({ open, close, logout }: MobileMenuProps) {
  return (
    <Drawer open={open} onClose={close} direction="left" hideOnDesktop widthClass="max-w-xs">
      <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
        <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border shrink-0">
          <Link
            href="/dashboard"
            onClick={close}
            className="flex items-center gap-2.5 unstyled-link min-w-0"
          >
            <div className="w-9 h-9 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-xs shrink-0">
              <Box className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div className="min-w-0">
              <span className="text-base font-bold text-sidebar-foreground tracking-tight block leading-none truncate">
                Seller Core
              </span>
              <span className="text-[11px] text-sidebar-foreground/65 block mt-0.5 truncate">
                Operations & P&L Suite
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={close}
            className="p-2 hover:bg-sidebar-accent rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {NAVIGATION.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/55">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarLink key={item.href} {...item} onClick={close} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border shrink-0">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-error w-full hover:bg-error-subtle rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </Drawer>
  )
}
