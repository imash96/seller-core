import { BrandSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Product from '#models/product'

export default class Brand extends BrandSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(brand: Brand) {
    if (!brand.id) {
      brand.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @hasMany(() => Product, { foreignKey: 'brandId' })
  declare products: HasMany<typeof Product>
}
