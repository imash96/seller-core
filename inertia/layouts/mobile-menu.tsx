import { Text } from '@astryxdesign/core/Text'
import { Stack } from '@astryxdesign/core/Stack'
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
      <Stack className="h-full bg-sidebar text-sidebar-foreground">
        <Stack
          direction="horizontal"
          align="center"
          justify="between"
          paddingInline={5}
          className="h-16 border-b border-sidebar-border"
        >
          <Link
            href="/dashboard"
            onClick={close}
            className="flex items-center gap-2.5 unstyled-link"
          >
            <Stack
              direction="horizontal"
              align="center"
              justify="center"
              className="w-9 h-9 bg-indigo-600 rounded-xl shadow-sm"
            >
              <Box className="w-5 h-5 text-white" />
            </Stack>
            <Stack>
              <Text
                size="base"
                weight="bold"
                className="text-white tracking-tight block leading-none"
              >
                Seller Core
              </Text>
              <Text size="2xs" className="text-slate-400 block mt-0.5">
                Operations & P&L Suite
              </Text>
            </Stack>
          </Link>
          <button
            type="button"
            onClick={close}
            className="p-2 hover:bg-sidebar-accent rounded-lg text-slate-300 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </Stack>

        <nav className="flex-1 px-4 py-5 overflow-y-auto space-y-6">
          {NAVIGATION.map((section) => (
            <Stack key={section.title}>
              <Stack
                paddingInline={3}
                className="mb-2 text-2xs font-semibold uppercase tracking-wider text-slate-400"
              >
                {section.title}
              </Stack>
              <Stack gap={1}>
                {section.items.map((item) => (
                  <SidebarLink key={item.href} {...item} onClick={close} />
                ))}
              </Stack>
            </Stack>
          ))}
        </nav>

        <Stack padding={4} className="border-t border-sidebar-border">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-400 w-full hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </Stack>
      </Stack>
    </Drawer>
  )
}
