import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import UserRole from '#models/user_role'
import ModuleEntitlement from '#models/module_entitlement'
import SalesChannel from '#models/sales_channel'
import SellerAccount from '#models/seller_account'
import SyncJob from '#models/sync_job'
import Customer from '#models/customer'
import CustomerAddress from '#models/customer_address'
import CustomerRiskSignal from '#models/customer_risk_signal'
import Brand from '#models/brand'
import ProductCategory from '#models/product_category'
import Product from '#models/product'
import ProductVariant from '#models/product_variant'
import ChannelListing from '#models/channel_listing'
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
import SavedView from '#models/saved_view'
import AuditLog from '#models/audit_log'
import { OrderService } from '../services/order_service.js'
import { CatalogService } from '../services/catalog_service.js'
import { FulfillmentAndReturnsService } from '../services/fulfillment_and_returns_service.js'
import { RbacService } from '../services/rbac_service.js'
import { generateEntityId } from '../utils/generate_entity_id.js'
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
  updateBrandValidator,
  updateCategoryValidator,
  updateProductValidator,
  updateCustomerValidator,
  updateSellerAccountValidator,
  updateFinancialAccountValidator,
  updateCreditCardValidator,
  createTaskValidator,
  updateTaskValidator,
  createVariantValidator,
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
  TaskType,
  TaskPriority,
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
      savedViews: savedViews.map((sv) => sv.serialize()),
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

  async deleteOrder({ auth, bouncer, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    // Bouncer policy check (abilities-backed): denies unless the caller owns the order and has permission
    if (await bouncer.denies('deleteOrders')) {
      session.flash('error', 'Bouncer: not authorized to delete orders.')
      return response.redirect().back()
    }
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
      // Coerce string inputs from SmartForm (hasVariants is "true"/"false" string, variationDimensions is "size,color")
      const rawHasVariants = (payload as any).hasVariants
      const hasVariants =
        typeof rawHasVariants === 'string' ? rawHasVariants === 'true' : Boolean(rawHasVariants)
      const rawVD = (payload as any).variationDimensions
      const variationDimensions: string[] =
        typeof rawVD === 'string'
          ? rawVD
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : Array.isArray(rawVD)
            ? rawVD
            : []
      const product = await CatalogService.createProduct({
        userId: user.id,
        brandId: payload.brandId ?? null,
        categoryId: payload.categoryId ?? null,
        title: payload.title,
        description: payload.description ?? null,
        skuPrefix: (payload as any).skuPrefix ?? payload.sku,
        hasVariants,
        variationDimensions,
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

  async storeUser({ auth, bouncer, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    await bouncer.with('UserPolicy').authorize('create')
    const payload = await request.validateUsing(createUserValidator)

    try {
      const roleSlugs =
        (payload as any).roleSlugs ??
        ((payload as any).roleSlug ? [(payload as any).roleSlug] : ['operations_manager'])
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
          roleSlugs,
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

  async toggleUserStatus({ auth, bouncer, params, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    await bouncer.authorize('manageUsers')
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

  async deleteUser({ auth, bouncer, params, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    await bouncer.authorize('manageUsers')
    if (!actor.isSuperAdmin) {
      session.flash('error', 'Forbidden: Only Super Administrators can delete users.')
      return response.redirect().back()
    }
    if (params.id === actor.id) {
      session.flash('error', 'You cannot delete your own account. Deactivate it instead.')
      return response.redirect().back()
    }
    const target = await User.findOrFail(params.id)
    // Check if target owns data — if so, suspend instead of hard delete
    const [orderCount, txCount] = await Promise.all([
      Order.query().where('userId', target.id).count('* as total'),
      FinancialTransaction.query().where('userId', target.id).count('* as total'),
    ])
    const hasOrders = Number((orderCount[0] as any).$extras.total) > 0
    const hasTx = Number((txCount[0] as any).$extras.total) > 0
    if (hasOrders || hasTx) {
      target.status = UserStatus.SUSPENDED
      await target.save()
      await RbacService.recordAudit({
        actorUserId: actor.id,
        userId: target.id,
        action: 'user.suspended_instead_of_delete',
        entityType: 'users',
        entityId: target.id,
        requestId: response as any,
        beforeState: { hasOrders, hasTx },
        afterState: { status: UserStatus.SUSPENDED },
      })
      session.flash(
        'success',
        `User "${target.email}" owns orders/transactions and was suspended instead of deleted to preserve data integrity.`
      )
      return response.redirect().back()
    }
    await target.delete()
    await RbacService.recordAudit({
      actorUserId: actor.id,
      userId: target.id,
      action: 'user.deleted',
      entityType: 'users',
      entityId: params.id,
      requestId: response as any,
      beforeState: { email: target.email },
    })
    session.flash('success', `User "${target.email}" deleted.`)
    return response.redirect().back()
  }

  async deleteSavedView({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const view = await SavedView.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()
    await view.delete()
    session.flash('success', `Saved view "${view.name}" removed.`)
    return response.redirect().back()
  }

  async toggleModuleEntitlement({ auth, bouncer, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    // Bouncer gate — super admin can toggle anyone's entitlement; others only own
    if (!user.isSuperAdmin && (await bouncer.denies('manageEntitlements'))) {
      session.flash('error', 'Bouncer: not authorized to manage entitlements.')
      return response.redirect().back()
    }
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

  /**
   * Merges a duplicate customer record into a primary target customer without destructive data loss.
   */
  async mergeCustomers({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const sourceCustomerId = String(request.input('sourceCustomerId', '')).trim()
    const targetCustomerId = String(request.input('targetCustomerId', '')).trim()

    if (!sourceCustomerId || !targetCustomerId || sourceCustomerId === targetCustomerId) {
      session.flash('error', 'Select two distinct customers to merge.')
      return response.redirect().back()
    }

    const [source, target] = await Promise.all([
      Customer.query().where('userId', user.id).andWhere('id', sourceCustomerId).firstOrFail(),
      Customer.query().where('userId', user.id).andWhere('id', targetCustomerId).firstOrFail(),
    ])

    await db.transaction(async (trx) => {
      await Order.query({ client: trx })
        .where('userId', user.id)
        .andWhere('customerId', source.id)
        .update({ customerId: target.id })

      await CustomerAddress.query({ client: trx })
        .where('userId', user.id)
        .andWhere('customerId', source.id)
        .update({ customerId: target.id, isDefault: false })

      await CustomerRiskSignal.query({ client: trx })
        .where('userId', user.id)
        .andWhere('customerId', source.id)
        .update({ customerId: target.id })

      await ReturnRequest.query({ client: trx })
        .where('userId', user.id)
        .andWhere('customerId', source.id)
        .update({ customerId: target.id })

      target.useTransaction(trx)
      target.ordersCount = Number(target.ordersCount || 0) + Number(source.ordersCount || 0)
      target.totalSpent = (Number(target.totalSpent || 0) + Number(source.totalSpent || 0)).toFixed(
        2
      )
      target.isRepeatCustomer = target.ordersCount > 1
      await target.save()

      source.useTransaction(trx)
      source.mergedIntoCustomerId = target.id
      source.ordersCount = 0
      await source.save()
    })

    await RbacService.recordAudit({
      actorUserId: user.id,
      userId: user.id,
      action: 'customer.merged',
      entityType: 'customers',
      entityId: target.id,
      requestId: request.id(),
      beforeState: { sourceCustomerId: source.id, sourceName: source.fullName },
      afterState: { targetCustomerId: target.id, targetName: target.fullName },
    })

    session.flash(
      'success',
      `Merged duplicate customer "${source.fullName}" into "${target.fullName}" with zero data loss.`
    )
    return response.redirect().back()
  }

  async deleteCustomer({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const customer = await Customer.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const orderCount = await Order.query()
      .where('userId', user.id)
      .andWhere('customerId', customer.id)
      .count('* as total')
    if (Number(orderCount[0].$extras.total) > 0) {
      session.flash(
        'error',
        `Cannot delete customer "${customer.fullName}" because they have historical orders. Use Merge instead.`
      )
      return response.redirect().back()
    }

    await customer.delete()
    session.flash('success', `Customer "${customer.fullName}" removed.`)
    return response.redirect().back()
  }

  async storeBrand({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    if (!name) {
      session.flash('error', 'Brand name is required.')
      return response.redirect().back()
    }
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    await Brand.updateOrCreate(
      { userId: user.id, slug },
      {
        userId: user.id,
        name,
        slug,
        websiteUrl: request.input('websiteUrl') || null,
        isActive: true,
      }
    )
    session.flash('success', `Brand "${name}" saved.`)
    return response.redirect().back()
  }

  async storeCategory({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    if (!name) {
      session.flash('error', 'Category name is required.')
      return response.redirect().back()
    }
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    await ProductCategory.updateOrCreate(
      { userId: user.id, slug },
      {
        userId: user.id,
        name,
        slug,
        taxonomyPath: `Catalog > ${name}`,
        attributesSchema: [],
      }
    )
    session.flash('success', `Category "${name}" saved.`)
    return response.redirect().back()
  }

  async deleteProduct({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const product = await Product.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    product.status = 'archived'
    await product.save()
    session.flash('success', `Product "${product.title}" archived.`)
    return response.redirect().back()
  }

  async storeChannelListing({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const productVariantId = String(request.input('productVariantId', '')).trim()
    const sellerAccountId = String(request.input('sellerAccountId', '')).trim()
    const channelSku = String(request.input('channelSku', '')).trim()
    const externalListingId = String(request.input('externalListingId', '')).trim()
    const listedPrice = Number(request.input('listedPrice', 0))

    const variant = await ProductVariant.query()
      .where('userId', user.id)
      .andWhere('id', productVariantId)
      .firstOrFail()
    const sellerAccount = await SellerAccount.query()
      .where('userId', user.id)
      .andWhere('id', sellerAccountId)
      .firstOrFail()

    await ChannelListing.create({
      userId: user.id,
      sellerAccountId: sellerAccount.id,
      productId: variant.productId,
      productVariantId: variant.id,
      externalListingId: externalListingId || `LST-${Date.now()}`,
      externalSku: channelSku || variant.sku,
      currencyCode: sellerAccount.defaultCurrency || 'USD',
      listedPrice: (listedPrice > 0 ? listedPrice : Number(variant.retailPrice)).toFixed(2),
      allocatedQuantity: variant.stockOnHand,
      listingStatus: 'active',
      publicationStatus: 'published',
      syncStatus: 'synced',
      lastSyncedAt: DateTime.now(),
    })

    session.flash(
      'success',
      `Published SKU ${variant.sku} to ${sellerAccount.accountName} (${externalListingId || variant.sku}).`
    )
    return response.redirect().back()
  }

  async updateShipmentStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const shipment = await Shipment.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const status = String(request.input('status', ShipmentStatus.DELIVERED))
    shipment.status = status
    if (status === ShipmentStatus.DELIVERED) {
      shipment.deliveredAt = DateTime.now()
      shipment.deliveryNotificationSent = true
      const order = await Order.query()
        .where('userId', user.id)
        .andWhere('id', shipment.orderId)
        .first()
      if (order) {
        order.status = OrderStatus.DELIVERED
        order.deliveredAt = DateTime.now()
        order.deliveryNotificationSentAt = DateTime.now()
        await order.save()
      }
    }
    await shipment.save()

    session.flash('success', `Shipment ${shipment.shipmentNumber} updated to ${status}.`)
    return response.redirect().back()
  }

  async updateInvoiceStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const invoice = await ShippingInvoice.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const status = String(request.input('paymentStatus') ?? request.input('status') ?? 'paid')
    const reconciliationStatus = String(request.input('reconciliationStatus', 'resolved'))
    invoice.paymentStatus = status
    invoice.reconciliationStatus = reconciliationStatus
    if (status === 'paid') {
      invoice.paidAmount = invoice.totalAmount
      invoice.paidAt = DateTime.now()
    }
    await invoice.save()

    session.flash(
      'success',
      `Invoice ${invoice.invoiceNumber} marked ${status} (${reconciliationStatus}).`
    )
    return response.redirect().back()
  }

  async updateReturnStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const rma = await ReturnRequest.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const status = String(request.input('status', 'received'))
    const itemCondition = request.input('itemCondition')
    rma.status = status
    if (itemCondition) {
      rma.itemCondition = String(itemCondition)
    }
    if (status === 'received') {
      rma.receivedAt = DateTime.now()
      rma.quantityReceived = rma.quantityRequested
    } else if (status === 'closed') {
      rma.closedAt = DateTime.now()
    }
    await rma.save()

    session.flash('success', `RMA ${rma.rmaNumber} updated to ${status}.`)
    return response.redirect().back()
  }

  async storeMarketplaceClaim({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const orderId = String(request.input('orderId', '')).trim()
    const order = await Order.query().where('userId', user.id).andWhere('id', orderId).firstOrFail()

    const claimNumber = String(request.input('claimNumber', `CLM-${Date.now()}`)).trim()
    const claimType = String(request.input('claimType', 'a_to_z_guarantee'))
    const disputedAmount = Number(request.input('disputedAmount', order.totalAmount || 50))
    const sellerLiabilityAmount = Number(request.input('sellerLiabilityAmount', 0))
    const sellerAccountId =
      String(request.input('sellerAccountId', '')).trim() || order.sellerAccountId
    const respondByAt = request.input('respondByAt')
    const status = String(request.input('status', 'under_review'))

    const claim = await MarketplaceClaim.create({
      userId: user.id,
      orderId: order.id,
      sellerAccountId: sellerAccountId || null,
      claimNumber,
      externalClaimId: request.input('externalClaimId') || claimNumber,
      claimType,
      status,
      currencyCode: order.currencyCode,
      disputedAmount: disputedAmount.toFixed(2),
      sellerLiabilityAmount: sellerLiabilityAmount.toFixed(2),
      reason: request.input('reason') || 'Customer marketplace claim opened',
      respondByAt: respondByAt ? DateTime.fromISO(String(respondByAt)) : null,
    })

    session.flash('success', `Marketplace Claim ${claim.claimNumber} logged.`)
    return response.redirect().back()
  }

  async updateClaimStatus({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const claim = await MarketplaceClaim.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    const status = String(request.input('status', 'won'))
    claim.status = status
    const liability = request.input('sellerLiabilityAmount')
    if (liability !== undefined && liability !== null && liability !== '') {
      claim.sellerLiabilityAmount = Number(liability).toFixed(2)
    }
    const notes = request.input('resolutionNotes') ?? request.input('reason')
    if (notes) claim.reason = String(notes)
    const respondByAt = request.input('respondByAt')
    if (respondByAt) claim.respondByAt = DateTime.fromISO(String(respondByAt))
    if (['won', 'lost', 'closed'].includes(status)) {
      claim.resolvedAt = DateTime.now()
    }
    await claim.save()

    session.flash('success', `Claim ${claim.claimNumber} status updated to ${status}.`)
    return response.redirect().back()
  }

  async storeFinancialAccount({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const accountName = String(request.input('accountName', '')).trim()
    if (!accountName) {
      session.flash('error', 'Account name is required.')
      return response.redirect().back()
    }

    const account = await FinancialAccount.create({
      userId: user.id,
      accountName,
      accountType: String(request.input('accountType', 'bank_checking')),
      dataClassification: String(request.input('dataClassification', 'business')),
      institutionName: request.input('institutionName') || 'Mercury Bank',
      accountNumberLast4: request.input('accountNumberLast4') || '4401',
      currencyCode: String(request.input('currencyCode', 'USD')).toUpperCase(),
      currentBalance: Number(request.input('currentBalance', 0)).toFixed(2),
      isActive: true,
    })

    session.flash('success', `Financial account "${account.accountName}" created.`)
    return response.redirect().back()
  }

  async voidFinancialTransaction({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const tx = await FinancialTransaction.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    tx.status = 'voided'
    await tx.save()
    session.flash('success', `Ledger entry ${tx.referenceNumber} voided.`)
    return response.redirect().back()
  }

  async deleteCreditCard({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const card = await CreditCard.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    card.status = CreditCardStatus.CANCELLED
    await card.save()
    session.flash('success', `Card "${card.cardLabel}" (•••• ${card.last4Digits}) cancelled.`)
    return response.redirect().back()
  }

  async storeTask({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createTaskValidator)

    await TasksReminder.create({
      userId: user.id,
      taskType: payload.taskType ?? TaskType.GENERAL,
      priority: payload.priority ?? TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      title: payload.title,
      description: payload.description || null,
      dueAt: payload.dueAt ? DateTime.fromISO(payload.dueAt) : DateTime.now().plus({ days: 3 }),
    })

    session.flash('success', `Task "${payload.title}" added.`)
    return response.redirect().back()
  }

  async storeSavedView({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    const moduleKey = String(request.input('moduleKey', 'orders')).trim()
    if (!name) {
      session.flash('error', 'View name is required.')
      return response.redirect().back()
    }

    await SavedView.updateOrCreate(
      { userId: user.id, moduleKey, name },
      {
        userId: user.id,
        moduleKey,
        name,
        isDefault: Boolean(request.input('isDefault', false)),
        filters: { status: request.input('filterStatus', 'all') },
        sortConfig: { field: 'created_at', direction: 'desc' },
        columnsConfig: ['order_number', 'status', 'total_amount', 'net_profit_amount'],
      }
    )

    session.flash('success', `Saved View "${name}" created for module ${moduleKey}.`)
    return response.redirect().back()
  }

  async assignUserRole({ auth, bouncer, params, request, response, session }: HttpContext) {
    const actor = auth.getUserOrFail()
    await bouncer.authorize('manageRoles')
    if (!actor.isSuperAdmin) {
      session.flash('error', 'Forbidden: Only Super Administrators can modify user roles.')
      return response.redirect().back()
    }

    const target = await User.findOrFail(params.id)
    const roleSlug = String(request.input('roleSlug', '')).trim()
    const role = await Role.findByOrFail('slug', roleSlug)

    const existing = await UserRole.query()
      .where('userId', target.id)
      .andWhere('roleId', role.id)
      .first()

    if (existing) {
      await existing.delete()
      session.flash('success', `Removed role "${role.slug}" from ${target.email}.`)
    } else {
      await UserRole.create({
        userId: target.id,
        roleId: role.id,
        assignedByUserId: actor.id,
      })
      session.flash('success', `Assigned role "${role.slug}" to ${target.email}.`)
    }

    await RbacService.recordAudit({
      actorUserId: actor.id,
      userId: target.id,
      action: existing ? 'rbac.role_revoked' : 'rbac.role_assigned',
      entityType: 'user_roles',
      entityId: target.id,
      requestId: request.id(),
      afterState: { roleSlug: role.slug },
    })

    return response.redirect().back()
  }

  /* ================================================================== */
  /* Brands — full CRUD                                                  */
  /* ================================================================== */

  async updateBrand({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateBrandValidator)
    const brand = await Brand.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    brand.merge(payload)
    await brand.save()
    session.flash('success', `Brand "${brand.name}" updated.`)
    return response.redirect().back()
  }

  async deleteBrand({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const brand = await Brand.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await brand.delete()
    session.flash('success', 'Brand deleted.')
    return response.redirect().back()
  }

  /* ================================================================== */
  /* Product categories — full CRUD                                      */
  /* ================================================================== */

  async updateCategory({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateCategoryValidator)
    const category = await ProductCategory.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    category.merge(payload)
    await category.save()
    session.flash('success', `Category "${category.name}" updated.`)
    return response.redirect().back()
  }

  async deleteCategory({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const category = await ProductCategory.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await category.delete()
    session.flash('success', 'Category deleted.')
    return response.redirect().back()
  }

  /* ================================================================== */
  /* Products & variants — update / create / delete                      */
  /* ================================================================== */

  async updateProduct({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateProductValidator)
    const product = await Product.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    product.merge(payload)
    await product.save()
    session.flash('success', `Product "${product.title}" updated.`)
    return response.redirect().back()
  }

  async storeVariant({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createVariantValidator)
    const product = await Product.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()

    await db.transaction(async (trx) => {
      const variant = await ProductVariant.create(
        {
          userId: user.id,
          productId: product.id,
          sku: payload.sku,
          title: payload.title,
          retailPrice: payload.retailPrice.toFixed(2),
          costPrice: (payload.costPrice ?? 0).toFixed(2),
          stockOnHand: payload.stockOnHand ?? 0,
          stockReserved: 0,
          currencyCode: 'USD',
          isDefault: false,
          status: 'active',
        },
        { client: trx }
      )
      if (payload.attributeName && payload.attributeValue) {
        await trx.table('product_variant_attributes').insert({
          id: generateEntityId('pattr'),
          user_id: user.id,
          product_variant_id: variant.id,
          attribute_name: payload.attributeName,
          attribute_value: payload.attributeValue,
          created_at: new Date(),
        })
      }
      if (!product.hasVariants && product.variationDimensions.length === 0) {
        product.useTransaction(trx)
        product.hasVariants = true
        await product.save()
      }
    })

    session.flash('success', `Variant ${payload.sku} created.`)
    return response.redirect().back()
  }

  async deleteVariant({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const variant = await ProductVariant.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await variant.delete()
    session.flash('success', 'Variant deleted.')
    return response.redirect().back()
  }

  async deleteChannelListing({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const listing = await ChannelListing.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await listing.delete()
    session.flash('success', 'Channel listing removed.')
    return response.redirect().back()
  }

  /* ================================================================== */
  /* Customers — update                                                  */
  /* ================================================================== */

  async updateCustomer({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateCustomerValidator)
    const customer = await Customer.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    const beforeRisk = customer.riskLevel
    customer.merge(payload)
    await customer.save()

    if (payload.riskLevel && payload.riskLevel !== beforeRisk) {
      await RbacService.recordAudit({
        actorUserId: user.id,
        userId: user.id,
        action: 'customer.risk_level_changed',
        entityType: 'customers',
        entityId: customer.id,
        requestId: request.id(),
        beforeState: { riskLevel: beforeRisk },
        afterState: { riskLevel: payload.riskLevel },
      })
    }
    session.flash('success', `Customer "${customer.fullName}" updated.`)
    return response.redirect().back()
  }

  /* ================================================================== */
  /* Seller accounts — update / delete                                   */
  /* ================================================================== */

  async updateSellerAccount({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateSellerAccountValidator)
    const account = await SellerAccount.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    account.merge(payload)
    await account.save()
    session.flash('success', `Seller account "${account.accountName}" updated.`)
    return response.redirect().back()
  }

  async deleteSellerAccount({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const account = await SellerAccount.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await account.delete()
    session.flash('success', 'Seller account disconnected and removed.')
    return response.redirect().back()
  }

  /* ================================================================== */
  /* Financial accounts — update / delete                                */
  /* ================================================================== */

  async updateFinancialAccount({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateFinancialAccountValidator)
    const account = await FinancialAccount.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    if (payload.accountName !== undefined) account.accountName = payload.accountName
    if (payload.currentBalance !== undefined)
      account.currentBalance = String(payload.currentBalance)
    if (payload.isActive !== undefined) account.isActive = payload.isActive
    await account.save()
    session.flash('success', `Financial account "${account.accountName}" updated.`)
    return response.redirect().back()
  }

  async deleteFinancialAccount({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const account = await FinancialAccount.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await account.delete()
    session.flash('success', 'Financial account deleted.')
    return response.redirect().back()
  }

  /* ================================================================== */
  /* Credit cards — update                                               */
  /* ================================================================== */

  async updateCreditCard({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateCreditCardValidator)
    const card = await CreditCard.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    if (payload.cardLabel !== undefined) card.cardLabel = payload.cardLabel
    if (payload.creditLimit !== undefined) card.creditLimit = String(payload.creditLimit)
    if (payload.minimumPaymentDue !== undefined) {
      card.minimumPaymentDue = String(payload.minimumPaymentDue)
    }
    if (payload.nextPaymentDueDate !== undefined) {
      card.nextPaymentDueDate = payload.nextPaymentDueDate
        ? DateTime.fromISO(payload.nextPaymentDueDate)
        : null
    }
    if (payload.status !== undefined) card.status = payload.status
    await card.save()
    session.flash('success', `Card "${card.cardLabel}" updated.`)
    return response.redirect().back()
  }

  /* ================================================================== */
  /* Tasks — update / delete                                             */
  /* ================================================================== */

  async updateTask({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateTaskValidator)
    const task = await TasksReminder.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    if (payload.title !== undefined) task.title = payload.title
    if (payload.description !== undefined) task.description = payload.description
    if (payload.taskType !== undefined) task.taskType = payload.taskType
    if (payload.priority !== undefined) task.priority = payload.priority
    if (payload.status !== undefined) {
      task.status = payload.status
      if (payload.status === 'completed') task.completedAt = DateTime.now()
    }
    if (payload.dueAt !== undefined) task.dueAt = DateTime.fromISO(payload.dueAt)
    await task.save()
    session.flash('success', 'Task updated.')
    return response.redirect().back()
  }

  async deleteTask({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const task = await TasksReminder.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await task.delete()
    session.flash('success', 'Task deleted.')
    return response.redirect().back()
  }
}
