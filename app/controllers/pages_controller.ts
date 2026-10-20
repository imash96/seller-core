import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import ModuleEntitlement from '#models/module_entitlement'
import SalesChannel from '#models/sales_channel'
import SellerAccount from '#models/seller_account'
import SyncJob from '#models/sync_job'
import Customer from '#models/customer'
import CustomerRiskSignal from '#models/customer_risk_signal'
import Brand from '#models/brand'
import ProductCategory from '#models/product_category'
import Product from '#models/product'
import ChannelListing from '#models/channel_listing'
import Order from '#models/order'
import OrderLineItem from '#models/order_line_item'
import Shipment from '#models/shipment'
import ShippingInvoice from '#models/shipping_invoice'
import ReturnRequest from '#models/return_request'
import RefundTransaction from '#models/refund_transaction'
import MarketplaceClaim from '#models/marketplace_claim'
import FinancialAccount from '#models/financial_account'
import CreditCard from '#models/credit_card'
import FinanceCategory from '#models/finance_category'
import FinancialTransaction from '#models/financial_transaction'
import TasksReminder from '#models/tasks_reminder'
import SavedView from '#models/saved_view'
import AuditLog from '#models/audit_log'
import { RbacService } from '../services/rbac_service.js'

/**
 * Read-side page controller. Every module page loads strictly scoped data
 * (`user_id = auth.user.id`) and renders its own Inertia view so each route
 * has a complete, self-contained CRUD workspace.
 */
export default class PagesController {
  /** Catalog lookups shared by forms across pages. */
  private async lookups(userId: string) {
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
      OrderLineItem.query().where('userId', userId).orderBy('createdAt', 'desc').limit(200),
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

  private async savedViewsFor(userId: string, moduleKey?: string) {
    const q = SavedView.query().where('userId', userId).orderBy('createdAt', 'desc')
    if (moduleKey) q.andWhere('moduleKey', moduleKey)
    const views = await q.limit(20)
    return views.map((v) => v.serialize())
  }

  async ordersPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [orders, customers, savedViews] = await Promise.all([
      Order.query()
        .where('userId', user.id)
        .preload('customer')
        .preload('sellerAccount')
        .preload('lineItems')
        .preload('shipments')
        .orderBy('orderedAt', 'desc')
        .limit(100),
      Customer.query().where('userId', user.id).orderBy('fullName'),
      this.savedViewsFor(user.id, 'orders'),
    ])
    return inertia.render('orders', {
      ...(await this.lookups(user.id)),
      orders: orders.map((o) => o.serialize()),
      customers: customers.map((c) => c.serialize()),
      savedViews,
    })
  }

