import { BaseSchema } from '@adonisjs/lucid/schema'
import { QueueSchemaService } from '@adonisjs/queue'

export default class extends BaseSchema {
  async up() {
    // Provided by @adonisjs/queue — creates queue_jobs + queue_schedules
    // with correct indexes. Uses the primary DB connection.
    const svc = new QueueSchemaService(this.db.getWriteClient())
    await svc.createJobsTable()
    await svc.createSchedulesTable()
  }

  async down() {
    const svc = new QueueSchemaService(this.db.getWriteClient())
    await svc.dropSchedulesTable()
    await svc.dropJobsTable()
  }
}
