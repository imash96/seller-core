import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('role_id', 64)
        .notNullable()
        .references('id')
        .inTable('roles')
        .onDelete('CASCADE')
      table
        .string('permission_id', 64)
        .notNullable()
        .references('id')
        .inTable('permissions')
        .onDelete('CASCADE')
      table
        .enum('effect', ['allow', 'deny'], {
          enumName: 'permission_effect',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('allow')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX uq_role_permissions_role_perm ON role_permissions (role_id, permission_id)'
    )
    this.schema.raw('CREATE INDEX idx_role_permissions_perm ON role_permissions (permission_id)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
