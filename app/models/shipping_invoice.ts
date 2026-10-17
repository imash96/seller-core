import { ShippingInvoiceSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { uuidv7 } from '../utils/uuid.js'
import User from '#models/user'
import FinancialAccount from '#models/financial_account'
import ShippingInvoiceLine from '#models/shipping_invoice_line'

export default class ShippingInvoice extends ShippingInvoiceSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(invoice: ShippingInvoice) {
    if (!invoice.id) {
      invoice.id = uuidv7()
    }
  }

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => FinancialAccount, { foreignKey: 'financialAccountId' })
  declare financialAccount: BelongsTo<typeof FinancialAccount>

  @hasMany(() => ShippingInvoiceLine, { foreignKey: 'shippingInvoiceId' })
  declare lines: HasMany<typeof ShippingInvoiceLine>
}
