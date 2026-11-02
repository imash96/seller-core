import { test } from '@japa/runner'
import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import { SessionRegistryService } from '#services/session_registry_service'
import AuditLog from '#models/audit_log'
import SellerAccount from '#models/seller_account'
import SalesChannel from '#models/sales_channel'
import SessionController from '#controllers/session_controller'
import SilentAuthMiddleware from '#middleware/silent_auth_middleware'
import CredentialMigration from '../../database/migrations/1760000000049_reencrypt_seller_credentials.js'
import { decryptJson, encryptJson } from '../../app/utils/secret_box.js'
import { generateEntityId } from '../../app/utils/generate_entity_id.js'

function legacyEncrypt(data: unknown) {
  const iv = crypto.randomBytes(12)
  const key = crypto.createHash('sha256').update('seller-core:undefined').digest()
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()])
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64')).join('.')
}

function fakeContext(user?: User, sessionId = `sess_${crypto.randomUUID()}`) {
  const values: Record<string, any> = {}
  const flashes: Record<string, string> = {}
  let currentUser = user
  const tagged: string[] = []
  const session = {
    sessionId,
    put: (key: string, value: unknown) => {
      values[key] = value
    },
    get: (key: string) => values[key],
    forget: (key: string) => {
      delete values[key]
    },
    flash: (key: string, value: string) => {
      flashes[key] = value
    },
    tag: async (userId: string) => {
      tagged.push(userId)
    },
    untag: async (userId: string) => {
      const index = tagged.lastIndexOf(String(userId))
      if (index >= 0) tagged.splice(index, 1)
    },
  }
  const guard = {
    login: async (u: User) => {
      currentUser = u
    },
    logout: async () => {
      currentUser = undefined
    },
  }
  const auth = {
    check: async () => !!currentUser,
    getUserOrFail: () => currentUser!,
    use: () => guard,
    get user() {
      return currentUser
    },
  }
  const response = { redirect: () => ({ back: () => 'back', toRoute: () => 'dashboard' }) }
  const request = {
    validateUsing: async () => ({ email: user!.email, password: values.password }),
    ip: () => '127.0.0.1',
    header: () => undefined,
    id: () => 'test',
  }
  return {
    ctx: { session, auth, response, request } as any,
    values,
    flashes,
    sessionId,
    taggedUserIds: tagged,
    getUser: () => currentUser,
  }
}

/** Mirrors what the Adonis database session store writes at the end of a request. */
async function persistSession(sessionId: string, userId: string) {
  await db
    .table('sessions')
    .insert({
      id: sessionId,
      data: 'signed-session-payload',
      user_id: userId,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
    })
    .onConflict('id')
    .merge(['user_id', 'expires_at', 'is_revoked', 'data'])
}

