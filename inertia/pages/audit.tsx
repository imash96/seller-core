import {
  PageHeader,
  PageSection,
  StatStrip,
  StatusBadge,
  ResponsiveDataView,
  col,
  type Row,
  short,
  displayValue,
} from '~/lib/ui'
import { ScrollText, ShieldCheck, Lock } from 'lucide-react'

type Props = { auditLogs: Row[] }

export default function Audit({ auditLogs }: Props) {
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

      <StatStrip
        items={[
          { label: 'Total Events', value: String(auditLogs.length) },
          { label: 'INSERT', value: String(inserts) },
          { label: 'UPDATE', value: String(updates) },
          { label: 'DELETE', value: String(deletes) },
          { label: 'Integrity', value: 'SHA-256', hint: 'per-row digest' },
          { label: 'Mutability', value: 'Append-Only', hint: 'trigger-enforced' },
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
        description="Every mutation in Seller Core — orders, catalog, entitlements, and Bouncer checks — is recorded below."
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
            col.text('entityType', 'Entity type', 140),
            col.id('entityId', 'Entity ID'),
            col.text('user', 'Owner', 150),
            col.text('actor', 'Actor', 150),
            col.text('checksum', 'Checksum', 130),
            col.date('createdAt', 'When'),
            col.action('Changed fields', (row) => {
              const meta = (row.metadata ?? {}) as { changed_fields?: string[] }
              const fields = meta.changed_fields ?? []
              return (
                <span className="text-xs text-muted-foreground">
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
      </PageSection>
    </div>
  )
}
