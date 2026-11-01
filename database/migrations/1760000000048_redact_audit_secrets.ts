import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION fn_audit_log_capture() RETURNS trigger AS $fn$
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
      END $fn$ LANGUAGE plpgsql;
    `)
  }
  // Retain redaction on rollback; older migrations eventually remove the trigger.
  async down() {}
}
