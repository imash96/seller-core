import { Text } from '@astryxdesign/core/Text'
import { Stack } from '@astryxdesign/core/Stack'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Building2, Plus, UserPlus, Trash2 } from 'lucide-react'
import { AppButton, FormModal, PageHeader, PageSection } from '~/lib/ui'

type Member = {
  id: string
  userId: string
  fullName: string
  email: string
  status: string
  isAdmin: boolean
  roleId: string | null
  roleName: string | null
}
type Org = {
  id: string
  name: string
  ownerUserId: string
  isPersonal: boolean
  canManage: boolean
  members: Member[]
  availableRoles: { id: string; name: string }[]
}

export default function Organizations({ organizations }: { organizations: Org[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [activeOrg, setActiveOrg] = useState<Org | null>(null)
  const [editMember, setEditMember] = useState<Member | null>(null)
  return (
    <Stack gap={6}>
      <PageHeader
        title="Organizations"
        icon={Building2}
        description="Set up organization membership. Existing data remains isolated by user."
        actions={
          <AppButton variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
            Create organization
          </AppButton>
        }
      />
      <Stack
        padding={4}
        role="status"
        className="rounded-xl border border-warning/40 bg-warning/10 text-sm"
      >
        <strong>Setup only:</strong> Shared access to orders, finance, catalog and other operational
        data is not yet enabled. Organization roles do not yet grant access to those records. Super
        administrators cannot yet browse other users’ operational data here.
      </Stack>
      {organizations.map((org) => (
        <PageSection
          key={org.id}
          title={org.name}
          description={
            org.isPersonal
              ? 'Personal workspace — existing data remains isolated.'
              : 'Company workspace — membership setup only.'
          }
        >
          {org.canManage && (
            <Stack className="mb-4">
              <AppButton
                variant="secondary"
                size="sm"
                icon={UserPlus}
                onClick={() => {
                  setEditMember(null)
                  setActiveOrg(org)
                }}
              >
                Add or update member
              </AppButton>
            </Stack>
          )}
          <Stack className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-130 text-sm">
              <thead className="text-left bg-muted/40">
                <tr>
                  <th className="p-3">Member</th>
                  <th className="p-3">Administration</th>
                  <th className="p-3">Role (not active)</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {org.members.map((member) => (
                  <tr key={member.id} className="border-t border-border">
                    <td className="p-3">
                      <Text weight="medium">{member.fullName}</Text>
                      <Stack className="text-xs text-muted-foreground">
                        {member.email} · {member.status}
                      </Stack>
                    </td>
                    <td className="p-3">
                      {member.userId === org.ownerUserId
                        ? 'Owner'
                        : member.isAdmin
                          ? 'Administrator'
                          : 'Member'}
                    </td>
                    <td className="p-3">{member.roleName ?? 'None'}</td>
                    <td className="p-3">
                      {org.canManage && member.userId !== org.ownerUserId && (
                        <Stack direction="horizontal" gap={2}>
                          <AppButton
                            variant="secondary"
                            size="xs"
                            onClick={() => {
                              setEditMember(member)
                              setActiveOrg(org)
                            }}
                          >
                            Edit
                          </AppButton>
                          <AppButton
                            variant="ghost"
                            size="xs"
                            icon={Trash2}
                            onClick={() => {
                              if (window.confirm(`Remove ${member.fullName} from ${org.name}?`))
                                router.post(`/organizations/${org.id}/members/${member.id}/delete`)
                            }}
                          >
                            Remove
                          </AppButton>
                        </Stack>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Stack>
        </PageSection>
      ))}
      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="Create organization"
        subtitle="This creates a membership space only; shared operations are not yet enabled."
        submitLabel="Create organization"
        action="/organizations"
        fields={[{ name: 'name', label: 'Organization name', required: true }]}
      />
      <FormModal
        isOpen={!!activeOrg}
        onOpenChange={(open) => {
          if (!open) {
            setActiveOrg(null)
            setEditMember(null)
          }
        }}
        title={`Manage member · ${activeOrg?.name ?? ''}`}
        subtitle="Only existing active users can be added. Assigned operational roles are not yet enforced."
        submitLabel="Save membership"
        action={`/organizations/${activeOrg?.id ?? 'placeholder'}/members`}
        initialValues={{
          email: editMember?.email ?? '',
          isAdmin: editMember?.isAdmin ? 'true' : 'false',
          roleId: editMember?.roleId ?? '',
        }}
        fields={[
          { name: 'email', label: 'Existing user email', kind: 'email', required: true },
          {
            name: 'isAdmin',
            label: 'Organization administrator',
            kind: 'select',
            required: true,
            options: [
              { value: 'false', label: 'No' },
              { value: 'true', label: 'Yes' },
            ],
          },
          {
            name: 'roleId',
            label: 'Role (setup only)',
            kind: 'select',
            options:
              activeOrg?.availableRoles.map((role) => ({ value: role.id, label: role.name })) ?? [],
          },
        ]}
      />
    </Stack>
  )
}
