import { type ReactNode } from 'react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

interface KeyValueProps {
  label: string
  value?: ReactNode
  muted?: boolean
}

/**
 * Horizontal label-value display pair for detail views.
 * Returns null when value is empty/undefined.
 */
export function KeyValue({ label, value, muted = false }: KeyValueProps) {
  if (value === undefined || value === null || value === '') return null

  return (
    <Stack direction="horizontal" align="center" justify="space-between" gap={3}>
      <Text type="supporting" as="span">
        {label}
      </Text>
      <Text
        type="body"
        as="span"
        weight="medium"
        color={muted ? 'secondary' : undefined}
        align="end"
      >
        {value}
      </Text>
    </Stack>
  )
}

interface MetaProps {
  label: string
  value?: string | number | null
  muted?: boolean
}

/**
 * Vertical label-value display for compact metadata grids.
 * Returns null when value is empty/undefined.
 */
export function Meta({ label, value, muted = false }: MetaProps) {
  if (value === undefined || value === null || value === '') return null

  return (
    <Stack gap={0}>
      <Text type="supporting" as="dt" size="2xs" className="meta-label">
        {label}
      </Text>
      <Text type="body" as="dd" weight="medium" color={muted ? 'secondary' : undefined}>
        {value}
      </Text>
    </Stack>
  )
}
