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
    <div className="space-y-6">
      <PageHeader
        title="Tamper-Evident Audit History"
        description="Append-only trail capturing inserts, updates, deletes, and RBAC events with SHA-256 checksums. Database triggers reject any UPDATE or DELETE on audit_logs."
        icon={ScrollText}
        eyebrow={<StatusBadge variant="info" label="Read-only · SHA-256 Checksummed" />}
        meta={
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge variant="success" label={`${inserts} inserts`} />
            <StatusBadge variant="info" label={`${updates} updates`} />
            <StatusBadge variant="error" label={`${deletes} deletes`} />
          </div>
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

      <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center gap-2.5 flex-wrap text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-semibold text-foreground">How it works:</span>
        <StatusBadge variant="neutral" label="Database trigger writes audit_logs" />
        <StatusBadge variant="neutral" label="Before/After JSONB → SHA-256 checksum → Append" />
        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

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
          <div className="flex justify-end">
            <AppButton variant="secondary" size="sm" onClick={() => setInspectRow(null)}>
              Close
            </AppButton>
          </div>
        }
      >
        {inspectRow && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <span className="text-muted-foreground block">SHA-256 Checksum</span>
                <code className="font-mono text-foreground break-all">
                  {String(inspectRow.checksum ?? '—')}
                </code>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <span className="text-muted-foreground block">Timestamp</span>
                <span className="font-semibold text-foreground">
                  {inspectRow.createdAt
                    ? new Date(String(inspectRow.createdAt)).toLocaleString()
                    : '—'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Before State (JSONB)
              </h4>
              <pre className="p-3.5 rounded-xl border border-border bg-muted/30 font-mono text-xs overflow-x-auto text-foreground">
                {JSON.stringify(inspectRow.beforeState ?? inspectRow.before_state ?? null, null, 2)}
              </pre>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                After State (JSONB)
              </h4>
              <pre className="p-3.5 rounded-xl border border-border bg-muted/30 font-mono text-xs overflow-x-auto text-foreground">
                {JSON.stringify(inspectRow.afterState ?? inspectRow.after_state ?? null, null, 2)}
              </pre>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Audit Metadata
              </h4>
              <pre className="p-3.5 rounded-xl border border-border bg-muted/30 font-mono text-xs overflow-x-auto text-foreground">
                {JSON.stringify(inspectRow.metadata ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  )
}
