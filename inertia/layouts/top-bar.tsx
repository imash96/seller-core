import { Text } from '@astryxdesign/core/Text'
import { Stack } from '@astryxdesign/core/Stack'
import { Menu, Bell, Shield, MapPin } from 'lucide-react'
import { Link } from '@adonisjs/inertia/react'
import { BreadcrumbNav } from './breadcrumb-nav'
import { ThemeToggleButton } from '~/components/atoms/theme-toggle-button'

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
  const getInitials = () => {
    const name = user?.fullName || user?.email || 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/85 backdrop-blur-xl">
      <Stack
        direction="horizontal"
        align="center"
        justify="between"
        gap={4}
        className="h-full mx-auto px-4 sm:px-6 lg:px-8"
      >
        <Stack direction="horizontal" align="center" gap={3} className="min-w-0">
          <button
            type="button"
            onClick={onMenu}
            className="p-2 rounded-lg hover:bg-muted text-foreground transition-colors lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BreadcrumbNav />
        </Stack>

        <Stack direction="horizontal" align="center" gap={2} className="sm:gap-3">
          <Link
            href="/address-cleanup"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors unstyled-link"
          >
            <MapPin className="w-3.5 h-3.5 text-primary" />
            Address Cleaner
          </Link>

          <ThemeToggleButton />

          <Link
            href="/tasks"
            className="relative p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Tasks & reminders"
            title="Tasks & Reminders"
          >
            <Bell className="w-4 h-4" />
            <Stack
              as="span"
              className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card"
            />
          </Link>

          <Stack className="hidden sm:block h-6 w-px bg-border" />

          {user && (
            <Stack direction="horizontal" align="center" gap={2}>
              <Stack
                direction="horizontal"
                align="center"
                justify="center"
                className="w-8 h-8 rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs"
              >
                {getInitials()}
              </Stack>
              <Stack className="hidden sm:block text-left leading-tight">
                <Stack
                  direction="horizontal"
                  align="center"
                  gap={1.5}
                  className="text-xs font-semibold text-foreground"
                >
                  <Text maxLines={1} className="max-w-36">
                    {user.fullName || user.email}
                  </Text>
                  {user.isSuperAdmin && (
                    <Stack
                      direction="horizontal"
                      align="center"
                      gap={0.5}
                      as="span"
                      paddingInline={1.5}
                      paddingBlock={0.5}
                      className="rounded text-3xs font-bold bg-primary/15 text-primary"
                    >
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </Stack>
                  )}
                </Stack>
                <Stack className="text-2xs text-muted-foreground truncate max-w-40">
                  {user.email}
                </Stack>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </header>
  )
}
