import { Button } from '@astryxdesign/core/Button'
import {
  PageHeader,
  PageSection,
  StatStrip,
  StatusBadge,
  ResponsiveDataView,
  FormModal,
  col,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Shield, Users, KeyRound, Layers, X } from 'lucide-react'

type Props = {
  allUsers: Row[]
  allRoles: Row[]
  allPermissions: Row[]
  moduleEntitlements: Row[]
}

const USER_STATUS = ['pending_activation', 'active', 'suspended', 'locked', 'deactivated']

export default function Admin({
  allUsers,
  allRoles,
  allPermissions,
  moduleEntitlements,
}: Props) {
  const [provisionOpen, setProvisionOpen] = useState(false)
  const [editUserRow, setEditUserRow] = useState<Row | null>(null)
  const [assignRoleOpen, setAssignRoleOpen] = useState(false)
  const [inspectRoleRow, setInspectRoleRow] = useState<Row | null>(null)

  const activeCount = allUsers.filter((u) => u.status === 'active').length
  const suspendedCount = allUsers.filter((u) => u.status === 'suspended').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users, RBAC & Module Entitlements"
        description="Provision accounts, assign roles with deny-overrides-allow precedence, and toggle module entitlements. Protected by @adonisjs/bouncer."
        icon={Shield}
        eyebrow={<StatusBadge variant="info" label="Super Admin Governance" />}
        meta={
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge variant="success" label={`${activeCount} active`} />
            <StatusBadge variant="neutral" label={`${allUsers.length} users`} />
            <StatusBadge variant="info" label={`${allRoles.length} roles`} />
          </div>
        }
        actions={
          <>
            <Button
              label="Assign / Revoke Role"
              variant="secondary"
              onClick={() => setAssignRoleOpen(true)}
            />
            <Button
              label="+ Provision User"
              variant="primary"
              onClick={() => setProvisionOpen(true)}
            />
          </>
        }
      />

      <StatStrip
        items={[
          { label: 'Total Users', value: String(allUsers.length) },
          { label: 'Active Users', value: String(activeCount), hint: `${suspendedCount} suspended` },
          { label: 'System Roles', value: String(allRoles.length) },
          { label: 'Permissions', value: String(allPermissions.length) },
          { label: 'Entitlements', value: String(moduleEntitlements.length) },
          { label: 'Authz Engine', value: 'Bouncer v3', hint: 'deny-overrides-allow' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Users className="w-4 h-4 text-primary" />
            <span>Admin-Only Provisioning</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Public registration is disabled. Super Admins provision accounts via{' '}
            <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">
              RbacService.createUserBySuperAdmin
            </code>
            .
          </p>
        </div>

        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <KeyRound className="w-4 h-4 text-primary" />
            <span>Deny-Overrides-Allow RBAC</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Role permissions carry an explicit{' '}
            <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">
              allow / deny
            </code>{' '}
            effect — any explicit deny overrides allow grants across all roles.
          </p>
        </div>

        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Layers className="w-4 h-4 text-primary" />
            <span>Independent Module Entitlements</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Gate entire operational modules per user independently of RBAC roles, with full SHA-256
            audit logging.
          </p>
        </div>
      </div>

      {/* Provision User Modal */}
      <FormModal
        isOpen={provisionOpen}
        onOpenChange={setProvisionOpen}
        title="Provision User Account"
        subtitle="Public registration is disabled — accounts are created exclusively by Super Administrators."
        submitLabel="Create User"
        action="/admin/users"
        fields={[
          { name: 'fullName', label: 'Full name', required: true },
          { name: 'email', label: 'Email address', kind: 'email', required: true },
          { name: 'password', label: 'Initial password (min 8 chars)', kind: 'password', required: true },
          { name: 'phone', label: 'Phone number' },
          {
            name: 'roleSlug',
            label: 'Primary role',
            kind: 'select',
            default: 'operations_manager',
            options: allRoles.map((r) => ({ value: String(r.slug), label: String(r.name) })),
          },
          {
            name: 'isSuperAdmin',
            label: 'Grant Super Admin privileges',
            kind: 'select',
            default: 'false',
            options: [
              { value: 'false', label: 'No (Standard Operator)' },
              { value: 'true', label: 'Yes (System Super Admin)' },
            ],
          },
        ]}
      />

      {/* Edit User Status Modal */}
      <FormModal
        isOpen={!!editUserRow}
        onOpenChange={(o) => {
          if (!o) setEditUserRow(null)
        }}
        title={`Update User Status: ${String(editUserRow?.email ?? '')}`}
        submitLabel="Update Status"
        action={
          editUserRow ? `/admin/users/${editUserRow.id}/status` : '/admin/users/placeholder/status'
        }
        initialValues={{ status: String(editUserRow?.status ?? 'active') }}
        fields={[
          {
            name: 'status',
            label: 'Account status',
            kind: 'select',
            required: true,
            fullWidth: true,
            options: USER_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
        ]}
      />

      {/* Assign / Revoke Role Modal */}
      <FormModal
        isOpen={assignRoleOpen}
        onOpenChange={setAssignRoleOpen}
        title="Assign / Revoke User Role"
        subtitle="Selecting an already-assigned role revokes it; selecting an unassigned role grants it."
        submitLabel="Toggle Role Assignment"
        action="/admin/users"
        actionFor={(v) => `/admin/users/${v.userId}/roles`}
        fields={[
          {
            name: 'userId',
            label: 'Target user',
            kind: 'select',
            required: true,
            fullWidth: true,
            options: allUsers.map((u) => ({
              value: String(u.id),
              label: `${u.fullName} — ${u.email}`,
            })),
          },
          {
            name: 'roleSlug',
            label: 'Role',
            kind: 'select',
            required: true,
            fullWidth: true,
            options: allRoles.map((r) => ({ value: String(r.slug), label: String(r.name) })),
          },
        ]}
      />

      {/* Inspect Role Permissions Modal */}
      {inspectRoleRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setInspectRoleRow(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-xl max-h-[85dvh] flex flex-col rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Role Permissions: {String(inspectRoleRow.name)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  Slug: {String(inspectRoleRow.slug)} ·{' '}
                  {((inspectRoleRow.permissions as Row[]) ?? []).length} permissions attached
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectRoleRow(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-2.5">
              {((inspectRoleRow.permissions as Row[]) ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No permissions attached to this role.</p>
              ) : (
                ((inspectRoleRow.permissions as Row[]) ?? []).map((perm: Row) => (
                  <div
                    key={String(perm.id ?? perm.slug)}
                    className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-foreground">
                        {String(perm.slug)}
                      </span>
                      {perm.description && (
                        <p className="text-muted-foreground mt-0.5">{String(perm.description)}</p>
                      )}
                    </div>
                    <StatusBadge
                      variant="success"
                      label={`${String(perm.resource ?? '*')}:${String(perm.action ?? '*')}`}
                    />
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
              <Button label="Close" variant="secondary" onClick={() => setInspectRoleRow(null)} />
            </div>
          </div>
        </div>
      )}

      <PageSection
        title="Provisioned Users"
        description="Toggle user status, assign roles, or delete accounts (users owning historical orders/transactions are safely suspended instead of hard-deleted)."
      >
        <ResponsiveDataView
          rows={allUsers}
          searchKeys={['fullName', 'email', 'status']}
          filterKey="status"
          filterPills={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'locked', label: 'Locked' },
          ]}
          createLabel="+ Provision User"
          onCreateClick={() => setProvisionOpen(true)}
          toCard={(row) => ({
            title: String(row.fullName),
            idBadge: String(row.email),
            statusBadge: {
              label: String(row.status).replace(/_/g, ' '),
              variant:
                row.status === 'active'
                  ? 'success'
                  : row.status === 'suspended' || row.status === 'locked'
                    ? 'error'
                    : row.status === 'pending_activation'
                      ? 'warning'
                      : 'neutral',
            },
            metrics: [
              {
                label: 'Super admin',
                value:
                  String(row.isSuperAdmin) === 'true' || row.isSuperAdmin === true ? 'Yes' : 'No',
              },
              {
                label: 'Assigned roles',
                value:
                  ((row.roles as Row[]) ?? []).map((r) => r.slug).join(', ') ||
                  String(((row.roles as Row[]) ?? []).length),
              },
              {
                label: 'Created',
                value: row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '—',
              },
            ],
            actions: (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  label="Edit Status"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditUserRow(row)}
                />
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete ${row.email}? If they own orders or ledger entries, they will be suspended instead.`
                      )
                    ) {
                      router.post(`/admin/users/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
              </div>
            ),
          })}
          columns={[
            col.text('fullName', 'Name', 160),
            col.text('email', 'Email', 210),
            col.badge('status', 'Status', {
              active: 'success',
              pending_activation: 'warning',
              suspended: 'error',
              locked: 'error',
              deactivated: 'neutral',
            }),
            col.text('isSuperAdmin', 'Super Admin', 110),
            col.action('Actions', (row) => (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditUserRow(row)}
                />
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete ${row.email}? If they own orders or ledger entries, they will be suspended instead.`
                      )
                    ) {
                      router.post(`/admin/users/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                />
              </div>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Roles & Permissions"
        description="Inspect role definitions and attached permission grants."
      >
        <ResponsiveDataView
          rows={allRoles}
          searchKeys={['slug', 'name']}
          toCard={(row) => ({
            title: String(row.name),
            idBadge: String(row.slug),
            metrics: [
              { label: 'System Role', value: row.isSystem ? 'Yes' : 'No' },
              { label: 'Permissions', value: String(((row.permissions as Row[]) ?? []).length) },
            ],
            actions: (
              <Button
                label="Inspect Permissions"
                variant="secondary"
                size="sm"
                onClick={() => setInspectRoleRow(row)}
              />
            ),
          })}
          columns={[
            col.text('slug', 'Slug', 160),
            col.text('name', 'Name', 200),
            col.text('isSystem', 'System', 90),
            col.action('Permissions', (row) => (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {((row.permissions as Row[]) ?? []).length} granted
                </span>
                <Button
                  label="Inspect"
                  variant="secondary"
                  size="sm"
                  onClick={() => setInspectRoleRow(row)}
                />
              </div>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Module Entitlements"
        description="Toggle per-module access independently of RBAC roles. Every toggle writes a SHA-256 audit event."
      >
        <ResponsiveDataView
          rows={moduleEntitlements}
          searchKeys={['moduleKey', 'planTier']}
          toCard={(row) => ({
            title: String(row.moduleKey),
            statusBadge: {
              label:
                String(row.isEnabled) === 'true' || row.isEnabled === true ? 'Enabled' : 'Disabled',
              variant:
                String(row.isEnabled) === 'true' || row.isEnabled === true ? 'success' : 'error',
            },
            metrics: [{ label: 'Plan tier', value: String(row.planTier ?? '—') }],
            actions: (
              <Button
                label={
                  String(row.isEnabled) === 'true' || row.isEnabled === true ? 'Disable' : 'Enable'
                }
                variant="secondary"
                size="sm"
                onClick={() => {
                  router.post(`/admin/entitlements/${row.id}/toggle`, {}, { preserveScroll: true })
                }}
              />
            ),
          })}
          columns={[
            col.text('moduleKey', 'Module', 170),
            col.badge('isEnabled', 'Enabled', { true: 'success', false: 'error' }),
            col.text('planTier', 'Plan tier', 120),
            col.action('Toggle', (row) => (
              <Button
                label={row.isEnabled ? 'Disable' : 'Enable'}
                variant="secondary"
                size="sm"
                onClick={() => {
                  router.post(`/admin/entitlements/${row.id}/toggle`, {}, { preserveScroll: true })
                }}
              />
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Permission Catalog"
        description="Granular resource and action capabilities enforced across controllers and Bouncer policies."
      >
        <ResponsiveDataView
          rows={allPermissions}
          searchKeys={['slug', 'resource', 'action']}
          toCard={(row) => ({
            title: String(row.slug),
            metrics: [
              { label: 'Resource', value: String(row.resource) },
              { label: 'Action', value: String(row.action) },
              { label: 'Description', value: String(row.description ?? '—').slice(0, 70) },
            ],
          })}
          columns={[
            col.text('slug', 'Slug', 200),
            col.text('resource', 'Resource', 140),
            col.text('action', 'Action', 110),
            col.text('description', 'Description', 260),
          ]}
        />
      </PageSection>
    </div>
  )
}
