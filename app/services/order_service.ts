import crypto from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Order from '#models/order'
import OrderLineItem from '#models/order_line_item'
import OrderImportPayload from '#models/order_import_payload'
import Customer from '#models/customer'
import CustomerAddress from '#models/customer_address'
import ProductVariant from '#models/product_variant'
import SyncJob from '#models/sync_job'
import SyncJobError from '#models/sync_job_error'
import OutboxEvent from '#models/outbox_event'
import AuditLog from '#models/audit_log'
import {
  OrderSourceType,
  OrderStatus,
  OrderPaymentStatus,
  FulfillmentStatus,
  EntitySyncStatus,
  SyncJobType,
  SyncJobStatus,
  OutboxEventStatus,
} from '../enums/index.js'
import { uuidv7, normalizeEmail, normalizePhone, computeAddressFingerprint } from '../utils/uuid.js'

export interface OrderLineInput {
  productVariantId?: string | null
  externalOrderLineId?: string | null
  sku: string
  title: string
  variantTitle?: string | null
  asin?: string | null
  quantityOrdered: number
  unitPrice: number
  discountAmount?: number
  taxAmount?: number
  shippingAmount?: number
  unitCostAmount?: number
  marketplaceFeeAmount?: number
}

export interface CreateOrderInput {
  userId: string
  actorUserId?: string
  sellerAccountId?: string | null
  orderNumber: string
  externalOrderId?: string | null
  sourceType?: string
  marketplaceCode?: string
  status?: string
  paymentStatus?: string
  currencyCode?: string
  reportingCurrencyCode?: string
  exchangeRate?: number
  shippingCostAmount?: number
  paymentProcessingFeesAmount?: number
  buyerNotes?: string | null
  internalNotes?: string | null
  orderedAt?: string
  customer: {
    id?: string
    externalCustomerId?: string | null
    fullName: string
    email?: string | null
    proxyEmail?: string | null
    phone?: string | null
  }
  shippingAddress?: {
    recipientName: string
    line1: string
    line2?: string | null
    city: string
    stateProvince?: string | null
    postalCode: string
    countryCode: string
    phone?: string | null
  }
  lines: OrderLineInput[]
  rawPayload?: Record<string, unknown> | null
  syncJobId?: string | null
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export class OrderService {
  /**
   * Creates a normalized order with line items, customer identity resolution,
   * repeat-customer detection, inventory reservation, and P&L calculation inside a transaction.
   */
  static async createOrder(input: CreateOrderInput): Promise<Order> {
    if (!input.lines || input.lines.length === 0) {
      throw new Error('VALIDATION_ERROR: An order must contain at least one line item.')
    }

    return await db.transaction(async (trx) => {
      // 1. Resolve or create customer scoped to user_id
      let customer: Customer | null = null
      const normEmail = normalizeEmail(input.customer.email)
      const normPhone = normalizePhone(input.customer.phone)

      if (input.customer.id) {
        customer = await Customer.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('id', input.customer.id)
          .first()
      }

      if (!customer && normEmail) {
        customer = await Customer.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('normalizedEmail', normEmail)
          .whereNull('mergedIntoCustomerId')
          .first()
      }

      if (!customer && input.customer.externalCustomerId) {
        customer = await Customer.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('externalCustomerId', input.customer.externalCustomerId)
          .whereNull('mergedIntoCustomerId')
          .first()
      }

      if (!customer && normPhone) {
        customer = await Customer.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('normalizedPhone', normPhone)
          .whereNull('mergedIntoCustomerId')
          .first()
      }

      if (!customer) {
        customer = new Customer()
        customer.useTransaction(trx)
        customer.id = uuidv7()
        customer.userId = input.userId
        customer.externalCustomerId = input.customer.externalCustomerId ?? null
        customer.fullName = input.customer.fullName.trim()
        customer.email = input.customer.email ?? null
        customer.normalizedEmail = normEmail
        customer.proxyEmail = input.customer.proxyEmail ?? null
        customer.phone = input.customer.phone ?? null
        customer.normalizedPhone = normPhone
        customer.preferredCurrency = (input.currencyCode || 'USD').toUpperCase()
        customer.ordersCount = 0
        customer.totalSpent = '0.00'
        customer.isRepeatCustomer = false
        customer.riskLevel = 'low'
        customer.riskScore = 0
        customer.metadata = {}
        await customer.save()
      }

      // 2. Resolve or create shipping address
      let shippingAddressId: string | null = null
      if (input.shippingAddress) {
        const fingerprint = computeAddressFingerprint(input.shippingAddress)
        let address = await CustomerAddress.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('customerId', customer.id)
          .andWhere('addressFingerprint', fingerprint)
          .first()

        if (!address) {
          address = new CustomerAddress()
          address.useTransaction(trx)
          address.id = uuidv7()
          address.userId = input.userId
          address.customerId = customer.id
          address.addressType = 'both'
          address.recipientName = input.shippingAddress.recipientName
          address.line1 = input.shippingAddress.line1
          address.line2 = input.shippingAddress.line2 ?? null
          address.city = input.shippingAddress.city
          address.stateProvince = input.shippingAddress.stateProvince ?? null
          address.postalCode = input.shippingAddress.postalCode
          address.countryCode = input.shippingAddress.countryCode.toUpperCase()
          address.phone = input.shippingAddress.phone ?? null
          address.addressFingerprint = fingerprint
          address.isDefault = true
          address.isVerified = true
          await address.save()
        }
        shippingAddressId = address.id
      }

      // 3. Calculate line-item and order-level financials
      const currencyCode = (input.currencyCode || 'USD').toUpperCase()
      const reportingCurrencyCode = (input.reportingCurrencyCode || 'USD').toUpperCase()
      const exchangeRate = Number(input.exchangeRate ?? 1.0)
      if (exchangeRate <= 0) {
        throw new Error('VALIDATION_ERROR: exchangeRate must be strictly positive.')
      }

      let subtotalAmount = 0
      let discountAmount = 0
      let taxAmount = 0
      let shippingChargedAmount = 0
      let marketplaceFeesAmount = 0
      let cogsAmount = 0

      const preparedLines: Array<{
        lineModel: OrderLineItem
        variantToReserve: ProductVariant | null
      }> = []

      for (const lineInput of input.lines) {
        if (lineInput.quantityOrdered <= 0) {
          throw new Error(
            `VALIDATION_ERROR: Line SKU ${lineInput.sku} must have quantityOrdered > 0`
          )
        }
        if (lineInput.unitPrice < 0) {
          throw new Error(
            `VALIDATION_ERROR: Line SKU ${lineInput.sku} cannot have negative unitPrice`
          )
        }

        let variant: ProductVariant | null = null
        if (lineInput.productVariantId) {
          variant = await ProductVariant.query({ client: trx })
            .where('userId', input.userId)
            .andWhere('id', lineInput.productVariantId)
            .first()
        } else if (lineInput.sku) {
          variant = await ProductVariant.query({ client: trx })
            .where('userId', input.userId)
            .andWhere('sku', lineInput.sku)
            .first()
        }

        const qty = Number(lineInput.quantityOrdered)
        const unitPrice = roundMoney(Number(lineInput.unitPrice))
        const lineDiscount = roundMoney(Number(lineInput.discountAmount ?? 0))
        const lineTax = roundMoney(Number(lineInput.taxAmount ?? 0))
        const lineShipping = roundMoney(Number(lineInput.shippingAmount ?? 0))
        const lineTotal = roundMoney(qty * unitPrice - lineDiscount + lineTax + lineShipping)

        const fallbackUnitCost = variant
          ? Number(variant.costPrice || 0) +
            Number(variant.manufacturingCost || 0) +
            Number(variant.packagingCost || 0)
          : 0
        const unitCost = roundMoney(Number(lineInput.unitCostAmount ?? fallbackUnitCost))
        const lineMarketplaceFee = roundMoney(
          Number(lineInput.marketplaceFeeAmount ?? roundMoney(qty * unitPrice * 0.12))
        )

        subtotalAmount = roundMoney(subtotalAmount + qty * unitPrice)
        discountAmount = roundMoney(discountAmount + lineDiscount)
        taxAmount = roundMoney(taxAmount + lineTax)
        shippingChargedAmount = roundMoney(shippingChargedAmount + lineShipping)
        marketplaceFeesAmount = roundMoney(marketplaceFeesAmount + lineMarketplaceFee)
        cogsAmount = roundMoney(cogsAmount + qty * unitCost)

        const lineModel = new OrderLineItem()
        lineModel.id = uuidv7()
        lineModel.userId = input.userId
        lineModel.productVariantId = variant?.id ?? null
        lineModel.externalOrderLineId = lineInput.externalOrderLineId ?? null
        lineModel.sku = lineInput.sku
        lineModel.title = lineInput.title
        lineModel.variantTitle = lineInput.variantTitle ?? variant?.title ?? null
        lineModel.asin = lineInput.asin ?? variant?.asin ?? null
        lineModel.quantityOrdered = qty
        lineModel.quantityFulfilled = 0
        lineModel.quantityReturned = 0
        lineModel.quantityCancelled = 0
        lineModel.currencyCode = currencyCode
        lineModel.unitPrice = unitPrice.toFixed(2)
        lineModel.discountAmount = lineDiscount.toFixed(2)
        lineModel.taxAmount = lineTax.toFixed(2)
        lineModel.shippingAmount = lineShipping.toFixed(2)
        lineModel.lineTotalAmount = lineTotal.toFixed(2)
        lineModel.unitCostAmount = unitCost.toFixed(2)
        lineModel.marketplaceFeeAmount = lineMarketplaceFee.toFixed(2)
        lineModel.refundedAmount = '0.00'
        lineModel.fulfillmentStatus = FulfillmentStatus.UNFULFILLED

        preparedLines.push({ lineModel, variantToReserve: variant })
      }

      const totalAmount = roundMoney(
        subtotalAmount - discountAmount + taxAmount + shippingChargedAmount
      )
      const shippingCostAmount = roundMoney(Number(input.shippingCostAmount ?? 0))
      const paymentProcessingFeesAmount = roundMoney(
        Number(input.paymentProcessingFeesAmount ?? roundMoney(totalAmount * 0.029))
      )
      const netSales = roundMoney(subtotalAmount - discountAmount + shippingChargedAmount)
      const netProceedsAmount = roundMoney(
        totalAmount - marketplaceFeesAmount - paymentProcessingFeesAmount
      )
      const grossProfitAmount = roundMoney(netSales - cogsAmount - shippingCostAmount)
      const netProfitAmount = roundMoney(
        netProceedsAmount - cogsAmount - shippingCostAmount - taxAmount
      )
      const reportingTotalAmount = roundMoney(totalAmount * exchangeRate)

      // 4. Create Order header
      const order = new Order()
      order.useTransaction(trx)
      order.id = uuidv7()
      order.userId = input.userId
      order.sellerAccountId = input.sellerAccountId ?? null
      order.customerId = customer.id
      order.shippingAddressId = shippingAddressId
      order.billingAddressId = shippingAddressId
      order.syncJobId = input.syncJobId ?? null
      order.orderNumber = input.orderNumber
      order.externalOrderId = input.externalOrderId ?? null
      order.sourceType = input.sourceType || OrderSourceType.MANUAL
      order.marketplaceCode = input.marketplaceCode || 'direct'
      order.status = input.status || OrderStatus.CONFIRMED
      order.paymentStatus = input.paymentStatus || OrderPaymentStatus.PAID
      order.fulfillmentStatus = FulfillmentStatus.UNFULFILLED
      order.syncStatus = input.externalOrderId
        ? EntitySyncStatus.SYNCED
        : EntitySyncStatus.NOT_APPLICABLE
      order.currencyCode = currencyCode
      order.reportingCurrencyCode = reportingCurrencyCode
      order.exchangeRate = exchangeRate.toFixed(8)
      order.subtotalAmount = subtotalAmount.toFixed(2)
      order.discountAmount = discountAmount.toFixed(2)
      order.taxAmount = taxAmount.toFixed(2)
      order.shippingChargedAmount = shippingChargedAmount.toFixed(2)
      order.totalAmount = totalAmount.toFixed(2)
      order.marketplaceFeesAmount = marketplaceFeesAmount.toFixed(2)
      order.paymentProcessingFeesAmount = paymentProcessingFeesAmount.toFixed(2)
      order.shippingCostAmount = shippingCostAmount.toFixed(2)
      order.cogsAmount = cogsAmount.toFixed(2)
      order.refundedAmount = '0.00'
      order.netProceedsAmount = netProceedsAmount.toFixed(2)
      order.grossProfitAmount = grossProfitAmount.toFixed(2)
      order.netProfitAmount = netProfitAmount.toFixed(2)
      order.reportingTotalAmount = reportingTotalAmount.toFixed(2)
      order.shippingAddressSnapshot = input.shippingAddress ?? null
      order.buyerNotes = input.buyerNotes ?? null
      order.internalNotes = input.internalNotes ?? null
      order.orderedAt = input.orderedAt ? DateTime.fromISO(input.orderedAt) : DateTime.now()
      order.confirmedAt = DateTime.now()
      await order.save()

      // 5. Save OrderLineItems & reserve stock on ProductVariant
      for (const { lineModel, variantToReserve } of preparedLines) {
        lineModel.useTransaction(trx)
        lineModel.orderId = order.id
        await lineModel.save()

        if (variantToReserve) {
          variantToReserve.useTransaction(trx)
          variantToReserve.stockReserved =
            (variantToReserve.stockReserved || 0) + lineModel.quantityOrdered
          await variantToReserve.save()
        }
      }

      // 6. Store isolated raw marketplace payload if provided
      if (input.rawPayload) {
        const serialized = JSON.stringify(input.rawPayload)
        const byteLength = Buffer.byteLength(serialized, 'utf8')
        if (byteLength > 262144) {
          throw new Error('PAYLOAD_TOO_LARGE: Raw marketplace order payload exceeds 256 KB limit.')
        }
        const sanitized = { ...input.rawPayload }
        const redactedFields: string[] = []
        for (const sensitiveKey of [
          'cardNumber',
          'cvv',
          'accessToken',
          'clientSecret',
          'password',
        ]) {
          if (sensitiveKey in sanitized) {
            sanitized[sensitiveKey] = '[REDACTED]'
            redactedFields.push(sensitiveKey)
          }
        }
        const payloadRecord = new OrderImportPayload()
        payloadRecord.useTransaction(trx)
        payloadRecord.id = uuidv7()
        payloadRecord.userId = input.userId
        payloadRecord.orderId = order.id
        payloadRecord.syncJobId = input.syncJobId ?? null
        payloadRecord.sellerAccountId = input.sellerAccountId ?? null
        payloadRecord.payloadHash = crypto.createHash('sha256').update(serialized).digest('hex')
        payloadRecord.payloadSizeBytes = byteLength
        payloadRecord.rawPayload = sanitized
        payloadRecord.redactedFields = redactedFields
        await payloadRecord.save()
      }

      // 7. Update customer repeat-purchase stats
      const newOrdersCount = (customer.ordersCount || 0) + 1
      const newTotalSpent = roundMoney(Number(customer.totalSpent || 0) + reportingTotalAmount)
      customer.ordersCount = newOrdersCount
      customer.totalSpent = newTotalSpent.toFixed(2)
      customer.isRepeatCustomer = newOrdersCount > 1
      if (!customer.firstOrderAt) {
        customer.firstOrderAt = order.orderedAt
      }
      customer.lastOrderAt = order.orderedAt
      await customer.save()

      // 8. Transactional outbox event & audit log
      const outbox = new OutboxEvent()
      outbox.useTransaction(trx)
      outbox.id = uuidv7()
      outbox.userId = input.userId
      outbox.aggregateType = 'orders'
      outbox.aggregateId = order.id
      outbox.eventType = 'order.created'
      outbox.idempotencyKey = `order.created:${order.id}`
      outbox.payload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        currencyCode: order.currencyCode,
      }
      outbox.status = OutboxEventStatus.PENDING
      await outbox.save()

      const audit = new AuditLog()
      audit.useTransaction(trx)
      audit.actorUserId = input.actorUserId ?? input.userId
      audit.userId = input.userId
      audit.action = 'order.created'
      audit.entityType = 'orders'
      audit.entityId = order.id
      audit.afterState = {
        orderNumber: order.orderNumber,
        externalOrderId: order.externalOrderId,
        totalAmount: order.totalAmount,
        currencyCode: order.currencyCode,
      }
      audit.metadata = { sourceType: order.sourceType }
      await audit.save()

      return order
    })
  }

