import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Selector } from '@astryxdesign/core/Selector'

interface BulkActionsBarProps {
  selectedIds: string[]
  resource: 'orders' | 'shipments'
  statusOptions: Array<{ label: string; value: string }>
  onClearSelection: () => void
}

/**
 * Floating bottom bar for bulk operations on selected items.
 * Appears only when one or more items are selected.
 * Provides status update, export, and clear-selection actions.
 */
export function BulkActionsBar({
  selectedIds,
  resource,
  statusOptions,
  onClearSelection,
}: BulkActionsBarProps) {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleBulkStatusUpdate = () => {
    if (!selectedStatus) return
    setProcessing(true)
    router.post(
      `/${resource}/bulk/status`,
      { ids: selectedIds, status: selectedStatus },
      {
        onSuccess: () => {
          setProcessing(false)
          onClearSelection()
        },
        onError: () => setProcessing(false),
      }
    )
  }

  const handleBulkExport = () => {
    setProcessing(true)
    router.post(
      `/${resource}/bulk/export`,
      { ids: selectedIds },
      {
        onSuccess: () => {
          setProcessing(false)
          onClearSelection()
        },
        onError: () => setProcessing(false),
      }
    )
  }

  if (selectedIds.length === 0) return null

  return (
    <Stack
      align="center"
      className="bulk-bar-fixed bulk-bar-enter"
    >
      <Card padding={4} elevation="high" width={480}>
        <Stack direction="horizontal" align="center" gap={4} wrap="wrap">
          <Stack direction="horizontal" align="center" gap={3}>
            <Badge variant="info" label={String(selectedIds.length)} />
            <Stack gap={0}>
              <Text type="label" weight="semibold">
                {selectedIds.length} {resource} selected
              </Text>
              <Text type="supporting">
                Perform bulk operations
              </Text>
            </Stack>
          </Stack>

          <Stack direction="horizontal" gap={2} align="center">
            <Selector
              label="Status"
              isLabelHidden
              value={selectedStatus}
              onChange={(v: string | null) => setSelectedStatus(v ?? '')}
              options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
              placeholder="Set status…"
              size="sm"
              width={150}
            />
            <Button
              label="Apply"
              variant="secondary"
              size="sm"
              onClick={handleBulkStatusUpdate}
              isDisabled={processing || !selectedStatus}
            />
            <Button
              label="Export"
              variant="secondary"
              size="sm"
              onClick={handleBulkExport}
              isDisabled={processing}
            />
            <Button
              label="Clear"
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            />
          </Stack>
        </Stack>
      </Card>
    </Stack>
  )
}
