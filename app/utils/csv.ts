/** Escape CSV cells and neutralize spreadsheet formulas in user-provided text. */
export function csvCell(value: unknown): string {
  let text = String(value ?? '')
  // eslint-disable-next-line no-control-regex
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
