import { type ReactElement } from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Link } from '@adonisjs/inertia/react'
import { useFlashToasts } from '~/lib/toast'
import { Box } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'

export default function AuthLayout({ title, children }: { title: string; children: ReactElement }) {
  useFlashToasts()
  return (
    <Stack align="center" justify="center" padding={6} minHeight="100vh">
      <Card padding={6} width={420}>
        <Stack gap={5}>
          <Stack gap={3} align="center">
            <Link href="/" className="unstyled-link">
              <Stack direction="horizontal" gap={2} align="center">
                <Icon icon={Box} size="lg" />
                <Text type="display-2" as="span" weight="bold">
                  Seller Core
                </Text>
              </Stack>
            </Link>
            <Text type="display-3" as="h1" weight="bold">
              {title}
            </Text>
          </Stack>
          {children}
        </Stack>
      </Card>
    </Stack>
  )
}
