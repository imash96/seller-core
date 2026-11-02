import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Phase 3 — organizations use real entity ids and `users.company_name` is gone.
 *
 * `organizations.id = 'org_p_' || md5(id)` and
 * `organization_memberships.id = 'om_p_' || md5(id)` violated
 * `ENTITY_ID_PATTERN` (optional lowercase prefix + 26-character ULID), so those
 * rows could not be used with any of the entity-id validators, route models or
 * audit trails. Existing rows are re-keyed with `generate_entity_id()`.
 *
 * The workspace name was seeded from `users.company_name`; the organization now
 * owns that name outright and the redundant user column is dropped.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.raw('DROP TRIGGER IF EXISTS trg_create_personal_organization ON users')
    this.schema.raw('DROP FUNCTION IF EXISTS create_personal_organization()')

    this.schema.raw(
      `CREATE TEMP TABLE org_id_map AS
         SELECT id AS old_id, generate_entity_id('org') AS new_id, owner_user_id, is_personal
           FROM organizations`
    )

    // Personal workspaces are 1:1 with their owner, so the partial unique index
    // forces this two-step dance: create the new rows as non-personal, move the
    // memberships across, delete the legacy rows, then flip the flag back.
    this.schema.raw(
      `INSERT INTO organizations (id, name, owner_user_id, is_personal, created_at, updated_at)
       SELECT map.new_id, o.name, o.owner_user_id, false, o.created_at, o.updated_at
         FROM organizations AS o
         JOIN org_id_map AS map ON map.old_id = o.id`
    )
    this.schema.raw(
      `UPDATE organization_memberships AS m
          SET organization_id = map.new_id, id = generate_entity_id('omem')
         FROM org_id_map AS map
        WHERE m.organization_id = map.old_id`
    )
    this.schema.raw('DELETE FROM organizations WHERE id IN (SELECT old_id FROM org_id_map)')
    this.schema.raw(
      `UPDATE organizations AS o
          SET is_personal = true
         FROM org_id_map AS map
        WHERE o.id = map.new_id AND map.is_personal`
    )

    this.schema.raw('DROP TABLE IF EXISTS org_id_map')

    // Organization ids are now ULID-compatible, enforced at the database level.
    this.schema.raw(
      `ALTER TABLE organizations ADD CONSTRAINT chk_organizations_entity_id
         CHECK (id ~ '^[a-z]{2,8}_[0-9A-HJKMNP-TV-Z]{26}$')`
    )
    this.schema.raw(
      `ALTER TABLE organization_memberships ADD CONSTRAINT chk_organization_memberships_entity_id
         CHECK (id ~ '^[a-z]{2,8}_[0-9A-HJKMNP-TV-Z]{26}$')`
    )

    // Every newly provisioned user receives an isolated personal workspace, with a
    // valid entity id generated inside the database.
    this.schema.raw(`CREATE FUNCTION create_personal_organization() RETURNS trigger AS $$
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
      END; $$ LANGUAGE plpgsql`)
    this.schema.raw(
      'CREATE TRIGGER trg_create_personal_organization AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION create_personal_organization()'
    )

    // The workspace owns its name; the user column was only ever a seed value.
    this.schema.raw('ALTER TABLE users DROP COLUMN IF EXISTS company_name')
  }

  async down() {
    // Raw DDL: `alterTable()` is deferred to the end of the migration, so the
    // backfill below would run before the column exists.
    this.schema.raw('ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name varchar(255) NULL')
    this.schema.raw(
      `UPDATE users AS u SET company_name = o.name
         FROM organizations AS o
        WHERE o.owner_user_id = u.id AND o.is_personal`
    )

    this.schema.raw('DROP TRIGGER IF EXISTS trg_create_personal_organization ON users')
    this.schema.raw('DROP FUNCTION IF EXISTS create_personal_organization()')
    this.schema.raw(
      'ALTER TABLE organizations DROP CONSTRAINT IF EXISTS chk_organizations_entity_id'
    )
    this.schema.raw(
      'ALTER TABLE organization_memberships DROP CONSTRAINT IF EXISTS chk_organization_memberships_entity_id'
    )
    this.schema.raw(`CREATE FUNCTION create_personal_organization() RETURNS trigger AS $$
      BEGIN
        INSERT INTO organizations (id, name, owner_user_id, is_personal)
        VALUES ('org_p_' || md5(NEW.id), LEFT(COALESCE(NULLIF(TRIM(NEW.company_name), ''), NEW.full_name || ' workspace'), 150), NEW.id, true);
        INSERT INTO organization_memberships (id, organization_id, user_id, is_admin, added_by_user_id)
        VALUES ('om_p_' || md5(NEW.id), 'org_p_' || md5(NEW.id), NEW.id, true, NEW.id);
        RETURN NEW;
      END; $$ LANGUAGE plpgsql`)
    this.schema.raw(
      'CREATE TRIGGER trg_create_personal_organization AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION create_personal_organization()'
    )
  }
}
