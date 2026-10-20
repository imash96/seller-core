import { Link } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'

export default function ServerError() {
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
          <Badge variant="error" label="Error 500" />
          <Text type="display-2" as="h1" weight="bold">
            Something broke
          </Text>
          <Text type="body" as="p">
            The server hit an unexpected error. Try again in a moment — if it persists, check the
            server logs for the underlying exception.
          </Text>
          <Link href="/dashboard">
            <Button label="Back to dashboard" variant="primary" />
          </Link>
        </Stack>
      </Card>
    </div>
  )
}
