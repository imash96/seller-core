import { type ReactNode, useState } from 'react'
import type { Data } from '@generated/data'
import { usePage } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import { AppShell } from '@astryxdesign/core/AppShell'
import { TopNav } from '@astryxdesign/core/TopNav'
import { SideNav, SideNavSection, SideNavItem } from '@astryxdesign/core/SideNav'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Card } from '@astryxdesign/core/Card'
import { Banner } from '@astryxdesign/core/Banner'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { IconButton } from '@astryxdesign/core/IconButton'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/astryx_themes'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Store,
  Truck,
  RotateCcw,
  Scale,
  Wallet,
  CheckSquare,
  Upload,
  Shield,
  History,
  LogOut,
  Sun,
  Moon,
  Menu,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: ReactNode; adminOnly?: boolean }

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard & KPIs', icon: <LayoutDashboard size={16} /> }],
  },
  {
    title: 'Commerce & Catalog',
    items: [
      { href: '/orders', label: 'Orders', icon: <ShoppingCart size={16} /> },
      { href: '/customers', label: 'Customers & Risk', icon: <Users size={16} /> },
      { href: '/products', label: 'Products & Catalog', icon: <Package size={16} /> },
      { href: '/seller-accounts', label: 'Seller Accounts', icon: <Store size={16} /> },
      { href: '/import', label: 'Bulk Import', icon: <Upload size={16} /> },
    ],
  },
  {
    title: 'Fulfillment & Post-Purchase',
    items: [
      { href: '/shipments', label: 'Shipments & Invoices', icon: <Truck size={16} /> },
      { href: '/returns', label: 'Returns & Refunds', icon: <RotateCcw size={16} /> },
      { href: '/claims', label: 'Marketplace Claims', icon: <Scale size={16} /> },
    ],
  },
  {
    title: 'Finance & Operations',
    items: [
      { href: '/finance', label: 'Finance & Cards', icon: <Wallet size={16} /> },
      { href: '/tasks', label: 'Tasks & Reminders', icon: <CheckSquare size={16} /> },
    ],
  },
  {
    title: 'Governance',
    items: [
      { href: '/admin', label: 'Users & RBAC', icon: <Shield size={16} />, adminOnly: true },
      { href: '/audit', label: 'Audit History', icon: <History size={16} /> },
    ],
  },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard & KPIs',
  '/orders': 'Orders',
  '/customers': 'Customers & Risk',
  '/products': 'Products & Catalog',
  '/seller-accounts': 'Seller Accounts',
  '/shipments': 'Shipments & Invoices',
  '/returns': 'Returns & Refunds',
  '/claims': 'Marketplace Claims',
  '/finance': 'Finance & Cards',
  '/tasks': 'Tasks & Reminders',
  '/import': 'Bulk Import',
  '/admin': 'Users & RBAC',
  '/audit': 'Audit History',
}

function getPageTitle(url: string): string {
  const path = url.split('?')[0] ?? '/'
  // exact match first, then prefix match
  if (PAGE_TITLES[path]) return PAGE_TITLES[path]
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (path.startsWith(prefix)) return title
  }
  return 'Operations Console'
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { props, flash, url } = usePage<Data.SharedProps>()
  const user = props.user
  const [flashDismissed, setFlashDismissed] = useState(false)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')

  const path = url.split('?')[0] ?? '/'
  const pageTitle = getPageTitle(url)
  const showFlash = !flashDismissed && (flash?.success || flash?.error)

  // Reset dismissal when flash changes
  const flashKey = `${flash?.success ?? ''}|${flash?.error ?? ''}`
  const [lastFlashKey, setLastFlashKey] = useState(flashKey)
  if (flashKey !== lastFlashKey) {
    setLastFlashKey(flashKey)
    if (flashDismissed) setFlashDismissed(false)
  }

  const initials = user
    ? user.fullName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  return (
    <Theme theme={themes[defaultThemeSlug]} mode={themeMode}>
      <AppShell
        contentPadding={4}
        height="fill"
        variant="wash"
        topNav={
          <TopNav
            label="Application top navigation"
            heading={
              <Link
                href="/dashboard"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--astryx-color-background-accent, #0866ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  SC
                </span>
                <strong>Seller Core</strong>
              </Link>
            }
            endContent={
              <Stack direction="horizontal" gap={2} align="center">
                <Text type="supporting" as="div">
                  {pageTitle}
                </Text>
                <button
                  onClick={() => {
                    const next = themeMode === 'light' ? 'dark' : 'light'
                    setThemeMode(next)
                    document.cookie = `app_theme=${next}; path=/; max-age=31536000`
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--astryx-color-border-default, #d1d5db)',
                    borderRadius: 8,
                    padding: 6,
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                  aria-label="Toggle theme"
                >
                  {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                {user ? (
                  <>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: user.isSuperAdmin ? '#7c3aed' : '#0866ff',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {initials}
                    </div>
                    <Stack gap={0}>
                      <Text type="label" as="div" weight="medium">
                        {user.fullName}
                      </Text>
                      <Text type="supporting" as="div">
                        {user.email}
                      </Text>
                    </Stack>
                    <Badge
                      variant={user.isSuperAdmin ? 'info' : 'neutral'}
                      label={user.isSuperAdmin ? 'Super Admin' : 'Operations'}
                    />
                  </>
                ) : null}
                <Form action="/logout" method="post">
                  {({ processing }) => (
                    <Button
                      label="Sign out"
                      variant="secondary"
                      size="sm"
                      type="submit"
                      isDisabled={processing}
                    />
                  )}
                </Form>
              </Stack>
            }
          />
        }
        sideNav={
          <SideNav
            header={
              <strong style={{ fontSize: 13, letterSpacing: 0.5, opacity: 0.7 }}>
                SELLER CORE
              </strong>
            }
          >
            {NAV_GROUPS.map((group) => (
              <SideNavSection key={group.title} title={group.title}>
                {group.items
                  .filter((item) => {
                    if (item.adminOnly && !user?.isSuperAdmin) return false
                    return true
                  })
                  .map((item) => {
                    const isActive =
                      path === item.href ||
                      (item.href !== '/dashboard' && path.startsWith(item.href))
                    return (
                      <SideNavItem
                        key={item.href}
                        label={item.label}
                        href={item.href}
                        isSelected={isActive}
                        icon={item.icon}
                      />
                    )
                  })}
              </SideNavSection>
            ))}
          </SideNav>
        }
      >
        <Stack gap={4}>
          {/* Breadcrumb + title */}
          <Stack direction="horizontal" align="center" wrap="wrap" gap={3}>
            <Text type="supporting" as="div">
              <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
                Home
              </Link>{' '}
              / {pageTitle}
            </Text>
          </Stack>
          <Stack direction="horizontal" align="center" wrap="wrap" gap={3}>
            <Text type="display-2" as="h1" weight="bold">
              {pageTitle}
            </Text>
            {user ? (
              <Badge
                variant={user.isSuperAdmin ? 'info' : 'neutral'}
                label={`${user.fullName}${user.isSuperAdmin ? ' · super admin' : ''}`}
              />
            ) : null}
          </Stack>

          {showFlash && flash?.success ? (
            <Banner
              status="success"
              title={flash.success}
              isDismissable
              onDismiss={() => setFlashDismissed(true)}
              container="card"
            />
          ) : null}
          {showFlash && flash?.error ? (
            <Banner
              status="error"
              title={flash.error}
              isDismissable
              onDismiss={() => setFlashDismissed(true)}
              container="card"
            />
          ) : null}

          {children}
        </Stack>
      </AppShell>
    </Theme>
  )
}
