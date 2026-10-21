import { type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { AppShell } from '@astryxdesign/core/AppShell'
import { TopNav } from '@astryxdesign/core/TopNav'
import { SideNav, SideNavSection, SideNavItem } from '@astryxdesign/core/SideNav'
import { Button } from '@astryxdesign/core/Button'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Avatar } from '@astryxdesign/core/Avatar'
import { Divider } from '@astryxdesign/core/Divider'
import { NAVIGATION } from '~/lib/constants'
import { FlashMessages } from '~/components/flash-messages'
import { BreadcrumbNav } from '~/components/breadcrumb-nav'
import { LogOut } from 'lucide-react'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { props, url } = usePage<Data.SharedProps>()
  const user = props.user
  const currentPath = url.split('?')[0] ?? '/'

  /**
   * Determine if a nav item is currently active based on the URL.
   * Dashboard matches only exact '/dashboard', other routes match prefix.
   */
  function isItemActive(href: string): boolean {
    if (href === '/dashboard') return currentPath === '/dashboard' || currentPath === '/'
    return currentPath === href || currentPath.startsWith(href + '/')
  }

  return (
    <AppShell
      contentPadding={4}
      height="fill"
      variant="elevated"
      topNav={
        <TopNav
          label="Application top navigation"
          heading={
            <Link href="/dashboard" className="unstyled-link">
              <Stack direction="horizontal" gap={2} align="center">
                <Text type="display-3" as="span" weight="bold">
                  Seller Core
                </Text>
              </Stack>
            </Link>
          }
          endContent={
            <Stack direction="horizontal" align="center" gap={3}>
              {user && (
                <Stack direction="horizontal" align="center" gap={2}>
                  <Avatar
                    name={user.fullName ?? '?'}
                    size="sm"
                  />
                  <Text type="body" as="span" weight="medium">
                    {user.fullName}
                  </Text>
                </Stack>
              )}
              <Form action="/logout" method="post">
                {({ processing }) => (
                  <Button
                    label="Sign out"
                    icon={<LogOut />}
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
          header={<Text type="label" as="div" weight="bold">Workspace</Text>}
          collapsible={{ defaultIsCollapsed: false, hasButton: true }}
        >
          {NAVIGATION.map((section) => (
            <SideNavSection key={section.title} title={section.title}>
              {section.items.map((item) => (
                <SideNavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  icon={item.icon}
                  isSelected={isItemActive(item.href)}
                  endContent={
                    item.badge ? (
                      <Text type="supporting" as="span" weight="semibold">
                        {item.badge}
                      </Text>
                    ) : undefined
                  }
                />
              ))}
            </SideNavSection>
          ))}
        </SideNav>
      }
    >
      <FlashMessages />

      <Stack gap={4}>
        <BreadcrumbNav />

        {children}
      </Stack>
    </AppShell>
  )
}
