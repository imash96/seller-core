import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Badge } from '@astryxdesign/core/Badge'
import { Divider } from '@astryxdesign/core/Divider'
import AppLayout from '~/layouts/app'
import {
  PageHeader,
  StatStrip,
  ResponsiveDataView,
  col,
  type Row,
  short,
  displayValue,
} from '~/lib/ui'
import { ShieldCheck, Lock } from 'lucide-react'

type Props = { auditLogs: Row[] }

Audit.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

export default function Audit({ auditLogs }: Props) {
  const inserts = auditLogs.filter((r) => String(r.action) === 'INSERT').length
  const updates = auditLogs.filter((r) => String(r.action) === 'UPDATE').length
  const deletes = auditLogs.filter((r) => String(r.action) === 'DELETE').length

  return (
    <Stack gap={4}>
      <PageHeader
        title="Audit history"
        description="Append-only, tamper-evident trail: inserts/updates/deletes on business tables are captured with SHA-256 checksums. Updates or deletes on this table are rejected by trigger. Visible to every authenticated user; mutations still gated by Bouncer."
        eyebrow={<Badge variant="info" label="Read-only · checksummed" />}
        meta={
          <Stack direction="horizontal" gap={2} wrap="wrap">
            <Badge variant="success" label={`${inserts} inserts`} />
            <Badge variant="info" label={`${updates} updates`} />
            <Badge variant="error" label={`${deletes} deletes`} />
          </Stack>
        }
      />

      <StatStrip
        items={[
          { label: 'Total events', value: String(auditLogs.length) },
          { label: 'INSERT', value: String(inserts) },
          { label: 'UPDATE', value: String(updates) },
          { label: 'DELETE', value: String(deletes) },
          { label: 'Integrity', value: 'SHA-256', hint: 'per-row checksums' },
        ]}
      />

      <Card padding={4} variant="muted">
        <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
          <ShieldCheck size={16} color="#059669" />
          <Text type="label" as="span" weight="semibold">
            How it works
          </Text>
          <Badge variant="neutral" label="Database trigger writes audit_logs" />
          <Badge variant="neutral" label="Before row → checksum → append" />
          <Lock size={14} />
        </Stack>
      </Card>

      <Card padding={5}>
        <Stack gap={4}>
          <Stack direction="horizontal" gap={2} align="center">
            <Text type="label" as="div" weight="semibold">
              Audit trail
            </Text>
            <Badge variant="neutral" label={`${auditLogs.length} records`} />
          </Stack>
          <Text type="supporting" as="div">
            Every action in Seller Core — orders, catalog, entitlements, Bouncer denials — is
            recorded here. Filters help isolate inserts for a specific entity type.
          </Text>
          <Divider />
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
              col.text('entityType', 'Entity type', 140),
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
                    {fields.length
                      ? fields.join(', ')
                      : row.action === 'INSERT'
                        ? 'new record'
                        : '—'}
                  </span>
                )
              }),
            ]}
          />
        </Stack>
      </Card>
    </Stack>
  )
}
