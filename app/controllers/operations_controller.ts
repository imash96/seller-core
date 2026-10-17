import { DateTime } from 'luxon'
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
import ProductVariant from '#models/product_variant'
import Order from '#models/order'
import Shipment from '#models/shipment'
import ShippingInvoice from '#models/shipping_invoice'
import ReturnRequest from '#models/return_request'
import RefundTransaction from '#models/refund_transaction'
import MarketplaceClaim from '#models/marketplace_claim'
import FinancialAccount from '#models/financial_account'
import CreditCard from '#models/credit_card'
import CreditCardSellerAccount from '#models/credit_card_seller_account'
import FinanceCategory from '#models/finance_category'
import FinancialTransaction from '#models/financial_transaction'
import TasksReminder from '#models/tasks_reminder'
import AuditLog from '#models/audit_log'
import { OrderService } from '../services/order_service.js'
import { CatalogService } from '../services/catalog_service.js'
import { FulfillmentAndReturnsService } from '../services/fulfillment_and_returns_service.js'
import { RbacService } from '../services/rbac_service.js'
import {
  createOrderValidator,
  bulkOrderImportValidator,
  createCustomerValidator,
  createProductValidator,
  createSellerAccountValidator,
  createShipmentValidator,
  createShippingInvoiceValidator,
  createReturnRequestValidator,
  createRefundValidator,
  createCreditCardValidator,
  createFinancialTransactionValidator,
} from '#validators/operations'
import { createUserValidator } from '#validators/user'
import {
  OrderStatus,
  ShipmentStatus,
  RiskReviewStatus,
  SellerAccountStatus,
  HealthStatus,
  CreditCardStatus,
  FinancialTransactionStatus,
  TaskStatus,
  UserStatus,
} from '../enums/index.js'

