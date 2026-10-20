import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Creates every PostgreSQL enum type up-front (idempotent).
 * Table migrations reuse them via table.enum(..., { useNative: true, existingType: true }).
 * Rollback drops the types only after all dependent tables have been dropped
 * (migrations roll back in reverse order) — plain DROP TYPE (no CASCADE) fails
 * loudly instead of silently dropping dependent columns.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE user_status AS ENUM ('pending_activation', 'active', 'suspended', 'locked', 'deactivated');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE permission_effect AS ENUM ('allow', 'deny');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE channel_type AS ENUM ('marketplace', 'webstore', 'shopping_feed', 'custom');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE seller_account_status AS ENUM ('pending_setup', 'active', 'auth_expired', 'rate_limited', 'suspended', 'disconnected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE health_status AS ENUM ('healthy', 'warning', 'critical', 'unknown');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE sync_job_type AS ENUM ('order_import', 'catalog_sync', 'inventory_sync', 'tracking_push', 'settlement_import', 'manual_bulk_import', 'export');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE sync_job_status AS ENUM ('queued', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE customer_risk_level AS ENUM ('low', 'medium', 'high', 'under_review', 'cleared');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE address_type AS ENUM ('shipping', 'billing', 'both');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE risk_signal_type AS ENUM ('shared_address_mismatch', 'proxy_email_change', 'repeated_chargebacks', 'high_return_rate', 'velocity_spike', 'address_verification_failed', 'manual_flag');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE risk_severity AS ENUM ('info', 'low', 'medium', 'high', 'critical');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE risk_review_status AS ENUM ('pending_review', 'investigating', 'confirmed_risk', 'false_positive', 'resolved');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived', 'discontinued');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE variant_status AS ENUM ('active', 'inactive', 'out_of_stock', 'discontinued');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE listing_status AS ENUM ('draft', 'active', 'paused', 'suppressed', 'ended', 'error');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE publication_status AS ENUM ('unpublished', 'queued', 'published', 'failed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE entity_sync_status AS ENUM ('not_applicable', 'synced', 'pending', 'error', 'stale');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE order_source_type AS ENUM ('manual', 'marketplace_import', 'api_bulk', 'webstore', 'replacement');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE order_status AS ENUM ('draft', 'pending', 'confirmed', 'processing', 'partially_fulfilled', 'fulfilled', 'delivered', 'cancelled', 'on_hold');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE order_payment_status AS ENUM ('unpaid', 'authorized', 'paid', 'partially_refunded', 'refunded', 'chargeback', 'voided');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE fulfillment_status AS ENUM ('unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled', 'returned');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE shipment_status AS ENUM ('pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'delayed', 'exception', 'failed', 'returned_to_sender');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE invoice_payment_status AS ENUM ('unpaid', 'partially_paid', 'paid', 'disputed', 'overdue', 'voided');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE invoice_reconciliation_status AS ENUM ('unreconciled', 'matched', 'variance_detected', 'resolved');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE shipping_charge_type AS ENUM ('base_freight', 'fuel_surcharge', 'residential_fee', 'remote_area_surcharge', 'customs_duty', 'tax', 'signature_fee', 'dimensional_weight_adjustment', 'address_correction', 'return_shipping', 'other');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE return_status AS ENUM ('requested', 'authorized', 'rejected', 'in_transit', 'received', 'inspected', 'refunded', 'replacement_sent', 'closed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE return_reason AS ENUM ('defective', 'wrong_item', 'damaged_in_transit', 'not_as_described', 'changed_mind', 'size_fit_issue', 'late_delivery', 'other');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE return_resolution_type AS ENUM ('refund', 'partial_refund', 'replacement', 'store_credit', 'rejected');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE return_item_condition AS ENUM ('unopened', 'like_new', 'used', 'damaged', 'unsellable');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE refund_status AS ENUM ('pending', 'processed', 'failed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE claim_type AS ENUM ('a_to_z_guarantee', 'chargeback', 'item_not_received', 'unauthorized_payment', 'not_as_described', 'other');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE claim_status AS ENUM ('opened', 'under_review', 'action_required', 'seller_funded', 'marketplace_funded', 'won', 'lost', 'appealed', 'closed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE financial_account_type AS ENUM ('bank_checking', 'bank_savings', 'cash', 'credit_card', 'marketplace_clearing', 'payment_gateway');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE data_classification AS ENUM ('business', 'household_personal');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE credit_card_status AS ENUM ('active', 'frozen', 'expired', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE card_channel_usage AS ENUM ('ad_spend', 'subscription_fee', 'chargeback_backup', 'shipping_labels', 'primary_billing');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE finance_category_type AS ENUM ('income', 'expense');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE finance_cost_bucket AS ENUM ('cogs', 'shipping', 'marketplace_fee', 'marketing', 'software', 'operations', 'manufacturing', 'tax', 'personal', 'other_income', 'sales_revenue');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE financial_transaction_type AS ENUM ('income', 'expense', 'transfer', 'credit_card_payment', 'refund_payout', 'marketplace_settlement');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE financial_transaction_status AS ENUM ('pending', 'posted', 'settled', 'reconciled', 'voided', 'overdue');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE task_type AS ENUM ('credit_card_due', 'confirm_shipment', 'message_reply', 'invoice_due', 'return_review', 'fraud_review', 'restock_alert', 'claim_deadline', 'general');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'snoozed', 'dismissed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
    this.schema.raw(`DO $$ BEGIN
      CREATE TYPE outbox_event_status AS ENUM ('pending', 'processing', 'published', 'failed', 'dead_letter');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
  }

  async down() {
    this.schema.raw('DROP TYPE IF EXISTS outbox_event_status')
    this.schema.raw('DROP TYPE IF EXISTS task_status')
    this.schema.raw('DROP TYPE IF EXISTS task_priority')
    this.schema.raw('DROP TYPE IF EXISTS task_type')
    this.schema.raw('DROP TYPE IF EXISTS financial_transaction_status')
    this.schema.raw('DROP TYPE IF EXISTS financial_transaction_type')
    this.schema.raw('DROP TYPE IF EXISTS finance_cost_bucket')
    this.schema.raw('DROP TYPE IF EXISTS finance_category_type')
    this.schema.raw('DROP TYPE IF EXISTS card_channel_usage')
    this.schema.raw('DROP TYPE IF EXISTS credit_card_status')
    this.schema.raw('DROP TYPE IF EXISTS data_classification')
    this.schema.raw('DROP TYPE IF EXISTS financial_account_type')
    this.schema.raw('DROP TYPE IF EXISTS claim_status')
    this.schema.raw('DROP TYPE IF EXISTS claim_type')
    this.schema.raw('DROP TYPE IF EXISTS refund_status')
    this.schema.raw('DROP TYPE IF EXISTS return_item_condition')
    this.schema.raw('DROP TYPE IF EXISTS return_resolution_type')
    this.schema.raw('DROP TYPE IF EXISTS return_reason')
    this.schema.raw('DROP TYPE IF EXISTS return_status')
    this.schema.raw('DROP TYPE IF EXISTS shipping_charge_type')
    this.schema.raw('DROP TYPE IF EXISTS invoice_reconciliation_status')
    this.schema.raw('DROP TYPE IF EXISTS invoice_payment_status')
    this.schema.raw('DROP TYPE IF EXISTS shipment_status')
    this.schema.raw('DROP TYPE IF EXISTS fulfillment_status')
    this.schema.raw('DROP TYPE IF EXISTS order_payment_status')
    this.schema.raw('DROP TYPE IF EXISTS order_status')
    this.schema.raw('DROP TYPE IF EXISTS order_source_type')
    this.schema.raw('DROP TYPE IF EXISTS entity_sync_status')
    this.schema.raw('DROP TYPE IF EXISTS publication_status')
    this.schema.raw('DROP TYPE IF EXISTS listing_status')
    this.schema.raw('DROP TYPE IF EXISTS variant_status')
    this.schema.raw('DROP TYPE IF EXISTS product_status')
    this.schema.raw('DROP TYPE IF EXISTS risk_review_status')
    this.schema.raw('DROP TYPE IF EXISTS risk_severity')
    this.schema.raw('DROP TYPE IF EXISTS risk_signal_type')
    this.schema.raw('DROP TYPE IF EXISTS address_type')
    this.schema.raw('DROP TYPE IF EXISTS customer_risk_level')
    this.schema.raw('DROP TYPE IF EXISTS sync_job_status')
    this.schema.raw('DROP TYPE IF EXISTS sync_job_type')
    this.schema.raw('DROP TYPE IF EXISTS health_status')
    this.schema.raw('DROP TYPE IF EXISTS seller_account_status')
    this.schema.raw('DROP TYPE IF EXISTS channel_type')
    this.schema.raw('DROP TYPE IF EXISTS permission_effect')
    this.schema.raw('DROP TYPE IF EXISTS user_status')
  }
}
