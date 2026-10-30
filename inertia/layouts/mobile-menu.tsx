import { Link } from '@inertiajs/react'
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
        <div className="h-16 px-5 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/dashboard" onClick={close} className="flex items-center gap-2.5 unstyled-link">
            <div className="w-9 h-9 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-sm">
              <Box className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <span className="text-base font-bold text-sidebar-foreground tracking-tight block leading-none">
                Seller Core
              </span>
              <span className="text-[11px] text-sidebar-foreground/60 block mt-0.5">
                Operations & P&L Suite
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={close}
            className="p-2 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground/75 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-5 overflow-y-auto space-y-6">
          {NAVIGATION.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
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

        <div className="p-4 border-t border-sidebar-border">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-error w-full hover:bg-error-subtle rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    </Drawer>
  )
}
