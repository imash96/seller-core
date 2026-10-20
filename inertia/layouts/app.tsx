import { type ReactNode } from 'react'
import type { Data } from '@generated/data'
import { usePage } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import { AppShell } from '@astryxdesign/core/AppShell'
import { TopNav } from '@astryxdesign/core/TopNav'
import { SideNav, SideNavSection, SideNavItem } from '@astryxdesign/core/SideNav'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Card } from '@astryxdesign/core/Card'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

const NAV = [
  { href: '/dashboard', label: 'Dashboard & KPIs' },
  { href: '/orders', label: 'Orders' },
  { href: '/customers', label: 'Customers & Risk' },
  { href: '/products', label: 'Products & Catalog' },
  { href: '/seller-accounts', label: 'Seller Accounts' },
  { href: '/shipments', label: 'Shipments & Invoices' },
  { href: '/returns', label: 'Returns & Refunds' },
  { href: '/claims', label: 'Marketplace Claims' },
  { href: '/finance', label: 'Finance & Cards' },
  { href: '/tasks', label: 'Tasks & Reminders' },
  { href: '/import', label: 'Bulk Import' },
  { href: '/admin', label: 'Users & RBAC' },
  { href: '/audit', label: 'Audit History' },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const { props, flash } = usePage<Data.SharedProps>()
  const user = props.user

  return (
    <AppShell
      contentPadding={4}
      height="fill"
      variant="wash"
      topNav={
        <TopNav
          label="Application top navigation"
          heading={
            <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
              <strong>Seller Core</strong>
            </Link>
          }
          endContent={
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
          }
        />
      }
      sideNav={
        <SideNav header={<strong>Workspace</strong>}>
          <SideNavSection title="Modules">
            {NAV.map((item) => (
              <SideNavItem key={item.href} label={item.label} href={item.href} />
            ))}
          </SideNavSection>
        </SideNav>
      }
    >
      <Stack gap={4}>
        <Stack direction="horizontal" align="center" wrap="wrap" gap={3}>
          <Text type="display-2" as="h1" weight="bold">
            Operations Console
          </Text>
          {user ? (
            <Badge
              variant={user.isSuperAdmin ? 'info' : 'neutral'}
              label={`${user.fullName}${user.isSuperAdmin ? ' · super admin' : ''}`}
            />
          ) : null}
        </Stack>

        {flash?.success ? (
          <Card padding={3} variant="muted">
            <Stack direction="horizontal" align="center" gap={3}>
              <Badge variant="success" label="Success" />
              <Text type="body" as="div">
                {flash.success}
              </Text>
            </Stack>
          </Card>
        ) : null}
        {flash?.error ? (
          <Card padding={3} variant="muted">
            <Stack direction="horizontal" align="center" gap={3}>
              <Badge variant="error" label="Error" />
              <Text type="body" as="div">
                {flash.error}
              </Text>
            </Stack>
          </Card>
        ) : null}

        {children}
      </Stack>
    </AppShell>
  )
}
