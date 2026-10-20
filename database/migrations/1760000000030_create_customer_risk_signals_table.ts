import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customer_risk_signals'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .string('customer_id', 64)
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('CASCADE')
      table
        .string('order_id', 64)
        .nullable()
        .references('id')
        .inTable('orders')
        .onDelete('SET NULL')
      table
        .enum(
          'signal_type',
          [
            'shared_address_mismatch',
            'proxy_email_change',
            'repeated_chargebacks',
            'high_return_rate',
            'velocity_spike',
            'address_verification_failed',
            'manual_flag',
          ],
          { enumName: 'risk_signal_type', useNative: true, existingType: true }
        )
        .notNullable()
      table
        .enum('severity', ['info', 'low', 'medium', 'high', 'critical'], {
          enumName: 'risk_severity',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('low')
      table
        .enum(
          'review_status',
          ['pending_review', 'investigating', 'confirmed_risk', 'false_positive', 'resolved'],
          { enumName: 'risk_review_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('pending_review')
      table.text('reason').notNullable()
      table.jsonb('evidence').notNullable().defaultTo('{}')
      table
        .string('reviewed_by_user_id', 64)
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('reviewed_at', { useTz: true }).nullable()
      table.text('review_notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX idx_customer_risk_signals_status ON customer_risk_signals (user_id, review_status)'
    )
    this.schema.raw(
      'CREATE INDEX idx_customer_risk_signals_customer ON customer_risk_signals (customer_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_customer_risk_signals_order ON customer_risk_signals (order_id)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