  /**
   * Bulk order import with batch job tracking, idempotency key deduplication,
   * source-account-scoped external_order_id duplicate prevention, and per-record error reporting.
   */
  static async importBulkOrders(input: {
    userId: string
    actorUserId?: string
    sellerAccountId?: string | null
    idempotencyKey: string
    correlationId?: string
    orders: Array<Omit<CreateOrderInput, 'userId' | 'syncJobId'>>
  }): Promise<{
    job: SyncJob
    createdOrderIds: string[]
    duplicateOrderNumbers: string[]
    errors: SyncJobError[]
  }> {
    if (input.orders.length > 500) {
      throw new Error('BATCH_LIMIT_EXCEEDED: Bulk import supports at most 500 orders per batch.')
    }

    // Check if this batch idempotencyKey was already processed for this user
    const existingJob = await SyncJob.query()
      .where('userId', input.userId)
      .andWhere('idempotencyKey', input.idempotencyKey)
      .preload('errors')
      .first()

    if (existingJob) {
      const existingOrders = await Order.query()
        .where('userId', input.userId)
        .andWhere('syncJobId', existingJob.id)
      return {
        job: existingJob,
        createdOrderIds: existingOrders.map((o) => o.id),
        duplicateOrderNumbers: [],
        errors: existingJob.errors ?? [],
      }
    }

    const job = await SyncJob.create({
      userId: input.userId,
      sellerAccountId: input.sellerAccountId ?? null,
      jobType: SyncJobType.MANUAL_BULK_IMPORT,
      status: SyncJobStatus.RUNNING,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId ?? uuidv7(),
      totalRecords: input.orders.length,
      processedRecords: 0,
      succeededRecords: 0,
      failedRecords: 0,
      skippedDuplicates: 0,
      errorSummary: {},
      startedAt: DateTime.now(),
    })

    const createdOrderIds: string[] = []
    const duplicateOrderNumbers: string[] = []
    const recordedErrors: SyncJobError[] = []

    for (let idx = 0; idx < input.orders.length; idx++) {
      const rawOrder = input.orders[idx]
      job.processedRecords += 1

      try {
        const effectiveSellerAccountId = rawOrder.sellerAccountId ?? input.sellerAccountId ?? null

        // Duplicate check 1: (seller_account_id, external_order_id)
        if (effectiveSellerAccountId && rawOrder.externalOrderId) {
          const duplicateExternal = await Order.query()
            .where('userId', input.userId)
            .andWhere('sellerAccountId', effectiveSellerAccountId)
            .andWhere('externalOrderId', rawOrder.externalOrderId)
            .first()
          if (duplicateExternal) {
            job.skippedDuplicates += 1
            duplicateOrderNumbers.push(duplicateExternal.orderNumber)
            continue
          }
        }

        // Duplicate check 2: (user_id, order_number)
        if (rawOrder.orderNumber) {
          const duplicateOrderNum = await Order.query()
            .where('userId', input.userId)
            .andWhere('orderNumber', rawOrder.orderNumber)
            .first()
          if (duplicateOrderNum) {
            job.skippedDuplicates += 1
            duplicateOrderNumbers.push(duplicateOrderNum.orderNumber)
            continue
          }
        }

        const created = await this.createOrder({
          ...rawOrder,
          userId: input.userId,
          actorUserId: input.actorUserId ?? input.userId,
          sellerAccountId: effectiveSellerAccountId,
          sourceType: rawOrder.sourceType || OrderSourceType.MARKETPLACE_IMPORT,
          syncJobId: job.id,
          rawPayload: rawOrder.rawPayload ?? (rawOrder as unknown as Record<string, unknown>),
        })

        createdOrderIds.push(created.id)
        job.succeededRecords += 1
      } catch (err: any) {
        job.failedRecords += 1
        const jobErr = await SyncJobError.create({
          syncJobId: job.id,
          userId: input.userId,
          recordIndex: idx,
          externalRecordId: rawOrder?.externalOrderId ?? rawOrder?.orderNumber ?? null,
          errorCode: 'IMPORT_VALIDATION_OR_CONSTRAINT_ERROR',
          errorMessage: err?.message || 'Unknown import error',
          fieldErrors: {},
          rawExcerpt: {
            orderNumber: rawOrder?.orderNumber,
            externalOrderId: rawOrder?.externalOrderId,
          },
          isResolved: false,
        })
        recordedErrors.push(jobErr)
      }
    }

    job.status =
      job.failedRecords > 0
        ? job.succeededRecords > 0 || job.skippedDuplicates > 0
          ? SyncJobStatus.COMPLETED_WITH_ERRORS
          : SyncJobStatus.FAILED
        : SyncJobStatus.COMPLETED
    job.completedAt = DateTime.now()
    job.errorSummary = {
      failedCount: job.failedRecords,
      skippedDuplicatesCount: job.skippedDuplicates,
    }
    await job.save()

    return {
      job,
      createdOrderIds,
      duplicateOrderNumbers,
      errors: recordedErrors,
    }
  }
}
