import { ProductSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Brand from '#models/brand'
import ProductCategory from '#models/product_category'
import ProductVariant from '#models/product_variant'
import ChannelListing from '#models/channel_listing'

export default class Product extends ProductSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(product: Product) {
    if (!product.id) {
      product.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Brand, { foreignKey: 'brandId' })
  declare brand: BelongsTo<typeof Brand>

  @belongsTo(() => ProductCategory, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof ProductCategory>

  @hasMany(() => ProductVariant, { foreignKey: 'productId' })
  declare variants: HasMany<typeof ProductVariant>

  @hasMany(() => ChannelListing, { foreignKey: 'productId' })
  declare listings: HasMany<typeof ChannelListing>
}
