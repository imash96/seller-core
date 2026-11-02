import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 4 — one audit writer, tenant-prefixed indexes, JSONB money invariants.
 *
 * 1. `generate_entity_id()` emits Crockford Base32 ULIDs so every application id
 *    (and every audit row id) matches `ENTITY_ID_PATTERN`.
 * 2. `fn_audit_log_capture()` becomes the single writer for row mutations on every
 *    business table. It reads the actor/request/correlation context published by
 *    `AuditContext` through `set_config(..., true)` and redacts secrets.
 * 3. Composite tenant-prefixed indexes + GIN indexes over the MedusaJS price arrays.
 * 4. Cross-field money/quantity invariants that a single-column CHECK cannot see.
 */
export default class extends BaseSchema {
  public async up() {
    // ---------------------------------------------------------------- ULID ids
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION fn_crockford_base32(p_bytes bytea) RETURNS text AS $fn$
      DECLARE
        v_alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        v_bits bigint := 0;
        v_value bigint := 0;
        v_out text := '';
        v_i integer;
        v_byte integer;
      BEGIN
        FOR v_i IN 0 .. length(p_bytes) - 1 LOOP
          v_byte := get_byte(p_bytes, v_i);
          v_value := (v_value << 8) | v_byte;
          v_bits := v_bits + 8;
          WHILE v_bits >= 5 LOOP
            v_bits := v_bits - 5;
            v_out := v_out || substr(v_alphabet, ((v_value >> v_bits::integer) & 31)::integer + 1, 1);
          END LOOP;
        END LOOP;
        IF v_bits > 0 THEN
          v_out := v_out || substr(v_alphabet, ((v_value << (5 - v_bits)::integer) & 31)::integer + 1, 1);
        END IF;
        -- 128 random bits encode to 26 Crockford characters (130 bits, last one padded).
        RETURN substr(v_out, 1, 26);
      END $fn$ LANGUAGE plpgsql IMMUTABLE;
    `)

    this.schema.raw(`
      CREATE OR REPLACE FUNCTION generate_entity_id(prefix text DEFAULT NULL) RETURNS text AS $fn$
      DECLARE
        v_id text;
      BEGIN
        v_id := fn_crockford_base32(uuid_send(gen_random_uuid()));
        IF prefix IS NULL OR prefix = '' THEN
          RETURN v_id;
        END IF;
        IF prefix !~ '^[a-z]{2,8}$' THEN
          RAISE EXCEPTION 'generate_entity_id: prefix "%" must match ^[a-z]{2,8}$', prefix;
        END IF;
        RETURN prefix || '_' || v_id;
      END $fn$ LANGUAGE plpgsql VOLATILE;
    `)

    // ------------------------------------------------------- audit trigger (one writer)
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION fn_audit_log_capture() RETURNS trigger AS $fn$
      DECLARE
        v_new jsonb;
        v_old jsonb;
        v_changed text[] := '{}';
        v_k text;
        v_action text;
        v_entity_id text;
        v_actor text;
        v_user_id text;
        v_request_id text;
        v_correlation_id text;
        v_ip text;
        v_user_agent text;
        v_reason text;
        v_checksum text;
        v_redacted constant text[] := ARRAY[
          'password',
          'encrypted_credentials',
          'session_token_hash',
          'vault_token_reference',
          'raw_payload',
          'access_token',
          'refresh_token',
          'client_secret',
          'api_key',
          'card_number',
          'cvv',
          'authorization'
        ];
      BEGIN
        IF TG_OP = 'INSERT' THEN
          v_new := to_jsonb(NEW) - v_redacted;
          v_old := NULL;
          v_action := 'INSERT';
        ELSIF TG_OP = 'UPDATE' THEN
          v_new := to_jsonb(NEW) - v_redacted;
          v_old := to_jsonb(OLD) - v_redacted;
          v_action := 'UPDATE';
          FOR v_k IN SELECT jsonb_object_keys(v_new) LOOP
            -- Timestamps that change without a business decision (row touch,
            -- session heartbeat) must not generate an audit event.
            IF v_k = ANY (ARRAY['updated_at', 'created_at', 'last_active_at']) THEN
              CONTINUE;
            END IF;
            IF v_new -> v_k IS DISTINCT FROM v_old -> v_k THEN
              v_changed := v_changed || v_k;
            END IF;
          END LOOP;
          -- A write that changed nothing but touched the row is not an audit event.
          IF COALESCE(array_length(v_changed, 1), 0) = 0 THEN
            RETURN NULL;
          END IF;
        ELSE
          v_new := NULL;
          v_old := to_jsonb(OLD) - v_redacted;
          v_action := 'DELETE';
          v_changed := ARRAY(SELECT jsonb_object_keys(v_old));
        END IF;

        v_entity_id := COALESCE(v_new ->> 'id', v_old ->> 'id');
        v_actor := NULLIF(current_setting('app.actor_user_id', true), '');
        v_user_id := COALESCE(v_new ->> 'user_id', v_old ->> 'user_id', v_actor);
        v_request_id := NULLIF(current_setting('app.request_id', true), '');
        v_correlation_id := NULLIF(current_setting('app.correlation_id', true), '');
        v_ip := NULLIF(current_setting('app.ip_address', true), '');
        v_user_agent := NULLIF(current_setting('app.user_agent', true), '');
        v_reason := NULLIF(current_setting('app.audit_reason', true), '');

        v_checksum := encode(
          sha256(
            convert_to(
              COALESCE(v_new::text, '') || '|' || COALESCE(v_old::text, '') || '|' ||
              COALESCE(v_changed::text, '') || '|' || COALESCE(v_entity_id, ''),
              'UTF8'
            )
          ),
          'hex'
        );

        INSERT INTO audit_logs (
          id, actor_user_id, user_id, action, entity_type, entity_id,
          request_id, correlation_id, ip_address, user_agent,
          before_state, after_state, metadata, checksum, created_at
        )
        VALUES (
          'aud_' || substr(fn_crockford_base32(uuid_send(gen_random_uuid())), 1, 26),
          v_actor,
          v_user_id,
          v_action,
          TG_TABLE_NAME,
          v_entity_id,
          v_request_id,
          v_correlation_id,
          v_ip,
          v_user_agent,
          v_old,
          v_new,
          jsonb_strip_nulls(
            jsonb_build_object(
              'changed_fields', to_jsonb(v_changed),
              'reason', v_reason
            )
          ),
          v_checksum,
          now()
        );
        RETURN NULL;
      END $fn$ LANGUAGE plpgsql;
    `)

