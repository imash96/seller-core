import { type ReactElement } from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

/** Settings shell: narrow column with a page title above the content. */
export default function SettingsLayout({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactElement
}) {
  return (
    <Stack gap={4} padding={4} width="100%" maxWidth={760}>
      <Stack gap={1}>
        <Text type="display-3" as="h1" weight="bold">
          {title}
        </Text>
        {description ? (
          <Text type="supporting" as="div">
            {description}
          </Text>
        ) : null}
      </Stack>
      {children}
    </Stack>
  )
}
