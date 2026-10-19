import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('type', 100).notNullable()
      table.string('title', 255).notNullable()
      table.text('body').nullable()
      table.string('entity_type', 100).nullable()
      table.string('entity_id', 64).nullable()
      table.string('channel', 32).notNullable().defaultTo('in_app')
      table.string('recipient_address', 255).nullable()
      table.boolean('is_read').notNullable().defaultTo(false)
      table.timestamp('sent_at', { useTz: true }).nullable()
      table.timestamp('read_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      "ALTER TABLE notifications ADD CONSTRAINT chk_notifications_channel CHECK (channel IN ('in_app','email','sms'))"
    )
    this.schema.raw(
      'CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at)'
    )
    this.schema.raw(
      'CREATE INDEX idx_notifications_entity ON notifications (entity_type, entity_id)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
