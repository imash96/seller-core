import { Text } from '@astryxdesign/core/Text'
import { Grid } from '@astryxdesign/core/Grid'
import { Stack } from '@astryxdesign/core/Stack'
import {
  PageHeader,
  PageSection,
  StatusBadge,
  ResponsiveDataView,
  FormModal,
  TopStatusBar,
  SlideOverDrawer,
  AppButton,
  col,
  type Row,
} from '~/lib/ui'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import {
  Shield,
  Users,
  KeyRound,
  Layers,
  UserPlus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
} from 'lucide-react'

type Props = {
  allUsers: Row[]
  allRoles: Row[]
  allPermissions: Row[]
  moduleEntitlements: Row[]
}

const USER_STATUS = ['pending_activation', 'active', 'suspended', 'locked', 'deactivated']

export default function Admin({ allUsers, allRoles, allPermissions, moduleEntitlements }: Props) {
  const [provisionOpen, setProvisionOpen] = useState(false)
  const [editUserRow, setEditUserRow] = useState<Row | null>(null)
  const [assignRoleOpen, setAssignRoleOpen] = useState(false)
  const [inspectRoleRow, setInspectRoleRow] = useState<Row | null>(null)

  const activeCount = allUsers.filter((u) => u.status === 'active').length
  const suspendedCount = allUsers.filter((u) => u.status === 'suspended').length

  return (
    <Stack gap={6}>
      <PageHeader
        title="Users, RBAC & Module Entitlements"
        description="Provision accounts, assign roles with deny-overrides-allow precedence, and toggle module entitlements. Protected by @adonisjs/bouncer."
        icon={Shield}
        eyebrow={<StatusBadge variant="info" label="Super Admin Governance" />}
        meta={
          <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
            <StatusBadge variant="success" label={`${activeCount} active`} />
            <StatusBadge variant="neutral" label={`${allUsers.length} users`} />
            <StatusBadge variant="info" label={`${allRoles.length} roles`} />
          </Stack>
        }
        actions={
          <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
            <AppButton
              variant="secondary"
              size="sm"
              icon={KeyRound}
              onClick={() => setAssignRoleOpen(true)}
            >
              Assign / Revoke Role
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => setProvisionOpen(true)}
            >
              Provision User
            </AppButton>
          </Stack>
        }
      />

      <TopStatusBar
        columns={4}
        items={[
          {
            id: 'total-users',
            label: 'Provisioned Users',
            value: allUsers.length,
            hint: `${activeCount} active · ${suspendedCount} suspended`,
            icon: Users,
            tone: 'primary',
          },
          {
            id: 'system-roles',
            label: 'System Roles',
            value: allRoles.length,
            hint: 'Deny-overrides-allow RBAC',
            icon: KeyRound,
            tone: 'info',
          },
          {
            id: 'permissions-count',
            label: 'Granular Permissions',
            value: allPermissions.length,
            hint: 'Enforced by Bouncer v3',
            icon: Shield,
            tone: 'success',
          },
          {
            id: 'module-entitlements',
            label: 'Module Entitlements',
            value: moduleEntitlements.length,
            hint: 'Per-module feature gates',
            icon: Layers,
            tone: 'warning',
          },
        ]}
      />

      <Grid columns={{ minWidth: 220, max: 1 }} className="md:grid-cols-3">
        <Stack
          gap={2}
          padding={5}
          className="bg-card text-card-foreground border border-border rounded-xl shadow-2xs"
        >
          <Stack
            direction="horizontal"
            align="center"
            gap={2}
            className="text-sm font-bold text-foreground"
          >
            <Users className="w-4 h-4 text-primary" />
            <Text>Admin-Only Provisioning</Text>
          </Stack>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Public registration is disabled. Super Admins provision accounts via{' '}
            <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">
              RbacService.createUserBySuperAdmin
            </code>
            .
          </p>
        </Stack>

        <Stack
          gap={2}
          padding={5}
          className="bg-card text-card-foreground border border-border rounded-xl shadow-2xs"
        >
          <Stack
            direction="horizontal"
            align="center"
            gap={2}
            className="text-sm font-bold text-foreground"
          >
            <KeyRound className="w-4 h-4 text-primary" />
            <Text>Deny-Overrides-Allow RBAC</Text>
          </Stack>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Role permissions carry an explicit{' '}
            <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">
              allow / deny
            </code>{' '}
            effect — any explicit deny overrides allow grants across all roles.
          </p>
        </Stack>

        <Stack
          gap={2}
          padding={5}
          className="bg-card text-card-foreground border border-border rounded-xl shadow-2xs"
        >
          <Stack
            direction="horizontal"
            align="center"
            gap={2}
            className="text-sm font-bold text-foreground"
          >
            <Layers className="w-4 h-4 text-primary" />
            <Text>Independent Module Entitlements</Text>
          </Stack>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Gate entire operational modules per user independently of RBAC roles, with full SHA-256
            audit logging.
          </p>
        </Stack>
      </Grid>

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
          {
            name: 'password',
            label: 'Initial password (min 8 chars)',
            kind: 'password',
            required: true,
          },
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

      {/* SlideOverDrawer for Role Permissions */}
      <SlideOverDrawer
        open={!!inspectRoleRow}
        onClose={() => setInspectRoleRow(null)}
        title={`Role Permissions: ${String(inspectRoleRow?.name ?? '')}`}
        subtitle={`Slug: ${String(inspectRoleRow?.slug ?? '')} · ${((inspectRoleRow?.permissions as Row[]) ?? []).length} permissions attached`}
        width="lg"
        footer={
          <Stack direction="horizontal" justify="end">
            <AppButton variant="secondary" size="sm" onClick={() => setInspectRoleRow(null)}>
              Close
            </AppButton>
          </Stack>
        }
      >
        {inspectRoleRow && (
          <Stack gap={2}>
            {((inspectRoleRow.permissions as Row[]) ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">No permissions attached to this role.</p>
            ) : (
              ((inspectRoleRow.permissions as Row[]) ?? []).map((perm: Row) => (
                <Stack
                  direction="horizontal"
                  align="center"
                  justify="between"
                  gap={3}
                  padding={3}
                  key={String(perm.id ?? perm.slug)}
                  className="rounded-xl border border-border bg-muted/20 text-xs"
                >
                  <Stack>
                    <Text color="primary" weight="bold" className="font-mono">
                      {String(perm.slug)}
                    </Text>
                    {perm.description && (
                      <p className="text-muted-foreground mt-0.5">{String(perm.description)}</p>
                    )}
                  </Stack>
                  <StatusBadge
                    variant="success"
                    label={`${String(perm.resource ?? '*')}:${String(perm.action ?? '*')}`}
                  />
                </Stack>
              ))
            )}
          </Stack>
        )}
      </SlideOverDrawer>

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
              <Stack direction="horizontal" align="center" wrap="wrap" gap={2}>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditUserRow(row)}
                >
                  Edit Status
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete ${row.email}? If they own orders or ledger entries, they will be suspended instead.`
                      )
                    ) {
                      router.post(`/admin/users/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                >
                  Delete
                </AppButton>
              </Stack>
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
              <Stack direction="horizontal" align="center" wrap="wrap" gap={1.5}>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Edit3}
                  onClick={() => setEditUserRow(row)}
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete ${row.email}? If they own orders or ledger entries, they will be suspended instead.`
                      )
                    ) {
                      router.post(`/admin/users/${row.id}/delete`, {}, { preserveScroll: true })
                    }
                  }}
                >
                  Delete
                </AppButton>
              </Stack>
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
              <AppButton
                variant="secondary"
                size="xs"
                icon={Eye}
                onClick={() => setInspectRoleRow(row)}
              >
                Inspect Permissions
              </AppButton>
            ),
          })}
          columns={[
            col.text('slug', 'Slug', 160),
            col.text('name', 'Name', 200),
            col.text('isSystem', 'System', 90),
            col.action('Permissions', (row) => (
              <Stack direction="horizontal" align="center" gap={2}>
                <Text size="xsm" color="secondary">
                  {((row.permissions as Row[]) ?? []).length} granted
                </Text>
                <AppButton
                  variant="secondary"
                  size="xs"
                  icon={Eye}
                  onClick={() => setInspectRoleRow(row)}
                >
                  Inspect
                </AppButton>
              </Stack>
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
              <AppButton
                variant="secondary"
                size="xs"
                icon={CheckCircle2}
                onClick={() => {
                  router.post(`/admin/entitlements/${row.id}/toggle`, {}, { preserveScroll: true })
                }}
              >
                {String(row.isEnabled) === 'true' || row.isEnabled === true ? 'Disable' : 'Enable'}
              </AppButton>
            ),
          })}
          columns={[
            col.text('moduleKey', 'Module', 170),
            col.badge('isEnabled', 'Enabled', { true: 'success', false: 'error' }),
            col.text('planTier', 'Plan tier', 120),
            col.action('Toggle', (row) => (
              <AppButton
                variant="secondary"
                size="xs"
                icon={CheckCircle2}
                onClick={() => {
                  router.post(`/admin/entitlements/${row.id}/toggle`, {}, { preserveScroll: true })
                }}
              >
                {row.isEnabled ? 'Disable' : 'Enable'}
              </AppButton>
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
    </Stack>
  )
}
