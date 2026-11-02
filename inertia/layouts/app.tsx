import { Text } from '@astryxdesign/core/Text'
import { Stack } from '@astryxdesign/core/Stack'
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
      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all unstyled-link ${
        isActive
          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      }`}
    >
      <Stack direction="horizontal" align="center" gap={3} className="min-w-0">
        {Icon && (
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isActive
                ? 'text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground'
            }`}
          />
        )}
        <Text maxLines={1}>{label}</Text>
      </Stack>

      {badge && (
        <Text
          as="span"
          size="2xs"
          weight="semibold"
          className={`px-2 py-0.5 rounded-full ${
            isActive
              ? 'bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground'
              : 'bg-sidebar-accent text-sidebar-accent-foreground'
          }`}
        >
          {badge}
        </Text>
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
    <Stack className="min-h-screen bg-background text-foreground">
      <MobileMenu open={drawerOpen} close={closeDrawer} logout={handleLogout} />
      <FlashMessages />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
        <Stack
          paddingInline={5}
          className="grow gap-y-5 overflow-y-auto bg-sidebar text-sidebar-foreground border-r border-sidebar-border pb-4"
        >
          <Stack
            direction="horizontal"
            align="center"
            className="h-16 border-b border-sidebar-border"
          >
            <Link href="/dashboard" className="flex items-center gap-3 group unstyled-link">
              <Stack
                direction="horizontal"
                align="center"
                justify="center"
                className="w-9 h-9 bg-sidebar-primary rounded-xl shadow-sm transition-transform group-hover:scale-105"
              >
                <Box className="w-5 h-5 text-sidebar-primary-foreground" />
              </Stack>
              <Stack>
                <Text
                  size="base"
                  weight="bold"
                  className="text-sidebar-foreground tracking-tight block leading-none"
                >
                  Seller Core
                </Text>
                <Text size="2xs" className="text-sidebar-foreground/65 block mt-1">
                  Multi-Channel Operations
                </Text>
              </Stack>
            </Link>
          </Stack>

          <nav className="flex flex-1 flex-col justify-between">
            <Stack gap={6}>
              {NAVIGATION.map((section) => (
                <Stack key={section.title}>
                  <Stack
                    paddingInline={3}
                    className="mb-2 text-2xs font-semibold uppercase tracking-wider text-sidebar-foreground/55"
                  >
                    {section.title}
                  </Stack>
                  <Stack gap={1}>
                    {section.items.map((item) => (
                      <SidebarLink key={item.href} {...item} />
                    ))}
                  </Stack>
                </Stack>
              ))}
            </Stack>

            <Stack className="pt-4 mt-6 border-t border-sidebar-border">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-400 w-full hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </Stack>
          </nav>
        </Stack>
      </aside>

      {/* Main Content Area */}
      <Stack className="lg:pl-72 min-h-screen">
        <TopBar onMenu={toggleDrawer} user={user} />
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </Stack>
    </Stack>
  )
}
