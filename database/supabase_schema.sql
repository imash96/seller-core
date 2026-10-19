-- Seller Core schema — generated from applied migrations (local PG 18)
-- Target: Supabase (PG 17). Apply in order; then insert adonis_schema rows.

-- ---------- ENUM TYPES ----------
CREATE TYPE address_type AS ENUM ('shipping', 'billing', 'both');
CREATE TYPE card_channel_usage AS ENUM ('ad_spend', 'subscription_fee', 'chargeback_backup', 'shipping_labels', 'primary_billing');
CREATE TYPE channel_type AS ENUM ('marketplace', 'webstore', 'shopping_feed', 'custom');
CREATE TYPE claim_status AS ENUM ('opened', 'under_review', 'action_required', 'seller_funded', 'marketplace_funded', 'won', 'lost', 'appealed', 'closed');
CREATE TYPE claim_type AS ENUM ('a_to_z_guarantee', 'chargeback', 'item_not_received', 'unauthorized_payment', 'not_as_described', 'other');
CREATE TYPE credit_card_status AS ENUM ('active', 'frozen', 'expired', 'cancelled');
CREATE TYPE customer_risk_level AS ENUM ('low', 'medium', 'high', 'under_review', 'cleared');
CREATE TYPE data_classification AS ENUM ('business', 'household_personal');
CREATE TYPE entity_sync_status AS ENUM ('not_applicable', 'synced', 'pending', 'error', 'stale');
CREATE TYPE finance_category_type AS ENUM ('income', 'expense');
CREATE TYPE finance_cost_bucket AS ENUM ('cogs', 'shipping', 'marketplace_fee', 'marketing', 'software', 'operations', 'manufacturing', 'tax', 'personal', 'other_income', 'sales_revenue');
CREATE TYPE financial_account_type AS ENUM ('bank_checking', 'bank_savings', 'cash', 'credit_card', 'marketplace_clearing', 'payment_gateway');
CREATE TYPE financial_transaction_status AS ENUM ('pending', 'posted', 'settled', 'reconciled', 'voided', 'overdue');
CREATE TYPE financial_transaction_type AS ENUM ('income', 'expense', 'transfer', 'credit_card_payment', 'refund_payout', 'marketplace_settlement');
CREATE TYPE fulfillment_status AS ENUM ('unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled', 'returned');
CREATE TYPE health_status AS ENUM ('healthy', 'warning', 'critical', 'unknown');
CREATE TYPE invoice_payment_status AS ENUM ('unpaid', 'partially_paid', 'paid', 'disputed', 'overdue', 'voided');
CREATE TYPE invoice_reconciliation_status AS ENUM ('unreconciled', 'matched', 'variance_detected', 'resolved');
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'paused', 'suppressed', 'ended', 'error');
CREATE TYPE order_payment_status AS ENUM ('unpaid', 'authorized', 'paid', 'partially_refunded', 'refunded', 'chargeback', 'voided');
CREATE TYPE order_source_type AS ENUM ('manual', 'marketplace_import', 'api_bulk', 'webstore', 'replacement');
CREATE TYPE order_status AS ENUM ('draft', 'pending', 'confirmed', 'processing', 'partially_fulfilled', 'fulfilled', 'delivered', 'cancelled', 'on_hold');
CREATE TYPE outbox_event_status AS ENUM ('pending', 'processing', 'published', 'failed', 'dead_letter');
CREATE TYPE permission_effect AS ENUM ('allow', 'deny');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived', 'discontinued');
CREATE TYPE publication_status AS ENUM ('unpublished', 'queued', 'published', 'failed');
CREATE TYPE refund_status AS ENUM ('pending', 'processed', 'failed', 'cancelled');
CREATE TYPE return_item_condition AS ENUM ('unopened', 'like_new', 'used', 'damaged', 'unsellable');
CREATE TYPE return_reason AS ENUM ('defective', 'wrong_item', 'damaged_in_transit', 'not_as_described', 'changed_mind', 'size_fit_issue', 'late_delivery', 'other');
CREATE TYPE return_resolution_type AS ENUM ('refund', 'partial_refund', 'replacement', 'store_credit', 'rejected');
CREATE TYPE return_status AS ENUM ('requested', 'authorized', 'rejected', 'in_transit', 'received', 'inspected', 'refunded', 'replacement_sent', 'closed');
CREATE TYPE risk_review_status AS ENUM ('pending_review', 'investigating', 'confirmed_risk', 'false_positive', 'resolved');
CREATE TYPE risk_severity AS ENUM ('info', 'low', 'medium', 'high', 'critical');
CREATE TYPE risk_signal_type AS ENUM ('shared_address_mismatch', 'proxy_email_change', 'repeated_chargebacks', 'high_return_rate', 'velocity_spike', 'address_verification_failed', 'manual_flag');
CREATE TYPE seller_account_status AS ENUM ('pending_setup', 'active', 'auth_expired', 'rate_limited', 'suspended', 'disconnected');
CREATE TYPE shipment_status AS ENUM ('pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'delayed', 'exception', 'failed', 'returned_to_sender');
CREATE TYPE shipping_charge_type AS ENUM ('base_freight', 'fuel_surcharge', 'residential_fee', 'remote_area_surcharge', 'customs_duty', 'tax', 'signature_fee', 'dimensional_weight_adjustment', 'address_correction', 'return_shipping', 'other');
CREATE TYPE sync_job_status AS ENUM ('queued', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled');
CREATE TYPE sync_job_type AS ENUM ('order_import', 'catalog_sync', 'inventory_sync', 'tracking_push', 'settlement_import', 'manual_bulk_import', 'export');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'snoozed', 'dismissed');
CREATE TYPE task_type AS ENUM ('credit_card_due', 'confirm_shipment', 'message_reply', 'invoice_due', 'return_review', 'fraud_review', 'restock_alert', 'claim_deadline', 'general');
CREATE TYPE user_status AS ENUM ('pending_activation', 'active', 'suspended', 'locked', 'deactivated');
CREATE TYPE variant_status AS ENUM ('active', 'inactive', 'out_of_stock', 'discontinued');

-- ---------- TABLES ----------
CREATE TABLE "audit_logs" (
  "id" character varying(64) NOT NULL,
  "actor_user_id" character varying(64),
  "user_id" character varying(64),
  "action" character varying(150) NOT NULL,
  "entity_type" character varying(100) NOT NULL,
  "entity_id" character varying(64),
  "request_id" character varying(100),
  "correlation_id" character varying(100),
  "ip_address" character varying(64),
  "user_agent" text,
  "before_state" jsonb,
  "after_state" jsonb,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "checksum" character varying(64) NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "brands" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "name" character varying(150) NOT NULL,
  "reg_no" character varying(150),
  "serial_no" character varying(150),
  "slug" character varying(150) NOT NULL,
  "logo_url" text,
  "website_url" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "channel_listings" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "seller_account_id" character varying(64) NOT NULL,
  "product_id" character varying(64) NOT NULL,
  "product_variant_id" character varying(64) NOT NULL,
  "external_listing_id" character varying(150) NOT NULL,
  "external_variant_id" character varying(150),
  "external_sku" character varying(150),
  "asin" character varying(20),
  "channel_title" character varying(500),
  "channel_description" text,
  "channel_category_id" character varying(150),
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "listed_price" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "allocated_quantity" integer DEFAULT 0 NOT NULL,
  "listing_status" listing_status DEFAULT 'active'::listing_status NOT NULL,
  "publication_status" publication_status DEFAULT 'published'::publication_status NOT NULL,
  "sync_status" entity_sync_status DEFAULT 'synced'::entity_sync_status NOT NULL,
  "last_sync_error" text,
  "channel_attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "last_synced_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "credit_card_seller_accounts" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "credit_card_id" character varying(64) NOT NULL,
  "seller_account_id" character varying(64) NOT NULL,
  "usage_purpose" card_channel_usage DEFAULT 'primary_billing'::card_channel_usage NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "credit_cards" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "financial_account_id" character varying(64),
  "card_label" character varying(150) NOT NULL,
  "brand_name" character varying(64) NOT NULL,
  "issuer_bank" character varying(150),
  "cardholder_name" character varying(150) NOT NULL,
  "last_4_digits" character varying(4) NOT NULL,
  "exp_month" integer NOT NULL,
  "exp_year" integer NOT NULL,
  "vault_token_reference" character varying(255),
  "logo_url" text,
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "credit_limit" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "current_balance" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "statement_balance" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "minimum_payment_due" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "billing_cycle_day" integer,
  "payment_due_day" integer,
  "next_payment_due_date" date,
  "reminder_days_before" integer DEFAULT 5 NOT NULL,
  "auto_pay_enabled" boolean DEFAULT false NOT NULL,
  "data_classification" data_classification DEFAULT 'business'::data_classification NOT NULL,
  "status" credit_card_status DEFAULT 'active'::credit_card_status NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "customer_addresses" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "customer_id" character varying(64) NOT NULL,
  "address_type" address_type DEFAULT 'both'::address_type NOT NULL,
  "label" character varying(100),
  "recipient_name" character varying(255) NOT NULL,
  "company_name" character varying(200),
  "phone" character varying(50),
  "line_1" character varying(255) NOT NULL,
  "line_2" character varying(255),
  "line_3" character varying(255),
  "city" character varying(150) NOT NULL,
  "state_province" character varying(150),
  "postal_code" character varying(50) NOT NULL,
  "country_code" character varying(2) DEFAULT 'US'::character varying NOT NULL,
  "address_fingerprint" character varying(64),
  "is_default" boolean DEFAULT false NOT NULL,
  "is_verified" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "customer_risk_signals" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "customer_id" character varying(64) NOT NULL,
  "order_id" character varying(64),
  "signal_type" risk_signal_type NOT NULL,
  "severity" risk_severity DEFAULT 'low'::risk_severity NOT NULL,
  "review_status" risk_review_status DEFAULT 'pending_review'::risk_review_status NOT NULL,
  "reason" text NOT NULL,
  "evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "reviewed_by_user_id" character varying(64),
  "reviewed_at" timestamp with time zone,
  "review_notes" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "customers" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "external_customer_id" character varying(150),
  "full_name" character varying(255) NOT NULL,
  "first_name" character varying(120),
  "last_name" character varying(120),
  "company_name" character varying(200),
  "email" character varying(255),
  "normalized_email" character varying(255),
  "proxy_email" character varying(255),
  "phone" character varying(50),
  "normalized_phone" character varying(50),
  "preferred_currency" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "orders_count" integer DEFAULT 0 NOT NULL,
  "total_spent" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "is_repeat_customer" boolean DEFAULT false NOT NULL,
  "risk_level" customer_risk_level DEFAULT 'low'::customer_risk_level NOT NULL,
  "risk_score" integer DEFAULT 0 NOT NULL,
  "merged_into_customer_id" character varying(64),
  "notes" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "first_order_at" timestamp with time zone,
  "last_order_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "finance_categories" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "parent_id" character varying(64),
  "name" character varying(150) NOT NULL,
  "slug" character varying(150) NOT NULL,
  "category_type" finance_category_type NOT NULL,
  "data_classification" data_classification DEFAULT 'business'::data_classification NOT NULL,
  "cost_bucket" finance_cost_bucket DEFAULT 'operations'::finance_cost_bucket NOT NULL,
  "is_tax_deductible" boolean DEFAULT true NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "financial_accounts" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "account_name" character varying(150) NOT NULL,
  "account_type" financial_account_type DEFAULT 'bank_checking'::financial_account_type NOT NULL,
  "institution_name" character varying(150),
  "account_number_last_4" character varying(4),
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "current_balance" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "data_classification" data_classification DEFAULT 'business'::data_classification NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "financial_transactions" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "financial_account_id" character varying(64),
  "credit_card_id" character varying(64),
  "finance_category_id" character varying(64),
  "seller_account_id" character varying(64),
  "order_id" character varying(64),
  "product_variant_id" character varying(64),
  "shipping_invoice_id" character varying(64),
  "reference_number" character varying(100) NOT NULL,
  "transaction_type" financial_transaction_type NOT NULL,
  "data_classification" data_classification DEFAULT 'business'::data_classification NOT NULL,
  "status" financial_transaction_status DEFAULT 'posted'::financial_transaction_status NOT NULL,
  "description" character varying(255) NOT NULL,
  "vendor_or_payer" character varying(200),
  "original_currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "original_amount" numeric(14,2) NOT NULL,
  "exchange_rate" numeric(18,8) DEFAULT '1'::numeric NOT NULL,
  "reporting_currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "reporting_amount" numeric(14,2) NOT NULL,
  "tax_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "transaction_date" date NOT NULL,
  "conversion_date" date,
  "due_date" date,
  "settled_at" timestamp with time zone,
  "reconciled_at" timestamp with time zone,
  "receipt_url" text,
  "notes" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "marketplace_claims" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "order_id" character varying(64) NOT NULL,
  "seller_account_id" character varying(64),
  "customer_id" character varying(64),
  "claim_number" character varying(100) NOT NULL,
  "external_claim_id" character varying(150),
  "claim_type" claim_type DEFAULT 'a_to_z_guarantee'::claim_type NOT NULL,
  "status" claim_status DEFAULT 'opened'::claim_status NOT NULL,
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "disputed_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "seller_liability_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "reason" text,
  "evidence_submitted" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "respond_by_at" timestamp with time zone,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "module_entitlements" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "module_key" character varying(100) NOT NULL,
  "is_enabled" boolean DEFAULT true NOT NULL,
  "plan_tier" character varying(64) DEFAULT 'enterprise'::character varying NOT NULL,
  "limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "expires_at" timestamp with time zone,
  "updated_by_user_id" character varying(64),
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "notifications" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "type" character varying(100) NOT NULL,
  "title" character varying(255) NOT NULL,
  "body" text,
  "entity_type" character varying(100),
  "entity_id" character varying(64),
  "channel" character varying(32) DEFAULT 'in_app'::character varying NOT NULL,
  "recipient_address" character varying(255),
  "is_read" boolean DEFAULT false NOT NULL,
  "sent_at" timestamp with time zone,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "order_import_payloads" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "order_id" character varying(64) NOT NULL,
  "sync_job_id" character varying(64),
  "seller_account_id" character varying(64),
  "payload_hash" character varying(64) NOT NULL,
  "payload_size_bytes" integer NOT NULL,
  "raw_payload" jsonb NOT NULL,
  "redacted_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "order_line_items" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "order_id" character varying(64) NOT NULL,
  "product_variant_id" character varying(64),
  "channel_listing_id" character varying(64),
  "external_order_line_id" character varying(150),
  "sku" character varying(120) NOT NULL,
  "title" character varying(255) NOT NULL,
  "variant_title" character varying(255),
  "asin" character varying(20),
  "quantity_ordered" integer NOT NULL,
  "quantity_fulfilled" integer DEFAULT 0 NOT NULL,
  "quantity_returned" integer DEFAULT 0 NOT NULL,
  "quantity_cancelled" integer DEFAULT 0 NOT NULL,
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "unit_price" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "discount_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "tax_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "shipping_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "line_total_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "unit_cost_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "marketplace_fee_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "refunded_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "fulfillment_status" fulfillment_status DEFAULT 'unfulfilled'::fulfillment_status NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "orders" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "seller_account_id" character varying(64),
  "customer_id" character varying(64) NOT NULL,
  "shipping_address_id" character varying(64),
  "billing_address_id" character varying(64),
  "sync_job_id" character varying(64),
  "order_number" character varying(100) NOT NULL,
  "external_order_id" character varying(150),
  "source_type" order_source_type DEFAULT 'manual'::order_source_type NOT NULL,
  "marketplace_code" character varying(50) DEFAULT 'direct'::character varying NOT NULL,
  "status" order_status DEFAULT 'pending'::order_status NOT NULL,
  "payment_status" order_payment_status DEFAULT 'unpaid'::order_payment_status NOT NULL,
  "fulfillment_status" fulfillment_status DEFAULT 'unfulfilled'::fulfillment_status NOT NULL,
  "sync_status" entity_sync_status DEFAULT 'not_applicable'::entity_sync_status NOT NULL,
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "reporting_currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "exchange_rate" numeric(18,8) DEFAULT '1'::numeric NOT NULL,
  "subtotal_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "tax_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "discount_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "shipping_charged_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "total_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "marketplace_fees_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "payment_processing_fees_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "shipping_cost_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "cogs_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "refunded_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "net_proceeds_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "gross_profit_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "net_profit_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "reporting_total_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "shipping_address_snapshot" jsonb,
  "buyer_notes" text,
  "internal_notes" text,
  "ordered_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "confirmed_at" timestamp with time zone,
  "shipped_at" timestamp with time zone,
  "delivered_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "delivery_notification_sent_at" timestamp with time zone,
  "source_created_at" timestamp with time zone,
  "source_updated_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "outbox_events" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64),
  "aggregate_type" character varying(100) NOT NULL,
  "aggregate_id" character varying(64) NOT NULL,
  "event_type" character varying(150) NOT NULL,
  "idempotency_key" character varying(150) NOT NULL,
  "correlation_id" character varying(100),
  "payload" jsonb NOT NULL,
  "status" outbox_event_status DEFAULT 'pending'::outbox_event_status NOT NULL,
  "retry_count" integer DEFAULT 0 NOT NULL,
  "max_retries" integer DEFAULT 5 NOT NULL,
  "next_retry_at" timestamp with time zone,
  "last_error" text,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "password_reset_tokens" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "token_hash" character varying(128) NOT NULL,
  "requested_ip" character varying(64),
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "permissions" (
  "id" character varying(64) NOT NULL,
  "name" character varying(150) NOT NULL,
  "slug" character varying(150) NOT NULL,
  "resource" character varying(100) NOT NULL,
  "action" character varying(100) NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "product_categories" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "parent_category_id" character varying(64),
  "name" character varying(150) NOT NULL,
  "slug" character varying(150) NOT NULL,
  "taxonomy_path" character varying(500),
  "attributes_schema" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "product_variant_attributes" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "product_variant_id" character varying(64) NOT NULL,
  "attribute_name" character varying(100) NOT NULL,
  "attribute_value" character varying(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "product_variants" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "product_id" character varying(64) NOT NULL,
  "sku" character varying(120) NOT NULL,
  "title" character varying(255) NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "barcode_upc_ean" character varying(64),
  "mpn" character varying(100),
  "asin" character varying(20),
  "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "retail_price" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "compare_at_price" numeric(14,2),
  "cost_price" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "manufacturing_cost" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "packaging_cost" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "stock_on_hand" integer DEFAULT 0 NOT NULL,
  "stock_reserved" integer DEFAULT 0 NOT NULL,
  "reorder_point" integer DEFAULT 5 NOT NULL,
  "weight_grams" numeric(14,2),
  "dimensions_cm" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "images" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" variant_status DEFAULT 'active'::variant_status NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "stock_available" integer DEFAULT (stock_on_hand - stock_reserved)
);

CREATE TABLE "products" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "brand_id" character varying(64),
  "category_id" character varying(64),
  "title" character varying(255) NOT NULL,
  "title_75" character varying(255),
  "title_80" character varying(255),
  "sub_title" character varying(255),
  "sub_title_125" character varying(255),
  "slug" character varying(255) NOT NULL,
  "sku_prefix" character varying(100),
  "list_price" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "sale_price" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "collection_name" character varying(100),
  "description" text,
  "extended_description" text,
  "short_description" text,
  "status" product_status DEFAULT 'draft'::product_status NOT NULL,
  "has_variants" boolean DEFAULT false NOT NULL,
  "variation_dimensions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "weight_grams" numeric(14,2),
  "dimensions_cm" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "images" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "type" character varying(100),
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "refund_transactions" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "order_id" character varying(64) NOT NULL,
  "order_line_item_id" character varying(64),
  "return_request_id" character varying(64),
  "financial_account_id" character varying(64),
  "refund_number" character varying(100) NOT NULL,
  "external_refund_id" character varying(150),
  "status" refund_status DEFAULT 'processed'::refund_status NOT NULL,
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "items_refund_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "shipping_refund_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "tax_refund_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "restocking_fee_deducted" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "total_refund_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "reason" text,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "return_requests" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "order_id" character varying(64) NOT NULL,
  "order_line_item_id" character varying(64) NOT NULL,
  "customer_id" character varying(64) NOT NULL,
  "rma_number" character varying(100) NOT NULL,
  "external_return_id" character varying(150),
  "status" return_status DEFAULT 'requested'::return_status NOT NULL,
  "return_reason" return_reason DEFAULT 'other'::return_reason NOT NULL,
  "resolution_type" return_resolution_type DEFAULT 'refund'::return_resolution_type NOT NULL,
  "quantity_requested" integer NOT NULL,
  "quantity_approved" integer DEFAULT 0 NOT NULL,
  "quantity_received" integer DEFAULT 0 NOT NULL,
  "item_condition" return_item_condition,
  "restock_inventory" boolean DEFAULT false NOT NULL,
  "return_carrier" character varying(100),
  "return_tracking_number" character varying(150),
  "return_label_url" text,
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "return_shipping_cost" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "restocking_fee_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "refund_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "replacement_order_id" character varying(64),
  "customer_comments" text,
  "internal_notes" text,
  "evidence_images" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "approval_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "reviewed_by_user_id" character varying(64),
  "requested_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "authorized_at" timestamp with time zone,
  "received_at" timestamp with time zone,
  "closed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "role_permissions" (
  "id" character varying(64) NOT NULL,
  "role_id" character varying(64) NOT NULL,
  "permission_id" character varying(64) NOT NULL,
  "effect" permission_effect DEFAULT 'allow'::permission_effect NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "roles" (
  "id" character varying(64) NOT NULL,
  "slug" character varying(100) NOT NULL,
  "name" character varying(150) NOT NULL,
  "description" text,
  "is_system" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "sales_channels" (
  "id" character varying(64) NOT NULL,
  "code" character varying(50) NOT NULL,
  "name" character varying(150) NOT NULL,
  "channel_type" channel_type DEFAULT 'marketplace'::channel_type NOT NULL,
  "logo_url" text,
  "supports_oauth" boolean DEFAULT true NOT NULL,
  "default_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "saved_views" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "module_key" character varying(100) NOT NULL,
  "name" character varying(150) NOT NULL,
  "filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "sort_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "columns_config" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "seller_accounts" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "sales_channel_id" character varying(64) NOT NULL,
  "account_name" character varying(150) NOT NULL,
  "account_email" character varying(150),
  "account_phone" character varying(150),
  "account_code" character varying(4),
  "external_seller_id" character varying(150) NOT NULL,
  "marketplace_region" character varying(32) DEFAULT 'US'::character varying NOT NULL,
  "default_currency" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "status" seller_account_status DEFAULT 'active'::seller_account_status NOT NULL,
  "health_status" health_status DEFAULT 'healthy'::health_status NOT NULL,
  "encrypted_credentials" text,
  "credential_vault_ref" character varying(255),
  "oauth_scopes" text,
  "token_expires_at" timestamp with time zone,
  "last_credential_rotated_at" timestamp with time zone,
  "rate_limit_rpm" integer DEFAULT 60 NOT NULL,
  "retry_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "sync_checkpoint" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "sync_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "last_synced_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "shipment_items" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "shipment_id" character varying(64) NOT NULL,
  "order_line_item_id" character varying(64) NOT NULL,
  "quantity_shipped" integer NOT NULL,
  "serial_numbers" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "shipments" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "order_id" character varying(64) NOT NULL,
  "shipment_number" character varying(100) NOT NULL,
  "carrier_code" character varying(50) NOT NULL,
  "carrier_name" character varying(150) NOT NULL,
  "service_level" character varying(100),
  "tracking_number" character varying(150),
  "third_party_tracking_number" character varying(150),
  "tracking_url" text,
  "third_party_tracking_url" text,
  "status" shipment_status DEFAULT 'pending'::shipment_status NOT NULL,
  "packaging_type" character varying(100),
  "length_cm" numeric(14,2),
  "width_cm" numeric(14,2),
  "height_cm" numeric(14,2),
  "dead_weight_grams" numeric(14,2),
  "volumetric_weight_grams" numeric(14,2),
  "billed_weight_grams" numeric(14,2),
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "estimated_shipping_cost" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "actual_invoiced_cost" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "shipped_at" timestamp with time zone,
  "estimated_delivery_at" timestamp with time zone,
  "delivered_at" timestamp with time zone,
  "delivery_notification_sent" boolean DEFAULT false NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "shipping_invoice_lines" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "shipping_invoice_id" character varying(64) NOT NULL,
  "shipment_id" character varying(64),
  "tracking_number" character varying(150),
  "charge_type" shipping_charge_type DEFAULT 'base_freight'::shipping_charge_type NOT NULL,
  "description" character varying(255),
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "expected_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "billed_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "variance_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "allow_duplicate_charge" boolean DEFAULT false NOT NULL,
  "reconciliation_notes" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "shipping_invoices" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "financial_account_id" character varying(64),
  "carrier_code" character varying(50) NOT NULL,
  "carrier_name" character varying(150) NOT NULL,
  "invoice_number" character varying(100) NOT NULL,
  "currency_code" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "subtotal_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "tax_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "total_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "paid_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "variance_amount" numeric(14,2) DEFAULT '0'::numeric NOT NULL,
  "payment_status" invoice_payment_status DEFAULT 'unpaid'::invoice_payment_status NOT NULL,
  "reconciliation_status" invoice_reconciliation_status DEFAULT 'unreconciled'::invoice_reconciliation_status NOT NULL,
  "invoice_date" date NOT NULL,
  "due_date" date,
  "paid_at" timestamp with time zone,
  "payment_reference" character varying(150),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "sync_job_errors" (
  "id" character varying(64) NOT NULL,
  "sync_job_id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "record_index" integer DEFAULT 0 NOT NULL,
  "external_record_id" character varying(150),
  "error_code" character varying(100) NOT NULL,
  "error_message" text NOT NULL,
  "field_errors" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "raw_excerpt" jsonb,
  "is_resolved" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "sync_jobs" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "seller_account_id" character varying(64),
  "job_type" sync_job_type NOT NULL,
  "status" sync_job_status DEFAULT 'queued'::sync_job_status NOT NULL,
  "idempotency_key" character varying(150) NOT NULL,
  "correlation_id" character varying(100),
  "total_records" integer DEFAULT 0 NOT NULL,
  "processed_records" integer DEFAULT 0 NOT NULL,
  "succeeded_records" integer DEFAULT 0 NOT NULL,
  "failed_records" integer DEFAULT 0 NOT NULL,
  "skipped_duplicates" integer DEFAULT 0 NOT NULL,
  "checkpoint_cursor" character varying(255),
  "error_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "tasks_reminders" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "related_entity_type" character varying(100),
  "related_entity_id" character varying(64),
  "credit_card_id" character varying(64),
  "title" character varying(255) NOT NULL,
  "description" text,
  "task_type" task_type DEFAULT 'general'::task_type NOT NULL,
  "priority" task_priority DEFAULT 'medium'::task_priority NOT NULL,
  "status" task_status DEFAULT 'pending'::task_status NOT NULL,
  "due_at" timestamp with time zone NOT NULL,
  "remind_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "user_roles" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "role_id" character varying(64) NOT NULL,
  "assigned_by_user_id" character varying(64),
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "user_sessions" (
  "id" character varying(64) NOT NULL,
  "user_id" character varying(64) NOT NULL,
  "session_token_hash" character varying(128) NOT NULL,
  "ip_address" character varying(64),
  "user_agent" text,
  "is_revoked" boolean DEFAULT false NOT NULL,
  "revoked_at" timestamp with time zone,
  "expires_at" timestamp with time zone NOT NULL,
  "last_active_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "users" (
  "id" character varying(64) NOT NULL,
  "email" character varying(255) NOT NULL,
  "full_name" character varying(255) NOT NULL,
  "company_name" character varying(255),
  "phone" character varying(50),
  "password" character varying(255) NOT NULL,
  "status" user_status DEFAULT 'pending_activation'::user_status NOT NULL,
  "is_super_admin" boolean DEFAULT false NOT NULL,
  "failed_login_attempts" integer DEFAULT 0 NOT NULL,
  "locked_until" timestamp with time zone,
  "password_changed_at" timestamp with time zone,
  "last_login_at" timestamp with time zone,
  "last_login_ip" character varying(64),
  "default_currency" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
  "timezone" character varying(64) DEFAULT 'UTC'::character varying NOT NULL,
  "preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_by_user_id" character varying(64),
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ---------- CONSTRAINTS ----------
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_foreign" FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_action_not_null" NOT NULL action;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_checksum_not_null" NOT NULL checksum;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_created_at_not_null" NOT NULL created_at;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_entity_type_not_null" NOT NULL entity_type;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_id_not_null" NOT NULL id;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_metadata_not_null" NOT NULL metadata;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY (id);
ALTER TABLE "brands" ADD CONSTRAINT "brands_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "brands" ADD CONSTRAINT "brands_created_at_not_null" NOT NULL created_at;
ALTER TABLE "brands" ADD CONSTRAINT "brands_id_not_null" NOT NULL id;
ALTER TABLE "brands" ADD CONSTRAINT "brands_is_active_not_null" NOT NULL is_active;
ALTER TABLE "brands" ADD CONSTRAINT "brands_name_not_null" NOT NULL name;
ALTER TABLE "brands" ADD CONSTRAINT "brands_slug_not_null" NOT NULL slug;
ALTER TABLE "brands" ADD CONSTRAINT "brands_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "brands" ADD CONSTRAINT "brands_user_id_not_null" NOT NULL user_id;
ALTER TABLE "brands" ADD CONSTRAINT "brands_pkey" PRIMARY KEY (id);
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_product_id_foreign" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_product_variant_id_foreign" FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE CASCADE;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_allocated_quantity_not_null" NOT NULL allocated_quantity;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_channel_attributes_not_null" NOT NULL channel_attributes;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_created_at_not_null" NOT NULL created_at;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_external_listing_id_not_null" NOT NULL external_listing_id;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_id_not_null" NOT NULL id;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_listed_price_not_null" NOT NULL listed_price;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_listing_status_not_null" NOT NULL listing_status;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_product_id_not_null" NOT NULL product_id;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_product_variant_id_not_null" NOT NULL product_variant_id;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_publication_status_not_null" NOT NULL publication_status;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_seller_account_id_not_null" NOT NULL seller_account_id;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_sync_status_not_null" NOT NULL sync_status;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_user_id_not_null" NOT NULL user_id;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_pkey" PRIMARY KEY (id);
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_credit_card_id_foreign" FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE CASCADE;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE CASCADE;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_created_at_not_null" NOT NULL created_at;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_credit_card_id_not_null" NOT NULL credit_card_id;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_id_not_null" NOT NULL id;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_is_primary_not_null" NOT NULL is_primary;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_seller_account_id_not_null" NOT NULL seller_account_id;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_usage_purpose_not_null" NOT NULL usage_purpose;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_user_id_not_null" NOT NULL user_id;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_pkey" PRIMARY KEY (id);
ALTER TABLE "credit_cards" ADD CONSTRAINT "chk_credit_cards_amounts_nonneg" CHECK (((credit_limit >= (0)::numeric) AND (current_balance >= (0)::numeric) AND (statement_balance >= (0)::numeric) AND (minimum_payment_due >= (0)::numeric)));
ALTER TABLE "credit_cards" ADD CONSTRAINT "chk_credit_cards_metadata_valid" CHECK ((((exp_month >= 1) AND (exp_month <= 12)) AND ((exp_year >= 2000) AND (exp_year <= 2100)) AND ((last_4_digits)::text ~ '^[0-9]{4}$'::text)));
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_financial_account_id_foreign" FOREIGN KEY (financial_account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_auto_pay_enabled_not_null" NOT NULL auto_pay_enabled;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_brand_name_not_null" NOT NULL brand_name;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_card_label_not_null" NOT NULL card_label;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_cardholder_name_not_null" NOT NULL cardholder_name;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_created_at_not_null" NOT NULL created_at;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_credit_limit_not_null" NOT NULL credit_limit;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_current_balance_not_null" NOT NULL current_balance;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_data_classification_not_null" NOT NULL data_classification;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_exp_month_not_null" NOT NULL exp_month;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_exp_year_not_null" NOT NULL exp_year;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_id_not_null" NOT NULL id;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_last_4_digits_not_null" NOT NULL last_4_digits;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_minimum_payment_due_not_null" NOT NULL minimum_payment_due;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_reminder_days_before_not_null" NOT NULL reminder_days_before;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_statement_balance_not_null" NOT NULL statement_balance;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_status_not_null" NOT NULL status;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_not_null" NOT NULL user_id;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_pkey" PRIMARY KEY (id);
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_foreign" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_address_type_not_null" NOT NULL address_type;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_city_not_null" NOT NULL city;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_country_code_not_null" NOT NULL country_code;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_created_at_not_null" NOT NULL created_at;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_not_null" NOT NULL customer_id;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_id_not_null" NOT NULL id;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_is_default_not_null" NOT NULL is_default;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_is_verified_not_null" NOT NULL is_verified;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_line_1_not_null" NOT NULL line_1;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_postal_code_not_null" NOT NULL postal_code;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_recipient_name_not_null" NOT NULL recipient_name;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_user_id_not_null" NOT NULL user_id;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_pkey" PRIMARY KEY (id);
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_customer_id_foreign" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_reviewed_by_user_id_foreign" FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_created_at_not_null" NOT NULL created_at;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_customer_id_not_null" NOT NULL customer_id;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_evidence_not_null" NOT NULL evidence;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_id_not_null" NOT NULL id;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_reason_not_null" NOT NULL reason;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_review_status_not_null" NOT NULL review_status;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_severity_not_null" NOT NULL severity;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_signal_type_not_null" NOT NULL signal_type;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_user_id_not_null" NOT NULL user_id;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_pkey" PRIMARY KEY (id);
ALTER TABLE "customers" ADD CONSTRAINT "chk_customers_orders_count_nonneg" CHECK ((orders_count >= 0));
ALTER TABLE "customers" ADD CONSTRAINT "chk_customers_risk_score_nonneg" CHECK ((risk_score >= 0));
ALTER TABLE "customers" ADD CONSTRAINT "chk_customers_total_spent_nonneg" CHECK ((total_spent >= (0)::numeric));
ALTER TABLE "customers" ADD CONSTRAINT "customers_merged_into_customer_id_foreign" FOREIGN KEY (merged_into_customer_id) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_at_not_null" NOT NULL created_at;
ALTER TABLE "customers" ADD CONSTRAINT "customers_full_name_not_null" NOT NULL full_name;
ALTER TABLE "customers" ADD CONSTRAINT "customers_id_not_null" NOT NULL id;
ALTER TABLE "customers" ADD CONSTRAINT "customers_is_repeat_customer_not_null" NOT NULL is_repeat_customer;
ALTER TABLE "customers" ADD CONSTRAINT "customers_metadata_not_null" NOT NULL metadata;
ALTER TABLE "customers" ADD CONSTRAINT "customers_orders_count_not_null" NOT NULL orders_count;
ALTER TABLE "customers" ADD CONSTRAINT "customers_preferred_currency_not_null" NOT NULL preferred_currency;
ALTER TABLE "customers" ADD CONSTRAINT "customers_risk_level_not_null" NOT NULL risk_level;
ALTER TABLE "customers" ADD CONSTRAINT "customers_risk_score_not_null" NOT NULL risk_score;
ALTER TABLE "customers" ADD CONSTRAINT "customers_total_spent_not_null" NOT NULL total_spent;
ALTER TABLE "customers" ADD CONSTRAINT "customers_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_not_null" NOT NULL user_id;
ALTER TABLE "customers" ADD CONSTRAINT "customers_pkey" PRIMARY KEY (id);
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_parent_id_foreign" FOREIGN KEY (parent_id) REFERENCES finance_categories(id) ON DELETE SET NULL;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_category_type_not_null" NOT NULL category_type;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_cost_bucket_not_null" NOT NULL cost_bucket;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_created_at_not_null" NOT NULL created_at;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_data_classification_not_null" NOT NULL data_classification;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_id_not_null" NOT NULL id;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_is_active_not_null" NOT NULL is_active;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_is_tax_deductible_not_null" NOT NULL is_tax_deductible;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_name_not_null" NOT NULL name;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_slug_not_null" NOT NULL slug;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_user_id_not_null" NOT NULL user_id;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_pkey" PRIMARY KEY (id);
ALTER TABLE "financial_accounts" ADD CONSTRAINT "chk_financial_accounts_last4" CHECK (((account_number_last_4 IS NULL) OR ((account_number_last_4)::text ~ '^[0-9]{4}$'::text)));
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_account_name_not_null" NOT NULL account_name;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_account_type_not_null" NOT NULL account_type;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_created_at_not_null" NOT NULL created_at;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_current_balance_not_null" NOT NULL current_balance;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_data_classification_not_null" NOT NULL data_classification;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_id_not_null" NOT NULL id;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_is_active_not_null" NOT NULL is_active;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_user_id_not_null" NOT NULL user_id;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_pkey" PRIMARY KEY (id);
ALTER TABLE "financial_transactions" ADD CONSTRAINT "chk_financial_transactions_amounts_nonneg" CHECK (((original_amount >= (0)::numeric) AND (reporting_amount >= (0)::numeric) AND (tax_amount >= (0)::numeric)));
ALTER TABLE "financial_transactions" ADD CONSTRAINT "chk_financial_transactions_rate_positive" CHECK ((exchange_rate > (0)::numeric));
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_credit_card_id_foreign" FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_finance_category_id_foreign" FOREIGN KEY (finance_category_id) REFERENCES finance_categories(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_financial_account_id_foreign" FOREIGN KEY (financial_account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_product_variant_id_foreign" FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_shipping_invoice_id_foreign" FOREIGN KEY (shipping_invoice_id) REFERENCES shipping_invoices(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_created_at_not_null" NOT NULL created_at;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_data_classification_not_null" NOT NULL data_classification;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_description_not_null" NOT NULL description;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_exchange_rate_not_null" NOT NULL exchange_rate;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_id_not_null" NOT NULL id;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_metadata_not_null" NOT NULL metadata;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_original_amount_not_null" NOT NULL original_amount;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_original_currency_code_not_null" NOT NULL original_currency_code;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_reference_number_not_null" NOT NULL reference_number;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_reporting_amount_not_null" NOT NULL reporting_amount;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_reporting_currency_code_not_null" NOT NULL reporting_currency_code;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_status_not_null" NOT NULL status;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_tax_amount_not_null" NOT NULL tax_amount;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_transaction_date_not_null" NOT NULL transaction_date;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_transaction_type_not_null" NOT NULL transaction_type;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_user_id_not_null" NOT NULL user_id;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_pkey" PRIMARY KEY (id);
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_customer_id_foreign" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE SET NULL;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_claim_number_not_null" NOT NULL claim_number;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_claim_type_not_null" NOT NULL claim_type;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_created_at_not_null" NOT NULL created_at;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_disputed_amount_not_null" NOT NULL disputed_amount;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_evidence_submitted_not_null" NOT NULL evidence_submitted;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_id_not_null" NOT NULL id;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_order_id_not_null" NOT NULL order_id;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_seller_liability_amount_not_null" NOT NULL seller_liability_amount;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_status_not_null" NOT NULL status;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_user_id_not_null" NOT NULL user_id;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_pkey" PRIMARY KEY (id);
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_updated_by_user_id_foreign" FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_created_at_not_null" NOT NULL created_at;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_id_not_null" NOT NULL id;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_is_enabled_not_null" NOT NULL is_enabled;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_limits_not_null" NOT NULL limits;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_module_key_not_null" NOT NULL module_key;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_plan_tier_not_null" NOT NULL plan_tier;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_user_id_not_null" NOT NULL user_id;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_pkey" PRIMARY KEY (id);
ALTER TABLE "notifications" ADD CONSTRAINT "chk_notifications_channel" CHECK (((channel)::text = ANY ((ARRAY['in_app'::character varying, 'email'::character varying, 'sms'::character varying])::text[])));
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_channel_not_null" NOT NULL channel;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_at_not_null" NOT NULL created_at;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_id_not_null" NOT NULL id;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_is_read_not_null" NOT NULL is_read;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_title_not_null" NOT NULL title;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_type_not_null" NOT NULL type;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_not_null" NOT NULL user_id;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "chk_order_import_payloads_size" CHECK (((payload_size_bytes >= 0) AND (payload_size_bytes <= 262144)));
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE SET NULL;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_sync_job_id_foreign" FOREIGN KEY (sync_job_id) REFERENCES sync_jobs(id) ON DELETE SET NULL;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_created_at_not_null" NOT NULL created_at;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_id_not_null" NOT NULL id;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_order_id_not_null" NOT NULL order_id;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_payload_hash_not_null" NOT NULL payload_hash;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_payload_size_bytes_not_null" NOT NULL payload_size_bytes;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_raw_payload_not_null" NOT NULL raw_payload;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_redacted_fields_not_null" NOT NULL redacted_fields;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_user_id_not_null" NOT NULL user_id;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_pkey" PRIMARY KEY (id);
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_amounts_nonneg" CHECK (((unit_price >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (tax_amount >= (0)::numeric) AND (shipping_amount >= (0)::numeric) AND (line_total_amount >= (0)::numeric) AND (unit_cost_amount >= (0)::numeric) AND (marketplace_fee_amount >= (0)::numeric) AND (refunded_amount >= (0)::numeric)));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_qty_bounds" CHECK (((quantity_fulfilled >= 0) AND (quantity_returned >= 0) AND (quantity_cancelled >= 0) AND (quantity_fulfilled <= quantity_ordered) AND (quantity_returned <= quantity_ordered) AND (quantity_cancelled <= quantity_ordered)));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_qty_ordered_positive" CHECK ((quantity_ordered > 0));
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_channel_listing_id_foreign" FOREIGN KEY (channel_listing_id) REFERENCES channel_listings(id) ON DELETE SET NULL;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_product_variant_id_foreign" FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_created_at_not_null" NOT NULL created_at;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_discount_amount_not_null" NOT NULL discount_amount;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_fulfillment_status_not_null" NOT NULL fulfillment_status;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_id_not_null" NOT NULL id;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_line_total_amount_not_null" NOT NULL line_total_amount;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_marketplace_fee_amount_not_null" NOT NULL marketplace_fee_amount;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_not_null" NOT NULL order_id;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_quantity_cancelled_not_null" NOT NULL quantity_cancelled;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_quantity_fulfilled_not_null" NOT NULL quantity_fulfilled;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_quantity_ordered_not_null" NOT NULL quantity_ordered;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_quantity_returned_not_null" NOT NULL quantity_returned;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_refunded_amount_not_null" NOT NULL refunded_amount;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_shipping_amount_not_null" NOT NULL shipping_amount;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_sku_not_null" NOT NULL sku;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_tax_amount_not_null" NOT NULL tax_amount;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_title_not_null" NOT NULL title;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_unit_cost_amount_not_null" NOT NULL unit_cost_amount;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_unit_price_not_null" NOT NULL unit_price;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_user_id_not_null" NOT NULL user_id;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_pkey" PRIMARY KEY (id);
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_amounts_nonneg" CHECK (((subtotal_amount >= (0)::numeric) AND (tax_amount >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (shipping_charged_amount >= (0)::numeric) AND (total_amount >= (0)::numeric) AND (marketplace_fees_amount >= (0)::numeric) AND (payment_processing_fees_amount >= (0)::numeric) AND (shipping_cost_amount >= (0)::numeric) AND (cogs_amount >= (0)::numeric) AND (refunded_amount >= (0)::numeric) AND (reporting_total_amount >= (0)::numeric)));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_exchange_rate_positive" CHECK ((exchange_rate > (0)::numeric));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_refund_within_total" CHECK ((refunded_amount <= total_amount));
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_foreign" FOREIGN KEY (billing_address_id) REFERENCES customer_addresses(id) ON DELETE SET NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_foreign" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE SET NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_foreign" FOREIGN KEY (shipping_address_id) REFERENCES customer_addresses(id) ON DELETE SET NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_sync_job_id_foreign" FOREIGN KEY (sync_job_id) REFERENCES sync_jobs(id) ON DELETE SET NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_cogs_amount_not_null" NOT NULL cogs_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_at_not_null" NOT NULL created_at;
ALTER TABLE "orders" ADD CONSTRAINT "orders_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_not_null" NOT NULL customer_id;
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_amount_not_null" NOT NULL discount_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_exchange_rate_not_null" NOT NULL exchange_rate;
ALTER TABLE "orders" ADD CONSTRAINT "orders_fulfillment_status_not_null" NOT NULL fulfillment_status;
ALTER TABLE "orders" ADD CONSTRAINT "orders_gross_profit_amount_not_null" NOT NULL gross_profit_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_id_not_null" NOT NULL id;
ALTER TABLE "orders" ADD CONSTRAINT "orders_marketplace_code_not_null" NOT NULL marketplace_code;
ALTER TABLE "orders" ADD CONSTRAINT "orders_marketplace_fees_amount_not_null" NOT NULL marketplace_fees_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_net_proceeds_amount_not_null" NOT NULL net_proceeds_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_net_profit_amount_not_null" NOT NULL net_profit_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_number_not_null" NOT NULL order_number;
ALTER TABLE "orders" ADD CONSTRAINT "orders_ordered_at_not_null" NOT NULL ordered_at;
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_processing_fees_amount_not_null" NOT NULL payment_processing_fees_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_status_not_null" NOT NULL payment_status;
ALTER TABLE "orders" ADD CONSTRAINT "orders_refunded_amount_not_null" NOT NULL refunded_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_reporting_currency_code_not_null" NOT NULL reporting_currency_code;
ALTER TABLE "orders" ADD CONSTRAINT "orders_reporting_total_amount_not_null" NOT NULL reporting_total_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_charged_amount_not_null" NOT NULL shipping_charged_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_cost_amount_not_null" NOT NULL shipping_cost_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_type_not_null" NOT NULL source_type;
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_not_null" NOT NULL status;
ALTER TABLE "orders" ADD CONSTRAINT "orders_subtotal_amount_not_null" NOT NULL subtotal_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_sync_status_not_null" NOT NULL sync_status;
ALTER TABLE "orders" ADD CONSTRAINT "orders_tax_amount_not_null" NOT NULL tax_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_amount_not_null" NOT NULL total_amount;
ALTER TABLE "orders" ADD CONSTRAINT "orders_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_not_null" NOT NULL user_id;
ALTER TABLE "orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY (id);
ALTER TABLE "outbox_events" ADD CONSTRAINT "chk_outbox_events_retries_nonneg" CHECK (((retry_count >= 0) AND (max_retries >= 0)));
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_aggregate_id_not_null" NOT NULL aggregate_id;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_aggregate_type_not_null" NOT NULL aggregate_type;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_created_at_not_null" NOT NULL created_at;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_event_type_not_null" NOT NULL event_type;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_id_not_null" NOT NULL id;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_idempotency_key_not_null" NOT NULL idempotency_key;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_max_retries_not_null" NOT NULL max_retries;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_payload_not_null" NOT NULL payload;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_retry_count_not_null" NOT NULL retry_count;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_status_not_null" NOT NULL status;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_pkey" PRIMARY KEY (id);
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_created_at_not_null" NOT NULL created_at;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_expires_at_not_null" NOT NULL expires_at;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_id_not_null" NOT NULL id;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_token_hash_not_null" NOT NULL token_hash;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_not_null" NOT NULL user_id;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY (id);
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_action_not_null" NOT NULL action;
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_created_at_not_null" NOT NULL created_at;
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_id_not_null" NOT NULL id;
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_name_not_null" NOT NULL name;
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_resource_not_null" NOT NULL resource;
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_slug_not_null" NOT NULL slug;
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_pkey" PRIMARY KEY (id);
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_category_id_foreign" FOREIGN KEY (parent_category_id) REFERENCES product_categories(id) ON DELETE SET NULL;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_attributes_schema_not_null" NOT NULL attributes_schema;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_created_at_not_null" NOT NULL created_at;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_id_not_null" NOT NULL id;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_is_active_not_null" NOT NULL is_active;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_name_not_null" NOT NULL name;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_slug_not_null" NOT NULL slug;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_sort_order_not_null" NOT NULL sort_order;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_user_id_not_null" NOT NULL user_id;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY (id);
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_product_variant_id_foreign" FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_attribute_name_not_null" NOT NULL attribute_name;
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_attribute_value_not_null" NOT NULL attribute_value;
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_created_at_not_null" NOT NULL created_at;
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_id_not_null" NOT NULL id;
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_product_variant_id_not_null" NOT NULL product_variant_id;
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_user_id_not_null" NOT NULL user_id;
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_pkey" PRIMARY KEY (id);
ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variants_prices_nonneg" CHECK (((retail_price >= (0)::numeric) AND (cost_price >= (0)::numeric) AND (manufacturing_cost >= (0)::numeric) AND (packaging_cost >= (0)::numeric) AND ((compare_at_price IS NULL) OR (compare_at_price >= (0)::numeric))));
ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variants_qty_nonneg" CHECK (((stock_on_hand >= 0) AND (stock_reserved >= 0) AND (reorder_point >= 0)));
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_foreign" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_attributes_not_null" NOT NULL attributes;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_cost_price_not_null" NOT NULL cost_price;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_created_at_not_null" NOT NULL created_at;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_dimensions_cm_not_null" NOT NULL dimensions_cm;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_id_not_null" NOT NULL id;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_images_not_null" NOT NULL images;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_is_default_not_null" NOT NULL is_default;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_manufacturing_cost_not_null" NOT NULL manufacturing_cost;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_packaging_cost_not_null" NOT NULL packaging_cost;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_not_null" NOT NULL product_id;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_reorder_point_not_null" NOT NULL reorder_point;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_retail_price_not_null" NOT NULL retail_price;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_sku_not_null" NOT NULL sku;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_status_not_null" NOT NULL status;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_stock_on_hand_not_null" NOT NULL stock_on_hand;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_stock_reserved_not_null" NOT NULL stock_reserved;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_title_not_null" NOT NULL title;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_user_id_not_null" NOT NULL user_id;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY (id);
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_foreign" FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_foreign" FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL;
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_created_at_not_null" NOT NULL created_at;
ALTER TABLE "products" ADD CONSTRAINT "products_dimensions_cm_not_null" NOT NULL dimensions_cm;
ALTER TABLE "products" ADD CONSTRAINT "products_has_variants_not_null" NOT NULL has_variants;
ALTER TABLE "products" ADD CONSTRAINT "products_id_not_null" NOT NULL id;
ALTER TABLE "products" ADD CONSTRAINT "products_images_not_null" NOT NULL images;
ALTER TABLE "products" ADD CONSTRAINT "products_list_price_not_null" NOT NULL list_price;
ALTER TABLE "products" ADD CONSTRAINT "products_metadata_not_null" NOT NULL metadata;
ALTER TABLE "products" ADD CONSTRAINT "products_sale_price_not_null" NOT NULL sale_price;
ALTER TABLE "products" ADD CONSTRAINT "products_slug_not_null" NOT NULL slug;
ALTER TABLE "products" ADD CONSTRAINT "products_status_not_null" NOT NULL status;
ALTER TABLE "products" ADD CONSTRAINT "products_tags_not_null" NOT NULL tags;
ALTER TABLE "products" ADD CONSTRAINT "products_title_not_null" NOT NULL title;
ALTER TABLE "products" ADD CONSTRAINT "products_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_not_null" NOT NULL user_id;
ALTER TABLE "products" ADD CONSTRAINT "products_variation_dimensions_not_null" NOT NULL variation_dimensions;
ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY (id);
ALTER TABLE "refund_transactions" ADD CONSTRAINT "chk_refund_transactions_amounts_nonneg" CHECK (((items_refund_amount >= (0)::numeric) AND (shipping_refund_amount >= (0)::numeric) AND (tax_refund_amount >= (0)::numeric) AND (restocking_fee_deducted >= (0)::numeric) AND (total_refund_amount >= (0)::numeric)));
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_financial_account_id_foreign" FOREIGN KEY (financial_account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_order_line_item_id_foreign" FOREIGN KEY (order_line_item_id) REFERENCES order_line_items(id) ON DELETE SET NULL;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_return_request_id_foreign" FOREIGN KEY (return_request_id) REFERENCES return_requests(id) ON DELETE SET NULL;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_created_at_not_null" NOT NULL created_at;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_id_not_null" NOT NULL id;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_items_refund_amount_not_null" NOT NULL items_refund_amount;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_order_id_not_null" NOT NULL order_id;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_refund_number_not_null" NOT NULL refund_number;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_restocking_fee_deducted_not_null" NOT NULL restocking_fee_deducted;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_shipping_refund_amount_not_null" NOT NULL shipping_refund_amount;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_status_not_null" NOT NULL status;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_tax_refund_amount_not_null" NOT NULL tax_refund_amount;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_total_refund_amount_not_null" NOT NULL total_refund_amount;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_user_id_not_null" NOT NULL user_id;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_pkey" PRIMARY KEY (id);
ALTER TABLE "return_requests" ADD CONSTRAINT "chk_return_requests_amounts_nonneg" CHECK (((return_shipping_cost >= (0)::numeric) AND (restocking_fee_amount >= (0)::numeric) AND (refund_amount >= (0)::numeric)));
ALTER TABLE "return_requests" ADD CONSTRAINT "chk_return_requests_qty_valid" CHECK (((quantity_requested > 0) AND (quantity_approved >= 0) AND (quantity_received >= 0) AND (quantity_approved <= quantity_requested) AND (quantity_received <= quantity_requested)));
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_customer_id_foreign" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_line_item_id_foreign" FOREIGN KEY (order_line_item_id) REFERENCES order_line_items(id) ON DELETE CASCADE;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_replacement_order_id_foreign" FOREIGN KEY (replacement_order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_reviewed_by_user_id_foreign" FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_approval_history_not_null" NOT NULL approval_history;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_created_at_not_null" NOT NULL created_at;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_customer_id_not_null" NOT NULL customer_id;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_evidence_images_not_null" NOT NULL evidence_images;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_id_not_null" NOT NULL id;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_not_null" NOT NULL order_id;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_line_item_id_not_null" NOT NULL order_line_item_id;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_quantity_approved_not_null" NOT NULL quantity_approved;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_quantity_received_not_null" NOT NULL quantity_received;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_quantity_requested_not_null" NOT NULL quantity_requested;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_refund_amount_not_null" NOT NULL refund_amount;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_requested_at_not_null" NOT NULL requested_at;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_resolution_type_not_null" NOT NULL resolution_type;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_restock_inventory_not_null" NOT NULL restock_inventory;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_restocking_fee_amount_not_null" NOT NULL restocking_fee_amount;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_return_reason_not_null" NOT NULL return_reason;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_return_shipping_cost_not_null" NOT NULL return_shipping_cost;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_rma_number_not_null" NOT NULL rma_number;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_status_not_null" NOT NULL status;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_not_null" NOT NULL user_id;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_pkey" PRIMARY KEY (id);
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_foreign" FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_foreign" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_created_at_not_null" NOT NULL created_at;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_effect_not_null" NOT NULL effect;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_id_not_null" NOT NULL id;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_not_null" NOT NULL permission_id;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_not_null" NOT NULL role_id;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY (id);
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_at_not_null" NOT NULL created_at;
ALTER TABLE "roles" ADD CONSTRAINT "roles_id_not_null" NOT NULL id;
ALTER TABLE "roles" ADD CONSTRAINT "roles_is_system_not_null" NOT NULL is_system;
ALTER TABLE "roles" ADD CONSTRAINT "roles_name_not_null" NOT NULL name;
ALTER TABLE "roles" ADD CONSTRAINT "roles_slug_not_null" NOT NULL slug;
ALTER TABLE "roles" ADD CONSTRAINT "roles_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "roles" ADD CONSTRAINT "roles_pkey" PRIMARY KEY (id);
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_channel_type_not_null" NOT NULL channel_type;
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_code_not_null" NOT NULL code;
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_created_at_not_null" NOT NULL created_at;
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_default_config_not_null" NOT NULL default_config;
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_id_not_null" NOT NULL id;
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_is_active_not_null" NOT NULL is_active;
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_name_not_null" NOT NULL name;
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_supports_oauth_not_null" NOT NULL supports_oauth;
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_pkey" PRIMARY KEY (id);
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_columns_config_not_null" NOT NULL columns_config;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_created_at_not_null" NOT NULL created_at;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_filters_not_null" NOT NULL filters;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_id_not_null" NOT NULL id;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_is_default_not_null" NOT NULL is_default;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_module_key_not_null" NOT NULL module_key;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_name_not_null" NOT NULL name;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_sort_config_not_null" NOT NULL sort_config;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_user_id_not_null" NOT NULL user_id;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_pkey" PRIMARY KEY (id);
ALTER TABLE "seller_accounts" ADD CONSTRAINT "chk_seller_accounts_rate_limit" CHECK ((rate_limit_rpm > 0));
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_sales_channel_id_foreign" FOREIGN KEY (sales_channel_id) REFERENCES sales_channels(id) ON DELETE RESTRICT;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_account_name_not_null" NOT NULL account_name;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_created_at_not_null" NOT NULL created_at;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_default_currency_not_null" NOT NULL default_currency;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_external_seller_id_not_null" NOT NULL external_seller_id;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_health_status_not_null" NOT NULL health_status;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_id_not_null" NOT NULL id;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_marketplace_region_not_null" NOT NULL marketplace_region;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_rate_limit_rpm_not_null" NOT NULL rate_limit_rpm;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_retry_policy_not_null" NOT NULL retry_policy;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_sales_channel_id_not_null" NOT NULL sales_channel_id;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_status_not_null" NOT NULL status;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_sync_checkpoint_not_null" NOT NULL sync_checkpoint;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_sync_config_not_null" NOT NULL sync_config;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_user_id_not_null" NOT NULL user_id;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_pkey" PRIMARY KEY (id);
ALTER TABLE "shipment_items" ADD CONSTRAINT "chk_shipment_items_qty_positive" CHECK ((quantity_shipped > 0));
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_order_line_item_id_foreign" FOREIGN KEY (order_line_item_id) REFERENCES order_line_items(id) ON DELETE CASCADE;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_foreign" FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_created_at_not_null" NOT NULL created_at;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_id_not_null" NOT NULL id;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_order_line_item_id_not_null" NOT NULL order_line_item_id;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_quantity_shipped_not_null" NOT NULL quantity_shipped;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_serial_numbers_not_null" NOT NULL serial_numbers;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_not_null" NOT NULL shipment_id;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_user_id_not_null" NOT NULL user_id;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_pkey" PRIMARY KEY (id);
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_actual_invoiced_cost_not_null" NOT NULL actual_invoiced_cost;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_carrier_code_not_null" NOT NULL carrier_code;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_carrier_name_not_null" NOT NULL carrier_name;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_created_at_not_null" NOT NULL created_at;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_delivery_notification_sent_not_null" NOT NULL delivery_notification_sent;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_estimated_shipping_cost_not_null" NOT NULL estimated_shipping_cost;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_id_not_null" NOT NULL id;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_not_null" NOT NULL order_id;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shipment_number_not_null" NOT NULL shipment_number;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_status_not_null" NOT NULL status;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_user_id_not_null" NOT NULL user_id;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_pkey" PRIMARY KEY (id);
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_shipment_id_foreign" FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE RESTRICT;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_shipping_invoice_id_foreign" FOREIGN KEY (shipping_invoice_id) REFERENCES shipping_invoices(id) ON DELETE CASCADE;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_allow_duplicate_charge_not_null" NOT NULL allow_duplicate_charge;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_billed_amount_not_null" NOT NULL billed_amount;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_charge_type_not_null" NOT NULL charge_type;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_created_at_not_null" NOT NULL created_at;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_expected_amount_not_null" NOT NULL expected_amount;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_id_not_null" NOT NULL id;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_shipping_invoice_id_not_null" NOT NULL shipping_invoice_id;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_user_id_not_null" NOT NULL user_id;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_variance_amount_not_null" NOT NULL variance_amount;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_pkey" PRIMARY KEY (id);
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "chk_shipping_invoices_amounts_nonneg" CHECK (((subtotal_amount >= (0)::numeric) AND (tax_amount >= (0)::numeric) AND (total_amount >= (0)::numeric) AND (paid_amount >= (0)::numeric)));
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_financial_account_id_foreign" FOREIGN KEY (financial_account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_carrier_code_not_null" NOT NULL carrier_code;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_carrier_name_not_null" NOT NULL carrier_name;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_created_at_not_null" NOT NULL created_at;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_currency_code_not_null" NOT NULL currency_code;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_id_not_null" NOT NULL id;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_invoice_date_not_null" NOT NULL invoice_date;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_invoice_number_not_null" NOT NULL invoice_number;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_paid_amount_not_null" NOT NULL paid_amount;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_payment_status_not_null" NOT NULL payment_status;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_reconciliation_status_not_null" NOT NULL reconciliation_status;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_subtotal_amount_not_null" NOT NULL subtotal_amount;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_tax_amount_not_null" NOT NULL tax_amount;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_total_amount_not_null" NOT NULL total_amount;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_user_id_not_null" NOT NULL user_id;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_variance_amount_not_null" NOT NULL variance_amount;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_pkey" PRIMARY KEY (id);
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_sync_job_id_foreign" FOREIGN KEY (sync_job_id) REFERENCES sync_jobs(id) ON DELETE CASCADE;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_created_at_not_null" NOT NULL created_at;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_error_code_not_null" NOT NULL error_code;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_error_message_not_null" NOT NULL error_message;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_field_errors_not_null" NOT NULL field_errors;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_id_not_null" NOT NULL id;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_is_resolved_not_null" NOT NULL is_resolved;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_record_index_not_null" NOT NULL record_index;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_sync_job_id_not_null" NOT NULL sync_job_id;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_user_id_not_null" NOT NULL user_id;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_pkey" PRIMARY KEY (id);
ALTER TABLE "sync_jobs" ADD CONSTRAINT "chk_sync_jobs_counters_nonneg" CHECK (((total_records >= 0) AND (processed_records >= 0) AND (succeeded_records >= 0) AND (failed_records >= 0) AND (skipped_duplicates >= 0)));
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE SET NULL;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_created_at_not_null" NOT NULL created_at;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_error_summary_not_null" NOT NULL error_summary;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_failed_records_not_null" NOT NULL failed_records;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_id_not_null" NOT NULL id;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_idempotency_key_not_null" NOT NULL idempotency_key;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_job_type_not_null" NOT NULL job_type;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_processed_records_not_null" NOT NULL processed_records;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_skipped_duplicates_not_null" NOT NULL skipped_duplicates;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_status_not_null" NOT NULL status;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_succeeded_records_not_null" NOT NULL succeeded_records;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_total_records_not_null" NOT NULL total_records;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_user_id_not_null" NOT NULL user_id;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_pkey" PRIMARY KEY (id);
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_credit_card_id_foreign" FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_created_at_not_null" NOT NULL created_at;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_due_at_not_null" NOT NULL due_at;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_id_not_null" NOT NULL id;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_priority_not_null" NOT NULL priority;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_status_not_null" NOT NULL status;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_task_type_not_null" NOT NULL task_type;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_title_not_null" NOT NULL title;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_user_id_not_null" NOT NULL user_id;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_pkey" PRIMARY KEY (id);
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_user_id_foreign" FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_foreign" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_created_at_not_null" NOT NULL created_at;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_id_not_null" NOT NULL id;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_not_null" NOT NULL role_id;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_not_null" NOT NULL user_id;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY (id);
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_created_at_not_null" NOT NULL created_at;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_expires_at_not_null" NOT NULL expires_at;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_id_not_null" NOT NULL id;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_is_revoked_not_null" NOT NULL is_revoked;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_last_active_at_not_null" NOT NULL last_active_at;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_session_token_hash_not_null" NOT NULL session_token_hash;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_not_null" NOT NULL user_id;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY (id);
ALTER TABLE "users" ADD CONSTRAINT "chk_users_currency_code" CHECK (((default_currency)::text ~ '^[A-Z]{3}$'::text));
ALTER TABLE "users" ADD CONSTRAINT "chk_users_email_lower" CHECK (((email)::text = lower((email)::text)));
ALTER TABLE "users" ADD CONSTRAINT "chk_users_failed_login_nonneg" CHECK ((failed_login_attempts >= 0));
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_user_id_foreign" FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_created_at_not_null" NOT NULL created_at;
ALTER TABLE "users" ADD CONSTRAINT "users_default_currency_not_null" NOT NULL default_currency;
ALTER TABLE "users" ADD CONSTRAINT "users_email_not_null" NOT NULL email;
ALTER TABLE "users" ADD CONSTRAINT "users_failed_login_attempts_not_null" NOT NULL failed_login_attempts;
ALTER TABLE "users" ADD CONSTRAINT "users_full_name_not_null" NOT NULL full_name;
ALTER TABLE "users" ADD CONSTRAINT "users_id_not_null" NOT NULL id;
ALTER TABLE "users" ADD CONSTRAINT "users_is_super_admin_not_null" NOT NULL is_super_admin;
ALTER TABLE "users" ADD CONSTRAINT "users_password_not_null" NOT NULL password;
ALTER TABLE "users" ADD CONSTRAINT "users_preferences_not_null" NOT NULL preferences;
ALTER TABLE "users" ADD CONSTRAINT "users_status_not_null" NOT NULL status;
ALTER TABLE "users" ADD CONSTRAINT "users_timezone_not_null" NOT NULL timezone;
ALTER TABLE "users" ADD CONSTRAINT "users_updated_at_not_null" NOT NULL updated_at;
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY (id);

-- ---------- INDEXES ----------
CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_user_id);
CREATE INDEX idx_audit_logs_correlation ON public.audit_logs USING btree (correlation_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);
CREATE UNIQUE INDEX brands_pkey ON public.brands USING btree (id);
CREATE UNIQUE INDEX uq_brands_user_slug ON public.brands USING btree (user_id, slug);
CREATE UNIQUE INDEX channel_listings_pkey ON public.channel_listings USING btree (id);
CREATE INDEX idx_channel_listings_user ON public.channel_listings USING btree (user_id);
CREATE INDEX idx_channel_listings_variant ON public.channel_listings USING btree (product_variant_id);
CREATE UNIQUE INDEX uq_channel_listings_account_ext_variant ON public.channel_listings USING btree (seller_account_id, external_listing_id, product_variant_id);
CREATE UNIQUE INDEX credit_card_seller_accounts_pkey ON public.credit_card_seller_accounts USING btree (id);
CREATE INDEX idx_card_seller_accounts_seller ON public.credit_card_seller_accounts USING btree (seller_account_id);
CREATE UNIQUE INDEX uq_card_seller_accounts_purpose ON public.credit_card_seller_accounts USING btree (credit_card_id, seller_account_id, usage_purpose);
CREATE UNIQUE INDEX credit_cards_pkey ON public.credit_cards USING btree (id);
CREATE INDEX idx_credit_cards_due_date ON public.credit_cards USING btree (user_id, next_payment_due_date);
CREATE INDEX idx_credit_cards_user ON public.credit_cards USING btree (user_id);
CREATE UNIQUE INDEX customer_addresses_pkey ON public.customer_addresses USING btree (id);
CREATE INDEX idx_customer_addresses_customer ON public.customer_addresses USING btree (customer_id);
CREATE INDEX idx_customer_addresses_fingerprint ON public.customer_addresses USING btree (user_id, address_fingerprint);
CREATE UNIQUE INDEX customer_risk_signals_pkey ON public.customer_risk_signals USING btree (id);
CREATE INDEX idx_customer_risk_signals_customer ON public.customer_risk_signals USING btree (customer_id);
CREATE INDEX idx_customer_risk_signals_order ON public.customer_risk_signals USING btree (order_id);
CREATE INDEX idx_customer_risk_signals_status ON public.customer_risk_signals USING btree (user_id, review_status);
CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);
CREATE INDEX idx_customers_user ON public.customers USING btree (user_id);
CREATE INDEX idx_customers_user_ext_id ON public.customers USING btree (user_id, external_customer_id);
CREATE INDEX idx_customers_user_merged_into ON public.customers USING btree (user_id, merged_into_customer_id);
CREATE INDEX idx_customers_user_norm_email ON public.customers USING btree (user_id, normalized_email);
CREATE INDEX idx_customers_user_norm_phone ON public.customers USING btree (user_id, normalized_phone);
CREATE INDEX idx_customers_user_risk ON public.customers USING btree (user_id, risk_level);
CREATE UNIQUE INDEX finance_categories_pkey ON public.finance_categories USING btree (id);
CREATE UNIQUE INDEX uq_finance_categories_user_type_slug ON public.finance_categories USING btree (user_id, category_type, slug);
CREATE UNIQUE INDEX financial_accounts_pkey ON public.financial_accounts USING btree (id);
CREATE INDEX idx_financial_accounts_classification ON public.financial_accounts USING btree (user_id, data_classification);
CREATE INDEX idx_financial_accounts_user ON public.financial_accounts USING btree (user_id);
CREATE UNIQUE INDEX financial_transactions_pkey ON public.financial_transactions USING btree (id);
CREATE INDEX idx_financial_transactions_card ON public.financial_transactions USING btree (credit_card_id);
CREATE INDEX idx_financial_transactions_classification ON public.financial_transactions USING btree (user_id, data_classification);
CREATE INDEX idx_financial_transactions_due ON public.financial_transactions USING btree (user_id, status, due_date);
CREATE INDEX idx_financial_transactions_order ON public.financial_transactions USING btree (order_id);
CREATE INDEX idx_financial_transactions_seller ON public.financial_transactions USING btree (seller_account_id);
CREATE INDEX idx_financial_transactions_user_type_date ON public.financial_transactions USING btree (user_id, transaction_type, transaction_date);
CREATE UNIQUE INDEX uq_financial_transactions_user_ref ON public.financial_transactions USING btree (user_id, reference_number);
CREATE INDEX idx_marketplace_claims_order ON public.marketplace_claims USING btree (order_id);
CREATE INDEX idx_marketplace_claims_status ON public.marketplace_claims USING btree (user_id, status);
CREATE UNIQUE INDEX marketplace_claims_pkey ON public.marketplace_claims USING btree (id);
CREATE UNIQUE INDEX uq_marketplace_claims_user_number ON public.marketplace_claims USING btree (user_id, claim_number);
CREATE UNIQUE INDEX module_entitlements_pkey ON public.module_entitlements USING btree (id);
CREATE UNIQUE INDEX uq_module_entitlements_user_module ON public.module_entitlements USING btree (user_id, module_key);
CREATE INDEX idx_notifications_entity ON public.notifications USING btree (entity_type, entity_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read, created_at);
CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);
CREATE INDEX idx_order_import_payloads_hash ON public.order_import_payloads USING btree (user_id, payload_hash);
CREATE INDEX idx_order_import_payloads_order ON public.order_import_payloads USING btree (order_id);
CREATE UNIQUE INDEX order_import_payloads_pkey ON public.order_import_payloads USING btree (id);
CREATE INDEX idx_order_line_items_order ON public.order_line_items USING btree (order_id);
CREATE INDEX idx_order_line_items_variant ON public.order_line_items USING btree (product_variant_id);
CREATE UNIQUE INDEX order_line_items_pkey ON public.order_line_items USING btree (id);
CREATE UNIQUE INDEX uq_order_line_items_ext_id ON public.order_line_items USING btree (order_id, external_order_line_id) WHERE (external_order_line_id IS NOT NULL);
CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);
CREATE INDEX idx_orders_sync_job ON public.orders USING btree (sync_job_id);
CREATE INDEX idx_orders_user_ordered_at ON public.orders USING btree (user_id, ordered_at);
CREATE INDEX idx_orders_user_status ON public.orders USING btree (user_id, status);
CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);
CREATE UNIQUE INDEX uq_orders_seller_external_id ON public.orders USING btree (seller_account_id, external_order_id) WHERE (external_order_id IS NOT NULL);
CREATE UNIQUE INDEX uq_orders_user_order_number ON public.orders USING btree (user_id, order_number);
CREATE INDEX idx_outbox_events_aggregate ON public.outbox_events USING btree (aggregate_type, aggregate_id);
CREATE INDEX idx_outbox_events_status_retry ON public.outbox_events USING btree (status, next_retry_at);
CREATE UNIQUE INDEX outbox_events_pkey ON public.outbox_events USING btree (id);
CREATE INDEX idx_password_reset_tokens_user ON public.password_reset_tokens USING btree (user_id);
CREATE UNIQUE INDEX password_reset_tokens_pkey ON public.password_reset_tokens USING btree (id);
CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id);
CREATE UNIQUE INDEX uq_permissions_resource_action ON public.permissions USING btree (resource, action);
CREATE UNIQUE INDEX product_categories_pkey ON public.product_categories USING btree (id);
CREATE UNIQUE INDEX uq_product_categories_user_slug ON public.product_categories USING btree (user_id, slug);
CREATE INDEX idx_variant_attributes_lookup ON public.product_variant_attributes USING btree (user_id, attribute_name, attribute_value);
CREATE UNIQUE INDEX product_variant_attributes_pkey ON public.product_variant_attributes USING btree (id);
CREATE UNIQUE INDEX uq_variant_attributes_variant_name ON public.product_variant_attributes USING btree (product_variant_id, attribute_name);
CREATE INDEX idx_product_variants_product ON public.product_variants USING btree (product_id);
CREATE INDEX idx_product_variants_user_asin ON public.product_variants USING btree (user_id, asin);
CREATE UNIQUE INDEX product_variants_pkey ON public.product_variants USING btree (id);
CREATE UNIQUE INDEX uq_product_variants_user_sku ON public.product_variants USING btree (user_id, sku);
CREATE INDEX idx_products_brand ON public.products USING btree (brand_id);
CREATE INDEX idx_products_category ON public.products USING btree (category_id);
CREATE INDEX idx_products_user_status ON public.products USING btree (user_id, status);
CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);
CREATE UNIQUE INDEX uq_products_user_slug ON public.products USING btree (user_id, slug);
CREATE INDEX idx_refund_transactions_order ON public.refund_transactions USING btree (order_id);
CREATE INDEX idx_refund_transactions_return ON public.refund_transactions USING btree (return_request_id);
CREATE UNIQUE INDEX refund_transactions_pkey ON public.refund_transactions USING btree (id);
CREATE UNIQUE INDEX uq_refund_transactions_order_ext_id ON public.refund_transactions USING btree (order_id, external_refund_id) WHERE (external_refund_id IS NOT NULL);
CREATE UNIQUE INDEX uq_refund_transactions_user_number ON public.refund_transactions USING btree (user_id, refund_number);
CREATE INDEX idx_return_requests_order ON public.return_requests USING btree (order_id);
CREATE INDEX idx_return_requests_order_line ON public.return_requests USING btree (order_line_item_id);
CREATE INDEX idx_return_requests_user_status ON public.return_requests USING btree (user_id, status);
CREATE UNIQUE INDEX return_requests_pkey ON public.return_requests USING btree (id);
CREATE UNIQUE INDEX uq_return_requests_order_ext_id ON public.return_requests USING btree (order_id, external_return_id) WHERE (external_return_id IS NOT NULL);
CREATE UNIQUE INDEX uq_return_requests_user_rma ON public.return_requests USING btree (user_id, rma_number);
CREATE INDEX idx_role_permissions_perm ON public.role_permissions USING btree (permission_id);
CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (id);
CREATE UNIQUE INDEX uq_role_permissions_role_perm ON public.role_permissions USING btree (role_id, permission_id);
CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);
CREATE UNIQUE INDEX sales_channels_pkey ON public.sales_channels USING btree (id);
CREATE UNIQUE INDEX saved_views_pkey ON public.saved_views USING btree (id);
CREATE UNIQUE INDEX uq_saved_views_user_module_name ON public.saved_views USING btree (user_id, module_key, name);
CREATE INDEX idx_seller_accounts_status ON public.seller_accounts USING btree (status);
CREATE INDEX idx_seller_accounts_user ON public.seller_accounts USING btree (user_id);
CREATE UNIQUE INDEX seller_accounts_pkey ON public.seller_accounts USING btree (id);
CREATE UNIQUE INDEX uq_seller_accounts_identity ON public.seller_accounts USING btree (user_id, sales_channel_id, external_seller_id, marketplace_region);
CREATE INDEX idx_shipment_items_order_line ON public.shipment_items USING btree (order_line_item_id);
CREATE UNIQUE INDEX shipment_items_pkey ON public.shipment_items USING btree (id);
CREATE UNIQUE INDEX uq_shipment_items_shipment_line ON public.shipment_items USING btree (shipment_id, order_line_item_id);
CREATE INDEX idx_shipments_order ON public.shipments USING btree (order_id);
CREATE INDEX idx_shipments_tracking ON public.shipments USING btree (tracking_number);
CREATE INDEX idx_shipments_user_status ON public.shipments USING btree (user_id, status);
CREATE UNIQUE INDEX shipments_pkey ON public.shipments USING btree (id);
CREATE UNIQUE INDEX uq_shipments_user_number ON public.shipments USING btree (user_id, shipment_number);
CREATE INDEX idx_shipping_invoice_lines_invoice ON public.shipping_invoice_lines USING btree (shipping_invoice_id);
CREATE UNIQUE INDEX shipping_invoice_lines_pkey ON public.shipping_invoice_lines USING btree (id);
CREATE UNIQUE INDEX uq_shipping_invoice_lines_shipment_charge ON public.shipping_invoice_lines USING btree (shipment_id, charge_type) WHERE ((shipment_id IS NOT NULL) AND (allow_duplicate_charge = false));
CREATE INDEX idx_shipping_invoices_due_date ON public.shipping_invoices USING btree (user_id, due_date);
CREATE INDEX idx_shipping_invoices_status ON public.shipping_invoices USING btree (user_id, payment_status);
CREATE UNIQUE INDEX shipping_invoices_pkey ON public.shipping_invoices USING btree (id);
CREATE UNIQUE INDEX uq_shipping_invoices_user_carrier_num ON public.shipping_invoices USING btree (user_id, carrier_code, invoice_number);
CREATE INDEX idx_sync_job_errors_job ON public.sync_job_errors USING btree (sync_job_id);
CREATE INDEX idx_sync_job_errors_user ON public.sync_job_errors USING btree (user_id);
CREATE UNIQUE INDEX sync_job_errors_pkey ON public.sync_job_errors USING btree (id);
CREATE INDEX idx_sync_jobs_seller_account ON public.sync_jobs USING btree (seller_account_id);
CREATE INDEX idx_sync_jobs_user_status ON public.sync_jobs USING btree (user_id, status);
CREATE UNIQUE INDEX sync_jobs_pkey ON public.sync_jobs USING btree (id);
CREATE UNIQUE INDEX uq_sync_jobs_user_idempotency ON public.sync_jobs USING btree (user_id, idempotency_key);
CREATE INDEX idx_tasks_reminders_card ON public.tasks_reminders USING btree (credit_card_id);
CREATE INDEX idx_tasks_reminders_user_status_due ON public.tasks_reminders USING btree (user_id, status, due_at);
CREATE UNIQUE INDEX tasks_reminders_pkey ON public.tasks_reminders USING btree (id);
CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role_id);
CREATE UNIQUE INDEX uq_user_roles_user_role ON public.user_roles USING btree (user_id, role_id);
CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (user_id, is_revoked);
CREATE INDEX idx_user_sessions_user ON public.user_sessions USING btree (user_id);
CREATE UNIQUE INDEX user_sessions_pkey ON public.user_sessions USING btree (id);
CREATE INDEX idx_users_created_by ON public.users USING btree (created_by_user_id);
CREATE INDEX idx_users_status ON public.users USING btree (status);
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

