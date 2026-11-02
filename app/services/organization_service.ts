import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import User from '#models/user'
import Organization from '#models/organization'
import OrganizationMembership from '#models/organization_membership'
import Role from '#models/role'
import { AuditContext } from './audit_context.js'

export class OrganizationError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message)
  }
}

export class OrganizationService {
  private static async lockAdmin(
    actor: User,
    organizationId: string,
    trx: TransactionClientContract
  ) {
    if (actor.status !== 'active') throw new OrganizationError('Active account required.', 403)
    const org = await Organization.query({ client: trx })
      .where('id', organizationId)
      .forUpdate()
      .first()
    if (!org) throw new OrganizationError('Organization not found.', 404)
    if (!actor.isSuperAdmin) {
      const membership = await OrganizationMembership.query({ client: trx })
        .where('organizationId', org.id)
        .where('userId', actor.id)
        .first()
      if (!membership?.isAdmin)
        throw new OrganizationError('Organization administrator access required.', 403)
    }
    return org
  }

  static async list(actor: User) {
    if (actor.status !== 'active') throw new OrganizationError('Active account required.', 403)
    const orgQuery = Organization.query().orderBy('createdAt', 'asc')
    if (!actor.isSuperAdmin) {
      const ids = await OrganizationMembership.query()
        .where('userId', actor.id)
        .select('organizationId')
      orgQuery.whereIn(
        'id',
        ids.map((m) => m.organizationId)
      )
    }
    const organizations = await orgQuery
    const ids = organizations.map((o) => o.id)
    const members = ids.length
      ? await db
          .from('organization_memberships as m')
          .join('users as u', 'u.id', 'm.user_id')
          .leftJoin('roles as r', 'r.id', 'm.role_id')
          .whereIn('m.organization_id', ids)
          .select(
            'm.id',
            'm.organization_id',
            'm.user_id',
            'm.is_admin',
            'm.role_id',
            'u.full_name',
            'u.email',
            'u.status',
            'r.name as role_name'
          )
          .orderBy('u.full_name')
      : []
    const roles = await Role.query().whereNot('slug', 'super_admin').orderBy('name')
    return organizations
      .map((org) => {
        const orgMembers = members.filter((m) => m.organization_id === org.id)
        const self = orgMembers.find((m) => m.user_id === actor.id)
        return {
          id: org.id,
          name: org.name,
          ownerUserId: org.ownerUserId,
          isPersonal: org.isPersonal,
          canManage: actor.isSuperAdmin || Boolean(self?.is_admin),
          members: orgMembers.map((m) => ({
            id: m.id,
            userId: m.user_id,
            fullName: m.full_name,
            email: m.email,
            status: m.status,
            isAdmin: m.is_admin,
            roleId: m.role_id,
            roleName: m.role_name,
          })),
        }
      })
      .map((org) => ({
        ...org,
        availableRoles: org.canManage ? roles.map((r) => ({ id: r.id, name: r.name })) : [],
      }))
  }

  static async create(actor: User, nameInput: unknown, requestId?: string) {
    if (actor.status !== 'active') throw new OrganizationError('Active account required.', 403)
    const name = String(nameInput ?? '').trim()
    if (name.length < 2 || name.length > 150)
      throw new OrganizationError('Organization name must be 2–150 characters.')
    return AuditContext.transaction(async (trx) => {
      await AuditContext.apply(trx, {
        actorUserId: actor.id,
        requestId: requestId ?? null,
        reason: 'organization.created',
      })
      // Serialize creates per actor so the quota cannot be bypassed with concurrent requests.
      await User.query({ client: trx }).where('id', actor.id).forUpdate().firstOrFail()
      const count = await Organization.query({ client: trx })
        .where('ownerUserId', actor.id)
        .count('* as total')
      if (!actor.isSuperAdmin && Number(count[0].$extras.total) >= 20)
        throw new OrganizationError('Organization limit reached.', 409)
      const organization = await Organization.create(
        { name, ownerUserId: actor.id, isPersonal: false },
        { client: trx }
      )
      await OrganizationMembership.create(
        {
          organizationId: organization.id,
          userId: actor.id,
          isAdmin: true,
          roleId: null,
          addedByUserId: actor.id,
        },
        { client: trx }
      )
      return organization
    })
  }

  static async upsertMember(
    actor: User,
    organizationId: string,
    input: { email: unknown; roleId: unknown; isAdmin: unknown },
    requestId?: string
  ) {
    const email = String(input.email ?? '')
      .trim()
      .toLowerCase()
    const roleId = String(input.roleId ?? '').trim()
    if (!email || email.length > 254 || !['true', 'false'].includes(String(input.isAdmin)))
      throw new OrganizationError('Provide a valid email and administrator setting.')
    return AuditContext.transaction(async (trx) => {
      const org = await this.lockAdmin(actor, organizationId, trx)
      await AuditContext.apply(trx, {
        actorUserId: actor.id,
        requestId: requestId ?? null,
        reason: 'organization.member_upserted',
      })
      const target = await User.query({ client: trx }).where('email', email).first()
      if (!target || target.status !== 'active')
        throw new OrganizationError('Active user not found.', 404)
      if (target.id === org.ownerUserId)
        throw new OrganizationError('The owner cannot be modified.', 409)
      if (roleId) {
        const role = await Role.query({ client: trx })
          .where('id', roleId)
          .whereNot('slug', 'super_admin')
          .first()
        if (!role) throw new OrganizationError('Invalid organization role.')
      }
      const existing = await OrganizationMembership.query({ client: trx })
        .where('organizationId', org.id)
        .where('userId', target.id)
        .first()
      const member = existing ?? new OrganizationMembership()
      member.useTransaction(trx)
      member.organizationId = org.id
      member.userId = target.id
      member.isAdmin = String(input.isAdmin) === 'true'
      member.roleId = roleId || null
      member.addedByUserId = existing?.addedByUserId ?? actor.id
      await member.save()
      return member
    })
  }

  static async removeMember(
    actor: User,
    organizationId: string,
    membershipId: string,
    requestId?: string
  ) {
    return AuditContext.transaction(async (trx) => {
      const org = await this.lockAdmin(actor, organizationId, trx)
      await AuditContext.apply(trx, {
        actorUserId: actor.id,
        requestId: requestId ?? null,
        reason: 'organization.member_removed',
      })
      const member = await OrganizationMembership.query({ client: trx })
        .where('organizationId', org.id)
        .where('id', membershipId)
        .first()
      if (!member) throw new OrganizationError('Member not found.', 404)
      if (member.userId === org.ownerUserId)
        throw new OrganizationError('The owner cannot be removed.', 409)
      await member.delete()
    })
  }
}
