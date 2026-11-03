import { Text } from '@astryxdesign/core/Text'
import { Stack } from '@astryxdesign/core/Stack'
import {
  PageHeader,
  PageSection,
  StatusBadge,
  ResponsiveDataView,
  TopStatusBar,
  SlideOverDrawer,
  AppButton,
  col,
  type Row,
  short,
  displayValue,
} from '~/lib/ui'
import { useState } from 'react'
import { ScrollText, ShieldCheck, Lock, PlusCircle, RefreshCw, Trash2, Eye } from 'lucide-react'

type Props = { auditLogs: Row[] }

export default function Audit({ auditLogs }: Props) {
  const [inspectRow, setInspectRow] = useState<Row | null>(null)

  const inserts = auditLogs.filter((r) => String(r.action) === 'INSERT').length
  const updates = auditLogs.filter((r) => String(r.action) === 'UPDATE').length
  const deletes = auditLogs.filter((r) => String(r.action) === 'DELETE').length

  return (
    <Stack gap={6}>
      <PageHeader
        title="Tamper-Evident Audit History"
        description="Append-only trail capturing inserts, updates, deletes, and RBAC events with SHA-256 checksums. Database triggers reject any UPDATE or DELETE on audit_logs."
        icon={ScrollText}
        eyebrow={<StatusBadge variant="info" label="Read-only · SHA-256 Checksummed" />}
        meta={
          <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
            <StatusBadge variant="success" label={`${inserts} inserts`} />
            <StatusBadge variant="info" label={`${updates} updates`} />
            <StatusBadge variant="error" label={`${deletes} deletes`} />
          </Stack>
        }
      />

      <TopStatusBar
        columns={4}
        items={[
          {
            id: 'total-audit',
            label: 'Total Audit Events',
            value: auditLogs.length,
            hint: 'Append-only trigger-enforced',
            icon: ScrollText,
            tone: 'primary',
          },
          {
            id: 'inserts',
            label: 'INSERT Mutations',
            value: inserts,
            hint: 'New records created',
            icon: PlusCircle,
            tone: 'success',
          },
          {
            id: 'updates',
            label: 'UPDATE Mutations',
            value: updates,
            hint: 'Before/After JSONB snapshots',
            icon: RefreshCw,
            tone: 'info',
          },
          {
            id: 'deletes',
            label: 'DELETE / RBAC Events',
            value: deletes,
            hint: 'SHA-256 digest verified',
            icon: Trash2,
            tone: deletes > 0 ? 'warning' : 'neutral',
          },
        ]}
      />

      <Stack
        direction="horizontal"
        align="center"
        wrap="wrap"
        gap={2}
        padding={4}
        className="rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <Text color="primary" weight="semibold">
          How it works:
        </Text>
        <StatusBadge variant="neutral" label="Database trigger writes audit_logs" />
        <StatusBadge variant="neutral" label="Before/After JSONB → SHA-256 checksum → Append" />
        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
      </Stack>

      <PageSection
        title="Audit Trail"
        description="Every mutation in Seller Core — orders, catalog, entitlements, and Bouncer checks — is recorded below. Click Inspect on any row to view Before/After JSON snapshots."
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
              actions: (
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Eye}
                  onClick={() => setInspectRow(row)}
                >
                  Inspect Diff
                </AppButton>
              ),
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
            col.text('user', 'Owner', 150),
            col.text('actor', 'Actor', 150),
            col.text('checksum', 'Checksum', 130),
            col.date('createdAt', 'When'),
            col.action('Snapshot', (row) => (
              <AppButton
                variant="secondary"
                size="xs"
                icon={Eye}
                onClick={() => setInspectRow(row)}
              >
                Inspect
              </AppButton>
            )),
          ]}
        />
      </PageSection>

      <SlideOverDrawer
        open={!!inspectRow}
        onClose={() => setInspectRow(null)}
        title={`Audit Event: ${String(inspectRow?.action ?? '')}`}
        subtitle={`Entity: ${String(inspectRow?.entityType ?? '')} (${String(inspectRow?.entityId ?? '')})`}
        badge={
          inspectRow && (
            <StatusBadge
              variant={
                inspectRow.action === 'INSERT'
                  ? 'success'
                  : inspectRow.action === 'DELETE'
                    ? 'error'
                    : 'info'
              }
              label={String(inspectRow.action)}
            />
          )
        }
        width="xl"
        footer={
          <Stack direction="horizontal" justify="end">
            <AppButton variant="secondary" size="sm" onClick={() => setInspectRow(null)}>
              Close
            </AppButton>
          </Stack>
        }
      >
        {inspectRow && (
          <Stack gap={4}>
            <div className="grid grid-cols-1 sm:grid-cols-2 text-xs gap-3.5">
              <Stack padding={3} className="rounded-xl border border-border bg-muted/20">
                <Text color="secondary" className="block">
                  SHA-256 Checksum
                </Text>
                <code className="font-mono text-foreground break-all">
                  {String(inspectRow.checksum ?? '—')}
                </code>
              </Stack>
              <Stack padding={3} className="rounded-xl border border-border bg-muted/20">
                <Text color="secondary" className="block">
                  Timestamp
                </Text>
                <Text color="primary" weight="semibold">
                  {inspectRow.createdAt
                    ? new Date(String(inspectRow.createdAt)).toLocaleString()
                    : '—'}
                </Text>
              </Stack>
            </div>

            <Stack gap={1.5}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Before State (JSONB)
              </h4>
              <pre className="p-3.5 rounded-xl border border-border bg-muted/30 font-mono text-xs overflow-x-auto text-foreground">
                {JSON.stringify(inspectRow.beforeState ?? inspectRow.before_state ?? null, null, 2)}
              </pre>
            </Stack>

            <Stack gap={1.5}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                After State (JSONB)
              </h4>
              <pre className="p-3.5 rounded-xl border border-border bg-muted/30 font-mono text-xs overflow-x-auto text-foreground">
                {JSON.stringify(inspectRow.afterState ?? inspectRow.after_state ?? null, null, 2)}
              </pre>
            </Stack>

            <Stack gap={1.5}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Audit Metadata
              </h4>
              <pre className="p-3.5 rounded-xl border border-border bg-muted/30 font-mono text-xs overflow-x-auto text-foreground">
                {JSON.stringify(inspectRow.metadata ?? {}, null, 2)}
              </pre>
            </Stack>
          </Stack>
        )}
      </SlideOverDrawer>
    </Stack>
  )
}
