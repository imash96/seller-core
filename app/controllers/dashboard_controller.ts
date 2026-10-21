import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
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
import Order from '#models/order'
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

export default class DashboardController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const [
      effectiveRbac,
      orders,
      customers,
      riskSignals,
      products,
      brands,
      categories,
      salesChannels,
      sellerAccounts,
      syncJobs,
      shipments,
      shippingInvoices,
      returnRequests,
      refundTransactions,
      marketplaceClaims,
      financialAccounts,
      creditCards,
      financeCategories,
      financialTransactions,
      tasksReminders,
      auditLogs,
      allUsers,
      allRoles,
      allPermissions,
      moduleEntitlements,
      savedViews,
    ] = await Promise.all([
      RbacService.getEffectivePermissions(user),
      Order.query()
        .where('userId', user.id)
        .preload('customer')
        .preload('sellerAccount')
        .preload('lineItems')
        .preload('shipments')
        .orderBy('orderedAt', 'desc')
        .limit(50),
      Customer.query()
        .where('userId', user.id)
        .preload('addresses')
        .preload('riskSignals')
        .orderBy('createdAt', 'desc')
        .limit(50),
      CustomerRiskSignal.query()
        .where('userId', user.id)
        .preload('customer')
        .orderBy('createdAt', 'desc')
        .limit(30),
      Product.query()
        .where('userId', user.id)
        .preload('brand')
        .preload('category')
        .preload('variants', (q) => q.preload('variantAttributes').preload('listings'))
        .orderBy('createdAt', 'desc')
        .limit(50),
      Brand.query().where('userId', user.id).orderBy('name', 'asc'),
      ProductCategory.query().where('userId', user.id).orderBy('name', 'asc'),
      SalesChannel.query().where('isActive', true).orderBy('name', 'asc'),
      SellerAccount.query()
        .where('userId', user.id)
        .preload('salesChannel')
        .orderBy('createdAt', 'desc'),
      SyncJob.query()
        .where('userId', user.id)
        .preload('errors')
        .orderBy('createdAt', 'desc')
        .limit(20),
      Shipment.query()
        .where('userId', user.id)
        .preload('order')
        .preload('shipmentItems', (q) => q.preload('orderLineItem'))
        .orderBy('createdAt', 'desc')
        .limit(50),
      ShippingInvoice.query()
        .where('userId', user.id)
        .preload('lines')
        .orderBy('invoiceDate', 'desc')
        .limit(30),
      ReturnRequest.query()
        .where('userId', user.id)
        .preload('order')
        .preload('orderLineItem')
        .preload('customer')
        .orderBy('requestedAt', 'desc')
        .limit(40),
      RefundTransaction.query()
        .where('userId', user.id)
        .preload('order')
        .orderBy('createdAt', 'desc')
        .limit(40),
      MarketplaceClaim.query()
        .where('userId', user.id)
        .preload('order')
        .orderBy('createdAt', 'desc')
        .limit(30),
      FinancialAccount.query().where('userId', user.id).orderBy('accountName', 'asc'),
      CreditCard.query()
        .where('userId', user.id)
        .preload('sellerAccountLinks', (q) => q.preload('sellerAccount'))
        .orderBy('createdAt', 'desc'),
      FinanceCategory.query().where('userId', user.id).orderBy('name', 'asc'),
      FinancialTransaction.query()
        .where('userId', user.id)
        .preload('financialAccount')
        .preload('creditCard')
        .preload('category')
        .preload('sellerAccount')
        .orderBy('transactionDate', 'desc')
        .limit(60),
      TasksReminder.query()
        .where('userId', user.id)
        .preload('creditCard')
        .orderBy('dueAt', 'asc')
        .limit(30),
      AuditLog.query()
        .where((q) => q.where('userId', user.id).orWhere('actorUserId', user.id))
        .preload('user')
        .preload('actor')
        .orderBy('createdAt', 'desc')
        .limit(40),
      user.isSuperAdmin
        ? User.query().preload('roles').preload('moduleEntitlements').orderBy('createdAt', 'desc')
        : User.query().where('id', user.id).preload('roles').preload('moduleEntitlements'),
      Role.query().preload('permissions').orderBy('name', 'asc'),
      Permission.query().orderBy('slug', 'asc'),
      ModuleEntitlement.query().where('userId', user.id).orderBy('moduleKey', 'asc'),
      SavedView.query().where('userId', user.id).orderBy('createdAt', 'desc'),
    ])

    const grossSales = orders.reduce(
      (sum, o) => sum + Number(o.reportingTotalAmount || o.totalAmount || 0),
      0
    )
    const totalRefunded = orders.reduce(
      (sum, o) => sum + Number(o.refundedAmount || 0) * Number(o.exchangeRate || 1),
      0
    )
    const totalMarketplaceFees = orders.reduce(
      (sum, o) =>
        sum +
        (Number(o.marketplaceFeesAmount || 0) + Number(o.paymentProcessingFeesAmount || 0)) *
          Number(o.exchangeRate || 1),
      0
    )
    const totalCogs = orders.reduce(
      (sum, o) => sum + Number(o.cogsAmount || 0) * Number(o.exchangeRate || 1),
      0
    )
    const totalShippingCost = orders.reduce(
      (sum, o) => sum + Number(o.shippingCostAmount || 0) * Number(o.exchangeRate || 1),
      0
    )
    const netProfit = orders.reduce(
      (sum, o) => sum + Number(o.netProfitAmount || 0) * Number(o.exchangeRate || 1),
      0
    )

    const businessExpenses = financialTransactions
      .filter((t) => t.transactionType === 'expense' && t.dataClassification === 'business')
      .reduce((sum, t) => sum + Number(t.reportingAmount || 0), 0)

    const householdExpenses = financialTransactions
      .filter((t) => t.dataClassification === 'household_personal')
      .reduce((sum, t) => sum + Number(t.reportingAmount || 0), 0)

    const kpis = {
      totalOrders: orders.length,
      grossSales: grossSales.toFixed(2),
      netSales: (grossSales - totalRefunded).toFixed(2),
      totalRefunded: totalRefunded.toFixed(2),
      totalMarketplaceFees: totalMarketplaceFees.toFixed(2),
      totalCogs: totalCogs.toFixed(2),
      totalShippingCost: totalShippingCost.toFixed(2),
      orderNetProfit: netProfit.toFixed(2),
      businessOperatingExpenses: businessExpenses.toFixed(2),
      householdExpenses: householdExpenses.toFixed(2),
      pendingOrders: orders.filter((o) =>
        ['draft', 'pending', 'confirmed', 'processing'].includes(o.status)
      ).length,
      deliveredOrders: orders.filter((o) => o.status === 'delivered' || o.status === 'fulfilled')
        .length,
      activeShipments: shipments.filter((s) =>
        ['pending', 'label_created', 'in_transit', 'out_for_delivery', 'delayed'].includes(s.status)
      ).length,
      openReturns: returnRequests.filter(
        (r) => !['closed', 'rejected', 'refunded'].includes(r.status)
      ).length,
      pendingRiskReviews: riskSignals.filter((r) => r.reviewStatus === 'pending_review').length,
      invoiceVarianceTotal: shippingInvoices
        .reduce((sum, inv) => sum + Number(inv.varianceAmount || 0), 0)
        .toFixed(2),
    }

    return inertia.render('dashboard', {
      kpis,
      effectiveRbac,
      orders: orders.map((o) => o.serialize()),
      customers: customers.map((c) => c.serialize()),
      riskSignals: riskSignals.map((r) => r.serialize()),
      products: products.map((p) => p.serialize()),
      brands: brands.map((b) => b.serialize()),
      categories: categories.map((c) => c.serialize()),
      salesChannels: salesChannels.map((sc) => sc.serialize()),
      sellerAccounts: sellerAccounts.map((sa) => ({
        ...sa.serialize(),
        encryptedCredentials: sa.encryptedCredentials ? '[AES-256-GCM ENCRYPTED]' : null,
      })),
      syncJobs: syncJobs.map((j) => j.serialize()),
      shipments: shipments.map((s) => s.serialize()),
      shippingInvoices: shippingInvoices.map((inv) => inv.serialize()),
      returnRequests: returnRequests.map((r) => r.serialize()),
      refundTransactions: refundTransactions.map((rf) => rf.serialize()),
      marketplaceClaims: marketplaceClaims.map((cl) => cl.serialize()),
      financialAccounts: financialAccounts.map((fa) => fa.serialize()),
      creditCards: creditCards.map((cc) => cc.serialize()),
      financeCategories: financeCategories.map((fc) => fc.serialize()),
      financialTransactions: financialTransactions.map((ft) => ft.serialize()),
      tasksReminders: tasksReminders.map((t) => t.serialize()),
      auditLogs: auditLogs.map((al) => al.serialize()),
      allUsers: allUsers.map((u) => u.serialize()),
      allRoles: allRoles.map((r) => r.serialize()),
      allPermissions: allPermissions.map((p) => p.serialize()),
      moduleEntitlements: moduleEntitlements.map((me) => me.serialize()),
      savedViews: savedViews.map((sv) => sv.serialize()),
    })
  }

  async queueOverview({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    let queueStats: any = null
    try {
      const jobs = await db
        .from('queue_jobs')
        .select('queue_name', 'status')
        .count('* as count')
        .groupBy('queue_name', 'status')
        .limit(100)
      queueStats = jobs
    } catch {
      queueStats = null
    }

    const [sellerAccounts, syncJobs] = await Promise.all([
      SellerAccount.query().where('userId', user.id).preload('salesChannel'),
      SyncJob.query().where('userId', user.id).orderBy('createdAt', 'desc').limit(20),
    ])

    return inertia.render('dashboard', {
      view: 'queue',
      queueStats,
      sellerAccounts: sellerAccounts.map((s) => s.serialize()),
      syncJobs: syncJobs.map((j) => j.serialize()),
    } as any)
  }
}
