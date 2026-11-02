import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Database-side entity id generator.
 *
 * Every primary key in the platform is a ULID (26 Crockford base32 characters,
 * lexicographically sortable, 80 bits of randomness) with an optional
 * self-describing lowercase prefix — see `app/utils/generate_entity_id.ts` and
 * `ENTITY_ID_PATTERN`.
 *
 * Migrations and triggers need to mint ids without a round-trip to Node, so the
 * same contract is implemented in SQL and enforced by the
 * `chk_entity_id_format` CHECK on the tables that own triggers (organizations,
 * organization_memberships) plus the seed/backfill statements below.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION generate_entity_id(prefix text DEFAULT NULL)
      RETURNS text
      LANGUAGE plpgsql
      VOLATILE
      AS $$
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
      $$`)
  }

  async down() {
    this.schema.raw('DROP FUNCTION IF EXISTS generate_entity_id(text)')
  }
}
