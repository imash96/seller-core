import { BaseSchema } from '@adonisjs/lucid/schema'
import { ClaimType, ClaimStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'marketplace_claims'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE claim_type AS ENUM ('a_to_z_guarantee', 'chargeback', 'item_not_received', 'unauthorized_payment', 'nad_dispute', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE claim_status AS ENUM ('opened', 'under_review', 'action_required', 'seller_funded', 'marketplace_funded', 'won', 'lost', 'appealed', 'closed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table
        .uuid('seller_account_id')
        .nullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('SET NULL')
      table
        .uuid('customer_id')
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
      table.string('claim_number', 100).notNullable()
      table.string('external_claim_id', 150).nullable()
      table
        .enu('claim_type', Object.values(ClaimType), {
          useNative: true,
          enumName: 'claim_type',
          existingType: true,
        })
        .notNullable()
        .defaultTo(ClaimType.A_TO_Z_GUARANTEE)
      table
        .enu('status', Object.values(ClaimStatus), {
          useNative: true,
          enumName: 'claim_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(ClaimStatus.OPENED)
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('disputed_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('seller_liability_amount', 14, 2).notNullable().defaultTo(0)
      table.text('reason').nullable()
      table.jsonb('evidence_submitted').notNullable().defaultTo('{}')
      table.timestamp('respond_by_at', { useTz: true }).nullable()
      table.timestamp('resolved_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'claim_number'], { indexName: 'uq_marketplace_claims_user_number' })
      table.index(['order_id'], 'idx_marketplace_claims_order')
      table.index(['user_id', 'status'], 'idx_marketplace_claims_status')
      table.check(
        'disputed_amount >= 0 AND seller_liability_amount >= 0',
        [],
        'chk_marketplace_claims_amounts_non_neg'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS claim_type;')
      await db.rawQuery('DROP TYPE IF EXISTS claim_status;')
    })
  }
}
