/**
 * Shared utility functions used across pages and components.
 * Pure helpers only — no React or Astryx imports.
 */

/** Format a currency amount with Intl.NumberFormat */
export function formatMoney(currency: string | undefined, amount: unknown): string {
  const n = Number(amount ?? 0)
  const cur = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n)
  } catch {
    return `${cur} ${n.toFixed(2)}`
  }
}

/** Format a date value to locale string, returns '—' for falsy/invalid */
export function formatDate(value: unknown): string {
  if (!value) return '—'
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString()
}

/** Relative time string (e.g. "2 min ago", "3 hours ago") */
export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return formatDate(date)
}

/** Shorten a long ID string for display (e.g. "abc123…ef89") */
export function shortId(id: unknown): string {
  const s = String(id ?? '')
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s
}

/** Capitalize the first letter of a string */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** Convert snake_case or kebab-case to Title Case */
export function humanize(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Generate user initials from first/last name */
export function getUserInitials(firstName?: string, lastName?: string): string {
  if (!firstName) return '?'
  const firstInitial = firstName[0] || ''
  const lastInitial = lastName?.[0] || ''
  return (firstInitial + lastInitial).toUpperCase()
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Safe percentage calculation, returns 0 if denominator is 0 */
export function percentage(numerator: number, denominator: number, decimals = 1): number {
  if (denominator === 0) return 0
  return Number(((numerator / denominator) * 100).toFixed(decimals))
}
