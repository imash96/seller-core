import crypto from 'node:crypto'
import env from '#start/env'

/** Version 2 derives its key from APP_KEY, unlike the original legacy format. */
function deriveKey(): Buffer {
  return crypto
    .createHash('sha256')
    .update(`seller-core:${env.get('APP_KEY').release()}`)
    .digest()
}

const legacyKey = crypto.createHash('sha256').update('seller-core:undefined').digest()

export function encryptJson(payload: unknown): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(), iv)
  const enc = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()])
  return [
    'v2',
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    enc.toString('base64'),
  ].join('.')
}

/** Legacy ciphertext is readable only to support migration and credential rotation. */
export function decryptJson<T = Record<string, unknown>>(ciphertext: string | null): T | null {
  if (!ciphertext) return null
  const parts = ciphertext.split('.')
  const isV2 = parts[0] === 'v2'
  if ((isV2 && parts.length !== 4) || (!isV2 && parts.length !== 3)) return null
  const [iv, tag, data] = isV2 ? parts.slice(1) : parts
  if (!iv || !tag || !data) return null
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      isV2 ? deriveKey() : legacyKey,
      Buffer.from(iv, 'base64')
    )
    decipher.setAuthTag(Buffer.from(tag, 'base64'))
    return JSON.parse(
      Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString(
        'utf8'
      )
    ) as T
  } catch {
    return null
  }
}
