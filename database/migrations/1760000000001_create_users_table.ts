import { BaseSchema } from '@adonisjs/lucid/schema'
import { UserStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('pending_activation', 'active', 'suspended', 'locked', 'deactivated');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('email', 255).notNullable().unique()
      table.string('full_name', 255).notNullable()
      table.string('phone', 50).nullable()
      table.string('password', 255).notNullable()
      table
        .enu('status', Object.values(UserStatus), {
          useNative: true,
          enumName: 'user_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(UserStatus.ACTIVE)
      table.boolean('is_super_admin').notNullable().defaultTo(false)
      table.integer('failed_login_attempts').notNullable().defaultTo(0)
      table.timestamp('locked_until', { useTz: true }).nullable()
      table.timestamp('password_changed_at', { useTz: true }).nullable()
      table.timestamp('last_login_at', { useTz: true }).nullable()
      table.string('last_login_ip', 64).nullable()
      table.string('default_currency', 3).notNullable().defaultTo('USD')
      table.string('timezone', 64).notNullable().defaultTo('UTC')
      table.jsonb('preferences').notNullable().defaultTo('{}')
      table
        .uuid('created_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['status'], 'idx_users_status')
      table.index(['created_by_user_id'], 'idx_users_created_by')
      table.check('failed_login_attempts >= 0', [], 'chk_users_failed_attempts_non_neg')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS user_status;')
    })
  }
}
