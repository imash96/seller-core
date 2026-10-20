import { Link } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card padding={6} width={420}>
        <Stack gap={3}>
          <Badge variant="warning" label="Error 404" />
          <Text type="display-2" as="h1" weight="bold">
            Page not found
          </Text>
          <Text type="body" as="p">
            The route you tried to reach doesn&apos;t exist. Check the URL or head back to the
            dashboard.
          </Text>
          <Link href="/dashboard">
            <Button label="Go to dashboard" variant="primary" />
          </Link>
        </Stack>
      </Card>
    </div>
  )
}