  async customersPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [customers, riskSignals, savedViews] = await Promise.all([
      Customer.query()
        .where('userId', user.id)
        .preload('addresses')
        .preload('riskSignals')
        .orderBy('createdAt', 'desc')
        .limit(100),
      CustomerRiskSignal.query()
        .where('userId', user.id)
        .preload('customer')
        .orderBy('createdAt', 'desc')
        .limit(50),
      this.savedViewsFor(user.id, 'customers'),
    ])
    return inertia.render('customers', {
      customers: customers.map((c) => c.serialize()),
      riskSignals: riskSignals.map((r) => r.serialize()),
      savedViews,
    })
  }

  async productsPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [products, channelListings, savedViews] = await Promise.all([
      Product.query()
        .where('userId', user.id)
        .preload('brand')
        .preload('category')
        .preload('variants', (q) => q.preload('variantAttributes').preload('listings'))
        .orderBy('createdAt', 'desc')
        .limit(100),
      ChannelListing.query()
        .where('userId', user.id)
        .preload('product')
        .preload('productVariant')
        .preload('sellerAccount')
        .orderBy('createdAt', 'desc')
        .limit(100),
      this.savedViewsFor(user.id, 'products'),
    ])
    return inertia.render('products', {
      products: products.map((p) => p.serialize()),
      channelListings: channelListings.map((c) => c.serialize()),
      savedViews,
      ...(await this.lookups(user.id)),
    })
  }

  async accountsPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const accounts = await SellerAccount.query()
      .where('userId', user.id)
      .preload('salesChannel')
      .orderBy('createdAt', 'desc')
    return inertia.render('accounts', {
      ...(await this.lookups(user.id)),
      sellerAccounts: accounts.map((a) => a.serialize()),
      savedViews: await this.savedViewsFor(user.id, 'seller_accounts'),
    })
  }

  async shipmentsPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [shipments, invoices, savedViews] = await Promise.all([
      Shipment.query()
        .where('userId', user.id)
        .preload('order')
        .preload('shipmentItems', (q) => q.preload('orderLineItem'))
        .orderBy('createdAt', 'desc')
        .limit(100),
      ShippingInvoice.query()
        .where('userId', user.id)
        .preload('lines')
        .orderBy('invoiceDate', 'desc')
        .limit(50),
      this.savedViewsFor(user.id, 'shipments'),
    ])
    return inertia.render('shipments', {
      shipments: shipments.map((s) => s.serialize()),
      shippingInvoices: invoices.map((i) => i.serialize()),
      savedViews,
      ...(await this.lookups(user.id)),
    })
  }

  async returnsPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [returns, refunds, savedViews] = await Promise.all([
      ReturnRequest.query()
        .where('userId', user.id)
        .preload('order')
        .preload('orderLineItem')
        .preload('customer')
        .orderBy('requestedAt', 'desc')
        .limit(100),
      RefundTransaction.query()
        .where('userId', user.id)
        .preload('order')
        .orderBy('createdAt', 'desc')
        .limit(50),
      this.savedViewsFor(user.id, 'returns'),
    ])
    return inertia.render('returns', {
      returnRequests: returns.map((r) => r.serialize()),
      refundTransactions: refunds.map((r) => r.serialize()),
      savedViews,
      ...(await this.lookups(user.id)),
    })
  }

  async claimsPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const claims = await MarketplaceClaim.query()
      .where('userId', user.id)
      .preload('order')
      .orderBy('createdAt', 'desc')
      .limit(100)
    return inertia.render('claims', {
      claims: claims.map((c) => c.serialize()),
      savedViews: await this.savedViewsFor(user.id, 'claims'),
      ...(await this.lookups(user.id)),
    })
  }

  async financePage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [accounts, cards, transactions, savedViews] = await Promise.all([
      FinancialAccount.query().where('userId', user.id).orderBy('accountName'),
      CreditCard.query()
        .where('userId', user.id)
        .preload('sellerAccountLinks', (q) => q.preload('sellerAccount'))
        .orderBy('createdAt', 'desc'),
      FinancialTransaction.query()
        .where('userId', user.id)
        .preload('financialAccount')
        .preload('creditCard')
        .preload('category')
        .preload('sellerAccount')
        .orderBy('transactionDate', 'desc')
        .limit(100),
      this.savedViewsFor(user.id, 'finance'),
    ])
    return inertia.render('finance', {
      financialAccounts: accounts.map((a) => a.serialize()),
      creditCards: cards.map((c) => c.serialize()),
      financialTransactions: transactions.map((t) => t.serialize()),
      savedViews,
      ...(await this.lookups(user.id)),
    })
  }

  async tasksPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [tasks, savedViews] = await Promise.all([
      TasksReminder.query()
        .where('userId', user.id)
        .preload('creditCard')
        .orderBy('dueAt', 'asc')
        .limit(100),
      this.savedViewsFor(user.id, 'tasks'),
    ])
    return inertia.render('tasks', {
      tasksReminders: tasks.map((t) => t.serialize()),
      savedViews,
    })
  }

  async adminPage({ auth, inertia, response }: HttpContext) {
    const actor = auth.getUserOrFail()
    if (!actor.isSuperAdmin) {
      return response.redirect('/dashboard')
    }
    const [users, roles, permissions, entitlements] = await Promise.all([
      User.query().preload('roles').orderBy('createdAt', 'desc'),
      Role.query().preload('permissions').orderBy('name'),
      Permission.query().orderBy('slug'),
      ModuleEntitlement.query().orderBy('moduleKey'),
    ])
    return inertia.render('admin', {
      allUsers: users.map((u) => u.serialize()),
      allRoles: roles.map((r) => r.serialize()),
      allPermissions: permissions.map((p) => p.serialize()),
      moduleEntitlements: entitlements.map((e) => e.serialize()),
    })
  }

  async auditPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const logs = await AuditLog.query()
      .where((q) => q.where('userId', user.id).orWhere('actorUserId', user.id))
      .preload('user')
      .preload('actor')
      .orderBy('createdAt', 'desc')
      .limit(150)
    return inertia.render('audit', {
      auditLogs: logs.map((l) => l.serialize()),
    })
  }

  async importPage({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [jobs, effectiveRbac, savedViews] = await Promise.all([
      SyncJob.query()
        .where('userId', user.id)
        .preload('errors')
        .orderBy('createdAt', 'desc')
        .limit(30),
      RbacService.getEffectivePermissions(user),
      this.savedViewsFor(user.id, 'import'),
    ])
    return inertia.render('import', {
      syncJobs: jobs.map((j) => j.serialize()),
      effectiveRbac,
      savedViews,
      ...(await this.lookups(user.id)),
    })
  }
}
