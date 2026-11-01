import { BaseSchema } from '@adonisjs/lucid/schema'

// Register permissions without granting them to existing roles. Administrators
// must explicitly grant the permissions and enable the tasks entitlement.
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      for (const action of ['*', 'read', 'create', 'update', 'delete', 'export']) {
        const suffix = action === '*' ? 'all' : action
        await db
          .table('permissions')
          .insert({
            id: `perm_tasks_${suffix}`,
            name: action === '*' ? 'Full access to tasks' : `${action} tasks`,
            slug: action === '*' ? 'tasks' : `tasks.${action}`,
            resource: 'tasks',
            action,
            description: 'Task module access',
          })
          .onConflict(['resource', 'action'])
          .ignore()
      }
    })
  }

  async down() {
    // Do not revoke administrator-assigned permissions on rollback.
  }
}
