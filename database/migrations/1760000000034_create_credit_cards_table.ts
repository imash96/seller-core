import { BaseSchema } from '@adonisjs/lucid/schema'
import { CreditCardStatus, DataClassification } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'credit_cards'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE credit_card_status AS ENUM ('active', 'frozen', 'expired', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('financial_account_id')
        .nullable()
        .references('id')
        .inTable('financial_accounts')
        .onDelete('SET NULL')
      table.string('card_label', 150).notNullable()
      table.string('brand_name', 64).notNullable()
      table.string('issuer_bank', 150).nullable()
      table.string('cardholder_name', 150).notNullable()
      table.string('last_4_digits', 4).notNullable()
      table.integer('exp_month').notNullable()
      table.integer('exp_year').notNullable()
      table.string('vault_token_reference', 255).nullable()
      table.text('logo_url').nullable()
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('credit_limit', 14, 2).notNullable().defaultTo(0)
      table.decimal('current_balance', 14, 2).notNullable().defaultTo(0)
      table.decimal('statement_balance', 14, 2).notNullable().defaultTo(0)
      table.decimal('minimum_payment_due', 14, 2).notNullable().defaultTo(0)
      table.integer('billing_cycle_day').nullable()
      table.integer('payment_due_day').nullable()
      table.date('next_payment_due_date').nullable()
      table.integer('reminder_days_before').notNullable().defaultTo(5)
      table.boolean('auto_pay_enabled').notNullable().defaultTo(false)
      table
        .enu('data_classification', Object.values(DataClassification), {
          useNative: true,
          enumName: 'data_classification',
          existingType: true,
        })
        .notNullable()
        .defaultTo(DataClassification.BUSINESS)
      table
        .enu('status', Object.values(CreditCardStatus), {
          useNative: true,
          enumName: 'credit_card_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(CreditCardStatus.ACTIVE)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id'], 'idx_credit_cards_user')
      table.index(['user_id', 'next_payment_due_date'], 'idx_credit_cards_due_date')
      table.check(
        'exp_month BETWEEN 1 AND 12 AND exp_year >= 2020 AND char_length(last_4_digits) = 4 AND credit_limit >= 0 AND minimum_payment_due >= 0',
        [],
        'chk_credit_cards_metadata_valid'
      )
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS credit_card_status;')
    })
  }
}
