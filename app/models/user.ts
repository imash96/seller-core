/**
 * User — maps to "users".
 * Root ownership entity. Public registration is disabled; only active system
 * super administrators may provision users. Passwords are scrypt-hashed and
 * never serialized to clients.
 */
import { beforeSave, belongsTo, column, hasMany, hasManyThrough } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasManyThrough } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import ModuleEntitlement from './module_entitlement.js'
import Order from './order.js'
import Role from './role.js'
import UserRole from './user_role.js'
import UserSession from './user_session.js'
import { prepareJson } from './json_helpers.js'
import AppBaseModel from './base_model.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends AuthFinder(AppBaseModel) {
  static readonly table = 'users'
  static readonly idPrefix = 'usr'

  @column({ columnName: 'email' })
  declare public email: string

  @column({ columnName: 'full_name' })
  declare public fullName: string

  @column({ columnName: 'company_name' })
  declare public companyName: string | null

  @column({ columnName: 'phone' })
  declare public phone: string | null

  /** Scrypt hash — never plaintext, never serialized to clients. */
  @column({ columnName: 'password', serializeAs: null })
  declare public password: string

  @column({ columnName: 'status' })
  declare public status: string

  @column({ columnName: 'is_super_admin' })
  declare public isSuperAdmin: boolean

  @column({ columnName: 'failed_login_attempts' })
  declare public failedLoginAttempts: number

  @column.dateTime({ columnName: 'locked_until' })
  declare public lockedUntil: DateTime | null

  @column.dateTime({ columnName: 'password_changed_at' })
  declare public passwordChangedAt: DateTime | null

  @column.dateTime({ columnName: 'last_login_at' })
  declare public lastLoginAt: DateTime | null

  @column({ columnName: 'last_login_ip' })
  declare public lastLoginIp: string | null

  @column({ columnName: 'default_currency' })
  declare public defaultCurrency: string

  @column({ columnName: 'timezone' })
  declare public timezone: string

  @column({ columnName: 'preferences', prepare: prepareJson })
  declare public preferences: any

  @column({ columnName: 'created_by_user_id' })
  declare public createdByUserId: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @hasMany(() => Order, { foreignKey: 'userId' })
  declare public orders: HasMany<typeof Order>

  @hasMany(() => ModuleEntitlement, { foreignKey: 'userId' })
  declare public moduleEntitlements: HasMany<typeof ModuleEntitlement>

  @hasMany(() => UserSession, { foreignKey: 'userId' })
  declare public userSessions: HasMany<typeof UserSession>

  @hasManyThrough([() => Role, () => UserRole], {
    throughLocalKey: 'roleId',
    throughForeignKey: 'id',
    localKey: 'id',
    foreignKey: 'userId',
  })
  declare public roles: HasManyThrough<typeof Role>

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare public createdBy: BelongsTo<typeof User>

  /**
   * Normalizes identity fields. Password hashing is handled by the
   * `withAuthFinder` mixin's own beforeSave hook — hashing it here too would
   * double-hash and make every credential check fail.
   */
  @beforeSave()
  static async normalizeAndHash(user: User) {
    if (user.$dirty.email) {
      user.email = user.email.trim().toLowerCase()
    }
  }

  /** Display initials used by the UI (avatar fallback). */
  get initials(): string {
    const parts = (this.fullName || this.email || '?').trim().split(/\s+/)
    const first = parts[0]?.charAt(0) ?? '?'
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''
    return (first + last).toUpperCase()
  }
}
