import { BaseSchema } from '@adonisjs/lucid/schema'

/** Additive only: legacy records continue to belong to their existing user_id. */
export default class extends BaseSchema {
  async up() {
    this.schema.createTable('organizations', (table) => {
      table.string('id', 64).primary()
      table.string('name', 150).notNullable()
      table
        .string('owner_user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.boolean('is_personal').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
    this.schema.raw(
      'CREATE UNIQUE INDEX uq_organizations_personal_owner ON organizations(owner_user_id) WHERE is_personal'
    )
    this.schema.createTable('organization_memberships', (table) => {
      table.string('id', 64).primary()
      table
        .string('organization_id', 64)
        .notNullable()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE')
      table
        .string('user_id', 64)
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.boolean('is_admin').notNullable().defaultTo(false)
      table.string('role_id', 64).nullable().references('id').inTable('roles').onDelete('RESTRICT')
      table
        .string('added_by_user_id', 64)
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.unique(['organization_id', 'user_id'])
      table.index(['user_id', 'organization_id'])
    })
    // Keep all existing users isolated; matching company names are never merged.
    this.schema.raw(`INSERT INTO organizations (id, name, owner_user_id, is_personal)
      SELECT 'org_p_' || md5(id), LEFT(COALESCE(NULLIF(TRIM(company_name), ''), full_name || ' workspace'), 150), id, true FROM users`)
    this.schema
      .raw(`INSERT INTO organization_memberships (id, organization_id, user_id, is_admin, added_by_user_id)
      SELECT 'om_p_' || md5(id), 'org_p_' || md5(id), id, true, id FROM users`)
    // Every subsequently provisioned user also receives an isolated workspace.
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

  async down() {
    this.schema.raw('DROP TRIGGER IF EXISTS trg_create_personal_organization ON users')
    this.schema.raw('DROP FUNCTION IF EXISTS create_personal_organization()')
    this.schema.dropTable('organization_memberships')
    this.schema.dropTable('organizations')
  }
}