    // Re-attach on every business table: tables created after 0043 never got one.
    this.schema.raw(`
      DO $$
      DECLARE
        t record;
      BEGIN
        FOR t IN
          SELECT tablename FROM pg_tables
          WHERE schemaname = 'public'
            AND tablename <> 'audit_logs'
            AND tablename NOT LIKE 'adonis_schema%'
        LOOP
          EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_capture ON %I', t.tablename);
          EXECUTE format(
            'CREATE TRIGGER trg_audit_capture AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION fn_audit_log_capture()',
            t.tablename
          );
        END LOOP;
      END $$;
    `)

    // --------------------------------------------------------------- indexes
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_orders_user_seller_ordered ON orders (user_id, seller_account_id, ordered_at DESC)'
    )
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_orders_user_status_payment_fulfillment ON orders (user_id, status, payment_status, fulfillment_status)'
    )
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_order_line_items_user_order ON order_line_items (user_id, order_id)'
    )
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_product_variants_user_product_status ON product_variants (user_id, product_id, status)'
    )
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_channel_listings_user_seller_status ON channel_listings (user_id, seller_account_id, listing_status, sync_status)'
    )
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_account_date ON financial_transactions (user_id, financial_account_id, transaction_date DESC)'
    )
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_product_variants_prices_gin ON product_variants USING gin (prices jsonb_path_ops)'
    )
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS idx_products_prices_gin ON products USING gin (prices jsonb_path_ops)'
    )

    // ------------------------------------------------ cross-field invariants
    // Refunds can never exceed the order total, and both sides must be the same currency:
    // comparing amounts across currencies is meaningless without a conversion snapshot.
    this.schema.raw('ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_refund_within_total')
    this.schema.raw(`
      ALTER TABLE orders ADD CONSTRAINT chk_orders_refund_within_total CHECK (
        (refunded_total ->> 'currency_code') = (grand_total ->> 'currency_code')
        AND (refunded_total ->> 'amount')::numeric <= (grand_total ->> 'amount')::numeric
      )
    `)

    this.schema.raw(
      'ALTER TABLE order_line_items DROP CONSTRAINT IF EXISTS chk_order_line_items_qty_bounds'
    )
    this.schema.raw(`
      ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_qty_bounds CHECK (
        quantity_fulfilled >= 0
        AND quantity_returned >= 0
        AND quantity_cancelled >= 0
        AND quantity_fulfilled <= quantity_ordered
        AND quantity_returned <= quantity_ordered
        AND quantity_cancelled <= quantity_ordered
        AND quantity_fulfilled + quantity_cancelled <= quantity_ordered
      )
    `)

    this.schema.raw(
      'ALTER TABLE order_line_items DROP CONSTRAINT IF EXISTS chk_order_line_items_refund_within_total'
    )
    this.schema.raw(`
      ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_refund_within_total CHECK (
        (refunded_total ->> 'currency_code') = (grand_total ->> 'currency_code')
        AND (refunded_total ->> 'amount')::numeric <= (grand_total ->> 'amount')::numeric
      )
    `)
  }

  public async down() {
    this.schema.raw(
      'ALTER TABLE order_line_items DROP CONSTRAINT IF EXISTS chk_order_line_items_refund_within_total'
    )
    this.schema.raw(
      'ALTER TABLE order_line_items DROP CONSTRAINT IF EXISTS chk_order_line_items_qty_bounds'
    )
    this.schema.raw(`
      ALTER TABLE order_line_items ADD CONSTRAINT chk_order_line_items_qty_bounds CHECK (
        quantity_fulfilled >= 0
        AND quantity_returned >= 0
        AND quantity_cancelled >= 0
        AND quantity_fulfilled <= quantity_ordered
        AND quantity_returned <= quantity_ordered
        AND quantity_cancelled <= quantity_ordered
      )
    `)
    this.schema.raw('ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_refund_within_total')
    this.schema.raw(`
      ALTER TABLE orders ADD CONSTRAINT chk_orders_refund_within_total CHECK (
        (refunded_total ->> 'amount')::numeric <= (grand_total ->> 'amount')::numeric
      )
    `)

    this.schema.raw('DROP INDEX IF EXISTS idx_products_prices_gin')
    this.schema.raw('DROP INDEX IF EXISTS idx_product_variants_prices_gin')
    this.schema.raw('DROP INDEX IF EXISTS idx_financial_transactions_user_account_date')
    this.schema.raw('DROP INDEX IF EXISTS idx_channel_listings_user_seller_status')
    this.schema.raw('DROP INDEX IF EXISTS idx_product_variants_user_product_status')
    this.schema.raw('DROP INDEX IF EXISTS idx_order_line_items_user_order')
    this.schema.raw('DROP INDEX IF EXISTS idx_orders_user_status_payment_fulfillment')
    this.schema.raw('DROP INDEX IF EXISTS idx_orders_user_seller_ordered')

    // `generate_entity_id()` / `fn_crockford_base32()` are deliberately kept on
    // rollback: earlier migrations (e.g. 0067's `create_personal_organization()`)
    // and the audit trigger depend on them, so dropping them would break rolling
    // back the rest of the chain.
  }
}
