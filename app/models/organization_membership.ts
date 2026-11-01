import { column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'
import AppBaseModel from './base_model.js'

export default class OrganizationMembership extends AppBaseModel {
  static readonly table = 'organization_memberships'
  static readonly idPrefix = 'omem'
  @column({ columnName: 'organization_id' }) declare public organizationId: string
  @column({ columnName: 'user_id' }) declare public userId: string
  @column({ columnName: 'is_admin' }) declare public isAdmin: boolean
  @column({ columnName: 'role_id' }) declare public roleId: string | null
  @column({ columnName: 'added_by_user_id' }) declare public addedByUserId: string | null
  @column.dateTime({ columnName: 'created_at' }) declare public createdAt: DateTime
  @column.dateTime({ columnName: 'updated_at' }) declare public updatedAt: DateTime
}
