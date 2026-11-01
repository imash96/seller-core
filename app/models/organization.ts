import { column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'
import AppBaseModel from './base_model.js'

export default class Organization extends AppBaseModel {
  static readonly table = 'organizations'
  static readonly idPrefix = 'org'
  @column() declare public name: string
  @column({ columnName: 'owner_user_id' }) declare public ownerUserId: string
  @column({ columnName: 'is_personal' }) declare public isPersonal: boolean
  @column.dateTime({ columnName: 'created_at' }) declare public createdAt: DateTime
  @column.dateTime({ columnName: 'updated_at' }) declare public updatedAt: DateTime
}
