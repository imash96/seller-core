import crypto from 'node:crypto'

/**
 * Identity and audit helpers shared across services and models.
 * Entity ids are ULIDs — see app/utils/generate_entity_id.ts.
 */

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
