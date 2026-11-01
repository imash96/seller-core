import { BaseSchema } from '@adonisjs/lucid/schema'

// Schema matches the official @adonisjs/session database-store migration.
export default class extends BaseSchema {
  protected tableName = 'sessions'
  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.text('data').notNullable()
      table.string('user_id').nullable().index()
      table.timestamp('expires_at', { useTz: true }).notNullable().index()
    })
  }
  async down() {
    this.schema.dropTable(this.tableName)
  }
}
