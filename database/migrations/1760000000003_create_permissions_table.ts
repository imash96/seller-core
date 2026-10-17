import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('slug', 150).notNullable().unique()
      table.string('resource', 100).notNullable()
      table.string('action', 100).notNullable()
      table.text('description').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['resource', 'action'], { indexName: 'idx_permissions_resource_action' })
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
