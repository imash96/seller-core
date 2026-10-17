import { BaseSchema } from '@adonisjs/lucid/schema'
import { PermissionEffect } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'role_permissions'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE permission_effect AS ENUM ('allow', 'deny');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE')
      table
        .uuid('permission_id')
        .notNullable()
        .references('id')
        .inTable('permissions')
        .onDelete('CASCADE')
      table
        .enu('effect', Object.values(PermissionEffect), {
          useNative: true,
          enumName: 'permission_effect',
          existingType: true,
        })
        .notNullable()
        .defaultTo(PermissionEffect.ALLOW)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['role_id', 'permission_id'], { indexName: 'uq_role_permissions_role_perm' })
      table.index(['permission_id'], 'idx_role_permissions_perm')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS permission_effect;')
    })
  }
}
