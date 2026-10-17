import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { beforeCreate, hasMany, manyToMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import Role from '#models/role'
import UserRole from '#models/user_role'
import ModuleEntitlement from '#models/module_entitlement'
import UserSession from '#models/user_session'
import SellerAccount from '#models/seller_account'
import Customer from '#models/customer'
import Product from '#models/product'
import Order from '#models/order'
import FinancialAccount from '#models/financial_account'
import CreditCard from '#models/credit_card'
import FinancialTransaction from '#models/financial_transaction'
import AuditLog from '#models/audit_log'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(UserSchema, AuthFinder) {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(user: User) {
    if (!user.id) {
      user.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdBy: BelongsTo<typeof User>

  @hasMany(() => UserRole, { foreignKey: 'userId' })
  declare userRoles: HasMany<typeof UserRole>

  @manyToMany(() => Role, {
    pivotTable: 'user_roles',
    localKey: 'id',
    pivotForeignKey: 'user_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'role_id',
    pivotColumns: ['assigned_by_user_id', 'expires_at', 'created_at'],
  })
  declare roles: ManyToMany<typeof Role>

  @hasMany(() => ModuleEntitlement, { foreignKey: 'userId' })
  declare moduleEntitlements: HasMany<typeof ModuleEntitlement>

  @hasMany(() => UserSession, { foreignKey: 'userId' })
  declare sessions: HasMany<typeof UserSession>

  @hasMany(() => SellerAccount, { foreignKey: 'userId' })
  declare sellerAccounts: HasMany<typeof SellerAccount>

  @hasMany(() => Customer, { foreignKey: 'userId' })
  declare customers: HasMany<typeof Customer>

  @hasMany(() => Product, { foreignKey: 'userId' })
  declare products: HasMany<typeof Product>

  @hasMany(() => Order, { foreignKey: 'userId' })
  declare orders: HasMany<typeof Order>

  @hasMany(() => FinancialAccount, { foreignKey: 'userId' })
  declare financialAccounts: HasMany<typeof FinancialAccount>

  @hasMany(() => CreditCard, { foreignKey: 'userId' })
  declare creditCards: HasMany<typeof CreditCard>

  @hasMany(() => FinancialTransaction, { foreignKey: 'userId' })
  declare financialTransactions: HasMany<typeof FinancialTransaction>

  @hasMany(() => AuditLog, { foreignKey: 'userId' })
  declare auditLogs: HasMany<typeof AuditLog>

  get initials(): string {
    const parts = (this.fullName || this.email || 'U').trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
}
