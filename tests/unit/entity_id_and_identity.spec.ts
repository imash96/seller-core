import { test } from '@japa/runner'
import {
  generateEntityId,
  isEntityId,
  ENTITY_ID_PATTERN,
} from '../../app/utils/generate_entity_id.js'
import {
  normalizeEmail,
  normalizePhone,
  computeAddressFingerprint,
  computeAuditChecksum,
} from '../../app/utils/identity.js'
import stateCheck from '../../app/utils/state_check.js'

test.group('Entity ID & Identity Utilities', () => {
  test('generateEntityId generates valid Crockford ULIDs with domain prefixes', ({ assert }) => {
    const prefixes = [
      'usr',
      'ord',
      'itm',
      'prd',
      'var',
      'shp',
      'clm',
      'ret',
      'tx',
      'crd',
      'not',
      'aud',
      'inv',
      'tsk',
      'syn',
      'lprc',
      'prc',
      'vprc',
      'oprc',
      'liprc',
    ]

    for (const prefix of prefixes) {
      const id = generateEntityId(prefix)
      assert.isTrue(id.startsWith(`${prefix}_`), `ID ${id} should start with prefix ${prefix}_`)
      assert.isTrue(isEntityId(id), `ID ${id} should pass isEntityId check`)
      assert.isTrue(ENTITY_ID_PATTERN.test(id), `ID ${id} must match ENTITY_ID_PATTERN`)

      const rawUlid = id.slice(prefix.length + 1)
      assert.equal(rawUlid.length, 26, `Raw ULID part of ${id} must be exactly 26 characters`)
      // Crockford Base32 excludes I, L, O, U
      assert.match(rawUlid, /^[0-9A-HJKMNP-TV-Z]{26}$/)
    }
  })

  test('generateEntityId without prefix generates valid 26-char ULID', ({ assert }) => {
    const id = generateEntityId()
    assert.equal(id.length, 26)
    assert.isTrue(isEntityId(id))
  })

  test('generateEntityId produces lexicographically monotonic and unique identifiers', ({
    assert,
  }) => {
    const ids: string[] = []
    for (let i = 0; i < 100; i++) {
      ids.push(generateEntityId('ord'))
    }

    const uniqueSet = new Set(ids)
    assert.equal(uniqueSet.size, 100, 'All 100 generated entity IDs must be unique')
  })

  test('isEntityId rejects malformed, lowercase ULID or invalid separators', ({ assert }) => {
    assert.isFalse(isEntityId(''))
    assert.isFalse(isEntityId(null))
    assert.isFalse(isEntityId(undefined))
    assert.isFalse(isEntityId(12345))
    assert.isFalse(isEntityId('ord-01K5ZQ7T9V0M8ZK5N7YQ2W4X6B')) // dash instead of underscore
    assert.isFalse(isEntityId('ord_01k5zq7t9v0m8zk5n7yq2w4x6b')) // lowercase ULID
    assert.isFalse(isEntityId('ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6')) // too short (25 chars)
    assert.isFalse(isEntityId('ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B99')) // too long (28 chars)
    assert.isFalse(isEntityId('verylongprefixthatisinvalid_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B')) // prefix > 8 chars
    assert.isFalse(isEntityId('ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6I')) // contains 'I' (invalid Crockford)
    assert.isFalse(isEntityId('ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6L')) // contains 'L' (invalid Crockford)
    assert.isFalse(isEntityId('ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6O')) // contains 'O' (invalid Crockford)
    assert.isFalse(isEntityId('ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6U')) // contains 'U' (invalid Crockford)
  })

  test('normalizeEmail strips whitespaces, downcases and handles null/undefined', ({ assert }) => {
    assert.equal(normalizeEmail('  Merchant@EXAMPLE.COM  '), 'merchant@example.com')
    assert.equal(normalizeEmail('john.doe+test@domain.co.uk'), 'john.doe+test@domain.co.uk')
    assert.isNull(normalizeEmail(''))
    assert.isNull(normalizeEmail('   '))
    assert.isNull(normalizeEmail(null))
    assert.isNull(normalizeEmail(undefined))
  })

  test('normalizePhone retains only digits and plus signs', ({ assert }) => {
    assert.equal(normalizePhone('+1 (555) 123-4567'), '+15551234567')
    assert.equal(normalizePhone('0049 162 298 6786 ext. 12'), '0049162298678612')
    assert.equal(normalizePhone('1-800-COMPANY'), '1800')
    assert.isNull(normalizePhone(''))
    assert.isNull(normalizePhone('no-phone'))
    assert.isNull(normalizePhone(null))
    assert.isNull(normalizePhone(undefined))
  })

  test('computeAddressFingerprint generates deterministic SHA-256 for duplicate matching', ({
    assert,
  }) => {
    const addr1 = {
      line1: ' 123 Main St.  Apt 4B ',
      city: 'New York ',
      stateProvince: ' NY ',
      postalCode: ' 10001 ',
      countryCode: 'us',
    }
    const addr2 = {
      line1: '123 Main St. Apt 4B',
      city: 'new york',
      stateProvince: 'ny',
      postalCode: '10001',
      countryCode: 'US',
    }
    const differentAddr = {
      line1: '124 Main St. Apt 4B',
      city: 'New York',
      stateProvince: 'NY',
      postalCode: '10001',
      countryCode: 'US',
    }

    const fp1 = computeAddressFingerprint(addr1)
    const fp2 = computeAddressFingerprint(addr2)
    const fp3 = computeAddressFingerprint(differentAddr)

    assert.equal(
      fp1,
      fp2,
      'Normalized variations of the same address must produce identical fingerprint'
    )
    assert.notEqual(fp1, fp3, 'Different addresses must produce different fingerprints')
    assert.equal(fp1.length, 64, 'SHA-256 fingerprint must be 64 hex characters')
  })

  test('computeAuditChecksum generates tamper-evident deterministic hash', ({ assert }) => {
    const entry = {
      actorUserId: 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6A',
      userId: 'usr_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B',
      action: 'order.status_update',
      entityType: 'order',
      entityId: 'ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6C',
      beforeState: { status: 'pending' },
      afterState: { status: 'shipped' },
      timestampIso: '2026-10-31T12:00:00.000Z',
    }

    const checksum1 = computeAuditChecksum(entry)
    const checksum2 = computeAuditChecksum({ ...entry })
    assert.equal(checksum1, checksum2)

    // Modifying afterState must produce a different checksum
    const tampered = computeAuditChecksum({
      ...entry,
      afterState: { status: 'cancelled' },
    })
    assert.notEqual(checksum1, tampered)
  })

  test('stateCheck resolves US, Canadian, and Mexican state codes and full names', ({ assert }) => {
    // US states
    assert.equal(stateCheck('ca', 'US'), 'California')
    assert.equal(stateCheck('california', 'united states'), 'California')
    assert.equal(stateCheck('ny', 'United States of America'), 'New York')
    assert.equal(stateCheck('tx', 'us'), 'Texas')

    // Canadian provinces
    assert.equal(stateCheck('on', 'Canada'), 'Ontario')
    assert.equal(stateCheck('ontario', 'ca'), 'Ontario')
    assert.equal(stateCheck('bc', 'canada'), 'British Columbia')
    assert.equal(stateCheck('ab', 'ca'), 'Alberta')

    // Mexican states
    assert.equal(stateCheck('ja', 'Mexico'), 'Jalisco')
    assert.equal(stateCheck('jalisco', 'mx'), 'Jalisco')

    // Unknown or other countries return uppercase state input
    assert.equal(stateCheck('Bavaria', 'Germany'), 'BAVARIA')
  })
})
