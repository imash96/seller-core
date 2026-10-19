import { type ReactElement } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'

/** Marketing shell: top brand bar + centered content column. */
export default function MarketingLayout({ children }: { children: ReactElement }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--astryx-color-background-wash, #f0f2f5)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 1080,
          margin: '0 auto',
          padding: '16px 24px',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Text type="label" weight="bold">
            Seller Core
          </Text>
        </Link>
        <Link href="/login">
          <Button label="Sign in" variant="secondary" size="sm" />
        </Link>
      </div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 48px' }}>
        <Stack gap={4}>{children}</Stack>
      </div>
    </div>
  )
}
