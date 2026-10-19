import { ulid } from 'ulid'

/**
 * Generate a composed id based on the input parameters and return either the id
 * if it exists or the generated one.
 *
 * Every primary key in the platform is a ULID string (26 chars, lexicographically
 * sortable, cryptographically random). An optional short entity prefix makes ids
 * self-describing in URLs, logs and error messages, e.g. `ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B`.
 *
 * @param prefix Optional entity prefix (e.g. 'ord', 'cust')
 */
export function generateEntityId(prefix?: string): string {
  const id = ulid()
  prefix = prefix ? `${prefix}_` : ''
  return `${prefix}${id}`
}

/**
 * Pattern accepted for entity identifiers: optional lowercase prefix + ULID.
 */
export const ENTITY_ID_PATTERN = /^([a-z]{2,8}_)?[0-9A-HJKMNP-TV-Z]{26}$/

/**
 * True when the given value is a well-formed entity identifier.
 */
export function isEntityId(value: unknown): value is string {
  return typeof value === 'string' && ENTITY_ID_PATTERN.test(value)
}
