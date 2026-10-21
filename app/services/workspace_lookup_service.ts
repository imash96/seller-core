import Brand from '#models/brand'
import ProductCategory from '#models/product_category'
import SalesChannel from '#models/sales_channel'
import SellerAccount from '#models/seller_account'
import Order from '#models/order'
import OrderLineItem from '#models/order_line_item'
import FinanceCategory from '#models/finance_category'
import SavedView from '#models/saved_view'

export class WorkspaceLookupService {
  static async lookups(userId: string) {
    const [
      brands,
      categories,
      salesChannels,
      sellerAccounts,
      orders,
      lineItems,
      financeCategories,
    ] = await Promise.all([
      Brand.query().where('userId', userId).orderBy('name'),
      ProductCategory.query().where('userId', userId).orderBy('name'),
      SalesChannel.query().where('isActive', true).orderBy('name'),
      SellerAccount.query().where('userId', userId).orderBy('accountName'),
      Order.query().where('userId', userId).orderBy('orderedAt', 'desc').limit(100),
      OrderLineItem.query().where('userId', userId).orderBy('createdAt', 'desc').limit(250),
      FinanceCategory.query().where('userId', userId).orderBy('name'),
    ])
    return {
      brands: brands.map((b) => b.serialize()),
      categories: categories.map((c) => c.serialize()),
      salesChannels: salesChannels.map((sc) => sc.serialize()),
      sellerAccounts: sellerAccounts.map((sa) => sa.serialize()),
      orders: orders.map((o) => o.serialize()),
      orderLineItems: lineItems.map((li) => li.serialize()),
      financeCategories: financeCategories.map((fc) => fc.serialize()),
    }
  }

  static async savedViewsFor(userId: string, moduleKey?: string) {
    const q = SavedView.query().where('userId', userId).orderBy('createdAt', 'desc')
    if (moduleKey) q.andWhere('moduleKey', moduleKey)
    const views = await q.limit(20)
    return views.map((v) => v.serialize())
  }
}
