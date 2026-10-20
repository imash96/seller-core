import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import AppLayout from '~/layouts/app'
import {
  PageSection,
  DataTable,
  SmartForm,
  RowAction,
  StatusForm,
  FormModal,
  ResponsiveDataView,
  col,
  type Row,
  short,
} from '~/lib/ui'
import { useState } from 'react'

type Props = { allUsers: Row[]; allRoles: Row[]; allPermissions: Row[]; moduleEntitlements: Row[] }

Admin.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

const USER_STATUS = ['pending_activation', 'active', 'suspended', 'locked', 'deactivated']

export default function Admin({ allUsers, allRoles, allPermissions, moduleEntitlements }: Props) {
  const [provisionOpen, setProvisionOpen] = useState(false)
  const [editUserRow, setEditUserRow] = useState<Row | null>(null)
  const [assignRoleOpen, setAssignRoleOpen] = useState(false)

  return (
    <Stack gap={4}>
      <Card padding={4}>
        <Stack direction="horizontal" gap={3} wrap="wrap" align="center">
          <Button
            label="+ Provision User"
            variant="primary"
            onClick={() => setProvisionOpen(true)}
          />
          <Button
            label="Assign / Revoke Role"
            variant="secondary"
            onClick={() => setAssignRoleOpen(true)}
          />
          <Text type="supporting" as="div">
            {allUsers.length} users · {allRoles.length} roles · {allPermissions.length} permissions
          </Text>
        </Stack>
      </Card>

      <FormModal
        isOpen={provisionOpen}
        onOpenChange={setProvisionOpen}
        title="Provision user (super admin only)"
        subtitle="Public registration is disabled — accounts exist only when a super admin creates them."
        submitLabel="Create user"
        action="/admin/users"
        fields={[
          { name: 'fullName', label: 'Full name', required: true },
          { name: 'email', label: 'Email', kind: 'email', required: true },
          { name: 'password', label: 'Password', kind: 'password', required: true },
          { name: 'phone', label: 'Phone' },
          {
            name: 'roleSlug',
            label: 'Initial role',
            kind: 'select',
            options: allRoles.map((r) => ({ value: String(r.slug), label: String(r.name) })),
          },
          {
            name: 'isSuperAdmin',
            label: 'Super admin',
            kind: 'select',
            default: 'false',
            options: [
              { value: 'false', label: 'No' },
              { value: 'true', label: 'Yes' },
            ],
          },
        ]}
      />

      <FormModal
        isOpen={!!editUserRow}
        onOpenChange={(o) => {
          if (!o) setEditUserRow(null)
        }}
        title={`Edit user: ${String(editUserRow?.email ?? '')}`}
        submitLabel="Update user"
        action={
          editUserRow ? `/admin/users/${editUserRow.id}/status` : '/admin/users/placeholder/status'
        }
        initialValues={{ status: String(editUserRow?.status ?? 'active') }}
        fields={[
          {
            name: 'status',
            label: 'Status',
            kind: 'select',
            required: true,
            options: USER_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
          },
        ]}
      />

      <FormModal
        isOpen={assignRoleOpen}
        onOpenChange={setAssignRoleOpen}
        title="Assign / revoke role"
        subtitle="Toggle a role for a user — same route assigns and revokes."
        submitLabel="Toggle role"
        action="/admin/users"
        actionFor={(v) => `/admin/users/${v.userId}/roles`}
        fields={[
          {
            name: 'userId',
            label: 'User',
            kind: 'select',
            required: true,
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
            options: allRoles.map((r) => ({ value: String(r.slug), label: String(r.name) })),
          },
        ]}
      />

      <PageSection
        title="Users"
        description="Multi-role RBAC: a user may hold several roles; explicit DENY always overrides ALLOW."
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
              { label: 'Roles', value: String(((row.roles as Row[]) ?? []).length) },
              {
                label: 'Created',
                value: row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '—',
              },
            ],
            actions: (
              <Stack direction="horizontal" gap={2} wrap="wrap">
                <Button
                  label="Edit status"
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
                      confirm(
                        `Delete user ${row.email}? If they own data, they will be suspended instead.`
                      )
                    ) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/admin/users/${row.id}/delete`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
              </Stack>
            ),
          })}
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
                      confirm(
                        `Delete user ${row.email}? If they own data, they will be suspended instead.`
                      )
                    ) {
                      const f = document.createElement('form')
                      f.method = 'POST'
                      f.action = `/admin/users/${row.id}/delete`
                      document.body.appendChild(f)
                      f.submit()
                    }
                  }}
                />
              </Stack>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Roles & permissions"
        description="Role → permission grants with allow/deny effect."
      >
        <ResponsiveDataView
          rows={allRoles}
          searchKeys={['slug', 'name']}
          toCard={(row) => ({
            title: String(row.name),
            idBadge: String(row.slug),
            metrics: [
              { label: 'System', value: String(row.isSystem) },
              { label: 'Permissions', value: String(((row.permissions as Row[]) ?? []).length) },
            ],
          })}
          columns={[
            col.text('slug', 'Slug', 140),
            col.text('name', 'Name', 170),
            col.text('isSystem', 'System', 80),
            col.action('Permissions', (row) => (
              <span style={{ fontSize: 12 }}>
                {((row.permissions as Row[]) ?? []).length} granted
              </span>
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Module entitlements"
        description="Entitlements gate whole modules independently from role permissions."
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
                  const f = document.createElement('form')
                  f.method = 'POST'
                  f.action = `/admin/entitlements/${row.id}/toggle`
                  document.body.appendChild(f)
                  f.submit()
                }}
              />
            ),
          })}
          columns={[
            col.text('moduleKey', 'Module', 160),
            col.badge('isEnabled', 'Enabled', { true: 'success', false: 'error' }),
            col.text('planTier', 'Plan tier', 110),
            col.action('Toggle', (row) => (
              <Button
                label={row.isEnabled ? 'Disable' : 'Enable'}
                variant="secondary"
                size="sm"
                onClick={() => {
                  const f = document.createElement('form')
                  f.method = 'POST'
                  f.action = `/admin/entitlements/${row.id}/toggle`
                  document.body.appendChild(f)
                  f.submit()
                }}
              />
            )),
          ]}
        />
      </PageSection>

      <PageSection
        title="Permission catalog"
        description="All defined permissions across resources and actions."
      >
        <ResponsiveDataView
          rows={allPermissions}
          searchKeys={['slug', 'resource', 'action']}
          toCard={(row) => ({
            title: String(row.slug),
            metrics: [
              { label: 'Resource', value: String(row.resource) },
              { label: 'Action', value: String(row.action) },
              { label: 'Description', value: String(row.description ?? '—').slice(0, 60) },
            ],
          })}
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
