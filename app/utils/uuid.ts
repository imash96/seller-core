import crypto from 'node:crypto'

/**
 * Generates an RFC 9562 compliant UUIDv7 (48-bit Unix epoch ms timestamp + 74-bit CSPRNG random).
 * Provides chronological k-sortability for PostgreSQL B-tree primary key indexes while remaining
 * 100% compatible with PostgreSQL `uuid` columns and `gen_random_uuid()`.
 */
export function uuidv7(): string {
  const timestamp = BigInt(Date.now())
  const bytes = crypto.randomBytes(16)

  // 48-bit big-endian timestamp in bytes 0..5
  bytes[0] = Number((timestamp >> 40n) & 0xffn)
  bytes[1] = Number((timestamp >> 32n) & 0xffn)
  bytes[2] = Number((timestamp >> 24n) & 0xffn)
  bytes[3] = Number((timestamp >> 16n) & 0xffn)
  bytes[4] = Number((timestamp >> 8n) & 0xffn)
  bytes[5] = Number(timestamp & 0xffn)

  // Version 7 (0111) in top 4 bits of byte 6
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  // Variant RFC 4122 / 9562 (10xx) in top 2 bits of byte 8
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/**
 * Normalizes an email address for customer identity matching.
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const trimmed = email.trim().toLowerCase()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Normalizes a phone number into digits-only format for identity matching.
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^0-9+]/g, '')
  return digits.length > 0 ? digits : null
}

/**
 * Generates a deterministic SHA-256 fingerprint for a postal address to detect shared addresses.
 */
export function computeAddressFingerprint(input: {
  line1: string
  city: string
  stateProvince?: string | null
  postalCode: string
  countryCode: string
}): string {
  const canonical = [
    input.line1.trim().toLowerCase().replace(/\s+/g, ' '),
    input.city.trim().toLowerCase(),
    (input.stateProvince ?? '').trim().toLowerCase(),
    input.postalCode.trim().toLowerCase().replace(/\s+/g, ''),
    input.countryCode.trim().toUpperCase(),
  ].join('|')
  return crypto.createHash('sha256').update(canonical).digest('hex')
}

/**
 * Computes a tamper-evident SHA-256 checksum for an audit log entry.
 */
export function computeAuditChecksum(payload: {
  actorUserId: string | null
  userId: string | null
  action: string
  entityType: string
  entityId: string | null
  beforeState?: unknown
  afterState?: unknown
  timestampIso: string
}): string {
  const serialized = JSON.stringify({
    actorUserId: payload.actorUserId,
    userId: payload.userId,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId,
    beforeState: payload.beforeState ?? null,
    afterState: payload.afterState ?? null,
    timestampIso: payload.timestampIso,
  })
  return crypto.createHash('sha256').update(serialized).digest('hex')
}
