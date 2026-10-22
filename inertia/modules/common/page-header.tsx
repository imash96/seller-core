import { type ReactNode } from 'react'
import { Stack, StackItem } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

/**
 * Standardized page header with title, optional description, and action buttons.
 * Use at the top of every page for visual consistency.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Stack direction="horizontal" align="center" wrap="wrap" gap={3}>
      <StackItem size="fill">
        <Stack gap={1}>
          <Heading level={1} type="display-2" weight="bold">
            {title}
          </Heading>
          {description && (
            <Text type="supporting" as="p">
              {description}
            </Text>
          )}
        </Stack>
      </StackItem>
      {actions && (
        <Stack direction="horizontal" gap={2} align="center">
          {actions}
        </Stack>
      )}
    </Stack>
  )
}
