import { BaseSchema } from '@adonisjs/lucid/schema'
import { TaskType, TaskPriority, TaskStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'tasks_reminders'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE task_type AS ENUM ('credit_card_due', 'invoice_due', 'return_review', 'fraud_review', 'restock_alert', 'claim_deadline', 'general');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'snoozed', 'dismissed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('related_entity_type', 100).nullable()
      table.uuid('related_entity_id').nullable()
      table
        .uuid('credit_card_id')
        .nullable()
        .references('id')
        .inTable('credit_cards')
        .onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table
        .enu('task_type', Object.values(TaskType), {
          useNative: true,
          enumName: 'task_type',
          existingType: true,
        })
        .notNullable()
        .defaultTo(TaskType.GENERAL)
      table
        .enu('priority', Object.values(TaskPriority), {
          useNative: true,
          enumName: 'task_priority',
          existingType: true,
        })
        .notNullable()
        .defaultTo(TaskPriority.MEDIUM)
      table
        .enu('status', Object.values(TaskStatus), {
          useNative: true,
          enumName: 'task_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(TaskStatus.PENDING)
      table.timestamp('due_at', { useTz: true }).notNullable()
      table.timestamp('remind_at', { useTz: true }).nullable()
      table.timestamp('completed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id', 'status', 'due_at'], 'idx_tasks_reminders_user_status_due')
      table.index(['credit_card_id'], 'idx_tasks_reminders_card')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS task_type;')
      await db.rawQuery('DROP TYPE IF EXISTS task_priority;')
      await db.rawQuery('DROP TYPE IF EXISTS task_status;')
    })
  }
}
