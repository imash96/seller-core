import { type ReactNode, useState, useCallback } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Popover } from '@astryxdesign/core/Popover'
import { useMemo } from 'react'

interface ListPageHeaderProps {
  /** The base resource URL (e.g. "/orders") used for search queries */
  resource: string
  title?: string
  description?: string
  searchPlaceholder?: string
  showCreate?: boolean
  createLabel?: string
  onCreate?: () => void
  onExport?: () => void
  /** Right-side extra actions (rendered after built-in buttons) */
  actions?: ReactNode
  /** Keys to reload on refresh */
  reloadKeys?: string[]
  /** Filter/sort controls rendered inside a popover. */
  filters?: ReactNode
  /** Label for the filter toggle button (default: "Filters"). */
  filterLabel?: string
  /** Count of active filters to show as a badge on the filter button. */
  activeFilterCount?: number
  children?: ReactNode
}

/**
 * Combined header for list/table pages with search, refresh, filter toggle,
 * create button, and export — all in one consistent bar.
 */
export function ListPageHeader({
  resource,
  title,
  description,
  searchPlaceholder = 'Search…',
  showCreate = true,
  createLabel = 'New',
  onCreate,
  onExport,
  actions,
  reloadKeys = [],
  filters,
  filterLabel = 'Filters',
  activeFilterCount,
  children,
}: ListPageHeaderProps) {
  const { url } = usePage()

  const query = useMemo(() => {
    const params = new URLSearchParams(url.split('?')[1])
    return { search: params.get('search') || '' }
  }, [url])

  const [searchTerm, setSearchTerm] = useState(query.search)
  const [refreshing, setRefreshing] = useState(false)

  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value)
      // Debounced search on Enter or clear
      if (value === '' || value.length >= 2) {
        router.get(
          resource,
          { search: value || undefined, page: 1 },
          { preserveState: true, preserveScroll: true, replace: true }
        )
      }
    },
    [resource]
  )

  const handleSearchSubmit = useCallback(() => {
    router.get(
      resource,
      { search: searchTerm || undefined, page: 1 },
      { preserveState: true, preserveScroll: true, replace: true }
    )
  }, [resource, searchTerm])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    router.reload({ only: reloadKeys.length ? reloadKeys : undefined })
    setTimeout(() => setRefreshing(false), 500)
  }, [reloadKeys])

  const filterButton = filters ? (
    <Popover
      label={filterLabel}
      placement="below"
      alignment="end"
      padding={4}
      width={320}
      content={
        <Stack gap={3}>
          {filters}
        </Stack>
      }
    >
      <Button
        label={
          activeFilterCount
            ? `${filterLabel} (${activeFilterCount})`
            : filterLabel
        }
        variant="secondary"
        size="sm"
      />
    </Popover>
  ) : null

  return (
    <Card padding={0}>
      <Stack gap={0}>
        <Stack gap={3} padding={4}>
          {(title || description) && (
            <Stack gap={1}>
              {title && (
                <Text type="display-3" as="h2" weight="bold">
                  {title}
                </Text>
              )}
              {description && (
                <Text type="supporting" as="p">
                  {description}
                </Text>
              )}
            </Stack>
          )}

          <Stack direction="horizontal" gap={3} align="end" wrap="wrap">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSearchSubmit()
              }}
              className="search-form"
            >
              <TextInput
                label="Search"
                isLabelHidden
                value={searchTerm}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                width="100%"
              />
            </form>

            <Stack direction="horizontal" gap={2} align="center">
              <Button
                label="Refresh"
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                isDisabled={refreshing}
              />

              {filterButton}

              {onExport && (
                <Button
                  label="Export"
                  variant="secondary"
                  size="sm"
                  onClick={onExport}
                />
              )}

              {showCreate && onCreate && (
                <Button
                  label={createLabel}
                  variant="primary"
                  size="sm"
                  onClick={onCreate}
                />
              )}

              {actions}
            </Stack>
          </Stack>
        </Stack>

        {children}
      </Stack>
    </Card>
  )
}

