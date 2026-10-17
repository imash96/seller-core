import { BaseSchema } from '@adonisjs/lucid/schema'
import { RiskSignalType, RiskSeverity, RiskReviewStatus } from '../../app/enums/index.js'

export default class extends BaseSchema {
  protected tableName = 'customer_risk_signals'

  async up() {
    await this.db.rawQuery(`
      DO $$ BEGIN
        CREATE TYPE risk_signal_type AS ENUM ('shared_address_mismatch', 'proxy_email_change', 'repeated_chargebacks', 'high_return_rate', 'velocity_spike', 'address_verification_failed', 'manual_flag');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE risk_severity AS ENUM ('info', 'low', 'medium', 'high', 'critical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE risk_review_status AS ENUM ('pending_review', 'investigating', 'confirmed_risk', 'false_positive', 'resolved');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('customer_id')
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('CASCADE')
      table.uuid('order_id').nullable()
      table
        .enu('signal_type', Object.values(RiskSignalType), {
          useNative: true,
          enumName: 'risk_signal_type',
          existingType: true,
        })
        .notNullable()
      table
        .enu('severity', Object.values(RiskSeverity), {
          useNative: true,
          enumName: 'risk_severity',
          existingType: true,
        })
        .notNullable()
        .defaultTo(RiskSeverity.LOW)
      table
        .enu('review_status', Object.values(RiskReviewStatus), {
          useNative: true,
          enumName: 'risk_review_status',
          existingType: true,
        })
        .notNullable()
        .defaultTo(RiskReviewStatus.PENDING_REVIEW)
      table.text('reason').notNullable()
      table.jsonb('evidence').notNullable().defaultTo('{}')
      table
        .uuid('reviewed_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('reviewed_at', { useTz: true }).nullable()
      table.text('review_notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id', 'review_status'], 'idx_customer_risk_signals_status')
      table.index(['customer_id'], 'idx_customer_risk_signals_customer')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
    this.defer(async (db) => {
      await db.rawQuery('DROP TYPE IF EXISTS risk_signal_type;')
      await db.rawQuery('DROP TYPE IF EXISTS risk_severity;')
      await db.rawQuery('DROP TYPE IF EXISTS risk_review_status;')
    })
  }
}
