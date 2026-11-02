import { test } from '@japa/runner'
import User from '#models/user'
import Role from '#models/role'
import Organization from '#models/organization'
import OrganizationMembership from '#models/organization_membership'
import AuditLog from '#models/audit_log'
import { OrganizationService } from '#services/organization_service'

async function makeUser(email: string, isSuperAdmin = false) {
  return User.create({
    email,
    fullName: 'Operator',
    password: 'Password123!',
    status: 'active',
    isSuperAdmin,
    defaultCurrency: 'USD',
    timezone: 'UTC',
  })
}

test.group('Organization membership setup', () => {
  test('isolates personal workspaces, protects owner, authorizes administrators, and audits changes', async ({
    assert,
  }) => {
    const n = Date.now().toString()
    const owner = await makeUser(`owner-${n}@example.com`)
    const other = await makeUser(`other-${n}@example.com`)
    const outsider = await makeUser(`outsider-${n}@example.com`)
    const platformAdmin = await makeUser(`platform-${n}@example.com`, true)
    const personal = await Organization.query()
      .where('ownerUserId', owner.id)
      .where('isPersonal', true)
      .firstOrFail()
    const otherPersonal = await Organization.query()
      .where('ownerUserId', other.id)
      .where('isPersonal', true)
      .firstOrFail()
    assert.notEqual(personal.id, otherPersonal.id)
    // Entity ids are ULID-compatible (optional lowercase prefix + 26 chars).
    assert.match(personal.id, /^org_[0-9A-HJKMNP-TV-Z]{26}$/)
    const role = await Role.create({
      name: `Operator ${n}`,
      slug: `operator-${n}`,
      isSystem: false,
    })
    const org = await OrganizationService.create(owner, 'Company')
    await assert.rejects(
      () =>
        OrganizationService.upsertMember(outsider, org.id, {
          email: other.email,
          roleId: role.id,
          isAdmin: false,
        }),
      /administrator/
    )
    const outsiderOrgs = await OrganizationService.list(outsider)
    const platformOrgs = await OrganizationService.list(platformAdmin)
    assert.notInclude(
      outsiderOrgs.map((o) => o.id),
      org.id
    )
    assert.include(
      platformOrgs.map((o) => o.id),
      org.id
    )
    const member = await OrganizationService.upsertMember(owner, org.id, {
      email: other.email,
      roleId: role.id,
      isAdmin: false,
    })
    assert.equal(member.roleId, role.id)
    assert.isFalse(member.isAdmin)
    await assert.rejects(
      () =>
        OrganizationService.upsertMember(other, org.id, {
          email: outsider.email,
          roleId: role.id,
          isAdmin: false,
        }),
      /administrator/
    )
    await OrganizationService.upsertMember(platformAdmin, org.id, {
      email: other.email,
      roleId: role.id,
      isAdmin: true,
    })
    await OrganizationService.upsertMember(other, org.id, {
      email: outsider.email,
      roleId: role.id,
      isAdmin: false,
    })
    const ownerMembership = await OrganizationMembership.query()
      .where('organizationId', org.id)
      .where('userId', owner.id)
      .firstOrFail()
    await assert.rejects(
      () => OrganizationService.removeMember(other, org.id, ownerMembership.id),
      /owner/
    )
    await assert.rejects(
      () =>
        OrganizationService.upsertMember(other, org.id, {
          email: owner.email,
          roleId: role.id,
          isAdmin: false,
        }),
      /owner/
    )
    await OrganizationService.removeMember(owner, org.id, member.id)
    await assert.rejects(
      () =>
        OrganizationService.upsertMember(other, org.id, {
          email: outsider.email,
          roleId: role.id,
          isAdmin: true,
        }),
      /administrator/
    )
    assert.lengthOf(
      await AuditLog.query().where('entityType', 'organizations').where('entityId', org.id),
      5
    )
    const otherOrgs = await OrganizationService.list(other)
    assert.notInclude(
      otherOrgs.map((o) => o.id),
      org.id
    )
  })

  test('rejects inappropriate role and malformed membership inputs', async ({ assert }) => {
    const n = Date.now().toString()
    const owner = await makeUser(`org-owner-${n}@example.com`)
    const member = await makeUser(`org-member-${n}@example.com`)
    const org = await OrganizationService.create(owner, 'Test Company')
    const superRole = await Role.updateOrCreate(
      { slug: 'super_admin' },
      { slug: 'super_admin', name: 'Super admin', isSystem: true }
    )
    await assert.rejects(
      () =>
        OrganizationService.upsertMember(owner, org.id, {
          email: member.email,
          roleId: superRole.id,
          isAdmin: false,
        }),
      /Invalid organization role/
    )
    await assert.rejects(
      () =>
        OrganizationService.upsertMember(owner, org.id, {
          email: member.email,
          roleId: '',
          isAdmin: 'yes',
        }),
      /valid email/
    )
    assert.lengthOf(await OrganizationMembership.query().where('organizationId', org.id), 1)
  })
})

test.group('Organization setup HTTP', () => {
  test('enforces session, CSRF and organization admin checks', async ({ assert }) => {
    const n = Date.now().toString()
    const owner = await makeUser(`http-owner-${n}@example.com`)
    const other = await makeUser(`http-other-${n}@example.com`)
    const org = await OrganizationService.create(owner, 'HTTP Company')
    const jar = new Map<string, string>()
    const send = async (path: string, body?: Record<string, unknown>) => {
      const res = await fetch(`http://localhost:3333${path}`, {
        method: body ? 'POST' : 'GET',
        redirect: 'manual',
        headers: {
          cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
          ...(body
            ? {
                'content-type': 'application/json',
                'x-xsrf-token': decodeURIComponent(jar.get('XSRF-TOKEN') ?? ''),
              }
            : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      for (const cookie of res.headers.getSetCookie()) {
        const pair = cookie.split(';')[0]
        const i = pair.indexOf('=')
        jar.set(pair.slice(0, i), pair.slice(i + 1))
      }
      return res
    }
    await send('/store/product-categories')
    await send('/', { email: other.email, password: 'Password123!' })
    const rejected = await send(`/organizations/${org.id}/members`, {
      email: other.email,
      isAdmin: true,
    })
    assert.equal(rejected.status, 403)
    assert.lengthOf(await OrganizationMembership.query().where('organizationId', org.id), 1)
    const noCsrf = await fetch(`http://localhost:3333/organizations/${org.id}/members`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'cookie': [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: other.email, isAdmin: true }),
    })
    assert.notEqual(noCsrf.status, 200)
    assert.lengthOf(await OrganizationMembership.query().where('organizationId', org.id), 1)
    await send('/logout', {})
    await send('/', { email: owner.email, password: 'Password123!' })
    const page = await send('/organizations')
    assert.equal(page.status, 200)
    const saved = await send(`/organizations/${org.id}/members`, {
      email: other.email,
      isAdmin: false,
    })
    assert.equal(saved.status, 302)
    const membership = await OrganizationMembership.query()
      .where('organizationId', org.id)
      .where('userId', other.id)
      .first()
    assert.isNotNull(membership)
  })
})
