import vine from '@vinejs/vine'
import { ENTITY_ID_PATTERN } from '../utils/generate_entity_id.js'

/**
 * Validates an entity identifier: an optionally prefixed ULID
 * (e.g. `01J8ZK9V3Q0M8ZK5N7YQ2W4X6B` or `ord_01J8ZK9V3Q0M8ZK5N7YQ2W4X6B`).
 */
export function objectId() {
  return vine.string().trim().regex(ENTITY_ID_PATTERN)
}
