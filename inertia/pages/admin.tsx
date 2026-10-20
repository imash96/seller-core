import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Card } from '@astryxdesign/core/Card'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Grid } from '@astryxdesign/core/Grid'
import { Divider } from '@astryxdesign/core/Divider'
import AppLayout from '~/layouts/app'
import { PageHeader, StatStrip, ResponsiveDataView, FormModal, col, type Row } from '~/lib/ui'
import { useState } from 'react'
import { Shield, Users, KeyRound, Layers, Lock, Sparkles } from 'lucide-react'

type Props = { allUsers: Row[]; allRoles: Row[]; allPermissions: Row[]; moduleEntitlements: Row[] }

Admin.layout = (page: React.ReactElement<Props>) => <AppLayout>{page}</AppLayout>

const USER_STATUS = ['pending_activation', 'active', 'suspended', 'locked', 'deactivated']

export default function Admin({ allUsers, allRoles, allPermissions, moduleEntitlements }: Props) {
  const [provisionOpen, setProvisionOpen] = useState(false)
  const [editUserRow, setEditUserRow] = useState<Row | null>(null)
  const [assignRoleOpen, setAssignRoleOpen] = useState(false)

  const activeCount = allUsers.filter((u) => u.status === 'active').length
  const suspendedCount = allUsers.filter((u) => u.status === 'suspended').length

  return (
    <Stack gap={4}>
      <PageHeader
        title="Users & RBAC"
        description="Provision users, assign roles, and manage module entitlements. Protected by @adonisjs/bouncer — only Super Admin abilities can mutate users or RBAC."
        eyebrow={<Badge variant="info" label="Super admin only" />}
        actions={
          <>
            <Button
              label="Provision user"
              variant="primary"
              onClick={() => setProvisionOpen(true)}
            />
            <Button
              label="Assign / revoke role"
              variant="secondary"
              onClick={() => setAssignRoleOpen(true)}
            />
          </>
        }
        meta={
          <Stack direction="horizontal" gap={2} wrap="wrap">
            <Badge variant="success" label={`${activeCount} active`} />
            <Badge variant="neutral" label={`${allUsers.length} users`} />
            <Badge variant="info" label={`${allRoles.length} roles`} />
          </Stack>
        }
      />

      <StatStrip
        items={[
          { label: 'Users', value: String(allUsers.length) },
          { label: 'Active', value: String(activeCount), hint: `${suspendedCount} suspended` },
          { label: 'Roles', value: String(allRoles.length) },
          { label: 'Permissions', value: String(allPermissions.length) },
          { label: 'Entitlements', value: String(moduleEntitlements.length) },
          { label: 'Authz', value: 'Bouncer', hint: 'abilities + policies' },
        ]}
      />

      <Card padding={4} variant="muted">
        <Stack direction="horizontal" gap={2} align="center" wrap="wrap">
          <Shield size={16} color="#581c87" />
          <Text type="label" as="span" weight="semibold">
            Authorization model
          </Text>
          <Badge variant="info" label="deny-overrides-allow" />
          <Badge variant="neutral" label="Ability: manageUsers / manageRoles" />
          <Badge variant="neutral" label="Policy: UserPolicy" />
        </Stack>
      </Card>

      <Grid columns={{ minWidth: 360, max: 3 }} gap={3}>
        <Card padding={4}>
          <Stack gap={2}>
            <Stack direction="horizontal" gap={2} align="center">
              <Users size={16} />
              <Text type="label" as="span" weight="semibold">
                How provisioning works
              </Text>
            </Stack>
            <Text type="supporting" as="p">
              Public signup is disabled. Super admins call <Text type="code">storeUser</Text> after
              <Text type="code">bouncer.authorize(&apos;manageUsers&apos;)</Text>.
            </Text>
          </Stack>
        </Card>
        <Card padding={4}>
          <Stack gap={2}>
            <Stack direction="horizontal" gap={2} align="center">
              <KeyRound size={16} />
              <Text type="label" as="span" weight="semibold">
                Roles & permissions
              </Text>
            </Stack>
            <Text type="supporting" as="p">
              Role grants use <Text type="code">allow/deny</Text> effect — any explicit deny beats
              allows. Audited on assignment via <Text type="code">UserPolicy.assignRole</Text>.
            </Text>
          </Stack>
        </Card>
        <Card padding={4}>
          <Stack gap={2}>
            <Stack direction="horizontal" gap={2} align="center">
              <Layers size={16} />
              <Text type="label" as="span" weight="semibold">
                Entitlements
              </Text>
            </Stack>
            <Text type="supporting" as="p">
              Gate whole modules independently of roles. Toggle emits{' '}
              <Text type="code">rbac.entitlement_toggled</Text> audit. Super admin only.
            </Text>
          </Stack>
        </Card>
      </Grid>

      {/* Modals */}
      <FormModal
        isOpen={provisionOpen}
        onOpenChange={setProvisionOpen}
        title="Provision user (super admin only)"
        subtitle="Public registration is disabled — accounts exist only when a super admin creates them. Bouncer checks `manageUsers` ability before this form is reachable."
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
        submitLabel="Update status"
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
        subtitle="Same ability toggles assignment: bouncer re-checks before removing or granting."
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
              label: `${u.fullName} — ${u.email}`,
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

      {/* Users table */}
      <Card padding={5}>
        <Stack gap={4}>
          <Stack gap={1}>
            <Text type="label" as="div" weight="semibold">
              Users
            </Text>
            <Text type="supporting" as="div">
              Toggle status or delete. Delete is gated by{' '}
              <Text type="code" as="span">
                UserPolicy.delete
              </Text>{' '}
              and ownership-data checks.
            </Text>
          </Stack>
          <Divider />
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
            createLabel="Provision user"
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
                          `Delete ${row.email}? If they own data, they will be suspended instead.`
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
              col.text('fullName', 'Name', 160),
              col.text('email', 'Email', 210),
              col.badge('status', 'Status', {
                active: 'success',
                pending_activation: 'warning',
                suspended: 'error',
                locked: 'error',
                deactivated: 'neutral',
              }),
              col.text('isSuperAdmin', 'Super admin', 110),
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
                          `Delete ${row.email}? If they own data, they will be suspended instead.`
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
        </Stack>
      </Card>

      <Card padding={5}>
        <Stack gap={4}>
          <Text type="label" as="div" weight="semibold">
            Roles & permissions
          </Text>
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
              col.text('slug', 'Slug', 150),
              col.text('name', 'Name', 180),
              col.text('isSystem', 'System', 90),
              col.action('Permissions', (row) => (
                <span style={{ fontSize: 12 }}>
                  {((row.permissions as Row[]) ?? []).length} granted
                </span>
              )),
            ]}
          />
        </Stack>
      </Card>

      <Card padding={5}>
        <Stack gap={4}>
          <Stack direction="horizontal" gap={2} align="center">
            <Sparkles size={16} color="#7c3aed" />
            <Text type="label" as="div" weight="semibold">
              Module entitlements
            </Text>
            <Badge variant="info" label="Super admin only" />
          </Stack>
          <Text type="supporting" as="div">
            Controlled via <Text type="code">manageEntitlements</Text> ability. Each toggle writes
            an audit event.
          </Text>
          <Divider />
          <ResponsiveDataView
            rows={moduleEntitlements}
            searchKeys={['moduleKey', 'planTier']}
            toCard={(row) => ({
              title: String(row.moduleKey),
              statusBadge: {
                label:
                  String(row.isEnabled) === 'true' || row.isEnabled === true
                    ? 'Enabled'
                    : 'Disabled',
                variant:
                  String(row.isEnabled) === 'true' || row.isEnabled === true ? 'success' : 'error',
              },
              metrics: [{ label: 'Plan tier', value: String(row.planTier ?? '—') }],
              actions: (
                <Button
                  label={
                    String(row.isEnabled) === 'true' || row.isEnabled === true
                      ? 'Disable'
                      : 'Enable'
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
              col.text('moduleKey', 'Module', 170),
              col.badge('isEnabled', 'Enabled', { true: 'success', false: 'error' }),
              col.text('planTier', 'Plan tier', 120),
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
        </Stack>
      </Card>

      <Card padding={5}>
        <Stack gap={4}>
          <Text type="label" as="div" weight="semibold">
            Permission catalog
          </Text>
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
        </Stack>
      </Card>
    </Stack>
  )
}
