import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * Centered empty state placeholder with optional CTA button.
 * Used when a list or table has no data to display.
 */
export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Stack gap={3} align="center" padding={6}>
      <Text type="display-3" as="h3" weight="semibold">
        {title}
      </Text>
      <Stack maxWidth={360}>
        <Text type="body" as="p" color="secondary" justify="center">
          {description}
        </Text>
      </Stack>
      {actionLabel && onAction && (
        <Button label={actionLabel} variant="primary" onClick={onAction} />
      )}
    </Stack>
  )
}

/**
 * Error state with retry button.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <Stack gap={3} align="center" padding={6}>
      <Text type="display-3" as="h3" weight="semibold">
        {title}
      </Text>
      <Stack maxWidth={360}>
        <Text type="body" as="p" color="secondary" justify="center">
          {message}
        </Text>
      </Stack>
      {onRetry && (
        <Button label="Try Again" variant="primary" onClick={onRetry} />
      )}
    </Stack>
  )
}