-- ---------- FUNCTIONS & TRIGGERS ----------
CREATE OR REPLACE FUNCTION public.fn_audit_log_capture()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_new jsonb;
  v_old jsonb;
  v_changed text[] := '{}';
  v_k text;
  v_action text;
  v_entity_id text;
  v_user_id text;
  v_actor text;
  v_checksum text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW); v_old := NULL; v_action := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN
    v_new := to_jsonb(NEW); v_old := to_jsonb(OLD); v_action := 'UPDATE';
    FOR v_k IN SELECT jsonb_object_keys(v_new) LOOP
      IF v_k = ANY(ARRAY['updated_at','created_at']) THEN CONTINUE; END IF;
      IF v_new->v_k IS DISTINCT FROM v_old->v_k THEN
        v_changed := v_changed || v_k;
      END IF;
    END LOOP;
    IF COALESCE(array_length(v_changed, 1), 0) = 0 THEN
      RETURN NULL;
    END IF;
  ELSE
    v_new := NULL; v_old := to_jsonb(OLD); v_action := 'DELETE';
    v_changed := ARRAY(SELECT jsonb_object_keys(v_old));
  END IF;

  v_entity_id := COALESCE(v_new->>'id', v_old->>'id');
  v_user_id := COALESCE(v_new->>'user_id', v_old->>'user_id');
  v_actor := NULLIF(current_setting('app.actor_user_id', true), '');
  v_checksum := encode(sha256(convert_to(
    COALESCE(v_new::text, '') || '|' || COALESCE(v_old::text, '') || '|' || COALESCE(v_changed::text, ''),
    'UTF8')), 'hex');

  INSERT INTO audit_logs (id, actor_user_id, user_id, action, entity_type, entity_id, before_state, after_state, metadata, checksum, created_at)
  VALUES (
    'aud_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 26)),
    v_actor, v_user_id, v_action, TG_TABLE_NAME, v_entity_id,
    v_old, v_new,
    jsonb_build_object('changed_fields', to_jsonb(v_changed)),
    v_checksum, now()
  );
  RETURN NULL;
END $function$;
CREATE OR REPLACE FUNCTION public.fn_audit_log_append_only()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: % is not allowed', TG_OP USING ERRCODE = '42501';
END $function$;
CREATE TRIGGER trg_audit_logs_append_only BEFORE DELETE OR UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION fn_audit_log_append_only();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.module_entitlements FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.user_sessions FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.password_reset_tokens FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.sales_channels FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.seller_accounts FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.sync_jobs FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.sync_job_errors FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.financial_accounts FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.credit_cards FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.credit_card_seller_accounts FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.finance_categories FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.customer_addresses FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.product_variant_attributes FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.channel_listings FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.order_import_payloads FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.order_line_items FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.customer_risk_signals FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.shipment_items FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.shipping_invoices FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.shipping_invoice_lines FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.return_requests FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.refund_transactions FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.marketplace_claims FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.saved_views FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.tasks_reminders FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.outbox_events FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
