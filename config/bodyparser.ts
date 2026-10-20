import { defineConfig } from '@adonisjs/core/bodyparser'

/**
 * BodyParser — how every HTTP request body is interpreted.
 *
 * Mounted as `@adonisjs/core/bodyparser_middleware` in the router stack
 * (start/kernel.ts). The middleware inspects Content-Type and delegates
 * to the matching parser below.
 *
 * Security-relevant choices:
 *  - JSON / form / multipart each have explicit `types` allowlists so
 *    unknown content types are rejected before reaching controllers.
 *  - `convertEmptyStringsToNull` normalizes "" → null so validators can
 *    use `optional().nullable()` consistently and the DB never stores
 *    ambiguous empty strings.
 *  - Multipart `limit` caps uploads (product images, bulk CSV) and
 *    `autoProcess` moves files to tmpDir for safe streaming validation.
 */
const bodyParserConfig = defineConfig({
  /**
   * Only these HTTP methods are examined for a body. GET/HEAD/OPTIONS
   * never carry one, so skipping them avoids false positives.
   */
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * JSON — primary API and Inertia form payloads.
   * The `csp-report` type is needed for `reportOnly` CSP violations.
   */
  json: {
    convertEmptyStringsToNull: true,
    limit: '1mb',
    strict: true,
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },

  /**
   * URL-encoded — classic HTML forms.
   */
  form: {
    convertEmptyStringsToNull: true,
    limit: '1mb',
    types: ['application/x-www-form-urlencoded'],
  },

  /**
   * Multipart — file uploads.
   *
   * Files are auto-processed into `tmp/` (see config/app.ts tmpDir).
   * Controllers receive them via `request.file('field')` and must
   * validate with vine before moving to permanent storage.
   *
   * Increase `limit` per-field via `request.file('avatar', { size: '2mb' })`
   * rather than raising the global cap.
   */
  multipart: {
    autoProcess: true,
    convertEmptyStringsToNull: true,
    processManually: [],
    limit: '20mb',
    types: ['multipart/form-data'],
  },
})

export default bodyParserConfig
