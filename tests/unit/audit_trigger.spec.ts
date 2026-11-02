import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import AuditLog from '#models/audit_log'
import { AuditContext } from '#services/audit_context'
import { AuditService } from '#services/audit_service'
import { generateEntityId, ENTITY_ID_PATTERN } from '../../app/utils/generate_entity_id.js'

/**
 * Phase 4 audit contract: one writer (the `trg_audit_capture` trigger), one row per
 * row mutation, actor/request/correlation published through `SET LOCAL`, secrets
 * redacted, and `audit_logs` append-only.
 */
test.group('Audit trigger and request context', () => {
  test('generates Crockford Base32 ULIDs in SQL and in TypeScript', async ({ assert }) => {
    const { rows } = await db.rawQuery<{ rows: { prefixed: string; bare: string }[] }>(
      `SELECT generate_entity_id('org') AS prefixed, generate_entity_id() AS bare`
    )
    const [row] = rows
    assert.match(row.prefixed, ENTITY_ID_PATTERN)
    assert.match(row.prefixed, /^org_[0-9A-HJKMNP-TV-Z]{26}$/)
    assert.match(row.bare, /^[0-9A-HJKMNP-TV-Z]{26}$/)
    // Crockford never uses I, L, O or U — that is what makes ids unambiguous.
    assert.notMatch(row.bare, /[ILOU]/)
    assert.match(generateEntityId('role'), ENTITY_ID_PATTERN)
    await assert.rejects(() => db.rawQuery(`SELECT generate_entity_id('BAD')`), /must match/)
    // 2^128 random bits always encode to exactly 26 characters.
    const { rows: encoded } = await db.rawQuery<{ rows: { len: number }[] }>(
      `SELECT length(fn_crockford_base32(uuid_send(gen_random_uuid()))) AS len`
    )
    assert.equal(encoded[0].len, 26)
  })

  test('writes exactly one audit row per mutation with the published actor context', async ({
    assert,
  }) => {
    const slug = `ctx-${Date.now()}`
    const actor = await User.create({
      email: `${slug}@example.com`,
      fullName: 'Audit Actor',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: false,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })

    const roleId = generateEntityId('role')
    await AuditContext.run(
      {
        actorUserId: actor.id,
        requestId: 'req-11111111',
        correlationId: 'corr-22222222',
        ipAddress: '203.0.113.10',
        userAgent: 'audit-test/1.0',
        reason: 'rbac.role_created',
      },
      async (trx) => {
        await trx.rawQuery('INSERT INTO roles (id, slug, name, is_system) VALUES (?, ?, ?, ?)', [
          roleId,
          slug,
          'Context role',
          false,
        ])
      }
    )

    const inserts = await AuditLog.query().where('entityType', 'roles').where('entityId', roleId)
    assert.lengthOf(inserts, 1)
    const [inserted] = inserts
    assert.equal(inserted.action, 'INSERT')
    assert.equal(inserted.actorUserId, actor.id)
    assert.equal(inserted.requestId, 'req-11111111')
    assert.equal(inserted.correlationId, 'corr-22222222')
    assert.equal(inserted.ipAddress, '203.0.113.10')
    assert.equal(inserted.userAgent, 'audit-test/1.0')
    assert.equal((inserted.metadata as any).reason, 'rbac.role_created')
    assert.match(inserted.id, /^aud_[0-9A-HJKMNP-TV-Z]{26}$/)
    assert.isNull(inserted.beforeState)
    assert.equal((inserted.afterState as any).slug, slug)

    await AuditContext.run({ actorUserId: actor.id, reason: 'rbac.role_renamed' }, async (trx) => {
      await trx.rawQuery('UPDATE roles SET name = ? WHERE id = ?', ['Renamed role', roleId])
    })

    const history = await AuditLog.query()
      .where('entityType', 'roles')
      .where('entityId', roleId)
      .orderBy('createdAt', 'asc')
    assert.lengthOf(history, 2)
    assert.equal(history[1].action, 'UPDATE')
    assert.equal((history[1].beforeState as any).name, 'Context role')
    assert.equal((history[1].afterState as any).name, 'Renamed role')
    assert.deepEqual((history[1].metadata as any).changed_fields, ['name'])
    assert.equal((history[1].metadata as any).reason, 'rbac.role_renamed')

    // A write that changes nothing about the row is not an audit event.
    await AuditContext.run({ actorUserId: actor.id }, async (trx) => {
      await trx.rawQuery('UPDATE roles SET name = ? WHERE id = ?', ['Renamed role', roleId])
    })
    assert.lengthOf(
      await AuditLog.query().where('entityType', 'roles').where('entityId', roleId),
      2
    )
  })

  test('secrets are redacted before they reach the audit history', async ({ assert }) => {
    const email = `redact-${Date.now()}@example.com`
    const user = await User.create({
      email,
      fullName: 'Secret Holder',
      password: 'SuperSecret123!',
      status: 'active',
      isSuperAdmin: false,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const rows = await AuditLog.query().where('entityType', 'users').where('entityId', user.id)
    assert.isAbove(rows.length, 0)
    for (const row of rows) {
      if (row.beforeState) assert.notProperty(row.beforeState, 'password')
      if (row.afterState) assert.notProperty(row.afterState, 'password')
    }
  })

  test('audit_logs is append-only and row-level actions cannot be written by hand', async ({
    assert,
  }) => {
    const existing = await db.rawQuery<{ rows: { id: string }[] }>(
      `SELECT id FROM audit_logs LIMIT 1`
    )
    const row = existing.rows[0]
    assert.isDefined(row, 'the trigger must have written at least one audit row')
    await assert.rejects(
      () => db.rawQuery(`UPDATE audit_logs SET action = 'tampered' WHERE id = ?`, [row.id]),
      /append-only/
    )
    await assert.rejects(
      () => db.rawQuery(`DELETE FROM audit_logs WHERE id = ?`, [row.id]),
      /append-only/
    )
    await assert.rejects(
      () =>
        AuditService.record({
          // @ts-expect-error row mutations must go through the trigger
          action: 'order.created',
          entityType: 'orders',
          entityId: 'ord_x',
        }),
      /non-row actions/
    )
  })

  test('non-row actions stay available to the application', async ({ assert }) => {
    const user = await User.create({
      email: `logout-${Date.now()}@example.com`,
      fullName: 'Leaver',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: false,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const audit = await AuditService.recordLogout({
      actorUserId: user.id,
      userId: user.id,
      requestId: 'req-logout',
    })
    assert.equal(audit.action, 'auth.logout')
    assert.equal(audit.entityType, 'users')
    assert.equal(audit.entityId, user.id)
  })
})
