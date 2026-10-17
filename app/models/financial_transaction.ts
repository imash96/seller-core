import { FinancialTransactionSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import FinancialAccount from '#models/financial_account'
import CreditCard from '#models/credit_card'
import FinanceCategory from '#models/finance_category'
import SellerAccount from '#models/seller_account'
import Order from '#models/order'
import ProductVariant from '#models/product_variant'
import ShippingInvoice from '#models/shipping_invoice'

export default class FinancialTransaction extends FinancialTransactionSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(tx: FinancialTransaction) {
    if (!tx.id) {
      tx.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => FinancialAccount, { foreignKey: 'financialAccountId' })
  declare financialAccount: BelongsTo<typeof FinancialAccount>

  @belongsTo(() => CreditCard, { foreignKey: 'creditCardId' })
  declare creditCard: BelongsTo<typeof CreditCard>

  @belongsTo(() => FinanceCategory, { foreignKey: 'financeCategoryId' })
  declare category: BelongsTo<typeof FinanceCategory>

  @belongsTo(() => SellerAccount, { foreignKey: 'sellerAccountId' })
  declare sellerAccount: BelongsTo<typeof SellerAccount>

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => ProductVariant, { foreignKey: 'productVariantId' })
  declare productVariant: BelongsTo<typeof ProductVariant>

  @belongsTo(() => ShippingInvoice, { foreignKey: 'shippingInvoiceId' })
  declare shippingInvoice: BelongsTo<typeof ShippingInvoice>
}
