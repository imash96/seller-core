import { ProductVariantSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import Product from '#models/product'
import ProductVariantAttribute from '#models/product_variant_attribute'
import ChannelListing from '#models/channel_listing'
import OrderLineItem from '#models/order_line_item'

export default class ProductVariant extends ProductVariantSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(variant: ProductVariant) {
    if (!variant.id) {
      variant.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Product, { foreignKey: 'productId' })
  declare product: BelongsTo<typeof Product>

  @hasMany(() => ProductVariantAttribute, { foreignKey: 'productVariantId' })
  declare variantAttributes: HasMany<typeof ProductVariantAttribute>

  @hasMany(() => ChannelListing, { foreignKey: 'productVariantId' })
  declare listings: HasMany<typeof ChannelListing>

  @hasMany(() => OrderLineItem, { foreignKey: 'productVariantId' })
  declare orderLines: HasMany<typeof OrderLineItem>
}
