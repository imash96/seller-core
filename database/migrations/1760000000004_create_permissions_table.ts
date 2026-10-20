import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table.string('name', 150).notNullable()
      table.string('slug', 150).notNullable()
      table.string('resource', 100).notNullable()
      table.string('action', 100).notNullable()
      table.text('description').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX uq_permissions_resource_action ON permissions (resource, action)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
