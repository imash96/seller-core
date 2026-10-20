import { Stack } from '@astryxdesign/core/Stack'
import AppLayout from '~/layouts/app'
import { PageSection, DataTable, SmartForm, RowAction, StatusForm, col, type Row } from '~/lib/ui'

type Props = {
  allUsers: Row[]
  allRoles: Row[]
  allPermissions: Row[]
  moduleEntitlements: Row[]
}

Admin.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

const USER_STATUS = ['pending_activation', 'active', 'suspended', 'locked', 'deactivated']

export default function Admin({ allUsers, allRoles, allPermissions, moduleEntitlements }: Props) {
  return (
    <Stack gap={4}>
      <PageSection
        title="Provision user (super admin only)"
        description="Public registration is disabled by security policy — accounts exist only when a super admin creates them."
      >
        <SmartForm
          action="/admin/users"
          submitLabel="Create user"
          fields={[
            { name: 'fullName', label: 'Full name', required: true, width: 190 },
            { name: 'email', label: 'Email', kind: 'email', required: true, width: 210 },
            { name: 'password', label: 'Password', kind: 'password', required: true, width: 180 },
            { name: 'phone', label: 'Phone', width: 140 },
            {
              name: 'roleSlug',
              label: 'Initial role',
              kind: 'select',
              width: 170,
              options: allRoles.map((r) => ({ value: String(r.slug), label: String(r.name) })),
            },
            {
              name: 'isSuperAdmin',
              label: 'Super admin',
              kind: 'select',
              width: 130,
              options: [
                { value: 'false', label: 'No' },
                { value: 'true', label: 'Yes' },
              ],
            },
          ]}
        />
      </PageSection>

      <PageSection
        title="Users"
        description="Multi-role RBAC: a user may hold several roles; explicit DENY always overrides ALLOW."
      >
        <DataTable
          rows={allUsers}
          empty="No users."
          columns={[
            col.text('fullName', 'Name', 150),
            col.text('email', 'Email', 200),
            col.badge('status', 'Status', {
              active: 'success',
              pending_activation: 'warning',
              suspended: 'error',
              locked: 'error',
              deactivated: 'neutral',
            }),
            col.text('isSuperAdmin', 'Super admin', 100),
            col.action('Actions', (row) => (
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <StatusForm
                  action={`/admin/users/${row.id}/status`}
                  fieldName="status"
                  label="User status"
                  current={String(row.status ?? 'active')}
                  options={USER_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                />
                <RowAction
                  action={`/admin/users/${row.id}/delete`}
                  label="Delete"
                  variant="ghost"
                  confirmText="Deactivate instead of deleting when the user owns data."
                />
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Assign / revoke roles"
        description="Toggle a role for a user — the same route assigns and revokes."
      >
        <SmartForm
          action="/admin/users"
          actionFor={(v) => `/admin/users/${v.userId}/roles`}
          submitLabel="Toggle role"
          fields={[
            {
              name: 'userId',
              label: 'User',
              kind: 'select',
              required: true,
              width: 230,
              options: allUsers.map((u) => ({
                value: String(u.id),
                label: `${u.fullName} (${u.email})`,
              })),
            },
            {
              name: 'roleSlug',
              label: 'Role',
              kind: 'select',
              required: true,
              width: 190,
              options: allRoles.map((r) => ({ value: String(r.slug), label: String(r.name) })),
            },
          ]}
        />
      </PageSection>

      <PageSection
        title="Roles & permissions"
        description="Role → permission grants with allow/deny effect."
      >
        <DataTable
          rows={allRoles}
          empty="No roles defined."
          columns={[
            col.text('slug', 'Slug', 140),
            col.text('name', 'Name', 170),
            col.text('isSystem', 'System', 80),
            col.action('Permission count', (row) => (
              <span style={{ fontSize: 12 }}>
                {((row.permissions as Row[]) ?? []).length} granted
              </span>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Module entitlements"
        description="Entitlements gate whole modules independently from role permissions (plan tiers, feature flags)."
      >
        <DataTable
          rows={moduleEntitlements}
          empty="No module entitlements configured."
          columns={[
            col.text('moduleKey', 'Module', 160),
            col.badge('isEnabled', 'Enabled', { true: 'success', false: 'error' }),
            col.text('planTier', 'Plan tier', 110),
            col.action('Toggle', (row) => (
              <RowAction
                action={`/admin/entitlements/${row.id}/toggle`}
                label={row.isEnabled ? 'Disable' : 'Enable'}
              />
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Permission catalog"
        description="All defined permissions across resources and actions."
      >
        <DataTable
          rows={allPermissions}
          empty="No permissions."
          columns={[
            col.text('slug', 'Slug', 190),
            col.text('resource', 'Resource', 130),
            col.text('action', 'Action', 100),
            col.text('description', 'Description', 260),
          ]}
        />
      </PageSection>
    </Stack>
  )
}