test.group('Security regressions', (group) => {
  let user: User
  group.setup(async () => {
    user = await User.create({
      email: `security-${generateEntityId()}@example.com`,
      fullName: 'Security Test',
      password: 'ValidPassword123!',
      status: 'active',
      isSuperAdmin: false,
      defaultCurrency: 'USD',
      timezone: 'UTC',
      failedLoginAttempts: 0,
    })
  })

  test('new ciphertext uses APP_KEY and is not decryptable with the old public key', ({
    assert,
  }) => {
    const ciphertext = encryptJson({ token: 'secret' })
    assert.match(ciphertext, /^v2\./)
    assert.deepEqual(decryptJson(ciphertext), { token: 'secret' })
    const [, iv, tag, data] = ciphertext.split('.')
    const legacyKey = crypto.createHash('sha256').update('seller-core:undefined').digest()
    assert.throws(() => {
      const decipher = crypto.createDecipheriv('aes-256-gcm', legacyKey, Buffer.from(iv, 'base64'))
      decipher.setAuthTag(Buffer.from(tag, 'base64'))
      decipher.update(Buffer.from(data, 'base64'))
      decipher.final()
    })
    assert.isNull(decryptJson(ciphertext.replace(/^v2/, 'v3')))
  })

  test('migration re-encrypts legacy accounts and serialization hides ciphertext', async ({
    assert,
  }) => {
    const channel = await SalesChannel.create({
      code: `sec-${generateEntityId()}`,
      name: 'Security',
      channelType: 'marketplace',
      isActive: true,
    })
    const account = await SellerAccount.create({
      userId: user.id,
      salesChannelId: channel.id,
      accountName: 'Security account',
      externalSellerId: generateEntityId(),
      marketplaceRegion: 'US',
      defaultCurrency: 'USD',
      status: 'active',
      healthStatus: 'healthy',
      rateLimitRpm: 60,
    })
    const legacy = legacyEncrypt({ token: 'legacy-secret' })
    await db
      .from('seller_accounts')
      .where('id', account.id)
      .update({ encrypted_credentials: legacy })
    assert.deepEqual(decryptJson(legacy), { token: 'legacy-secret' })
    await new CredentialMigration(db.connection(), 'credential-migration-test').execUp()
    await account.refresh()
    assert.match(account.encryptedCredentials!, /^v2\./)
    assert.deepEqual(account.getDecryptedCredentials(), { token: 'legacy-secret' })
    assert.notProperty(account.serialize(), 'encryptedCredentials')
    const logs = await db
      .from('audit_logs')
      .where('entity_type', 'seller_accounts')
      .where('entity_id', account.id)
    for (const log of logs) {
      if (log.before_state) assert.notProperty(log.before_state, 'encrypted_credentials')
      if (log.after_state) assert.notProperty(log.after_state, 'encrypted_credentials')
    }
  })

  test('historical audit snapshots are redacted when serialized', ({ assert }) => {
    const audit = new AuditLog()
    audit.beforeState = {
      password: 'hash',
      encrypted_credentials: 'old',
      nested: { accessToken: 'secret', safe: 'visible' },
    }
    audit.afterState = { raw_payload: { password: 'secret' } }
    audit.metadata = { session_token_hash: 'hash' }
    const serialized = audit.serialize()
    assert.deepEqual(serialized.beforeState, {
      password: '[REDACTED]',
      encrypted_credentials: '[REDACTED]',
      nested: { accessToken: '[REDACTED]', safe: 'visible' },
    })
    assert.deepEqual(serialized.afterState, { raw_payload: '[REDACTED]' })
    assert.deepEqual(serialized.metadata, { session_token_hash: '[REDACTED]' })
  })

  test('login lockout expires and revoked or suspended sessions are rejected', async ({
    assert,
  }) => {
    const controller = new SessionController()
    const context = fakeContext(user)
    context.values.password = 'wrong-password'
    for (let i = 0; i < 5; i++) await controller.store(context.ctx)
    await user.refresh()
    assert.equal(user.status, 'locked')
    assert.isNotNull(user.lockedUntil)

    context.values.password = 'ValidPassword123!'
    await controller.store(context.ctx)
    assert.include(context.flashes.error, 'temporarily locked')
    user.lockedUntil = DateTime.now().minus({ minutes: 1 })
    await user.save()
    await controller.store(context.ctx)
    await user.refresh()
    assert.equal(user.status, 'active')
    assert.equal(user.failedLoginAttempts, 0)
    // The session was tagged with its owner, so the registry row IS the session row.
    assert.deepEqual(context.taggedUserIds, [user.id])
    await persistSession(context.sessionId, user.id)

    const middleware = new SilentAuthMiddleware()
    await middleware.handle(context.ctx, async () => {})
    assert.isDefined(context.getUser())

    // Revoking the session row kills the very session the browser presents.
    await SessionRegistryService.revoke(context.sessionId)
    await middleware.handle(context.ctx, async () => {})
    assert.isUndefined(context.getUser())

    const other = fakeContext(user)
    other.values.password = 'ValidPassword123!'
    await controller.store(other.ctx)
    await persistSession(other.sessionId, user.id)
    // Simulate the user provider loading the changed account on the next request.
    other.getUser()!.status = 'suspended'
    await middleware.handle(other.ctx, async () => {})
    assert.isUndefined(other.getUser())

    // Suspension revokes every live session of the user in one statement.
    const revoked = await SessionRegistryService.revokeAllForUser(user.id)
    assert.isAtLeast(revoked, 1)
    assert.equal(await SessionRegistryService.countActiveForUser(user.id), 0)
  })

  test('logout revokes only the current session', async ({ assert }) => {
    const controller = new SessionController()
    const first = fakeContext(user)
    const second = fakeContext(user)
    first.values.password = second.values.password = 'ValidPassword123!'
    await controller.store(first.ctx)
    await controller.store(second.ctx)
    await persistSession(first.sessionId, user.id)
    await persistSession(second.sessionId, user.id)

    await controller.destroy(first.ctx)

    const rows = await db
      .from('sessions')
      .whereIn('id', [first.sessionId, second.sessionId])
      .select('id', 'is_revoked')
    const byId = new Map(rows.map((row: any) => [row.id, row.is_revoked]))
    assert.isTrue(byId.get(first.sessionId))
    assert.isFalse(byId.get(second.sessionId))
  })
})
