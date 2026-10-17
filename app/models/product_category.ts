import { ProductCategorySchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Product from '#models/product'

export default class ProductCategory extends ProductCategorySchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(cat: ProductCategory) {
    if (!cat.id) {
      cat.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => ProductCategory, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof ProductCategory>

  @hasMany(() => ProductCategory, { foreignKey: 'parentId' })
  declare children: HasMany<typeof ProductCategory>

  @hasMany(() => Product, { foreignKey: 'categoryId' })
  declare products: HasMany<typeof Product>
}
