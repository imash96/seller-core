import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'marketplace_claims'

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
        .string('order_id', 64)
        .notNullable()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')
      table
        .string('seller_account_id', 64)
        .nullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('SET NULL')
      table
        .string('customer_id', 64)
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
      table.string('claim_number', 100).notNullable()
      table.string('external_claim_id', 150).nullable()
      table
        .enum(
          'claim_type',
          [
            'a_to_z_guarantee',
            'chargeback',
            'item_not_received',
            'unauthorized_payment',
            'not_as_described',
            'other',
          ],
          { enumName: 'claim_type', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('a_to_z_guarantee')
      table
        .enum(
          'status',
          [
            'opened',
            'under_review',
            'action_required',
            'seller_funded',
            'marketplace_funded',
            'won',
            'lost',
            'appealed',
            'closed',
          ],
          { enumName: 'claim_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('opened')
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('disputed_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('seller_liability_amount', 14, 2).notNullable().defaultTo(0)
      table.text('reason').nullable()
      table.jsonb('evidence_submitted').notNullable().defaultTo('{}')
      table.timestamp('respond_by_at', { useTz: true }).nullable()
      table.timestamp('resolved_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX uq_marketplace_claims_user_number ON marketplace_claims (user_id, claim_number)'
    )
    this.schema.raw('CREATE INDEX idx_marketplace_claims_order ON marketplace_claims (order_id)')
    this.schema.raw(
      'CREATE INDEX idx_marketplace_claims_status ON marketplace_claims (user_id, status)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
