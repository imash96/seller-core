import { type ReactElement } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import { useFlashToasts } from '~/lib/toast'
import { Box } from 'lucide-react'

export default function MarketingLayout({ children }: { children: ReactElement }) {
  useFlashToasts()

  return (
    <Stack gap={0} minHeight="100vh">
      <Stack
        direction="horizontal"
        align="center"
        justify="between"
        maxWidth={1080}
        width="100%"
        padding={4}
        paddingInline={6}
      >
        <Link href="/" className="unstyled-link">
          <Stack direction="horizontal" gap={2} align="center">
            <Icon icon={Box} size="md" />
            <Text type="label" weight="bold">
              Seller Core
            </Text>
          </Stack>
        </Link>
        <Link href="/login">
          <Button label="Sign in" variant="secondary" size="sm" />
        </Link>
      </Stack>
      <Stack gap={4} maxWidth={1080} width="100%" padding={4} paddingInline={6} paddingBlockEnd={10}>
        {children}
      </Stack>
    </Stack>
  )
}
