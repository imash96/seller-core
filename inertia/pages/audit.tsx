import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import AppLayout from '~/layouts/app'
import { PageSection, ResponsiveDataView, col, type Row, short, displayValue } from '~/lib/ui'

type Props = { auditLogs: Row[] }

Audit.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

export default function Audit({ auditLogs }: Props) {
  return (
    <Stack gap={4}>
      <PageSection
        title="Audit history"
        description="Append-only, tamper-evident trail: every INSERT/UPDATE/DELETE on business tables is captured with SHA-256 checksums. Updates and deletes on this table are rejected by trigger."
      >
        <ResponsiveDataView
          rows={auditLogs}
          searchKeys={['action', 'entityType', 'entityId']}
          filterKey="action"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'INSERT', label: 'INSERT' },
            { value: 'UPDATE', label: 'UPDATE' },
            { value: 'DELETE', label: 'DELETE' },
          ]}
          toCard={(row) => {
            const actor = displayValue(row.actor)
            const owner = displayValue(row.user)
            return {
              title: String(row.action),
              idBadge: short(row.entityId),
              statusBadge: { label: String(row.entityType), variant: 'neutral' },
              metrics: [
                { label: 'Owner', value: owner },
                { label: 'Actor', value: actor },
                { label: 'Checksum', value: String(row.checksum ?? '—').slice(0, 12) + '…' },
                {
                  label: 'When',
                  value: row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—',
                },
              ],
            }
          }}
          columns={[
            col.badge('action', 'Action', {
              'INSERT': 'success',
              'UPDATE': 'info',
              'DELETE': 'error',
              'rbac.role_assigned': 'info',
              'rbac.role_revoked': 'warning',
              'customer.risk_level_changed': 'warning',
            }),
            col.text('entityType', 'Entity type', 130),
            col.id('entityId', 'Entity ID'),
            col.text('user', 'Owner', 140),
            col.text('actor', 'Actor', 140),
            col.text('checksum', 'Checksum', 130),
            col.date('createdAt', 'When'),
            col.action('Changed fields', (row) => {
              const meta = (row.metadata ?? {}) as { changed_fields?: string[] }
              const fields = meta.changed_fields ?? []
              return (
                <span style={{ fontSize: 12 }}>
                  {fields.length ? fields.join(', ') : row.action === 'INSERT' ? 'new record' : '—'}
                </span>
              )
            }),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
