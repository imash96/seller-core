import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'

interface PaginationMeta {
  currentPage: number
  lastPage: number
  total: number
  perPage: number
}

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

/**
 * Pagination controls with previous/next buttons and page info.
 * Hides when there's only one page.
 */
export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.lastPage <= 1) return null

  return (
    <Stack direction="horizontal" align="center" justify="space-between" padding={4}>
      <Text type="supporting" as="span">
        Page {meta.currentPage} of {meta.lastPage} ({meta.total} total)
      </Text>
      <Stack direction="horizontal" gap={2}>
        <Button
          label="Previous"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(meta.currentPage - 1)}
          isDisabled={meta.currentPage <= 1}
        />
        <Button
          label="Next"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(meta.currentPage + 1)}
          isDisabled={meta.currentPage >= meta.lastPage}
        />
      </Stack>
    </Stack>
  )
}
