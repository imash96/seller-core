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
import { normalizePriceMoney } from '../types/price.js'

export default class DashboardController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const effectiveRbac = await RbacService.getEffectivePermissions(user)
    const can = (resource: string) =>
      RbacService.allows(user, effectiveRbac, `${resource}.read`, resource)
    const access = {
      orders: can('orders'),
      customers: can('customers'),
      catalog: can('catalog'),
      integrations: can('integrations'),
      shipments: can('shipments'),
      returns: can('returns'),
      finance: can('finance'),
      creditCards: can('credit_cards'),
      householdFinance: can('household_finance'),
      tasks: can('tasks'),
    }

    const [
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
      can('orders')
        ? Order.query()
            .where('userId', user.id)
            .if(can('customers'), (q) => q.preload('customer', (r) => r.where('userId', user.id)))
            .if(can('integrations'), (q) =>
              q.preload('sellerAccount', (r) => r.where('userId', user.id))
            )
            .preload('orderPrices', (q) => q.where('userId', user.id))
            .preload('lineItems', (lq) =>
              lq.where('userId', user.id).preload('linePrices', (q) => q.where('userId', user.id))
            )
            .if(can('shipments'), (q) => q.preload('shipments', (r) => r.where('userId', user.id)))
            .orderBy('orderedAt', 'desc')
            .limit(50)
        : [],
      can('customers')
        ? Customer.query()
            .where('userId', user.id)
            .preload('addresses', (q) => q.where('userId', user.id))
            .preload('riskSignals', (q) => q.where('userId', user.id))
            .orderBy('createdAt', 'desc')
            .limit(50)
        : [],
      can('customers')
        ? CustomerRiskSignal.query()
            .where('userId', user.id)
            .preload('customer', (q) => q.where('userId', user.id))
            .orderBy('createdAt', 'desc')
            .limit(30)
        : [],
      can('catalog')
        ? Product.query()
            .where('userId', user.id)
            .preload('brand', (q) => q.where('userId', user.id))
            .preload('category', (q) => q.where('userId', user.id))
            .preload('priceRecords', (q) => q.where('userId', user.id))
            .preload('variants', (q) =>
              q
                .where('userId', user.id)
                .preload('variantAttributes', (r) => r.where('userId', user.id))
                .preload('priceRecords', (r) => r.where('userId', user.id))
                .preload('listings', (r) => r.where('userId', user.id))
            )
            .orderBy('createdAt', 'desc')
            .limit(50)
        : [],
      can('catalog') ? Brand.query().where('userId', user.id).orderBy('name', 'asc') : [],
      can('catalog') ? ProductCategory.query().where('userId', user.id).orderBy('name', 'asc') : [],
      SalesChannel.query().where('isActive', true).orderBy('name', 'asc'),
      can('integrations')
        ? SellerAccount.query()
            .where('userId', user.id)
            .preload('salesChannel')
            .orderBy('createdAt', 'desc')
        : [],
      can('integrations')
        ? SyncJob.query()
            .where('userId', user.id)
            .preload('errors', (q) => q.where('userId', user.id))
            .orderBy('createdAt', 'desc')
            .limit(20)
        : [],
      can('shipments')
        ? Shipment.query()
            .where('userId', user.id)
            .if(can('orders'), (q) => q.preload('order', (r) => r.where('userId', user.id)))
            .preload('shipmentItems', (q) =>
              q
                .where('userId', user.id)
                .if(can('orders'), (r) =>
                  r.preload('orderLineItem', (line) => line.where('userId', user.id))
                )
            )
            .orderBy('createdAt', 'desc')
            .limit(50)
        : [],
      can('shipments')
        ? ShippingInvoice.query()
            .where('userId', user.id)
            .preload('lines', (q) => q.where('userId', user.id))
            .orderBy('invoiceDate', 'desc')
            .limit(30)
        : [],
      can('returns')
        ? ReturnRequest.query()
            .where('userId', user.id)
            .if(can('orders'), (q) =>
              q
                .preload('order', (r) => r.where('userId', user.id))
                .preload('orderLineItem', (r) => r.where('userId', user.id))
            )
            .if(can('customers'), (q) => q.preload('customer', (r) => r.where('userId', user.id)))
            .orderBy('requestedAt', 'desc')
            .limit(40)
        : [],
      can('returns')
        ? RefundTransaction.query()
            .where('userId', user.id)
            .if(can('orders'), (q) => q.preload('order', (r) => r.where('userId', user.id)))
            .orderBy('createdAt', 'desc')
            .limit(40)
        : [],
      can('orders')
        ? MarketplaceClaim.query()
            .where('userId', user.id)
            .preload('order', (q) => q.where('userId', user.id))
            .orderBy('createdAt', 'desc')
            .limit(30)
        : [],
      can('finance')
        ? FinancialAccount.query()
            .where('userId', user.id)
            .if(!can('household_finance'), (q) => q.where('dataClassification', 'business'))
            .orderBy('accountName', 'asc')
        : [],
      can('credit_cards')
        ? CreditCard.query()
            .where('userId', user.id)
            .if(!can('household_finance'), (q) => q.where('dataClassification', 'business'))
            .if(can('integrations'), (q) =>
              q.preload('sellerAccountLinks', (links) =>
                links
                  .where('userId', user.id)
                  .preload('sellerAccount', (account) => account.where('userId', user.id))
              )
            )
            .orderBy('createdAt', 'desc')
        : [],
      can('finance')
        ? FinanceCategory.query()
            .where('userId', user.id)
            .if(!can('household_finance'), (q) => q.where('dataClassification', 'business'))
            .orderBy('name', 'asc')
        : [],
      can('finance')
        ? FinancialTransaction.query()
            .where('userId', user.id)
            .if(!can('household_finance'), (q) => q.where('dataClassification', 'business'))
            .preload('financialAccount', (q) =>
              q
                .where('userId', user.id)
                .if(!can('household_finance'), (r) => r.where('dataClassification', 'business'))
            )
            .preload('category', (q) =>
              q
                .where('userId', user.id)
                .if(!can('household_finance'), (r) => r.where('dataClassification', 'business'))
            )
            .if(can('integrations'), (q) =>
              q.preload('sellerAccount', (r) => r.where('userId', user.id))
            )
            .orderBy('transactionDate', 'desc')
            .limit(60)
        : [],
      can('tasks')
        ? TasksReminder.query().where('userId', user.id).orderBy('dueAt', 'asc').limit(30)
        : [],
      AuditLog.query()
        .where((q) => q.where('userId', user.id).orWhere('actorUserId', user.id))
        .preload('user', (q) => q.if(!user.isSuperAdmin, (r) => r.where('id', user.id)))
        .preload('actor', (q) => q.if(!user.isSuperAdmin, (r) => r.where('id', user.id)))
        .orderBy('createdAt', 'desc')
        .limit(40),
      user.isSuperAdmin
        ? User.query().preload('roles').preload('moduleEntitlements').orderBy('createdAt', 'desc')
        : User.query().where('id', user.id).preload('roles').preload('moduleEntitlements'),
      user.isSuperAdmin ? Role.query().preload('permissions').orderBy('name', 'asc') : [],
      user.isSuperAdmin ? Permission.query().orderBy('slug', 'asc') : [],
      ModuleEntitlement.query().where('userId', user.id).orderBy('moduleKey', 'asc'),
      SavedView.query()
        .where('userId', user.id)
        .whereIn(
          'moduleKey',
          Object.entries({
            orders: 'orders',
            shipments: 'shipments',
            returns: 'returns',
            customers: 'customers',
            products: 'catalog',
            seller_accounts: 'integrations',
            finance: 'finance',
            tasks: 'tasks',
            claims: 'orders',
            import: 'orders',
          })
            .filter(([, resource]) => can(resource))
            .map(([key]) => key)
        )
        .orderBy('createdAt', 'desc'),
    ])

    // Monetary aggregates are limited to a single reporting currency; never sum mixed currencies.
    const usdOrders = orders.filter((o) => o.reportingCurrencyCode === 'USD')
    const grossSales = usdOrders.reduce(
      (sum, o) => sum + Number(o.reportingTotalAmount || o.totalAmount || 0),
      0
    )
    const totalRefunded = usdOrders.reduce(
      (sum, o) => sum + Number(o.refundedAmount || 0) * Number(o.exchangeRate || 1),
      0
    )
    const totalMarketplaceFees = usdOrders.reduce(
      (sum, o) =>
        sum +
        (Number(o.marketplaceFeesAmount || 0) + Number(o.paymentProcessingFeesAmount || 0)) *
          Number(o.exchangeRate || 1),
      0
    )
    const totalCogs = usdOrders.reduce(
      (sum, o) => sum + Number(o.cogsAmount || 0) * Number(o.exchangeRate || 1),
      0
    )
    const totalShippingCost = usdOrders.reduce(
      (sum, o) => sum + Number(o.shippingCostAmount || 0) * Number(o.exchangeRate || 1),
      0
    )
    const netProfit = usdOrders.reduce(
      (sum, o) => sum + Number(o.netProfitAmount || 0) * Number(o.exchangeRate || 1),
      0
    )

    const businessExpenses = financialTransactions
      .filter(
        (t) =>
          t.transactionType === 'expense' &&
          t.dataClassification === 'business' &&
          t.status !== 'voided' &&
          t.reportingCurrencyCode === 'USD'
      )
      .reduce((sum, t) => sum + Number(t.reportingAmount || 0), 0)

    const householdExpenses = financialTransactions
      .filter(
        (t) =>
          t.dataClassification === 'household_personal' &&
          t.status !== 'voided' &&
          t.transactionType === 'expense' &&
          t.reportingCurrencyCode === 'USD'
      )
      .reduce((sum, t) => sum + Number(t.reportingAmount || 0), 0)

    const invoiceVarianceVal = shippingInvoices
      .filter((inv) => inv.currencyCode === 'USD')
      .reduce((sum, inv) => sum + Number(inv.varianceAmount || 0), 0)

    const repCur = 'USD'

    const kpis = {
      totalOrders: orders.length,
      grossSales: grossSales.toFixed(2),
      grossSalesMoney: normalizePriceMoney(grossSales, repCur),
      netSales: (grossSales - totalRefunded).toFixed(2),
      netSalesMoney: normalizePriceMoney(grossSales - totalRefunded, repCur),
      totalRefunded: totalRefunded.toFixed(2),
      totalRefundedMoney: normalizePriceMoney(totalRefunded, repCur),
      totalMarketplaceFees: totalMarketplaceFees.toFixed(2),
      totalMarketplaceFeesMoney: normalizePriceMoney(totalMarketplaceFees, repCur),
      totalCogs: totalCogs.toFixed(2),
      totalCogsMoney: normalizePriceMoney(totalCogs, repCur),
      totalShippingCost: totalShippingCost.toFixed(2),
      totalShippingCostMoney: normalizePriceMoney(totalShippingCost, repCur),
      orderNetProfit: netProfit.toFixed(2),
      orderNetProfitMoney: normalizePriceMoney(netProfit, repCur),
      businessOperatingExpenses: businessExpenses.toFixed(2),
      businessOperatingExpensesMoney: normalizePriceMoney(businessExpenses, repCur),
      householdExpenses: householdExpenses.toFixed(2),
      householdExpensesMoney: normalizePriceMoney(householdExpenses, repCur),
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
      invoiceVarianceTotal: invoiceVarianceVal.toFixed(2),
      invoiceVarianceTotalMoney: normalizePriceMoney(invoiceVarianceVal, repCur),
    }

    return inertia.render('dashboard', {
      kpis,
      effectiveRbac,
      access,
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
      auditLogs: auditLogs.map((al) => al.serializeForViewer(user.isSuperAdmin)),
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
