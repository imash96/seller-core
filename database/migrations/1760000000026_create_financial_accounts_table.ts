import { BaseSchema } from '@adonisjs/lucid/schema'
import { FinancialAccountType, DataClassification } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'financial_accounts'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE financial_account_type AS ENUM ('bank_checking', 'bank_savings', 'cash', 'credit_card', 'marketplace_clearing', 'payment_gateway');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE data_classification AS ENUM ('business', 'household_personal');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('account_name', 150).notNullable()
      table
        .enu('account_type', Object.values(FinancialAccountType), {
          useNative: true,
          enumName: 'financial_account_type',
          existingType: true,
        })
        .notNullable()
        .defaultTo(FinancialAccountType.BANK_CHECKING)
      table.string('institution_name', 150).nullable()
      table.string('account_number_last_4', 4).nullable()
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('current_balance', 14, 2).notNullable().defaultTo(0)
      table
        .enu('data_classification', Object.values(DataClassification), {
          useNative: true,
          enumName: 'data_classification',
          existingType: true,
        })
        .notNullable()
        .defaultTo(DataClassification.BUSINESS)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id'], 'idx_financial_accounts_user')
      table.index(['user_id', 'data_classification'], 'idx_financial_accounts_classification')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS financial_account_type;')
      await db.rawQuery('DROP TYPE IF EXISTS data_classification;')
    })
  }
}
