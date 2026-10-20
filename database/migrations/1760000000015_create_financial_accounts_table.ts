import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'financial_accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).notNullable().primary()
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('account_name', 150).notNullable()
      table
        .enum(
          'account_type',
          [
            'bank_checking',
            'bank_savings',
            'cash',
            'credit_card',
            'marketplace_clearing',
            'payment_gateway',
          ],
          { enumName: 'financial_account_type', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('bank_checking')
      table.string('institution_name', 150).nullable()
      table.string('account_number_last_4', 4).nullable()
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('current_balance', 14, 2).notNullable().defaultTo(0)
      table
        .enum('data_classification', ['business', 'household_personal'], {
          enumName: 'data_classification',
          useNative: true,
          existingType: true,
        })
        .notNullable()
        .defaultTo('business')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      "ALTER TABLE financial_accounts ADD CONSTRAINT chk_financial_accounts_last4 CHECK (account_number_last_4 IS NULL OR account_number_last_4 ~ '^[0-9]{4}$')"
    )
    this.schema.raw('CREATE INDEX idx_financial_accounts_user ON financial_accounts (user_id)')
    this.schema.raw(
      'CREATE INDEX idx_financial_accounts_classification ON financial_accounts (user_id, data_classification)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
