/**
 * Brand — maps to "brands".
 * User-owned brand definitions for catalog organization and brand-level P&L reporting.
 *
 * This file is generated from database/schema.dbml — keep the two in sync.
 */
import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Product from './product.js'
import AppBaseModel from './base_model.js'

export default class Brand extends AppBaseModel {
  static readonly table = 'brands'
  static readonly idPrefix = 'brd'

  @column({ columnName: 'user_id' })
  declare public userId: string

  @column({ columnName: 'name' })
  declare public name: string

  @column({ columnName: 'reg_no' })
  declare public regNo: string | null

  @column({ columnName: 'serial_no' })
  declare public serialNo: string | null

  @column({ columnName: 'slug' })
  declare public slug: string

  @column({ columnName: 'logo_url' })
  declare public logoUrl: string | null

  @column({ columnName: 'website_url' })
  declare public websiteUrl: string | null

  @column({ columnName: 'is_active' })
  declare public isActive: boolean

  @column.dateTime({ columnName: 'created_at' })
  declare public createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at' })
  declare public updatedAt: DateTime

  @hasMany(() => Product, { foreignKey: 'brandId' })
  declare public products: HasMany<typeof Product>
}
