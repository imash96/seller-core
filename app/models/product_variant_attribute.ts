import { ProductVariantAttributeSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import ProductVariant from '#models/product_variant'

export default class ProductVariantAttribute extends ProductVariantAttributeSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(attr: ProductVariantAttribute) {
    if (!attr.id) {
      attr.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare productVariant: BelongsTo<typeof ProductVariant>
}
