/** Validate deployment-only settings before binding the public HTTP server. */
export function validateProductionConfig(input: {
  nodeEnv?: string
  appKey?: string
  appUrl?: string
  sessionDriver?: string
}) {
  if (input.nodeEnv !== 'production') return
  const key = input.appKey ?? ''
  if (key.length < 32 || new Set(key).size < 12 || /^(1234567890|password|changeme)/i.test(key)) {
    throw new Error(
      'Production APP_KEY must be a unique, high-entropy secret of at least 32 characters. Generate one securely; do not use an example key.'
    )
  }
  let url: URL
  try {
    url = new URL(input.appUrl ?? '')
  } catch {
    throw new Error('Production APP_URL must be a valid HTTPS URL.')
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'].includes(url.hostname)
  ) {
    throw new Error('Production APP_URL must be a public HTTPS URL without credentials.')
  }
  if (!['cookie', 'database'].includes(input.sessionDriver ?? ''))
    throw new Error('Production SESSION_DRIVER must be cookie or database, not memory.')
}
