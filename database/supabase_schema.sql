-- Seller Core schema — generated from the applied migrations (local PostgreSQL).
-- Target: Supabase (PostgreSQL 17+). Apply in order; then run `node ace migration:run`.
-- Regenerate with: node ./scripts/sync_supabase_schema.mjs
-- Money is PriceMoney JSONB {currency_code, amount} validated by is_valid_price_money.

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

-- ---------- FUNCTIONS ----------
CREATE OR REPLACE FUNCTION public.is_valid_price_money(val jsonb, allow_negative boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
  SELECT jsonb_typeof(val) = 'object'
    AND (val ? 'currency_code')
    AND (val ? 'amount')
    AND jsonb_typeof(val->'currency_code') = 'string'
    AND (val->>'currency_code') ~ '^[A-Z]{3}$'
    AND jsonb_typeof(val->'amount') = 'number'
    AND (allow_negative OR (val->>'amount')::numeric >= 0);
$function$;

CREATE OR REPLACE FUNCTION public.is_valid_medusa_prices_array(val jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
  SELECT jsonb_typeof(val) = 'array'
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(val) AS elem
      WHERE NOT is_valid_price_money(elem, false)
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_valid_money_entry_array(val jsonb, amount_key text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
  SELECT jsonb_typeof(val) = 'array'
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(val) AS elem
      WHERE jsonb_typeof(elem) <> 'object'
        OR NOT is_valid_price_money(elem -> amount_key, false)
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_valid_variant_attributes_map(val jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
        SELECT COALESCE(
          jsonb_typeof(val) = 'object'
          AND NOT jsonb_exists_any(val, ARRAY['prices','color_name','color_code','color_map','size_key','size_value','size_code'])
          AND NOT EXISTS (
            SELECT 1 FROM jsonb_each(val) AS kv(key, value) WHERE jsonb_typeof(kv.value) <> 'string'
          )
          AND NOT EXISTS (
            SELECT 1 FROM jsonb_object_keys(val) AS key WHERE key !~ '^[a-z][a-z0-9_]{0,63}$'
          ),
          false)
      $function$;

CREATE OR REPLACE FUNCTION public.create_personal_organization()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      DECLARE
        org_id text := generate_entity_id('org');
      BEGIN
        INSERT INTO organizations (id, name, owner_user_id, is_personal)
        VALUES (
          org_id,
          LEFT(COALESCE(NULLIF(TRIM(NEW.full_name), ''), NEW.email) || ' workspace', 150),
          NEW.id,
          true
        );
        INSERT INTO organization_memberships (id, organization_id, user_id, is_admin, added_by_user_id)
        VALUES (generate_entity_id('omem'), org_id, NEW.id, true, NEW.id);
        RETURN NEW;
      END; $function$;

CREATE OR REPLACE FUNCTION public.fn_audit_log_append_only()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: % is not allowed', TG_OP USING ERRCODE = '42501';
END $function$;

CREATE OR REPLACE FUNCTION public.fn_audit_log_capture()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      DECLARE
        v_new jsonb; v_old jsonb; v_changed text[] := '{}'; v_k text;
        v_action text; v_entity_id text; v_user_id text; v_actor text; v_checksum text;
      BEGIN
        IF TG_OP = 'INSERT' THEN
          v_new := to_jsonb(NEW); v_old := NULL; v_action := 'INSERT';
        ELSIF TG_OP = 'UPDATE' THEN
          v_new := to_jsonb(NEW); v_old := to_jsonb(OLD); v_action := 'UPDATE';
          FOR v_k IN SELECT jsonb_object_keys(v_new) LOOP
            IF v_k = ANY(ARRAY['updated_at','created_at']) THEN CONTINUE; END IF;
            IF v_new->v_k IS DISTINCT FROM v_old->v_k THEN v_changed := v_changed || v_k; END IF;
          END LOOP;
          IF COALESCE(array_length(v_changed, 1), 0) = 0 THEN RETURN NULL; END IF;
        ELSE
          v_new := NULL; v_old := to_jsonb(OLD); v_action := 'DELETE';
          v_changed := ARRAY(SELECT jsonb_object_keys(v_old));
        END IF;
        v_entity_id := COALESCE(v_new->>'id', v_old->>'id');
        v_user_id := COALESCE(v_new->>'user_id', v_old->>'user_id');
        v_actor := NULLIF(current_setting('app.actor_user_id', true), '');
        -- Never duplicate credentials, password hashes or raw import payloads into audit history.
        v_new := v_new - ARRAY['password', 'encrypted_credentials', 'session_token_hash', 'vault_token_reference', 'raw_payload'];
        v_old := v_old - ARRAY['password', 'encrypted_credentials', 'session_token_hash', 'vault_token_reference', 'raw_payload'];
        v_checksum := encode(sha256(convert_to(
          COALESCE(v_new::text, '') || '|' || COALESCE(v_old::text, '') || '|' || COALESCE(v_changed::text, ''), 'UTF8')), 'hex');
        INSERT INTO audit_logs (id, actor_user_id, user_id, action, entity_type, entity_id, before_state, after_state, metadata, checksum, created_at)
        VALUES ('aud_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 26)),
          v_actor, v_user_id, v_action, TG_TABLE_NAME, v_entity_id, v_old, v_new,
          jsonb_build_object('changed_fields', to_jsonb(v_changed)), v_checksum, now());
        RETURN NULL;
      END $function$;

CREATE OR REPLACE FUNCTION public.generate_entity_id(prefix text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
      DECLARE
        alphabet CONSTANT text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        timestamp_ms bigint := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint;
        time_part text := '';
        random_part text := '';
        random_value numeric := 0;
        raw_random bytea := substring(uuid_send(gen_random_uuid()) from 1 for 10);
        suffix text := '';
        i integer;
        digit integer;
      BEGIN
        IF prefix IS NOT NULL AND prefix !~ '^[a-z]{2,8}$' THEN
          RAISE EXCEPTION 'invalid entity id prefix: %', prefix;
        END IF;

        -- 48-bit millisecond timestamp encoded into ten base32 characters.
        FOR i IN REVERSE 9..0 LOOP
          digit := (timestamp_ms % 32)::integer;
          time_part := substr(alphabet, digit + 1, 1) || time_part;
          timestamp_ms := timestamp_ms / 32;
        END LOOP;

        -- 80 bits of randomness encoded into sixteen base32 characters.
        FOR i IN 0..9 LOOP
          random_value := random_value * 256 + get_byte(raw_random, i);
        END LOOP;
        FOR i IN REVERSE 15..0 LOOP
          digit := (random_value % 32)::integer;
          random_part := substr(alphabet, digit + 1, 1) || random_part;
          random_value := floor(random_value / 32);
        END LOOP;

        suffix := time_part || random_part;
        IF prefix IS NULL THEN
          RETURN suffix;
        END IF;
        RETURN prefix || '_' || suffix;
      END;
      $function$;

-- ---------- TABLES ----------
CREATE TABLE "audit_logs" (
  "id" varchar(64) NOT NULL,
  "actor_user_id" varchar(64),
  "user_id" varchar(64),
  "action" varchar(150) NOT NULL,
  "entity_type" varchar(100) NOT NULL,
  "entity_id" varchar(64),
  "request_id" varchar(100),
  "correlation_id" varchar(100),
  "ip_address" varchar(64),
  "user_agent" text,
  "before_state" jsonb,
  "after_state" jsonb,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "checksum" varchar(64) NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "brands" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "name" varchar(150) NOT NULL,
  "reg_no" varchar(150),
  "serial_no" varchar(150),
  "slug" varchar(150) NOT NULL,
  "logo_url" text,
  "website_url" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "catalog_items" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "catalog_key" varchar(100) NOT NULL,
  "structured_code" varchar(100),
  "file_name" varchar(255),
  "title" varchar(255) NOT NULL,
  "sub_title" varchar(255),
  "type" varchar(100),
  "gender" varchar(50) DEFAULT 'Men'::character varying NOT NULL,
  "resolved_category_id" varchar(64),
  "description" text,
  "pattern" varchar(100) DEFAULT 'Solid'::character varying,
  "price_tier" varchar(10) DEFAULT '01'::character varying NOT NULL,
  "base_price_usd" numeric(14,2) DEFAULT 239.99 NOT NULL,
  "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "images" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "variants_spec" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" varchar(50) DEFAULT 'draft'::character varying NOT NULL,
  "converted_product_id" varchar(64),
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "channel_listings" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "seller_account_id" varchar(64) NOT NULL,
  "product_variant_id" varchar(64) NOT NULL,
  "external_listing_id" varchar(150) NOT NULL,
  "external_variant_id" varchar(150),
  "external_sku" varchar(150),
  "channel_title" varchar(500),
  "channel_description" text,
  "channel_category_id" varchar(150),
  "prices" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "listed_price" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "allocated_quantity" integer DEFAULT 0 NOT NULL,
  "listing_status" "listing_status" DEFAULT 'active'::listing_status NOT NULL,
  "publication_status" "publication_status" DEFAULT 'published'::publication_status NOT NULL,
  "sync_status" "entity_sync_status" DEFAULT 'synced'::entity_sync_status NOT NULL,
  "last_sync_error" text,
  "channel_attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "last_synced_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "credit_card_seller_accounts" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "credit_card_id" varchar(64) NOT NULL,
  "seller_account_id" varchar(64) NOT NULL,
  "usage_purpose" "card_channel_usage" DEFAULT 'primary_billing'::card_channel_usage NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "credit_cards" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "financial_account_id" varchar(64),
  "card_label" varchar(150) NOT NULL,
  "brand_name" varchar(64) NOT NULL,
  "issuer_bank" varchar(150),
  "cardholder_name" varchar(150) NOT NULL,
  "last_4_digits" varchar(4) NOT NULL,
  "exp_month" integer NOT NULL,
  "exp_year" integer NOT NULL,
  "vault_token_reference" varchar(255),
  "logo_url" text,
  "credit_limit" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "current_balance" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "statement_balance" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "minimum_payment_due" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "billing_cycle_day" integer,
  "payment_due_day" integer,
  "next_payment_due_date" date,
  "reminder_days_before" integer DEFAULT 5 NOT NULL,
  "auto_pay_enabled" boolean DEFAULT false NOT NULL,
  "data_classification" "data_classification" DEFAULT 'business'::data_classification NOT NULL,
  "status" "credit_card_status" DEFAULT 'active'::credit_card_status NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "customer_addresses" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "customer_id" varchar(64) NOT NULL,
  "address_type" "address_type" DEFAULT 'both'::address_type NOT NULL,
  "label" varchar(100),
  "recipient_name" varchar(255) NOT NULL,
  "company_name" varchar(200),
  "phone" varchar(50),
  "line_1" varchar(255) NOT NULL,
  "line_2" varchar(255),
  "line_3" varchar(255),
  "city" varchar(150) NOT NULL,
  "state_province" varchar(150),
  "postal_code" varchar(50) NOT NULL,
  "country_code" varchar(2) DEFAULT 'US'::character varying NOT NULL,
  "address_fingerprint" varchar(64),
  "is_default" boolean DEFAULT false NOT NULL,
  "is_verified" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "customer_risk_signals" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "customer_id" varchar(64) NOT NULL,
  "order_id" varchar(64),
  "signal_type" "risk_signal_type" NOT NULL,
  "severity" "risk_severity" DEFAULT 'low'::risk_severity NOT NULL,
  "review_status" "risk_review_status" DEFAULT 'pending_review'::risk_review_status NOT NULL,
  "reason" text NOT NULL,
  "evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "reviewed_by_user_id" varchar(64),
  "reviewed_at" timestamptz,
  "review_notes" text,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "customers" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "external_customer_id" varchar(150),
  "full_name" varchar(255) NOT NULL,
  "company_name" varchar(200),
  "email" varchar(255),
  "normalized_email" varchar(255),
  "proxy_email" varchar(255),
  "phone" varchar(50),
  "normalized_phone" varchar(50),
  "orders_count" integer DEFAULT 0 NOT NULL,
  "total_spent" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "risk_level" "customer_risk_level" DEFAULT 'low'::customer_risk_level NOT NULL,
  "risk_score" integer DEFAULT 0 NOT NULL,
  "merged_into_customer_id" varchar(64),
  "notes" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "first_order_at" timestamptz,
  "last_order_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "is_repeat_customer" boolean,
  PRIMARY KEY (id)
);

CREATE TABLE "finance_categories" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "parent_id" varchar(64),
  "name" varchar(150) NOT NULL,
  "slug" varchar(150) NOT NULL,
  "category_type" "finance_category_type" NOT NULL,
  "data_classification" "data_classification" DEFAULT 'business'::data_classification NOT NULL,
  "cost_bucket" "finance_cost_bucket" DEFAULT 'operations'::finance_cost_bucket NOT NULL,
  "is_tax_deductible" boolean DEFAULT true NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "financial_accounts" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "account_name" varchar(150) NOT NULL,
  "account_type" "financial_account_type" DEFAULT 'bank_checking'::financial_account_type NOT NULL,
  "institution_name" varchar(150),
  "account_number_last_4" varchar(4),
  "current_balance" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "data_classification" "data_classification" DEFAULT 'business'::data_classification NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "financial_transactions" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "financial_account_id" varchar(64),
  "credit_card_id" varchar(64),
  "finance_category_id" varchar(64),
  "seller_account_id" varchar(64),
  "order_id" varchar(64),
  "product_variant_id" varchar(64),
  "shipping_invoice_id" varchar(64),
  "reference_number" varchar(100) NOT NULL,
  "transaction_type" "financial_transaction_type" NOT NULL,
  "data_classification" "data_classification" DEFAULT 'business'::data_classification NOT NULL,
  "status" "financial_transaction_status" DEFAULT 'posted'::financial_transaction_status NOT NULL,
  "description" varchar(255) NOT NULL,
  "vendor_or_payer" varchar(200),
  "original_amount" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "exchange_rate" numeric(18,8) DEFAULT '1'::numeric NOT NULL,
  "reporting_amount" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "tax_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "transaction_date" date NOT NULL,
  "conversion_date" date,
  "due_date" date,
  "settled_at" timestamptz,
  "reconciled_at" timestamptz,
  "receipt_url" text,
  "notes" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "manual_reconciliations" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "financial_transaction_id" varchar(64) NOT NULL,
  "source_reference" varchar(150) NOT NULL,
  "observed_amount" jsonb NOT NULL,
  "notes" text,
  "previous_status" varchar(30) NOT NULL,
  "reconciled_by_user_id" varchar(64) NOT NULL,
  "reconciled_at" timestamptz NOT NULL,
  "reversed_at" timestamptz,
  "reversed_by_user_id" varchar(64),
  "reversal_reason" text,
  PRIMARY KEY (id)
);

CREATE TABLE "marketplace_claims" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "order_id" varchar(64) NOT NULL,
  "claim_number" varchar(100) NOT NULL,
  "external_claim_id" varchar(150),
  "claim_type" "claim_type" DEFAULT 'a_to_z_guarantee'::claim_type NOT NULL,
  "status" "claim_status" DEFAULT 'opened'::claim_status NOT NULL,
  "disputed_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "seller_liability_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "reason" text,
  "evidence_submitted" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "respond_by_at" timestamptz,
  "resolved_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "module_entitlements" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "module_key" varchar(100) NOT NULL,
  "is_enabled" boolean DEFAULT true NOT NULL,
  "plan_tier" varchar(64) DEFAULT 'enterprise'::character varying NOT NULL,
  "limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "expires_at" timestamptz,
  "updated_by_user_id" varchar(64),
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "notifications" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "type" varchar(100) NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text,
  "entity_type" varchar(100),
  "entity_id" varchar(64),
  "channel" varchar(32) DEFAULT 'in_app'::character varying NOT NULL,
  "recipient_address" varchar(255),
  "is_read" boolean DEFAULT false NOT NULL,
  "sent_at" timestamptz,
  "read_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "order_import_payloads" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "order_id" varchar(64) NOT NULL,
  "payload_hash" varchar(64) NOT NULL,
  "payload_size_bytes" integer NOT NULL,
  "raw_payload" jsonb NOT NULL,
  "redacted_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "order_line_items" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "order_id" varchar(64) NOT NULL,
  "product_variant_id" varchar(64),
  "channel_listing_id" varchar(64),
  "external_order_line_id" varchar(150),
  "external_listing_id" varchar(150),
  "external_variant_id" varchar(150),
  "sku" varchar(120) NOT NULL,
  "title" varchar(255) NOT NULL,
  "variant_title" varchar(255),
  "quantity_ordered" integer NOT NULL,
  "quantity_fulfilled" integer DEFAULT 0 NOT NULL,
  "quantity_returned" integer DEFAULT 0 NOT NULL,
  "quantity_cancelled" integer DEFAULT 0 NOT NULL,
  "fulfillment_channel" varchar(32) DEFAULT 'MFN'::character varying NOT NULL,
  "tax_lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "adjustments" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "custom_attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "unit_price" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "subtotal" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "discount_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "promotion_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "tax_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "shipping_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "shipping_discount_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "shipping_tax_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "grand_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "unit_cost" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "marketplace_fee" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "refunded_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "fulfillment_status" "fulfillment_status" DEFAULT 'unfulfilled'::fulfillment_status NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "orders" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "seller_account_id" varchar(64),
  "customer_id" varchar(64) NOT NULL,
  "shipping_address_id" varchar(64),
  "billing_address_id" varchar(64),
  "sync_job_id" varchar(64),
  "order_number" varchar(100) NOT NULL,
  "external_order_id" varchar(150),
  "external_display_id" varchar(150),
  "source_type" "order_source_type" DEFAULT 'manual'::order_source_type NOT NULL,
  "status" "order_status" DEFAULT 'pending'::order_status NOT NULL,
  "payment_status" "order_payment_status" DEFAULT 'unpaid'::order_payment_status NOT NULL,
  "fulfillment_status" "fulfillment_status" DEFAULT 'unfulfilled'::fulfillment_status NOT NULL,
  "sync_status" "entity_sync_status" DEFAULT 'not_applicable'::entity_sync_status NOT NULL,
  "fulfillment_channel" varchar(32) DEFAULT 'MFN'::character varying NOT NULL,
  "marketplace_site_id" varchar(64),
  "tax_collection_model" varchar(32) DEFAULT 'seller'::character varying NOT NULL,
  "channel_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "earliest_ship_at" timestamptz,
  "latest_ship_at" timestamptz,
  "earliest_delivery_at" timestamptz,
  "latest_delivery_at" timestamptz,
  "exchange_rate" numeric(18,8) DEFAULT '1'::numeric NOT NULL,
  "subtotal" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "discount_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "promotion_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "shipping_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "shipping_discount_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "tax_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "shipping_tax_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "marketplace_withheld_tax_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "grand_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "marketplace_fees_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "payment_processing_fees_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "shipping_cost_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "cogs_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "refunded_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "net_proceeds" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "gross_profit" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "net_profit" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "reporting_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "shipping_address_snapshot" jsonb,
  "buyer_notes" text,
  "internal_notes" text,
  "ordered_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "confirmed_at" timestamptz,
  "shipped_at" timestamptz,
  "delivered_at" timestamptz,
  "cancelled_at" timestamptz,
  "source_created_at" timestamptz,
  "source_updated_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "organization_memberships" (
  "id" varchar(64) NOT NULL,
  "organization_id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "is_admin" boolean DEFAULT false NOT NULL,
  "role_id" varchar(64),
  "added_by_user_id" varchar(64),
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "organizations" (
  "id" varchar(64) NOT NULL,
  "name" varchar(150) NOT NULL,
  "owner_user_id" varchar(64) NOT NULL,
  "is_personal" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "outbox_events" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64),
  "aggregate_type" varchar(100) NOT NULL,
  "aggregate_id" varchar(64) NOT NULL,
  "event_type" varchar(150) NOT NULL,
  "idempotency_key" varchar(150) NOT NULL,
  "correlation_id" varchar(100),
  "payload" jsonb NOT NULL,
  "status" "outbox_event_status" DEFAULT 'pending'::outbox_event_status NOT NULL,
  "retry_count" integer DEFAULT 0 NOT NULL,
  "max_retries" integer DEFAULT 5 NOT NULL,
  "next_retry_at" timestamptz,
  "last_error" text,
  "processed_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "password_reset_tokens" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "token_hash" varchar(128) NOT NULL,
  "requested_ip" varchar(64),
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "permissions" (
  "id" varchar(64) NOT NULL,
  "name" varchar(150) NOT NULL,
  "slug" varchar(150) NOT NULL,
  "resource" varchar(100) NOT NULL,
  "action" varchar(100) NOT NULL,
  "description" text,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "product_categories" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "parent_category_id" varchar(64),
  "name" varchar(150) NOT NULL,
  "slug" varchar(150) NOT NULL,
  "taxonomy_path" varchar(500),
  "attributes_schema" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "description" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "product_variant_attributes" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "product_variant_id" varchar(64) NOT NULL,
  "attribute_name" varchar(100) NOT NULL,
  "attribute_value" varchar(255) NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "product_variants" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "product_id" varchar(64) NOT NULL,
  "sku" varchar(120) NOT NULL,
  "title" varchar(255) NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "barcode_upc_ean" varchar(64),
  "mpn" varchar(100),
  "asin" varchar(20),
  "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "prices" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "cost_price" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "manufacturing_cost" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "packaging_cost" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "stock_on_hand" integer DEFAULT 0 NOT NULL,
  "stock_reserved" integer DEFAULT 0 NOT NULL,
  "reorder_point" integer DEFAULT 5 NOT NULL,
  "weight_grams" numeric(14,2),
  "dimensions_cm" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "images" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" "variant_status" DEFAULT 'active'::variant_status NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "stock_available" integer,
  PRIMARY KEY (id)
);

CREATE TABLE "products" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "brand_id" varchar(64),
  "category_id" varchar(64),
  "title" varchar(255) NOT NULL,
  "sub_title" varchar(255),
  "slug" varchar(255) NOT NULL,
  "sku_prefix" varchar(100),
  "prices" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "collection_name" varchar(100),
  "description" text,
  "status" "product_status" DEFAULT 'draft'::product_status NOT NULL,
  "has_variants" boolean DEFAULT false NOT NULL,
  "variation_dimensions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "weight_grams" numeric(14,2),
  "dimensions_cm" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "images" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "type" varchar(100),
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "queue_jobs" (
  "id" varchar(255) NOT NULL,
  "queue" varchar(255) NOT NULL,
  "status" text NOT NULL,
  "data" text NOT NULL,
  "score" bigint,
  "worker_id" varchar(255),
  "acquired_at" bigint,
  "execute_at" bigint,
  "finished_at" bigint,
  "error" text,
  "dedup_id" varchar(510),
  "dedup_at" bigint,
  "dedup_ttl" bigint,
  PRIMARY KEY (id, queue)
);

CREATE TABLE "queue_schedules" (
  "id" varchar(255) NOT NULL,
  "status" varchar(50) DEFAULT 'active'::character varying NOT NULL,
  "name" varchar(255) NOT NULL,
  "payload" text NOT NULL,
  "cron_expression" varchar(255),
  "every_ms" bigint,
  "timezone" varchar(100) DEFAULT 'UTC'::character varying NOT NULL,
  "from_date" timestamptz,
  "to_date" timestamptz,
  "run_limit" integer,
  "run_count" integer DEFAULT 0 NOT NULL,
  "next_run_at" timestamptz,
  "last_run_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "refund_transactions" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "order_id" varchar(64) NOT NULL,
  "order_line_item_id" varchar(64),
  "return_request_id" varchar(64),
  "financial_account_id" varchar(64),
  "refund_number" varchar(100) NOT NULL,
  "external_refund_id" varchar(150),
  "status" "refund_status" DEFAULT 'processed'::refund_status NOT NULL,
  "items_refund_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "shipping_refund_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "tax_refund_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "restocking_fee_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "grand_refund_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "reason" text,
  "processed_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "return_requests" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "order_id" varchar(64) NOT NULL,
  "order_line_item_id" varchar(64) NOT NULL,
  "rma_number" varchar(100) NOT NULL,
  "external_return_id" varchar(150),
  "status" "return_status" DEFAULT 'requested'::return_status NOT NULL,
  "return_reason" "return_reason" DEFAULT 'other'::return_reason NOT NULL,
  "resolution_type" "return_resolution_type" DEFAULT 'refund'::return_resolution_type NOT NULL,
  "quantity_requested" integer NOT NULL,
  "quantity_approved" integer DEFAULT 0 NOT NULL,
  "quantity_received" integer DEFAULT 0 NOT NULL,
  "item_condition" "return_item_condition",
  "restock_inventory" boolean DEFAULT false NOT NULL,
  "return_carrier" varchar(100),
  "return_tracking_number" varchar(150),
  "return_label_url" text,
  "return_shipping_cost" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "restocking_fee_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "refund_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "replacement_order_id" varchar(64),
  "customer_comments" text,
  "internal_notes" text,
  "evidence_images" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "approval_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "reviewed_by_user_id" varchar(64),
  "requested_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "authorized_at" timestamptz,
  "received_at" timestamptz,
  "closed_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "role_permissions" (
  "id" varchar(64) NOT NULL,
  "role_id" varchar(64) NOT NULL,
  "permission_id" varchar(64) NOT NULL,
  "effect" "permission_effect" DEFAULT 'allow'::permission_effect NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "roles" (
  "id" varchar(64) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "name" varchar(150) NOT NULL,
  "description" text,
  "is_system" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "sales_channels" (
  "id" varchar(64) NOT NULL,
  "code" varchar(50) NOT NULL,
  "name" varchar(150) NOT NULL,
  "channel_type" "channel_type" DEFAULT 'marketplace'::channel_type NOT NULL,
  "logo_url" text,
  "supports_oauth" boolean DEFAULT true NOT NULL,
  "default_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "saved_views" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "module_key" varchar(100) NOT NULL,
  "name" varchar(150) NOT NULL,
  "filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "sort_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "columns_config" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "seller_accounts" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "sales_channel_id" varchar(64) NOT NULL,
  "account_name" varchar(150) NOT NULL,
  "account_email" varchar(150),
  "account_phone" varchar(150),
  "account_code" varchar(4),
  "external_seller_id" varchar(150) NOT NULL,
  "marketplace_region" varchar(32) DEFAULT 'US'::character varying NOT NULL,
  "default_currency" varchar(3) DEFAULT 'USD'::character varying NOT NULL,
  "status" "seller_account_status" DEFAULT 'active'::seller_account_status NOT NULL,
  "health_status" "health_status" DEFAULT 'healthy'::health_status NOT NULL,
  "encrypted_credentials" text,
  "credential_vault_ref" varchar(255),
  "oauth_scopes" text,
  "token_expires_at" timestamptz,
  "last_credential_rotated_at" timestamptz,
  "rate_limit_rpm" integer DEFAULT 60 NOT NULL,
  "retry_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "sync_checkpoint" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "sync_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "last_synced_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "sessions" (
  "id" varchar(255) NOT NULL,
  "data" text NOT NULL,
  "user_id" varchar(255),
  "expires_at" timestamptz NOT NULL,
  "ip_address" varchar(64),
  "user_agent" text,
  "is_revoked" boolean DEFAULT false NOT NULL,
  "revoked_at" timestamptz,
  "last_active_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "shipment_items" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "shipment_id" varchar(64) NOT NULL,
  "order_line_item_id" varchar(64) NOT NULL,
  "quantity_shipped" integer NOT NULL,
  "serial_numbers" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "shipments" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "order_id" varchar(64) NOT NULL,
  "shipment_number" varchar(100) NOT NULL,
  "carrier_code" varchar(50) NOT NULL,
  "carrier_name" varchar(150) NOT NULL,
  "service_level" varchar(100),
  "tracking_number" varchar(150),
  "third_party_tracking_number" varchar(150),
  "tracking_url" text,
  "third_party_tracking_url" text,
  "status" "shipment_status" DEFAULT 'pending'::shipment_status NOT NULL,
  "packaging_type" varchar(100),
  "length_cm" numeric(14,2),
  "width_cm" numeric(14,2),
  "height_cm" numeric(14,2),
  "dead_weight_grams" numeric(14,2),
  "estimated_shipping_cost" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "actual_invoiced_cost" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "insurance_cost" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "shipped_at" timestamptz,
  "estimated_delivery_at" timestamptz,
  "delivered_at" timestamptz,
  "delivery_notification_sent" boolean DEFAULT false NOT NULL,
  "notes" text,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "volumetric_weight_grams" numeric(14,2),
  "billed_weight_grams" numeric(14,2),
  PRIMARY KEY (id)
);

CREATE TABLE "shipping_invoice_lines" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "shipping_invoice_id" varchar(64) NOT NULL,
  "shipment_id" varchar(64),
  "charge_type" "shipping_charge_type" DEFAULT 'base_freight'::shipping_charge_type NOT NULL,
  "description" varchar(255),
  "expected_amount" jsonb,
  "billed_amount" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "tax_amount" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "variance_amount" jsonb,
  "allow_duplicate_charge" boolean DEFAULT false NOT NULL,
  "reconciliation_notes" text,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "shipping_invoices" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "financial_account_id" varchar(64),
  "carrier_code" varchar(50) NOT NULL,
  "carrier_name" varchar(150) NOT NULL,
  "invoice_number" varchar(100) NOT NULL,
  "subtotal_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "discount_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "tax_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "grand_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "paid_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "variance_total" jsonb DEFAULT '{"amount": 0, "currency_code": "USD"}'::jsonb NOT NULL,
  "payment_status" "invoice_payment_status" DEFAULT 'unpaid'::invoice_payment_status NOT NULL,
  "reconciliation_status" "invoice_reconciliation_status" DEFAULT 'unreconciled'::invoice_reconciliation_status NOT NULL,
  "invoice_date" date NOT NULL,
  "due_date" date,
  "paid_at" timestamptz,
  "payment_reference" varchar(150),
  "notes" text,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "sync_job_errors" (
  "id" varchar(64) NOT NULL,
  "sync_job_id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "record_index" integer DEFAULT 0 NOT NULL,
  "external_record_id" varchar(150),
  "error_code" varchar(100) NOT NULL,
  "error_message" text NOT NULL,
  "field_errors" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "raw_excerpt" jsonb,
  "is_resolved" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "sync_jobs" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "seller_account_id" varchar(64),
  "job_type" "sync_job_type" NOT NULL,
  "status" "sync_job_status" DEFAULT 'queued'::sync_job_status NOT NULL,
  "idempotency_key" varchar(150) NOT NULL,
  "correlation_id" varchar(100),
  "total_records" integer DEFAULT 0 NOT NULL,
  "processed_records" integer DEFAULT 0 NOT NULL,
  "succeeded_records" integer DEFAULT 0 NOT NULL,
  "failed_records" integer DEFAULT 0 NOT NULL,
  "skipped_duplicates" integer DEFAULT 0 NOT NULL,
  "checkpoint_cursor" varchar(255),
  "error_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "tasks_reminders" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "related_entity_type" varchar(100),
  "related_entity_id" varchar(64),
  "credit_card_id" varchar(64),
  "title" varchar(255) NOT NULL,
  "description" text,
  "task_type" "task_type" DEFAULT 'general'::task_type NOT NULL,
  "priority" "task_priority" DEFAULT 'medium'::task_priority NOT NULL,
  "status" "task_status" DEFAULT 'pending'::task_status NOT NULL,
  "due_at" timestamptz NOT NULL,
  "remind_at" timestamptz,
  "completed_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "user_roles" (
  "id" varchar(64) NOT NULL,
  "user_id" varchar(64) NOT NULL,
  "role_id" varchar(64) NOT NULL,
  "assigned_by_user_id" varchar(64),
  "expires_at" timestamptz,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE "users" (
  "id" varchar(64) NOT NULL,
  "email" varchar(255) NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "phone" varchar(50),
  "password" varchar(255) NOT NULL,
  "status" "user_status" DEFAULT 'pending_activation'::user_status NOT NULL,
  "is_super_admin" boolean DEFAULT false NOT NULL,
  "failed_login_attempts" integer DEFAULT 0 NOT NULL,
  "locked_until" timestamptz,
  "password_changed_at" timestamptz,
  "last_login_at" timestamptz,
  "last_login_ip" varchar(64),
  "default_currency" varchar(3) DEFAULT 'USD'::character varying NOT NULL,
  "timezone" varchar(64) DEFAULT 'UTC'::character varying NOT NULL,
  "preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_by_user_id" varchar(64),
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

-- ---------- UNIQUE & CHECK CONSTRAINTS ----------
ALTER TABLE "catalog_items" ADD CONSTRAINT "chk_catalog_items_attributes_object" CHECK ((jsonb_typeof(attributes) = 'object'::text));
ALTER TABLE "catalog_items" ADD CONSTRAINT "chk_catalog_items_base_price_usd_nonneg" CHECK ((base_price_usd >= (0)::numeric));
ALTER TABLE "catalog_items" ADD CONSTRAINT "chk_catalog_items_price_tier_valid" CHECK (((price_tier)::text ~ '^[0-9]{2}$'::text));
ALTER TABLE "channel_listings" ADD CONSTRAINT "chk_channel_listings_listed_price_money" CHECK (is_valid_price_money(listed_price, false));
ALTER TABLE "channel_listings" ADD CONSTRAINT "chk_channel_listings_prices_medusa" CHECK (is_valid_medusa_prices_array(prices));
ALTER TABLE "credit_cards" ADD CONSTRAINT "chk_credit_cards_credit_limit_money" CHECK (is_valid_price_money(credit_limit, false));
ALTER TABLE "credit_cards" ADD CONSTRAINT "chk_credit_cards_current_balance_money" CHECK (is_valid_price_money(current_balance, false));
ALTER TABLE "credit_cards" ADD CONSTRAINT "chk_credit_cards_metadata_valid" CHECK ((((exp_month >= 1) AND (exp_month <= 12)) AND ((exp_year >= 2000) AND (exp_year <= 2100)) AND ((last_4_digits)::text ~ '^[0-9]{4}$'::text)));
ALTER TABLE "credit_cards" ADD CONSTRAINT "chk_credit_cards_minimum_payment_due_money" CHECK (is_valid_price_money(minimum_payment_due, false));
ALTER TABLE "credit_cards" ADD CONSTRAINT "chk_credit_cards_statement_balance_money" CHECK (is_valid_price_money(statement_balance, false));
ALTER TABLE "customers" ADD CONSTRAINT "chk_customers_orders_count_nonneg" CHECK ((orders_count >= 0));
ALTER TABLE "customers" ADD CONSTRAINT "chk_customers_risk_score_nonneg" CHECK ((risk_score >= 0));
ALTER TABLE "customers" ADD CONSTRAINT "chk_customers_total_spent_money" CHECK (is_valid_price_money(total_spent, false));
ALTER TABLE "financial_accounts" ADD CONSTRAINT "chk_financial_accounts_current_balance_money" CHECK (is_valid_price_money(current_balance, true));
ALTER TABLE "financial_accounts" ADD CONSTRAINT "chk_financial_accounts_last4" CHECK (((account_number_last_4 IS NULL) OR ((account_number_last_4)::text ~ '^[0-9]{4}$'::text)));
ALTER TABLE "financial_transactions" ADD CONSTRAINT "chk_financial_transactions_original_amount_money" CHECK (is_valid_price_money(original_amount, false));
ALTER TABLE "financial_transactions" ADD CONSTRAINT "chk_financial_transactions_rate_positive" CHECK ((exchange_rate > (0)::numeric));
ALTER TABLE "financial_transactions" ADD CONSTRAINT "chk_financial_transactions_reporting_amount_money" CHECK (is_valid_price_money(reporting_amount, false));
ALTER TABLE "financial_transactions" ADD CONSTRAINT "chk_financial_transactions_tax_total_money" CHECK (is_valid_price_money(tax_total, false));
ALTER TABLE "manual_reconciliations" ADD CONSTRAINT "chk_manual_reconciliation_observed_amount_money" CHECK (is_valid_price_money(observed_amount, false));
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "chk_marketplace_claims_disputed_total_money" CHECK (is_valid_price_money(disputed_total, false));
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "chk_marketplace_claims_seller_liability_total_money" CHECK (is_valid_price_money(seller_liability_total, false));
ALTER TABLE "notifications" ADD CONSTRAINT "chk_notifications_channel" CHECK (((channel)::text = ANY ((ARRAY['in_app'::character varying, 'email'::character varying, 'sms'::character varying])::text[])));
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "chk_order_import_payloads_size" CHECK (((payload_size_bytes >= 0) AND (payload_size_bytes <= 262144)));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_adjustments_money" CHECK (is_valid_money_entry_array(adjustments, 'amount'::text));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_custom_attributes_object" CHECK ((jsonb_typeof(custom_attributes) = 'object'::text));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_discount_total_price_money" CHECK (is_valid_price_money(discount_total, false));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_fulfillment_channel" CHECK (((fulfillment_channel)::text = ANY ((ARRAY['MFN'::character varying, 'AFN'::character varying, 'FBA'::character varying, 'FBM'::character varying, '3PL'::character varying, 'direct'::character varying])::text[])));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_grand_total_price_money" CHECK (is_valid_price_money(grand_total, false));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_marketplace_fee_price_money" CHECK (is_valid_price_money(marketplace_fee, false));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_promotion_total_price_money" CHECK (is_valid_price_money(promotion_total, false));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_qty_bounds" CHECK (((quantity_fulfilled >= 0) AND (quantity_returned >= 0) AND (quantity_cancelled >= 0) AND (quantity_fulfilled <= quantity_ordered) AND (quantity_returned <= quantity_ordered) AND (quantity_cancelled <= quantity_ordered)));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_qty_ordered_positive" CHECK ((quantity_ordered > 0));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_refunded_total_price_money" CHECK (is_valid_price_money(refunded_total, false));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_shipping_discount_total_price_money" CHECK (is_valid_price_money(shipping_discount_total, false));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_shipping_tax_total_price_money" CHECK (is_valid_price_money(shipping_tax_total, false));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_shipping_total_price_money" CHECK (is_valid_price_money(shipping_total, false));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_subtotal_price_money" CHECK (is_valid_price_money(subtotal, false));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_tax_lines_money" CHECK (is_valid_money_entry_array(tax_lines, 'total'::text));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_tax_total_price_money" CHECK (is_valid_price_money(tax_total, false));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_unit_cost_price_money" CHECK (is_valid_price_money(unit_cost, false));
ALTER TABLE "order_line_items" ADD CONSTRAINT "chk_order_line_items_unit_price_price_money" CHECK (is_valid_price_money(unit_price, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_channel_metadata_object" CHECK ((jsonb_typeof(channel_metadata) = 'object'::text));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_cogs_total_price_money" CHECK (is_valid_price_money(cogs_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_delivery_window" CHECK (((latest_delivery_at IS NULL) OR (earliest_delivery_at IS NULL) OR (latest_delivery_at >= earliest_delivery_at)));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_discount_total_price_money" CHECK (is_valid_price_money(discount_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_exchange_rate_positive" CHECK ((exchange_rate > (0)::numeric));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_fulfillment_channel" CHECK (((fulfillment_channel)::text = ANY ((ARRAY['MFN'::character varying, 'AFN'::character varying, 'FBA'::character varying, 'FBM'::character varying, '3PL'::character varying, 'direct'::character varying])::text[])));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_grand_total_price_money" CHECK (is_valid_price_money(grand_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_gross_profit_price_money" CHECK (is_valid_price_money(gross_profit, true));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_marketplace_fees_total_price_money" CHECK (is_valid_price_money(marketplace_fees_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_marketplace_withheld_tax_total_price_money" CHECK (is_valid_price_money(marketplace_withheld_tax_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_net_proceeds_price_money" CHECK (is_valid_price_money(net_proceeds, true));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_net_profit_price_money" CHECK (is_valid_price_money(net_profit, true));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_payment_processing_fees_total_price_money" CHECK (is_valid_price_money(payment_processing_fees_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_promotion_total_price_money" CHECK (is_valid_price_money(promotion_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_refund_within_total" CHECK ((((refunded_total ->> 'amount'::text))::numeric <= ((grand_total ->> 'amount'::text))::numeric));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_refunded_total_price_money" CHECK (is_valid_price_money(refunded_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_reporting_total_price_money" CHECK (is_valid_price_money(reporting_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_ship_window" CHECK (((latest_ship_at IS NULL) OR (earliest_ship_at IS NULL) OR (latest_ship_at >= earliest_ship_at)));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_shipping_cost_total_price_money" CHECK (is_valid_price_money(shipping_cost_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_shipping_discount_total_price_money" CHECK (is_valid_price_money(shipping_discount_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_shipping_tax_total_price_money" CHECK (is_valid_price_money(shipping_tax_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_shipping_total_price_money" CHECK (is_valid_price_money(shipping_total, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_subtotal_price_money" CHECK (is_valid_price_money(subtotal, false));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_tax_collection_model" CHECK (((tax_collection_model)::text = ANY ((ARRAY['marketplace_facilitator'::character varying, 'seller'::character varying, 'none'::character varying])::text[])));
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_tax_total_price_money" CHECK (is_valid_price_money(tax_total, false));
ALTER TABLE "organization_memberships" ADD CONSTRAINT "chk_organization_memberships_entity_id" CHECK (((id)::text ~ '^[a-z]{2,8}_[0-9A-HJKMNP-TV-Z]{26}$'::text));
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_user_id_unique" UNIQUE (organization_id, user_id);
ALTER TABLE "organizations" ADD CONSTRAINT "chk_organizations_entity_id" CHECK (((id)::text ~ '^[a-z]{2,8}_[0-9A-HJKMNP-TV-Z]{26}$'::text));
ALTER TABLE "outbox_events" ADD CONSTRAINT "chk_outbox_events_retries_nonneg" CHECK (((retry_count >= 0) AND (max_retries >= 0)));
ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variants_attributes_map" CHECK (is_valid_variant_attributes_map(attributes));
ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variants_cost_price_money" CHECK (is_valid_price_money(cost_price, false));
ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variants_manufacturing_cost_money" CHECK (is_valid_price_money(manufacturing_cost, false));
ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variants_packaging_cost_money" CHECK (is_valid_price_money(packaging_cost, false));
ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variants_prices_medusa" CHECK (is_valid_medusa_prices_array(prices));
ALTER TABLE "product_variants" ADD CONSTRAINT "chk_product_variants_qty_nonneg" CHECK (((stock_on_hand >= 0) AND (stock_reserved >= 0) AND (reorder_point >= 0)));
ALTER TABLE "products" ADD CONSTRAINT "chk_products_metadata_no_duplicate_keys" CHECK ((NOT jsonb_exists_any(metadata, ARRAY['prices'::text, 'category_handle'::text, 'resolved_category_handle'::text])));
ALTER TABLE "products" ADD CONSTRAINT "chk_products_metadata_object" CHECK ((jsonb_typeof(metadata) = 'object'::text));
ALTER TABLE "products" ADD CONSTRAINT "chk_products_prices_medusa" CHECK (is_valid_medusa_prices_array(prices));
ALTER TABLE "queue_jobs" ADD CONSTRAINT "queue_jobs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'delayed'::text, 'completed'::text, 'failed'::text])));
ALTER TABLE "refund_transactions" ADD CONSTRAINT "chk_refund_transactions_grand_refund_total_money" CHECK (is_valid_price_money(grand_refund_total, false));
ALTER TABLE "refund_transactions" ADD CONSTRAINT "chk_refund_transactions_items_refund_total_money" CHECK (is_valid_price_money(items_refund_total, false));
ALTER TABLE "refund_transactions" ADD CONSTRAINT "chk_refund_transactions_restocking_fee_total_money" CHECK (is_valid_price_money(restocking_fee_total, false));
ALTER TABLE "refund_transactions" ADD CONSTRAINT "chk_refund_transactions_shipping_refund_total_money" CHECK (is_valid_price_money(shipping_refund_total, false));
ALTER TABLE "refund_transactions" ADD CONSTRAINT "chk_refund_transactions_tax_refund_total_money" CHECK (is_valid_price_money(tax_refund_total, false));
ALTER TABLE "return_requests" ADD CONSTRAINT "chk_return_requests_qty_valid" CHECK (((quantity_requested > 0) AND (quantity_approved >= 0) AND (quantity_received >= 0) AND (quantity_approved <= quantity_requested) AND (quantity_received <= quantity_requested)));
ALTER TABLE "return_requests" ADD CONSTRAINT "chk_return_requests_refund_total_money" CHECK (is_valid_price_money(refund_total, false));
ALTER TABLE "return_requests" ADD CONSTRAINT "chk_return_requests_restocking_fee_total_money" CHECK (is_valid_price_money(restocking_fee_total, false));
ALTER TABLE "return_requests" ADD CONSTRAINT "chk_return_requests_return_shipping_cost_money" CHECK (is_valid_price_money(return_shipping_cost, false));
ALTER TABLE "seller_accounts" ADD CONSTRAINT "chk_seller_accounts_rate_limit" CHECK ((rate_limit_rpm > 0));
ALTER TABLE "shipment_items" ADD CONSTRAINT "chk_shipment_items_qty_positive" CHECK ((quantity_shipped > 0));
ALTER TABLE "shipments" ADD CONSTRAINT "chk_shipments_actual_invoiced_cost_money" CHECK (is_valid_price_money(actual_invoiced_cost, false));
ALTER TABLE "shipments" ADD CONSTRAINT "chk_shipments_dimensions_nonneg" CHECK ((((length_cm IS NULL) OR (length_cm >= (0)::numeric)) AND ((width_cm IS NULL) OR (width_cm >= (0)::numeric)) AND ((height_cm IS NULL) OR (height_cm >= (0)::numeric)) AND ((dead_weight_grams IS NULL) OR (dead_weight_grams >= (0)::numeric))));
ALTER TABLE "shipments" ADD CONSTRAINT "chk_shipments_estimated_shipping_cost_money" CHECK (is_valid_price_money(estimated_shipping_cost, false));
ALTER TABLE "shipments" ADD CONSTRAINT "chk_shipments_insurance_cost_money" CHECK (is_valid_price_money(insurance_cost, false));
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "chk_shipping_invoice_lines_billed_amount_money" CHECK (is_valid_price_money(billed_amount, false));
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "chk_shipping_invoice_lines_expected_amount_money" CHECK (((expected_amount IS NULL) OR is_valid_price_money(expected_amount, false)));
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "chk_shipping_invoice_lines_tax_amount_money" CHECK (is_valid_price_money(tax_amount, false));
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "chk_shipping_invoice_lines_variance_amount_money" CHECK (((variance_amount IS NULL) OR is_valid_price_money(variance_amount, true)));
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "chk_shipping_invoices_discount_total_money" CHECK (is_valid_price_money(discount_total, false));
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "chk_shipping_invoices_grand_total_money" CHECK (is_valid_price_money(grand_total, false));
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "chk_shipping_invoices_paid_total_money" CHECK (is_valid_price_money(paid_total, false));
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "chk_shipping_invoices_subtotal_total_money" CHECK (is_valid_price_money(subtotal_total, false));
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "chk_shipping_invoices_tax_total_money" CHECK (is_valid_price_money(tax_total, false));
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "chk_shipping_invoices_variance_total_money" CHECK (is_valid_price_money(variance_total, true));
ALTER TABLE "sync_jobs" ADD CONSTRAINT "chk_sync_jobs_counters_nonneg" CHECK (((total_records >= 0) AND (processed_records >= 0) AND (succeeded_records >= 0) AND (failed_records >= 0) AND (skipped_duplicates >= 0)));
ALTER TABLE "users" ADD CONSTRAINT "chk_users_currency_code" CHECK (((default_currency)::text ~ '^[A-Z]{3}$'::text));
ALTER TABLE "users" ADD CONSTRAINT "chk_users_email_lower" CHECK (((email)::text = lower((email)::text)));
ALTER TABLE "users" ADD CONSTRAINT "chk_users_failed_login_nonneg" CHECK ((failed_login_attempts >= 0));

-- ---------- INDEXES ----------
CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_user_id);
CREATE INDEX idx_audit_logs_correlation ON public.audit_logs USING btree (correlation_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);
CREATE UNIQUE INDEX uq_brands_user_slug ON public.brands USING btree (user_id, slug);
CREATE INDEX idx_catalog_items_resolved_category ON public.catalog_items USING btree (resolved_category_id);
CREATE UNIQUE INDEX uq_catalog_items_user_key ON public.catalog_items USING btree (user_id, catalog_key);
CREATE INDEX idx_channel_listings_user ON public.channel_listings USING btree (user_id);
CREATE INDEX idx_channel_listings_variant ON public.channel_listings USING btree (product_variant_id);
CREATE UNIQUE INDEX uq_channel_listings_account_ext_variant ON public.channel_listings USING btree (seller_account_id, external_listing_id, product_variant_id);
CREATE INDEX idx_card_seller_accounts_seller ON public.credit_card_seller_accounts USING btree (seller_account_id);
CREATE UNIQUE INDEX uq_card_seller_accounts_purpose ON public.credit_card_seller_accounts USING btree (credit_card_id, seller_account_id, usage_purpose);
CREATE INDEX idx_credit_cards_due_date ON public.credit_cards USING btree (user_id, next_payment_due_date);
CREATE INDEX idx_credit_cards_user ON public.credit_cards USING btree (user_id);
CREATE INDEX idx_customer_addresses_customer ON public.customer_addresses USING btree (customer_id);
CREATE INDEX idx_customer_addresses_fingerprint ON public.customer_addresses USING btree (user_id, address_fingerprint);
CREATE INDEX idx_customer_risk_signals_customer ON public.customer_risk_signals USING btree (customer_id);
CREATE INDEX idx_customer_risk_signals_order ON public.customer_risk_signals USING btree (order_id);
CREATE INDEX idx_customer_risk_signals_status ON public.customer_risk_signals USING btree (user_id, review_status);
CREATE INDEX idx_customers_user ON public.customers USING btree (user_id);
CREATE INDEX idx_customers_user_ext_id ON public.customers USING btree (user_id, external_customer_id);
CREATE INDEX idx_customers_user_merged_into ON public.customers USING btree (user_id, merged_into_customer_id);
CREATE INDEX idx_customers_user_norm_email ON public.customers USING btree (user_id, normalized_email);
CREATE INDEX idx_customers_user_norm_phone ON public.customers USING btree (user_id, normalized_phone);
CREATE INDEX idx_customers_user_risk ON public.customers USING btree (user_id, risk_level);
CREATE UNIQUE INDEX uq_finance_categories_user_type_slug ON public.finance_categories USING btree (user_id, category_type, slug);
CREATE INDEX idx_financial_accounts_classification ON public.financial_accounts USING btree (user_id, data_classification);
CREATE INDEX idx_financial_accounts_user ON public.financial_accounts USING btree (user_id);
CREATE INDEX idx_financial_transactions_card ON public.financial_transactions USING btree (credit_card_id);
CREATE INDEX idx_financial_transactions_classification ON public.financial_transactions USING btree (user_id, data_classification);
CREATE INDEX idx_financial_transactions_due ON public.financial_transactions USING btree (user_id, status, due_date);
CREATE INDEX idx_financial_transactions_order ON public.financial_transactions USING btree (order_id);
CREATE INDEX idx_financial_transactions_seller ON public.financial_transactions USING btree (seller_account_id);
CREATE INDEX idx_financial_transactions_user_type_date ON public.financial_transactions USING btree (user_id, transaction_type, transaction_date);
CREATE UNIQUE INDEX uq_financial_transactions_user_ref ON public.financial_transactions USING btree (user_id, reference_number);
CREATE INDEX idx_manual_reconciliations_user_tx ON public.manual_reconciliations USING btree (user_id, financial_transaction_id);
CREATE UNIQUE INDEX uq_active_manual_reconciliation_reference ON public.manual_reconciliations USING btree (user_id, lower((source_reference)::text)) WHERE (reversed_at IS NULL);
CREATE UNIQUE INDEX uq_active_manual_reconciliation_tx ON public.manual_reconciliations USING btree (financial_transaction_id) WHERE (reversed_at IS NULL);
CREATE INDEX idx_marketplace_claims_order ON public.marketplace_claims USING btree (order_id);
CREATE INDEX idx_marketplace_claims_status ON public.marketplace_claims USING btree (user_id, status);
CREATE UNIQUE INDEX uq_marketplace_claims_user_number ON public.marketplace_claims USING btree (user_id, claim_number);
CREATE UNIQUE INDEX uq_module_entitlements_user_module ON public.module_entitlements USING btree (user_id, module_key);
CREATE INDEX idx_notifications_entity ON public.notifications USING btree (entity_type, entity_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read, created_at);
CREATE INDEX idx_order_import_payloads_hash ON public.order_import_payloads USING btree (user_id, payload_hash);
CREATE INDEX idx_order_import_payloads_order ON public.order_import_payloads USING btree (order_id);
CREATE INDEX idx_order_line_items_external_listing ON public.order_line_items USING btree (user_id, external_listing_id) WHERE (external_listing_id IS NOT NULL);
CREATE INDEX idx_order_line_items_order ON public.order_line_items USING btree (order_id);
CREATE INDEX idx_order_line_items_variant ON public.order_line_items USING btree (product_variant_id);
CREATE UNIQUE INDEX uq_order_line_items_ext_id ON public.order_line_items USING btree (order_id, external_order_line_id) WHERE (external_order_line_id IS NOT NULL);
CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);
CREATE INDEX idx_orders_latest_ship_at ON public.orders USING btree (user_id, latest_ship_at) WHERE (latest_ship_at IS NOT NULL);
CREATE INDEX idx_orders_marketplace_site ON public.orders USING btree (user_id, marketplace_site_id) WHERE (marketplace_site_id IS NOT NULL);
CREATE INDEX idx_orders_seller_account ON public.orders USING btree (seller_account_id);
CREATE INDEX idx_orders_sync_job ON public.orders USING btree (sync_job_id);
CREATE INDEX idx_orders_user_fulfillment_channel ON public.orders USING btree (user_id, fulfillment_channel);
CREATE INDEX idx_orders_user_ordered_at ON public.orders USING btree (user_id, ordered_at);
CREATE INDEX idx_orders_user_status ON public.orders USING btree (user_id, status);
CREATE UNIQUE INDEX uq_orders_seller_external_id ON public.orders USING btree (seller_account_id, external_order_id) WHERE (external_order_id IS NOT NULL);
CREATE UNIQUE INDEX uq_orders_user_order_number ON public.orders USING btree (user_id, order_number);
CREATE INDEX organization_memberships_user_id_organization_id_index ON public.organization_memberships USING btree (user_id, organization_id);
CREATE UNIQUE INDEX uq_organizations_personal_owner ON public.organizations USING btree (owner_user_id) WHERE is_personal;
CREATE INDEX idx_outbox_events_aggregate ON public.outbox_events USING btree (aggregate_type, aggregate_id);
CREATE INDEX idx_outbox_events_status_retry ON public.outbox_events USING btree (status, next_retry_at);
CREATE INDEX idx_password_reset_tokens_user ON public.password_reset_tokens USING btree (user_id);
CREATE UNIQUE INDEX uq_permissions_resource_action ON public.permissions USING btree (resource, action);
CREATE UNIQUE INDEX uq_product_categories_user_slug ON public.product_categories USING btree (user_id, slug);
CREATE INDEX idx_variant_attributes_lookup ON public.product_variant_attributes USING btree (user_id, attribute_name, attribute_value);
CREATE UNIQUE INDEX uq_variant_attributes_variant_name ON public.product_variant_attributes USING btree (product_variant_id, attribute_name);
CREATE INDEX idx_product_variants_product ON public.product_variants USING btree (product_id);
CREATE INDEX idx_product_variants_user_asin ON public.product_variants USING btree (user_id, asin);
CREATE UNIQUE INDEX uq_product_variants_user_sku ON public.product_variants USING btree (user_id, sku);
CREATE INDEX idx_products_brand ON public.products USING btree (brand_id);
CREATE INDEX idx_products_category ON public.products USING btree (category_id);
CREATE INDEX idx_products_user_status ON public.products USING btree (user_id, status);
CREATE UNIQUE INDEX uq_products_user_slug ON public.products USING btree (user_id, slug);
CREATE UNIQUE INDEX queue_jobs_dedup_active_uidx ON public.queue_jobs USING btree (queue, dedup_id) WHERE ((dedup_id IS NOT NULL) AND (status = ANY (ARRAY['pending'::text, 'delayed'::text])));
CREATE INDEX queue_jobs_queue_dedup_id_index ON public.queue_jobs USING btree (queue, dedup_id);
CREATE INDEX queue_jobs_queue_status_execute_at_index ON public.queue_jobs USING btree (queue, status, execute_at);
CREATE INDEX queue_jobs_queue_status_finished_at_index ON public.queue_jobs USING btree (queue, status, finished_at);
CREATE INDEX queue_jobs_queue_status_score_index ON public.queue_jobs USING btree (queue, status, score);
CREATE INDEX queue_schedules_status_next_run_at_index ON public.queue_schedules USING btree (status, next_run_at);
CREATE INDEX idx_refund_transactions_order ON public.refund_transactions USING btree (order_id);
CREATE INDEX idx_refund_transactions_return ON public.refund_transactions USING btree (return_request_id);
CREATE UNIQUE INDEX uq_refund_transactions_order_ext_id ON public.refund_transactions USING btree (order_id, external_refund_id) WHERE (external_refund_id IS NOT NULL);
CREATE UNIQUE INDEX uq_refund_transactions_user_number ON public.refund_transactions USING btree (user_id, refund_number);
CREATE INDEX idx_return_requests_order ON public.return_requests USING btree (order_id);
CREATE INDEX idx_return_requests_order_line ON public.return_requests USING btree (order_line_item_id);
CREATE INDEX idx_return_requests_user_status ON public.return_requests USING btree (user_id, status);
CREATE UNIQUE INDEX uq_return_requests_order_ext_id ON public.return_requests USING btree (order_id, external_return_id) WHERE (external_return_id IS NOT NULL);
CREATE UNIQUE INDEX uq_return_requests_user_rma ON public.return_requests USING btree (user_id, rma_number);
CREATE INDEX idx_role_permissions_perm ON public.role_permissions USING btree (permission_id);
CREATE UNIQUE INDEX uq_role_permissions_role_perm ON public.role_permissions USING btree (role_id, permission_id);
CREATE UNIQUE INDEX uq_saved_views_user_module_name ON public.saved_views USING btree (user_id, module_key, name);
CREATE INDEX idx_seller_accounts_status ON public.seller_accounts USING btree (status);
CREATE INDEX idx_seller_accounts_user ON public.seller_accounts USING btree (user_id);
CREATE UNIQUE INDEX uq_seller_accounts_identity ON public.seller_accounts USING btree (user_id, sales_channel_id, external_seller_id, marketplace_region);
CREATE INDEX idx_sessions_expiry ON public.sessions USING btree (expires_at) WHERE (is_revoked = false);
CREATE INDEX idx_sessions_user_active ON public.sessions USING btree (user_id, is_revoked);
CREATE INDEX sessions_expires_at_index ON public.sessions USING btree (expires_at);
CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);
CREATE INDEX idx_shipment_items_order_line ON public.shipment_items USING btree (order_line_item_id);
CREATE UNIQUE INDEX uq_shipment_items_shipment_line ON public.shipment_items USING btree (shipment_id, order_line_item_id);
CREATE INDEX idx_shipments_order ON public.shipments USING btree (order_id);
CREATE INDEX idx_shipments_tracking ON public.shipments USING btree (tracking_number);
CREATE INDEX idx_shipments_user_status ON public.shipments USING btree (user_id, status);
CREATE UNIQUE INDEX uq_shipments_user_number ON public.shipments USING btree (user_id, shipment_number);
CREATE INDEX idx_shipping_invoice_lines_invoice ON public.shipping_invoice_lines USING btree (shipping_invoice_id);
CREATE INDEX idx_shipping_invoice_lines_shipment ON public.shipping_invoice_lines USING btree (shipment_id);
CREATE UNIQUE INDEX uq_shipping_invoice_lines_shipment_charge ON public.shipping_invoice_lines USING btree (shipment_id, charge_type) WHERE ((shipment_id IS NOT NULL) AND (allow_duplicate_charge = false));
CREATE INDEX idx_shipping_invoices_due_date ON public.shipping_invoices USING btree (user_id, due_date);
CREATE INDEX idx_shipping_invoices_status ON public.shipping_invoices USING btree (user_id, payment_status);
CREATE UNIQUE INDEX uq_shipping_invoices_user_carrier_num ON public.shipping_invoices USING btree (user_id, carrier_code, invoice_number);
CREATE INDEX idx_sync_job_errors_job ON public.sync_job_errors USING btree (sync_job_id);
CREATE INDEX idx_sync_job_errors_user ON public.sync_job_errors USING btree (user_id);
CREATE INDEX idx_sync_jobs_seller_account ON public.sync_jobs USING btree (seller_account_id);
CREATE INDEX idx_sync_jobs_user_status ON public.sync_jobs USING btree (user_id, status);
CREATE UNIQUE INDEX uq_sync_jobs_user_idempotency ON public.sync_jobs USING btree (user_id, idempotency_key);
CREATE INDEX idx_tasks_reminders_card ON public.tasks_reminders USING btree (credit_card_id);
CREATE INDEX idx_tasks_reminders_user_status_due ON public.tasks_reminders USING btree (user_id, status, due_at);
CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role_id);
CREATE UNIQUE INDEX uq_user_roles_user_role ON public.user_roles USING btree (user_id, role_id);
CREATE INDEX idx_users_created_by ON public.users USING btree (created_by_user_id);
CREATE INDEX idx_users_status ON public.users USING btree (status);

-- ---------- FOREIGN KEYS ----------
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_foreign" FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "brands" ADD CONSTRAINT "brands_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_converted_product_id_foreign" FOREIGN KEY (converted_product_id) REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_resolved_category_id_foreign" FOREIGN KEY (resolved_category_id) REFERENCES product_categories(id) ON DELETE SET NULL;
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_product_variant_id_foreign" FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE CASCADE;
ALTER TABLE "channel_listings" ADD CONSTRAINT "channel_listings_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_credit_card_id_foreign" FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE CASCADE;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE CASCADE;
ALTER TABLE "credit_card_seller_accounts" ADD CONSTRAINT "credit_card_seller_accounts_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_financial_account_id_foreign" FOREIGN KEY (financial_account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL;
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_foreign" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_customer_id_foreign" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_reviewed_by_user_id_foreign" FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "customer_risk_signals" ADD CONSTRAINT "customer_risk_signals_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_merged_into_customer_id_foreign" FOREIGN KEY (merged_into_customer_id) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_parent_id_foreign" FOREIGN KEY (parent_id) REFERENCES finance_categories(id) ON DELETE SET NULL;
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_credit_card_id_foreign" FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_finance_category_id_foreign" FOREIGN KEY (finance_category_id) REFERENCES finance_categories(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_financial_account_id_foreign" FOREIGN KEY (financial_account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_product_variant_id_foreign" FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_shipping_invoice_id_foreign" FOREIGN KEY (shipping_invoice_id) REFERENCES shipping_invoices(id) ON DELETE SET NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "manual_reconciliations" ADD CONSTRAINT "manual_reconciliations_financial_transaction_id_foreign" FOREIGN KEY (financial_transaction_id) REFERENCES financial_transactions(id) ON DELETE RESTRICT;
ALTER TABLE "manual_reconciliations" ADD CONSTRAINT "manual_reconciliations_reconciled_by_user_id_foreign" FOREIGN KEY (reconciled_by_user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE "manual_reconciliations" ADD CONSTRAINT "manual_reconciliations_reversed_by_user_id_foreign" FOREIGN KEY (reversed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE "manual_reconciliations" ADD CONSTRAINT "manual_reconciliations_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "marketplace_claims" ADD CONSTRAINT "marketplace_claims_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_updated_by_user_id_foreign" FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "module_entitlements" ADD CONSTRAINT "module_entitlements_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "order_import_payloads" ADD CONSTRAINT "order_import_payloads_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_channel_listing_id_foreign" FOREIGN KEY (channel_listing_id) REFERENCES channel_listings(id) ON DELETE SET NULL;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_product_variant_id_foreign" FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_foreign" FOREIGN KEY (billing_address_id) REFERENCES customer_addresses(id) ON DELETE SET NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_foreign" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE SET NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_foreign" FOREIGN KEY (shipping_address_id) REFERENCES customer_addresses(id) ON DELETE SET NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_sync_job_id_foreign" FOREIGN KEY (sync_job_id) REFERENCES sync_jobs(id) ON DELETE SET NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_added_by_user_id_foreign" FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_foreign" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_role_id_foreign" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_user_id_foreign" FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_category_id_foreign" FOREIGN KEY (parent_category_id) REFERENCES product_categories(id) ON DELETE SET NULL;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_product_variant_id_foreign" FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE;
ALTER TABLE "product_variant_attributes" ADD CONSTRAINT "product_variant_attributes_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_foreign" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_foreign" FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_foreign" FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL;
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_financial_account_id_foreign" FOREIGN KEY (financial_account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_order_line_item_id_foreign" FOREIGN KEY (order_line_item_id) REFERENCES order_line_items(id) ON DELETE SET NULL;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_return_request_id_foreign" FOREIGN KEY (return_request_id) REFERENCES return_requests(id) ON DELETE SET NULL;
ALTER TABLE "refund_transactions" ADD CONSTRAINT "refund_transactions_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_line_item_id_foreign" FOREIGN KEY (order_line_item_id) REFERENCES order_line_items(id) ON DELETE CASCADE;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_replacement_order_id_foreign" FOREIGN KEY (replacement_order_id) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_reviewed_by_user_id_foreign" FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_foreign" FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_foreign" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
ALTER TABLE "saved_views" ADD CONSTRAINT "saved_views_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_sales_channel_id_foreign" FOREIGN KEY (sales_channel_id) REFERENCES sales_channels(id) ON DELETE RESTRICT;
ALTER TABLE "seller_accounts" ADD CONSTRAINT "seller_accounts_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_order_line_item_id_foreign" FOREIGN KEY (order_line_item_id) REFERENCES order_line_items(id) ON DELETE CASCADE;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_foreign" FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE;
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_foreign" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_shipment_id_foreign" FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE RESTRICT;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_shipping_invoice_id_foreign" FOREIGN KEY (shipping_invoice_id) REFERENCES shipping_invoices(id) ON DELETE CASCADE;
ALTER TABLE "shipping_invoice_lines" ADD CONSTRAINT "shipping_invoice_lines_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_financial_account_id_foreign" FOREIGN KEY (financial_account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL;
ALTER TABLE "shipping_invoices" ADD CONSTRAINT "shipping_invoices_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_sync_job_id_foreign" FOREIGN KEY (sync_job_id) REFERENCES sync_jobs(id) ON DELETE CASCADE;
ALTER TABLE "sync_job_errors" ADD CONSTRAINT "sync_job_errors_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_seller_account_id_foreign" FOREIGN KEY (seller_account_id) REFERENCES seller_accounts(id) ON DELETE SET NULL;
ALTER TABLE "sync_jobs" ADD CONSTRAINT "sync_jobs_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_credit_card_id_foreign" FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL;
ALTER TABLE "tasks_reminders" ADD CONSTRAINT "tasks_reminders_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_user_id_foreign" FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_foreign" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_user_id_foreign" FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ---------- TRIGGERS ----------
CREATE TRIGGER trg_audit_logs_append_only BEFORE DELETE OR UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION fn_audit_log_append_only();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.channel_listings FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.credit_card_seller_accounts FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.credit_cards FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.customer_addresses FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.customer_risk_signals FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.finance_categories FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.financial_accounts FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.marketplace_claims FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.module_entitlements FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.order_import_payloads FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.order_line_items FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.outbox_events FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.password_reset_tokens FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.product_variant_attributes FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.refund_transactions FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.return_requests FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.sales_channels FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.saved_views FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.seller_accounts FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.shipment_items FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.shipping_invoice_lines FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.shipping_invoices FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.sync_job_errors FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.sync_jobs FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.tasks_reminders FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_audit_capture AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture();
CREATE TRIGGER trg_create_personal_organization AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION create_personal_organization();
