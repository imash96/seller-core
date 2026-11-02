import { test } from '@japa/runner'
import User from '#models/user'
import ModuleEntitlement from '#models/module_entitlement'
import AuditLog from '#models/audit_log'

test.group('Admin entitlements over HTTP', () => {
  test('sets the requested user module transactionally even on concurrent first writes', async ({
    assert,
  }) => {
    const nonce = Date.now().toString()
    const admin = await User.create({
      email: `admin-${nonce}@example.com`,
      fullName: 'Admin',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const target = await User.create({
      email: `target-${nonce}@example.com`,
      fullName: 'Target',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: false,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
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
    await send('/', { email: admin.email, password: 'Password123!' })
    const url = `/admin/users/${target.id}/modules`
    const invalid = await send(url, { moduleKey: 'finance', isEnabled: 'yes' })
    assert.equal(invalid.status, 400)
    const responses = await Promise.all([
      send(url, { moduleKey: 'finance', isEnabled: true }),
      send(url, { moduleKey: 'finance', isEnabled: false }),
    ])
    assert.deepEqual(
      responses.map((r) => r.status),
      [200, 200]
    )
    const records = await ModuleEntitlement.query()
      .where('userId', target.id)
      .where('moduleKey', 'finance')
    assert.lengthOf(records, 1)
    // Exactly one audit row per row mutation, written by the database trigger.
    const audits = await AuditLog.query()
      .where('entityType', 'module_entitlements')
      .where('entityId', records[0].id)
      .whereRaw(`metadata ->> 'reason' = 'rbac.entitlement_changed'`)
      .orderBy('createdAt', 'asc')
    assert.lengthOf(audits, 2)
    assert.deepEqual(audits.map((entry) => entry.action).sort(), ['INSERT', 'UPDATE'])
    // The actor is published through `SET LOCAL app.actor_user_id`, never re-derived.
    assert.deepEqual(Array.from(new Set(audits.map((entry) => entry.actorUserId))), [admin.id])
    // Trigger snapshots are raw row images, so columns keep their snake_case names.
    const update = audits.find((entry) => entry.action === 'UPDATE')!
    assert.notEqual((update.beforeState as any)?.is_enabled, (update.afterState as any)?.is_enabled)
  })
})
