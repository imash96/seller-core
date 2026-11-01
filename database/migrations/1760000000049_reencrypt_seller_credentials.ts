import { BaseSchema } from '@adonisjs/lucid/schema'
import { decryptJson, encryptJson } from '../../app/utils/secret_box.js'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const accounts = await db
        .from('seller_accounts')
        .whereNotNull('encrypted_credentials')
        .select('id', 'encrypted_credentials')
      for (const account of accounts) {
        if (account.encrypted_credentials.startsWith('v2.')) continue
        const credentials = decryptJson(account.encrypted_credentials)
        if (credentials === null) {
          throw new Error(
            `Cannot migrate credentials for seller account ${account.id}; restore or rotate them first.`
          )
        }
        await db
          .from('seller_accounts')
          .where('id', account.id)
          .update({ encrypted_credentials: encryptJson(credentials) })
      }
    })
  }

  // Do not downgrade credentials back to the compromised legacy key.
  async down() {}
}