export default class OperationsController {
  /**
   * Renders the unified multi-module Operations & Business Management SaaS workspace
   * strictly isolated by `user_id = auth.user.id`.
   */
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
        .orderBy('createdAt', 'desc')
        .limit(40),
      user.isSuperAdmin
        ? User.query().preload('roles').preload('moduleEntitlements').orderBy('createdAt', 'desc')
        : User.query().where('id', user.id).preload('roles').preload('moduleEntitlements'),
      Role.query().preload('permissions').orderBy('name', 'asc'),
      Permission.query().orderBy('slug', 'asc'),
      ModuleEntitlement.query().where('userId', user.id).orderBy('moduleKey', 'asc'),
    ])

    // Compute Dashboard & Financial Metrics in Reporting Currency (USD)
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
    })
  }

  async storeOrder({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createOrderValidator)

    try {
      const order = await OrderService.createOrder({
        userId: user.id,
        actorUserId: user.id,
        sellerAccountId: payload.sellerAccountId ?? null,
        orderNumber: payload.orderNumber,
        externalOrderId: payload.externalOrderId ?? null,
        marketplaceCode: payload.marketplaceCode || 'direct',
        currencyCode: payload.currencyCode || 'USD',
        reportingCurrencyCode: user.defaultCurrency || 'USD',
        exchangeRate: payload.exchangeRate ?? 1.0,
        shippingCostAmount: payload.shippingCostAmount ?? 0,
        customer: {
          fullName: payload.customerFullName,
          email: payload.customerEmail ?? null,
          phone: payload.customerPhone ?? null,
        },
        shippingAddress: payload.shippingLine1
          ? {
              recipientName: payload.customerFullName,
              line1: payload.shippingLine1,
              city: payload.shippingCity || 'Seattle',
              postalCode: payload.shippingPostalCode || '98101',
              countryCode: payload.shippingCountryCode || 'US',
            }
          : undefined,
        lines: [
          {
            sku: payload.sku,
            title: payload.itemTitle,
            quantityOrdered: payload.quantityOrdered,
            unitPrice: payload.unitPrice,
            unitCostAmount: payload.unitCostAmount,
            taxAmount: payload.taxAmount ?? 0,
            discountAmount: payload.discountAmount ?? 0,
            shippingAmount: payload.shippingChargedAmount ?? 0,
          },
        ],
      })
      session.flash('success', `Order ${order.orderNumber} created with P&L calculated.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create order')
    }
    return response.redirect().back()
  }

  async updateOrderStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const status = request.input('status')
    const order = await Order.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const prevStatus = order.status
    order.status = status
    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = DateTime.now()
      order.deliveryNotificationSentAt = DateTime.now()
    } else if (status === OrderStatus.CANCELLED) {
      order.cancelledAt = DateTime.now()
    }
    await order.save()

    await RbacService.recordAudit({
      actorUserId: user.id,
      userId: user.id,
      action: 'order.status_updated',
      entityType: 'orders',
      entityId: order.id,
      requestId: request.id(),
      beforeState: { status: prevStatus },
      afterState: { status: order.status },
    })

    session.flash(
      'success',
      status === OrderStatus.DELIVERED
        ? `Order ${order.orderNumber} marked delivered and customer delivery notification queued.`
        : `Order ${order.orderNumber} status updated to ${status}.`
    )
    return response.redirect().back()
  }

  async deleteOrder({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const allowed = await RbacService.hasPermission(user, 'orders.delete', 'orders')
    if (!allowed) {
      session.flash('error', 'RBAC Denied: You do not have permission orders.delete')
      return response.redirect().back()
    }

    const order = await Order.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()
    const orderNum = order.orderNumber
    await order.delete()

    await RbacService.recordAudit({
      actorUserId: user.id,
      userId: user.id,
      action: 'order.deleted',
      entityType: 'orders',
      entityId: params.id,
      requestId: request.id(),
      beforeState: { orderNumber: orderNum },
    })

    session.flash('success', `Order ${orderNum} deleted.`)
    return response.redirect().back()
  }

  async importBulkOrders({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(bulkOrderImportValidator)

    try {
      const parsedOrders = JSON.parse(payload.ordersJson)
      if (!Array.isArray(parsedOrders)) {
        throw new Error('ordersJson must be a JSON array of order objects.')
      }

      const result = await OrderService.importBulkOrders({
        userId: user.id,
        actorUserId: user.id,
        sellerAccountId: payload.sellerAccountId ?? null,
        idempotencyKey: payload.idempotencyKey,
        orders: parsedOrders,
      })

      session.flash(
        'success',
        `Bulk Import Batch (${result.job.idempotencyKey}): ${result.job.succeededRecords} created, ${result.job.skippedDuplicates} duplicates skipped, ${result.job.failedRecords} errors.`
      )
    } catch (err: any) {
      session.flash('error', `Bulk import error: ${err.message}`)
    }
    return response.redirect().back()
  }

  async storeCustomer({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createCustomerValidator)

    const customer = await Customer.create({
      userId: user.id,
      fullName: payload.fullName,
      email: payload.email ?? null,
      proxyEmail: payload.proxyEmail ?? null,
      phone: payload.phone ?? null,
      preferredCurrency: payload.preferredCurrency || 'USD',
      riskLevel: payload.riskLevel || 'low',
      ordersCount: 0,
      totalSpent: '0.00',
      isRepeatCustomer: false,
      riskScore: 0,
      metadata: {},
    })

    if (payload.line1 && payload.city && payload.postalCode) {
      await customer.related('addresses').create({
        userId: user.id,
        addressType: 'both',
        recipientName: payload.fullName,
        line1: payload.line1,
        city: payload.city,
        stateProvince: payload.stateProvince ?? null,
        postalCode: payload.postalCode,
        countryCode: payload.countryCode || 'US',
        phone: payload.phone ?? null,
        isDefault: true,
        isVerified: true,
      })
    }

    session.flash('success', `Customer ${customer.fullName} saved.`)
    return response.redirect().back()
  }

  async reviewRiskSignal({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const signal = await CustomerRiskSignal.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const reviewStatus = request.input('reviewStatus', RiskReviewStatus.RESOLVED)
    const reviewNotes = request.input('reviewNotes', 'Reviewed by operations team.')

    signal.reviewStatus = reviewStatus
    signal.reviewNotes = reviewNotes
    signal.reviewedByUserId = user.id
    signal.reviewedAt = DateTime.now()
    await signal.save()

    session.flash('success', `Risk signal marked as ${reviewStatus}.`)
    return response.redirect().back()
  }

  async storeProduct({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createProductValidator)

    try {
      const product = await CatalogService.createProduct({
        userId: user.id,
        brandId: payload.brandId ?? null,
        categoryId: payload.categoryId ?? null,
        title: payload.title,
        description: payload.description ?? null,
        hasVariants: Boolean(payload.hasVariants),
        variationDimensions: payload.variationDimensions ?? [],
        variants: [
          {
            sku: payload.sku,
            title: payload.title,
            asin: payload.asin ?? null,
            currencyCode: payload.currencyCode || 'USD',
            retailPrice: payload.retailPrice,
            costPrice: payload.costPrice ?? 0,
            manufacturingCost: payload.manufacturingCost ?? 0,
            packagingCost: payload.packagingCost ?? 0,
            stockOnHand: payload.stockOnHand ?? 0,
          },
        ],
      })
      session.flash('success', `Product "${product.title}" (SKU: ${payload.sku}) created.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create product')
    }
    return response.redirect().back()
  }

  async updateVariantStock({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const variant = await ProductVariant.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const stockOnHand = Number(request.input('stockOnHand', variant.stockOnHand))
    const retailPrice = Number(request.input('retailPrice', variant.retailPrice))
    if (stockOnHand < 0 || retailPrice < 0) {
      session.flash('error', 'Stock and price must be non-negative.')
      return response.redirect().back()
    }

    variant.stockOnHand = stockOnHand
    variant.retailPrice = retailPrice.toFixed(2)
    await variant.save()

    session.flash(
      'success',
      `Updated SKU ${variant.sku}: Stock=${stockOnHand}, Price=${variant.retailPrice}`
    )
    return response.redirect().back()
  }

  async storeSellerAccount({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createSellerAccountValidator)

    try {
      const account = new SellerAccount()
      account.userId = user.id
      account.salesChannelId = payload.salesChannelId
      account.accountName = payload.accountName
      account.externalSellerId = payload.externalSellerId
      account.marketplaceRegion = payload.marketplaceRegion.toUpperCase()
      account.defaultCurrency = payload.defaultCurrency.toUpperCase()
      account.status = SellerAccountStatus.ACTIVE
      account.healthStatus = HealthStatus.HEALTHY
      account.rateLimitRpm = payload.rateLimitRpm ?? 60
      account.setPlainCredentials({
        apiKey: payload.apiKey ?? 'encrypted-key',
        apiSecret: payload.apiSecret ?? 'encrypted-secret',
        rotatedAt: DateTime.now().toISO(),
      })
      account.lastCredentialRotatedAt = DateTime.now()
      account.lastSyncedAt = DateTime.now()
      await account.save()

      session.flash(
        'success',
        `Seller Account "${account.accountName}" connected with AES-256-GCM encrypted credentials.`
      )
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to connect seller account')
    }
    return response.redirect().back()
  }

  async storeShipment({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createShipmentValidator)

    try {
      const shipment = await FulfillmentAndReturnsService.createShipment({
        userId: user.id,
        orderId: payload.orderId,
        shipmentNumber: payload.shipmentNumber,
        carrierCode: payload.carrierCode,
        carrierName: payload.carrierName,
        serviceLevel: payload.serviceLevel,
        trackingNumber: payload.trackingNumber,
        lengthCm: payload.lengthCm,
        widthCm: payload.widthCm,
        heightCm: payload.heightCm,
        deadWeightGrams: payload.deadWeightGrams,
        estimatedShippingCost: payload.estimatedShippingCost,
        status: payload.status || ShipmentStatus.IN_TRANSIT,
        items: [
          {
            orderLineItemId: payload.orderLineItemId,
            quantityShipped: payload.quantityShipped,
          },
        ],
      })
      session.flash('success', `Shipment ${shipment.shipmentNumber} created and order updated.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create shipment')
    }
    return response.redirect().back()
  }

  async storeShippingInvoice({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createShippingInvoiceValidator)

    try {
      const invoice = await FulfillmentAndReturnsService.createShippingInvoice({
        userId: user.id,
        carrierCode: payload.carrierCode,
        carrierName: payload.carrierName,
        invoiceNumber: payload.invoiceNumber,
        currencyCode: payload.currencyCode || 'USD',
        invoiceDate: payload.invoiceDate,
        dueDate: payload.dueDate,
        lines: [
          {
            shipmentId: payload.shipmentId ?? null,
            chargeType: payload.chargeType,
            expectedAmount: payload.expectedAmount ?? payload.billedAmount,
            billedAmount: payload.billedAmount,
          },
        ],
      })
      session.flash(
        'success',
        `Carrier Invoice ${invoice.invoiceNumber} reconciled (${invoice.reconciliationStatus}, variance: ${invoice.varianceAmount}).`
      )
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create shipping invoice')
    }
    return response.redirect().back()
  }

  async storeReturnRequest({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createReturnRequestValidator)

    try {
      const rma = await FulfillmentAndReturnsService.createReturnRequest({
        userId: user.id,
        orderId: payload.orderId,
        orderLineItemId: payload.orderLineItemId,
        rmaNumber: payload.rmaNumber,
        returnReason: payload.returnReason,
        resolutionType: payload.resolutionType,
        quantityRequested: payload.quantityRequested,
        restockingFeeAmount: payload.restockingFeeAmount ?? 0,
        customerComments: payload.customerComments,
      })
      session.flash('success', `Return Request ${rma.rmaNumber} authorized.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to create return request')
    }
    return response.redirect().back()
  }

  async storeRefund({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createRefundValidator)

    try {
      const refund = await FulfillmentAndReturnsService.processRefund({
        userId: user.id,
        actorUserId: user.id,
        orderId: payload.orderId,
        returnRequestId: payload.returnRequestId ?? null,
        refundNumber: payload.refundNumber,
        itemsRefundAmount: payload.itemsRefundAmount,
        shippingRefundAmount: payload.shippingRefundAmount ?? 0,
        taxRefundAmount: payload.taxRefundAmount ?? 0,
        restockingFeeDeducted: payload.restockingFeeDeducted ?? 0,
        reason: payload.reason,
      })
      session.flash(
        'success',
        `Refund ${refund.refundNumber} (${refund.totalRefundAmount} ${refund.currencyCode}) processed and posted to ledger.`
      )
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to process refund')
    }
    return response.redirect().back()
  }

  async storeCreditCard({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createCreditCardValidator)

    const card = await CreditCard.create({
      userId: user.id,
      cardLabel: payload.cardLabel,
      brandName: payload.brandName,
      issuerBank: payload.issuerBank ?? null,
      cardholderName: payload.cardholderName.toUpperCase(),
      last4Digits: payload.last4Digits,
      expMonth: payload.expMonth,
      expYear: payload.expYear,
      vaultTokenReference: `tok_vault_${payload.last4Digits}_${Date.now()}`,
      currencyCode: payload.currencyCode || 'USD',
      creditLimit: (payload.creditLimit ?? 25000).toFixed(2),
      currentBalance: (payload.currentBalance ?? 0).toFixed(2),
      statementBalance: (payload.currentBalance ?? 0).toFixed(2),
      minimumPaymentDue: (payload.minimumPaymentDue ?? 0).toFixed(2),
      nextPaymentDueDate: payload.nextPaymentDueDate
        ? DateTime.fromISO(payload.nextPaymentDueDate)
        : DateTime.now().plus({ days: 15 }),
      reminderDaysBefore: 5,
      autoPayEnabled: false,
      dataClassification: payload.dataClassification || 'business',
      status: CreditCardStatus.ACTIVE,
    })

    if (payload.sellerAccountId) {
      await CreditCardSellerAccount.create({
        userId: user.id,
        creditCardId: card.id,
        sellerAccountId: payload.sellerAccountId,
        usagePurpose: payload.usagePurpose || 'primary_billing',
        isPrimary: true,
      })
    }

    session.flash('success', `Card "${card.cardLabel}" (•••• ${card.last4Digits}) registered.`)
    return response.redirect().back()
  }

  async storeFinancialTransaction({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createFinancialTransactionValidator)

    const exchangeRate = Number(payload.exchangeRate ?? 1.0)
    const originalAmount = Number(payload.originalAmount)
    const reportingAmount = Math.round(originalAmount * exchangeRate * 100) / 100

    const tx = await FinancialTransaction.create({
      userId: user.id,
      financialAccountId: payload.financialAccountId ?? null,
      creditCardId: payload.creditCardId ?? null,
      sellerAccountId: payload.sellerAccountId ?? null,
      orderId: payload.orderId ?? null,
      referenceNumber: payload.referenceNumber,
      transactionType: payload.transactionType,
      dataClassification: payload.dataClassification || 'business',
      status: FinancialTransactionStatus.POSTED,
      description: payload.description,
      vendorOrPayer: payload.vendorOrPayer ?? null,
      originalCurrencyCode: payload.originalCurrencyCode || 'USD',
      originalAmount: originalAmount.toFixed(2),
      exchangeRate: exchangeRate.toFixed(8),
      reportingCurrencyCode: payload.reportingCurrencyCode || 'USD',
      reportingAmount: reportingAmount.toFixed(2),
      taxAmount: Number(payload.taxAmount ?? 0).toFixed(2),
      transactionDate: DateTime.fromISO(payload.transactionDate),
      conversionDate: DateTime.fromISO(payload.transactionDate),
      metadata: {},
    })

    session.flash(
      'success',
      `Ledger entry ${tx.referenceNumber} (${tx.originalAmount} ${tx.originalCurrencyCode} -> ${tx.reportingAmount} ${tx.reportingCurrencyCode}) posted.`
    )
    return response.redirect().back()
  }

  async completeTask({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await TasksReminder.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    task.status = TaskStatus.COMPLETED
    task.completedAt = DateTime.now()
    await task.save()

    session.flash('success', `Task "${task.title}" marked completed.`)
    return response.redirect().back()
  }

  async storeUser({ auth, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    const payload = await request.validateUsing(createUserValidator)

    try {
      const created = await RbacService.createUserBySuperAdmin(
        actor,
        {
          email: payload.email,
          fullName: payload.fullName,
          password: payload.password,
          phone: payload.phone ?? null,
          defaultCurrency: payload.defaultCurrency || 'USD',
          timezone: payload.timezone || 'UTC',
          isSuperAdmin: payload.isSuperAdmin ?? false,
          roleSlugs: payload.roleSlugs ?? ['operations_manager'],
          enabledModules: payload.enabledModules,
        },
        {
          requestId: request.id(),
          ipAddress: request.ip(),
          userAgent: request.header('user-agent') ?? undefined,
        }
      )
      session.flash('success', `User ${created.email} provisioned by Super Administrator.`)
    } catch (err: any) {
      session.flash(
        'error',
        err.message || 'Forbidden: Only Super Administrators can create users.'
      )
    }
    return response.redirect().back()
  }

  async toggleUserStatus({ auth, params, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    if (!actor.isSuperAdmin) {
      session.flash('error', 'Forbidden: Only Super Administrators can change user account status.')
      return response.redirect().back()
    }

    const targetStatus = request.input('status', UserStatus.SUSPENDED)
    try {
      if (targetStatus === UserStatus.SUSPENDED) {
        await RbacService.suspendUser(actor, params.id, 'Suspended via Admin Console', {
          requestId: request.id(),
          ipAddress: request.ip(),
        })
        session.flash('success', 'User suspended and all active sessions revoked.')
      } else {
        const target = await User.findOrFail(params.id)
        const prev = target.status
        target.status = targetStatus
        target.failedLoginAttempts = 0
        target.lockedUntil = null
        await target.save()

        await RbacService.recordAudit({
          actorUserId: actor.id,
          userId: target.id,
          action: 'user.status_changed',
          entityType: 'users',
          entityId: target.id,
          requestId: request.id(),
          beforeState: { status: prev },
          afterState: { status: targetStatus },
        })
        session.flash('success', `User ${target.email} status updated to ${targetStatus}.`)
      }
    } catch (err: any) {
      session.flash('error', err.message)
    }
    return response.redirect().back()
  }

  async toggleModuleEntitlement({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const entitlement = await ModuleEntitlement.query()
      .where('id', params.id)
      .andWhere((q) => {
        if (!user.isSuperAdmin) {
          q.where('userId', user.id)
        }
      })
      .firstOrFail()

    entitlement.isEnabled = !entitlement.isEnabled
    entitlement.updatedByUserId = user.id
    await entitlement.save()

    session.flash(
      'success',
      `Module "${entitlement.moduleKey}" is now ${entitlement.isEnabled ? 'ENABLED' : 'DISABLED'}.`
    )
    return response.redirect().back()
  }
}
