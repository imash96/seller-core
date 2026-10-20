import crypto from 'node:crypto'
import app from '@adonisjs/core/services/app'

/**
 * AES-256-GCM secret box for marketplace credential payloads.
 *
 * Ciphertext format: base64(iv).base64(authTag).base64(ciphertext)
 * The encryption key is derived from the application APP_KEY; raw secrets are
 * never persisted.
 */
function deriveKey(): Buffer {
  const appKey = String(app.config.get('app.appKey'))
  return crypto.createHash('sha256').update(`seller-core:${appKey}`).digest()
}

export function encryptJson(payload: unknown): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(), iv)
  const plaintext = JSON.stringify(payload)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.')
}

export function decryptJson<T = Record<string, unknown>>(ciphertext: string | null): T | null {
  if (!ciphertext) {
    return null
  }
  const [ivB64, tagB64, dataB64] = ciphertext.split('.')
  if (!ivB64 || !tagB64 || !dataB64) {
    return null
  }
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      deriveKey(),
      Buffer.from(ivB64, 'base64')
    )
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
    return JSON.parse(dec.toString('utf8')) as T
  } catch {
    return null
  }
}
