import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'credit_card_seller_accounts'

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
        .string('credit_card_id', 64)
        .notNullable()
        .references('id')
        .inTable('credit_cards')
        .onDelete('CASCADE')
      table
        .string('seller_account_id', 64)
        .notNullable()
        .references('id')
        .inTable('seller_accounts')
        .onDelete('CASCADE')
      table
        .enum(
          'usage_purpose',
          [
            'ad_spend',
            'subscription_fee',
            'chargeback_backup',
            'shipping_labels',
            'primary_billing',
          ],
          { enumName: 'card_channel_usage', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('primary_billing')
      table.boolean('is_primary').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE UNIQUE INDEX uq_card_seller_accounts_purpose ON credit_card_seller_accounts (credit_card_id, seller_account_id, usage_purpose)'
    )
    this.schema.raw(
      'CREATE INDEX idx_card_seller_accounts_seller ON credit_card_seller_accounts (seller_account_id)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
