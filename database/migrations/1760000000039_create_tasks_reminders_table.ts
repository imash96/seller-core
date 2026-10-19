import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks_reminders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('related_entity_type', 100).nullable()
      table.string('related_entity_id', 64).nullable()
      table
        .string('credit_card_id', 64)
        .nullable()
        .references('id')
        .inTable('credit_cards')
        .onDelete('SET NULL')
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table
        .enum(
          'task_type',
          [
            'credit_card_due',
            'confirm_shipment',
            'message_reply',
            'invoice_due',
            'return_review',
            'fraud_review',
            'restock_alert',
            'claim_deadline',
            'general',
          ],
          { enumName: 'task_type', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('general')
      table
        .enum('priority', ['low', 'medium', 'high', 'urgent'], {
          enumName: 'task_priority',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('medium')
      table
        .enum('status', ['pending', 'in_progress', 'completed', 'snoozed', 'dismissed'], {
          enumName: 'task_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('pending')
      table.timestamp('due_at', { useTz: true }).notNullable()
      table.timestamp('remind_at', { useTz: true }).nullable()
      table.timestamp('completed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX idx_tasks_reminders_user_status_due ON tasks_reminders (user_id, status, due_at)'
    )
    this.schema.raw('CREATE INDEX idx_tasks_reminders_card ON tasks_reminders (credit_card_id)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
