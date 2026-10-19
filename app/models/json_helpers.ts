/**
 * jsonb column helper.
 *
 * node-postgres formats JavaScript arrays as PostgreSQL array literals
 * (`{a,b}`) which jsonb columns reject. Every jsonb column therefore goes
 * through `prepare` with this serializer. Values are returned untouched on
 * read (the pg driver already parses jsonb into JS values).
 */
export function prepareJson(value: unknown): string | null | undefined {
  if (value === null || value === undefined) {
    return value
  }
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}
