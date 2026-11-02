import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'credit_cards'

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
        .string('financial_account_id', 64)
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
      table.jsonb('credit_limit').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('current_balance').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table.jsonb('statement_balance').notNullable().defaultTo('{"currency_code":"USD","amount":0}')
      table
        .jsonb('minimum_payment_due')
        .notNullable()
        .defaultTo('{"currency_code":"USD","amount":0}')
      table.integer('billing_cycle_day').nullable()
      table.integer('payment_due_day').nullable()
      table.date('next_payment_due_date').nullable()
      table.integer('reminder_days_before').notNullable().defaultTo(5)
      table.boolean('auto_pay_enabled').notNullable().defaultTo(false)
      table
        .enum('data_classification', ['business', 'household_personal'], {
          enumName: 'data_classification',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('business')
      table
        .enum('status', ['active', 'frozen', 'expired', 'cancelled'], {
          enumName: 'credit_card_status',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('active')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      "ALTER TABLE credit_cards ADD CONSTRAINT chk_credit_cards_metadata_valid CHECK (exp_month BETWEEN 1 AND 12 AND exp_year BETWEEN 2000 AND 2100 AND last_4_digits ~ '^[0-9]{4}$')"
    )
    this.schema.raw(
      'ALTER TABLE credit_cards ADD CONSTRAINT chk_credit_cards_credit_limit_money CHECK (is_valid_price_money(credit_limit, false))'
    )
    this.schema.raw(
      'ALTER TABLE credit_cards ADD CONSTRAINT chk_credit_cards_current_balance_money CHECK (is_valid_price_money(current_balance, false))'
    )
    this.schema.raw(
      'ALTER TABLE credit_cards ADD CONSTRAINT chk_credit_cards_statement_balance_money CHECK (is_valid_price_money(statement_balance, false))'
    )
    this.schema.raw(
      'ALTER TABLE credit_cards ADD CONSTRAINT chk_credit_cards_minimum_payment_due_money CHECK (is_valid_price_money(minimum_payment_due, false))'
    )
    this.schema.raw('CREATE INDEX idx_credit_cards_user ON credit_cards (user_id)')
    this.schema.raw(
      'CREATE INDEX idx_credit_cards_due_date ON credit_cards (user_id, next_payment_due_date)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
