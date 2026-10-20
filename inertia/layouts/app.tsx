import { type ReactNode, useState, useCallback } from 'react'
import { usePage } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { AppShell } from '@astryxdesign/core/AppShell'
import { TopNav } from '@astryxdesign/core/TopNav'
import { SideNav, SideNavSection, SideNavItem } from '@astryxdesign/core/SideNav'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/astryx_themes'
import { useFlashToasts } from '~/lib/toast'
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
  Sun,
  Moon,
  Home,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: ReactNode; adminOnly?: boolean }

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> }],
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
    title: 'Finance & Ops',
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
  '/dashboard': 'Dashboard',
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

const PAGE_DESCRIPTIONS: Record<string, string> = {
  '/dashboard': 'P&L waterfall, fulfillment health and workspace activity.',
  '/orders': 'Marketplace orders with lifecycle status and payment breakdown.',
  '/customers': 'Customer profiles, merge tools and explainable risk reviews.',
  '/products': 'Catalog brands, categories, products, variants and channel listings.',
  '/seller-accounts': 'Marketplace connections with AES-256-GCM credential rotation.',
  '/shipments': 'Fulfillment shipments and carrier invoice reconciliation.',
  '/returns': 'RMAs, refunds and variance controls.',
  '/claims': 'Marketplace claims and chargeback evidence packs.',
  '/finance': 'Financial accounts, credit cards and ledger entries.',
  '/tasks': 'Operational tasks and reminders.',
  '/import': 'Idempotent bulk import with duplicate detection and job history.',
  '/admin': 'User provisioning, roles and module entitlements.',
  '/audit': 'Append-only audit trail (SHA-256 checksummed).',
}

function getPageMeta(url: string) {
  const path = url.split('?')[0] ?? '/'
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (path === prefix || (prefix !== '/dashboard' && path.startsWith(prefix))) {
      return { path: prefix, title, desc: PAGE_DESCRIPTIONS[prefix] }
    }
  }
  return { path: '/', title: 'Operations Console', desc: '' }
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { props, url } = usePage<Data.SharedProps>()
  useFlashToasts()

  const user = props.user
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const { path, title: pageTitle, desc: pageDesc } = getPageMeta(url)
  const initials = user
    ? user.fullName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  const toggleTheme = useCallback(() => {
    const next = themeMode === 'light' ? 'dark' : 'light'
    setThemeMode(next)
    document.cookie = `app_theme=${next}; path=/; max-age=31536000`
  }, [themeMode])

  return (
    <Theme theme={themes[defaultThemeSlug]} mode={themeMode}>
      <AppShell
        contentPadding={4}
        height="fill"
        variant="wash"
        topNav={
          <TopNav
            label="Application navigation"
            heading={
              <Link
                href="/dashboard"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'var(--astryx-color-background-accent, #0866ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: 13,
                    letterSpacing: -0.5,
                  }}
                >
                  SC
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                  <strong style={{ fontSize: 14 }}>Seller Core</strong>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>Ops workspace</span>
                </span>
              </Link>
            }
            endContent={
              <Stack direction="horizontal" gap={2} align="center">
                {/* Page pill — shows where you are */}
                <Badge
                  variant="neutral"
                  label={
                    pageTitle === 'Dashboard'
                      ? 'Workspace'
                      : pageTitle.replace(' & ', ' · ').replace(' & Catalog', '')
                  }
                />
                <button
                  onClick={toggleTheme}
                  style={{
                    background: 'none',
                    border: '1px solid var(--astryx-color-border-default, #d1d5db)',
                    borderRadius: 8,
                    padding: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label="Toggle theme"
                  title="Toggle theme"
                >
                  {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                {user ? (
                  <>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: user.isSuperAdmin ? '#581c87' : '#1d4ed8',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: 0.5,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {user.fullName}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.6, whiteSpace: 'nowrap' }}>
                        {user.email}
                      </div>
                    </div>
                    <Badge
                      variant={user.isSuperAdmin ? 'info' : 'neutral'}
                      label={user.isSuperAdmin ? 'Super admin' : 'Operator'}
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
              <Stack gap={1}>
                <div style={{ fontSize: 11, letterSpacing: 0.8, opacity: 0.55, fontWeight: 800 }}>
                  SELLER CORE
                </div>
                {!user?.isSuperAdmin ? (
                  <Text type="supporting" as="span">
                    Operator workspace
                  </Text>
                ) : null}
              </Stack>
            }
          >
            {NAV_GROUPS.map((group) => (
              <SideNavSection key={group.title} title={group.title}>
                {group.items
                  .filter((item) => (item.adminOnly ? !!user?.isSuperAdmin : true))
                  .map((item) => {
                    const isActive =
                      path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href))
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
        {/* Page header */}
        <Stack gap={4}>
          <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
            <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Badge variant="neutral" label="Home" />
            </Link>
            <span style={{ opacity: 0.35 }}>›</span>
            <Text type="supporting" as="span">
              {pageTitle}
            </Text>
          </Stack>

          <Stack gap={1}>
            <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
              <Text type="display-2" as="h1" weight="bold">
                {pageTitle}
              </Text>
              {pageTitle === 'Dashboard' && user?.isSuperAdmin ? (
                <Badge variant="info" label="Super admin view" />
              ) : null}
            </Stack>
            {pageDesc ? (
              <Text type="supporting" as="p" style={{ maxWidth: 720 }}>
                {pageDesc}
              </Text>
            ) : null}
          </Stack>

          {children}
        </Stack>
      </AppShell>
    </Theme>
  )
}
