import { type ReactElement } from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'

/** Centered single-card shell for authentication screens. */
export default function AuthLayout({ title, children }: { title: string; children: ReactElement }) {
  return (
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
      <Card padding={6} width={420}>
        <Stack gap={4}>
          <Text type="display-2" as="h1" weight="bold">
            {title}
          </Text>
          {children}
        </Stack>
      </Card>
    </div>
  )
}
