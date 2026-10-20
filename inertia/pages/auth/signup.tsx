import { Link } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from '~/astryx_themes'

export default function SignupDisabled() {
  return (
    <Theme theme={themes[defaultThemeSlug]}>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--astryx-color-background-wash, #f0f2f5)',
          padding: 24,
        }}
      >
        <Card padding={6} width={440}>
          <Stack gap={4}>
            <Badge variant="error" label="Registration disabled" />
            <Text type="display-2" as="h1" weight="bold">
              Public sign-up is disabled
            </Text>
            <Text type="body" as="p">
              For security, Seller Core has no public registration. User accounts can only be
              provisioned by a system super administrator. If you need access, contact your
              administrator.
            </Text>
            <Link href="/login">
              <Button label="Go to sign in" variant="primary" />
            </Link>
          </Stack>
        </Card>
      </div>
    </Theme>
  )
}
