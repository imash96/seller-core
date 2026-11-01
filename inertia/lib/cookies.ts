/**
 * Safe, cross-browser cookie parsing utilities.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const escapedName = name.replace(/[$()*+./?[\\\]^{|}-]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`))
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export function getCsrfToken(): string {
  const fromCookie = getCookie('XSRF-TOKEN')
  if (fromCookie) return fromCookie

  if (typeof document !== 'undefined') {
    const metaTag = document.querySelector('meta[name="csrf-token"]')
    if (metaTag) {
      const content = metaTag.getAttribute('content')
      if (content) return content
    }
  }

  return ''
}
