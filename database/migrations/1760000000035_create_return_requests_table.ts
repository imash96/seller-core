import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'return_requests'

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
        .string('order_line_item_id', 64)
        .notNullable()
        .references('id')
        .inTable('order_line_items')
        .onDelete('CASCADE')
      table
        .string('customer_id', 64)
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('RESTRICT')
      table.string('rma_number', 100).notNullable()
      table.string('external_return_id', 150).nullable()
      table
        .enum(
          'status',
          [
            'requested',
            'authorized',
            'rejected',
            'in_transit',
            'received',
            'inspected',
            'refunded',
            'replacement_sent',
            'closed',
          ],
          { enumName: 'return_status', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('requested')
      table
        .enum(
          'return_reason',
          [
            'defective',
            'wrong_item',
            'damaged_in_transit',
            'not_as_described',
            'changed_mind',
            'size_fit_issue',
            'late_delivery',
            'other',
          ],
          { enumName: 'return_reason', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('other')
      table
        .enum(
          'resolution_type',
          ['refund', 'partial_refund', 'replacement', 'store_credit', 'rejected'],
          { enumName: 'return_resolution_type', useNative: true, existingType: true }
        )
        .notNullable()
        .defaultTo('refund')
      table.integer('quantity_requested').notNullable()
      table.integer('quantity_approved').notNullable().defaultTo(0)
      table.integer('quantity_received').notNullable().defaultTo(0)
      table
        .enum('item_condition', ['unopened', 'like_new', 'used', 'damaged', 'unsellable'], {
          enumName: 'return_item_condition',
          useNative: true,
          existingType: true,
        })
        .nullable()
      table.boolean('restock_inventory').notNullable().defaultTo(false)
      table.string('return_carrier', 100).nullable()
      table.string('return_tracking_number', 150).nullable()
      table.text('return_label_url').nullable()
      table.string('currency_code', 3).notNullable().defaultTo('USD')
      table.decimal('return_shipping_cost', 14, 2).notNullable().defaultTo(0)
      table.decimal('restocking_fee_amount', 14, 2).notNullable().defaultTo(0)
      table.decimal('refund_amount', 14, 2).notNullable().defaultTo(0)
      table
        .string('replacement_order_id', 64)
        .nullable()
        .references('id')
        .inTable('orders')
        .onDelete('SET NULL')
      table.text('customer_comments').nullable()
      table.text('internal_notes').nullable()
      table.jsonb('evidence_images').notNullable().defaultTo('[]')
      table.jsonb('approval_history').notNullable().defaultTo('[]')
      table
        .string('reviewed_by_user_id', 64)
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('requested_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('authorized_at', { useTz: true }).nullable()
      table.timestamp('received_at', { useTz: true }).nullable()
      table.timestamp('closed_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'ALTER TABLE return_requests ADD CONSTRAINT chk_return_requests_qty_valid CHECK (quantity_requested > 0 AND quantity_approved >= 0 AND quantity_received >= 0 AND quantity_approved <= quantity_requested AND quantity_received <= quantity_requested)'
    )
    this.schema.raw(
      'ALTER TABLE return_requests ADD CONSTRAINT chk_return_requests_amounts_nonneg CHECK (return_shipping_cost >= 0 AND restocking_fee_amount >= 0 AND refund_amount >= 0)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_return_requests_user_rma ON return_requests (user_id, rma_number)'
    )
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_return_requests_order_ext_id ON return_requests (order_id, external_return_id) WHERE external_return_id IS NOT NULL'
    )
    this.schema.raw('CREATE INDEX idx_return_requests_order ON return_requests (order_id)')
    this.schema.raw(
      'CREATE INDEX idx_return_requests_order_line ON return_requests (order_line_item_id)'
    )
    this.schema.raw(
      'CREATE INDEX idx_return_requests_user_status ON return_requests (user_id, status)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
