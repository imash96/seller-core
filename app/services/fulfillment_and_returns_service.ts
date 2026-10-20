import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Order from '#models/order'
import OrderLineItem from '#models/order_line_item'
import Shipment from '#models/shipment'
import ShipmentItem from '#models/shipment_item'
import ShippingInvoice from '#models/shipping_invoice'
import ShippingInvoiceLine from '#models/shipping_invoice_line'
import ReturnRequest from '#models/return_request'
import RefundTransaction from '#models/refund_transaction'
import FinancialTransaction from '#models/financial_transaction'
import OutboxEvent from '#models/outbox_event'
import AuditLog from '#models/audit_log'
import {
  OrderStatus,
  OrderPaymentStatus,
  FulfillmentStatus,
  ShipmentStatus,
  InvoicePaymentStatus,
  InvoiceReconciliationStatus,
  ReturnStatus,
  RefundStatus,
  FinancialTransactionType,
  FinancialTransactionStatus,
  DataClassification,
  OutboxEventStatus,
} from '../enums/index.js'

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export class FulfillmentAndReturnsService {
  /**
   * Creates a shipment for an order supporting partial fulfillment, shipment splitting,
   * and multiple order line items in a single parcel.
   */
  static async createShipment(input: {
    userId: string
    orderId: string
    shipmentNumber: string
    carrierCode: string
    carrierName: string
    serviceLevel?: string
    trackingNumber?: string
    packagingType?: string
    lengthCm?: number
    widthCm?: number
    heightCm?: number
    deadWeightGrams?: number
    estimatedShippingCost?: number
    status?: string
    items: Array<{
      orderLineItemId: string
      quantityShipped: number
      serialNumbers?: string[]
    }>
  }): Promise<Shipment> {
    if (!input.items || input.items.length === 0) {
      throw new Error('VALIDATION_ERROR: A shipment must contain at least one order line item.')
    }

    return await db.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('userId', input.userId)
        .andWhere('id', input.orderId)
        .preload('lineItems')
        .firstOrFail()

      const lengthCm = input.lengthCm ?? null
      const widthCm = input.widthCm ?? null
      const heightCm = input.heightCm ?? null
      const deadWeightGrams = input.deadWeightGrams ?? null
      const volumetricWeightGrams =
        lengthCm && widthCm && heightCm
          ? roundMoney(((lengthCm * widthCm * heightCm) / 5000) * 1000)
          : null
      const billedWeightGrams =
        deadWeightGrams && volumetricWeightGrams
          ? Math.max(deadWeightGrams, volumetricWeightGrams)
          : (deadWeightGrams ?? volumetricWeightGrams)

      const isDelivered = input.status === ShipmentStatus.DELIVERED
      const shipment = new Shipment()
      shipment.useTransaction(trx)
      shipment.userId = input.userId
      shipment.orderId = order.id
      shipment.shipmentNumber = input.shipmentNumber
      shipment.carrierCode = input.carrierCode
      shipment.carrierName = input.carrierName
      shipment.serviceLevel = input.serviceLevel ?? null
      shipment.trackingNumber = input.trackingNumber ?? null
      shipment.status = input.status || ShipmentStatus.IN_TRANSIT
      shipment.packagingType = input.packagingType ?? 'box'
      shipment.lengthCm = lengthCm !== null ? lengthCm.toFixed(2) : null
      shipment.widthCm = widthCm !== null ? widthCm.toFixed(2) : null
      shipment.heightCm = heightCm !== null ? heightCm.toFixed(2) : null
      shipment.deadWeightGrams = deadWeightGrams !== null ? deadWeightGrams.toFixed(2) : null
      shipment.volumetricWeightGrams =
        volumetricWeightGrams !== null ? volumetricWeightGrams.toFixed(2) : null
      shipment.billedWeightGrams = billedWeightGrams !== null ? billedWeightGrams.toFixed(2) : null
      shipment.currencyCode = order.currencyCode
      shipment.estimatedShippingCost = roundMoney(input.estimatedShippingCost ?? 0).toFixed(2)
      shipment.actualInvoicedCost = '0.00'
      shipment.shippedAt = DateTime.now()
      shipment.deliveredAt = isDelivered ? DateTime.now() : null
      shipment.deliveryNotificationSent = isDelivered
      await shipment.save()

      const lineMap = new Map<string, OrderLineItem>()
      for (const l of order.lineItems) {
        lineMap.set(l.id, l)
      }

      for (const itemInput of input.items) {
        const line = lineMap.get(itemInput.orderLineItemId)
        if (!line) {
          throw new Error(
            `INVALID_ORDER_LINE: Line ${itemInput.orderLineItemId} does not belong to order ${order.orderNumber}`
          )
        }
        if (itemInput.quantityShipped <= 0) {
          throw new Error('VALIDATION_ERROR: quantityShipped must be > 0')
        }
        const remaining = line.quantityOrdered - line.quantityCancelled - line.quantityFulfilled
        if (itemInput.quantityShipped > remaining) {
          throw new Error(
            `OVER_FULFILLMENT: Cannot ship ${itemInput.quantityShipped} units for SKU ${line.sku}; only ${remaining} remaining.`
          )
        }

        const shipmentItem = new ShipmentItem()
        shipmentItem.useTransaction(trx)
        shipmentItem.userId = input.userId
        shipmentItem.shipmentId = shipment.id
        shipmentItem.orderLineItemId = line.id
        shipmentItem.quantityShipped = itemInput.quantityShipped
        shipmentItem.serialNumbers = itemInput.serialNumbers ?? []
        await shipmentItem.save()

        line.useTransaction(trx)
        line.quantityFulfilled += itemInput.quantityShipped
        line.fulfillmentStatus =
          line.quantityFulfilled >= line.quantityOrdered - line.quantityCancelled
            ? FulfillmentStatus.FULFILLED
            : FulfillmentStatus.PARTIALLY_FULFILLED
        await line.save()
      }

      // Recalculate Order fulfillment status
      const allFulfilled = order.lineItems.every(
        (l) => l.quantityFulfilled >= l.quantityOrdered - l.quantityCancelled
      )
      const anyFulfilled = order.lineItems.some((l) => l.quantityFulfilled > 0)

      order.useTransaction(trx)
      order.fulfillmentStatus = allFulfilled
        ? FulfillmentStatus.FULFILLED
        : anyFulfilled
          ? FulfillmentStatus.PARTIALLY_FULFILLED
          : FulfillmentStatus.UNFULFILLED

      if (isDelivered && allFulfilled) {
        order.status = OrderStatus.DELIVERED
        order.deliveredAt = DateTime.now()
        order.deliveryNotificationSentAt = DateTime.now()
      } else if (allFulfilled) {
        order.status = OrderStatus.FULFILLED
        order.shippedAt = DateTime.now()
      } else if (anyFulfilled) {
        order.status = OrderStatus.PARTIALLY_FULFILLED
        order.shippedAt = order.shippedAt ?? DateTime.now()
      }
      order.shippingCostAmount = roundMoney(
        Number(order.shippingCostAmount || 0) + Number(input.estimatedShippingCost ?? 0)
      ).toFixed(2)
      order.grossProfitAmount = roundMoney(
        Number(order.subtotalAmount) -
          Number(order.discountAmount) +
          Number(order.shippingChargedAmount) -
          Number(order.cogsAmount) -
          Number(order.shippingCostAmount)
      ).toFixed(2)
      order.netProfitAmount = roundMoney(
        Number(order.netProceedsAmount) -
          Number(order.cogsAmount) -
          Number(order.shippingCostAmount) -
          Number(order.taxAmount)
      ).toFixed(2)
      await order.save()

      if (isDelivered) {
        const outbox = new OutboxEvent()
        outbox.useTransaction(trx)
        outbox.userId = input.userId
        outbox.aggregateType = 'shipments'
        outbox.aggregateId = shipment.id
        outbox.eventType = 'shipment.delivered.notify_customer'
        outbox.idempotencyKey = `shipment.delivered:${shipment.id}`
        outbox.payload = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
        }
        outbox.status = OutboxEventStatus.PENDING
        await outbox.save()
      }

      return shipment
    })
  }

  /**
   * Creates and reconciles a carrier shipping invoice with multiple charge lines.
   * Enforces unambiguous shipment + charge_type association and prevents accidental double-billing.
   */
  static async createShippingInvoice(input: {
    userId: string
    financialAccountId?: string | null
    carrierCode: string
    carrierName: string
    invoiceNumber: string
    currencyCode?: string
    taxAmount?: number
    invoiceDate: string
    dueDate?: string
    lines: Array<{
      shipmentId?: string | null
      trackingNumber?: string | null
      chargeType: string
      description?: string
      expectedAmount?: number
      billedAmount: number
      allowDuplicateCharge?: boolean
    }>
  }): Promise<ShippingInvoice> {
    if (!input.lines || input.lines.length === 0) {
      throw new Error('VALIDATION_ERROR: Shipping invoice must have at least one line item.')
    }

    return await db.transaction(async (trx) => {
      const currencyCode = (input.currencyCode || 'USD').toUpperCase()
      let subtotalAmount = 0
      let totalVariance = 0

      const invoice = new ShippingInvoice()
      invoice.useTransaction(trx)
      invoice.userId = input.userId
      invoice.financialAccountId = input.financialAccountId ?? null
      invoice.carrierCode = input.carrierCode
      invoice.carrierName = input.carrierName
      invoice.invoiceNumber = input.invoiceNumber
      invoice.currencyCode = currencyCode
      invoice.subtotalAmount = '0.00'
      invoice.taxAmount = roundMoney(input.taxAmount ?? 0).toFixed(2)
      invoice.totalAmount = '0.00'
      invoice.paidAmount = '0.00'
      invoice.varianceAmount = '0.00'
      invoice.paymentStatus = InvoicePaymentStatus.UNPAID
      invoice.reconciliationStatus = InvoiceReconciliationStatus.UNRECONCILED
      invoice.invoiceDate = DateTime.fromISO(input.invoiceDate)
      invoice.dueDate = input.dueDate ? DateTime.fromISO(input.dueDate) : null
      await invoice.save()

      for (const lineInput of input.lines) {
        const billed = roundMoney(lineInput.billedAmount)
        const expected = roundMoney(lineInput.expectedAmount ?? billed)
        const variance = roundMoney(billed - expected)

        subtotalAmount = roundMoney(subtotalAmount + billed)
        totalVariance = roundMoney(totalVariance + variance)

        const invLine = new ShippingInvoiceLine()
        invLine.useTransaction(trx)
        invLine.userId = input.userId
        invLine.shippingInvoiceId = invoice.id
        invLine.shipmentId = lineInput.shipmentId ?? null
        invLine.trackingNumber = lineInput.trackingNumber ?? null
        invLine.chargeType = lineInput.chargeType
        invLine.description = lineInput.description ?? null
        invLine.currencyCode = currencyCode
        invLine.expectedAmount = expected.toFixed(2)
        invLine.billedAmount = billed.toFixed(2)
        invLine.varianceAmount = variance.toFixed(2)
        invLine.allowDuplicateCharge = Boolean(lineInput.allowDuplicateCharge)
        await invLine.save()

        if (lineInput.shipmentId) {
          const shipment = await Shipment.query({ client: trx })
            .where('userId', input.userId)
            .andWhere('id', lineInput.shipmentId)
            .firstOrFail()
          shipment.actualInvoicedCost = roundMoney(
            Number(shipment.actualInvoicedCost || 0) + billed
          ).toFixed(2)
          await shipment.save()
        }
      }

      const tax = roundMoney(input.taxAmount ?? 0)
      const total = roundMoney(subtotalAmount + tax)

      invoice.subtotalAmount = subtotalAmount.toFixed(2)
      invoice.totalAmount = total.toFixed(2)
      invoice.varianceAmount = totalVariance.toFixed(2)
      invoice.reconciliationStatus =
        Math.abs(totalVariance) > 0.001
          ? InvoiceReconciliationStatus.VARIANCE_DETECTED
          : InvoiceReconciliationStatus.MATCHED
      await invoice.save()

      return invoice
    })
  }

  /**
   * Creates a return request against an order line item, enforcing remaining-returnable-quantity limits.
   */
  static async createReturnRequest(input: {
    userId: string
    orderId: string
    orderLineItemId: string
    rmaNumber: string
    returnReason: string
    resolutionType?: string
    quantityRequested: number
    restockingFeeAmount?: number
    returnShippingCost?: number
    customerComments?: string
  }): Promise<ReturnRequest> {
    if (input.quantityRequested <= 0) {
      throw new Error('VALIDATION_ERROR: quantityRequested must be greater than 0.')
    }

    return await db.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('userId', input.userId)
        .andWhere('id', input.orderId)
        .firstOrFail()

      const line = await OrderLineItem.query({ client: trx })
        .where('userId', input.userId)
        .andWhere('orderId', order.id)
        .andWhere('id', input.orderLineItemId)
        .firstOrFail()

      // Calculate active requested quantities across existing non-rejected return requests
      const existingReturns = await ReturnRequest.query({ client: trx })
        .where('userId', input.userId)
        .andWhere('orderLineItemId', line.id)
        .whereNot('status', ReturnStatus.REJECTED)

      const alreadyRequestedQty = existingReturns.reduce(
        (sum, r) => sum + Number(r.quantityRequested || 0),
        0
      )
      const maxReturnable = line.quantityOrdered - line.quantityCancelled - alreadyRequestedQty

      if (input.quantityRequested > maxReturnable) {
        throw new Error(
          `OVER_RETURN_LIMIT: Requested ${input.quantityRequested} units for SKU ${line.sku}, but only ${maxReturnable} remaining returnable.`
        )
      }

      const estimatedRefund = roundMoney(
        input.quantityRequested * Number(line.unitPrice) - Number(input.restockingFeeAmount ?? 0)
      )

      const returnReq = new ReturnRequest()
      returnReq.useTransaction(trx)
      returnReq.userId = input.userId
      returnReq.orderId = order.id
      returnReq.orderLineItemId = line.id
      returnReq.customerId = order.customerId
      returnReq.rmaNumber = input.rmaNumber
      returnReq.status = ReturnStatus.AUTHORIZED
      returnReq.returnReason = input.returnReason
      returnReq.resolutionType = input.resolutionType || 'refund'
      returnReq.quantityRequested = input.quantityRequested
      returnReq.quantityApproved = input.quantityRequested
      returnReq.quantityReceived = 0
      returnReq.restockInventory = true
      returnReq.currencyCode = order.currencyCode
      returnReq.returnShippingCost = roundMoney(input.returnShippingCost ?? 0).toFixed(2)
      returnReq.restockingFeeAmount = roundMoney(input.restockingFeeAmount ?? 0).toFixed(2)
      returnReq.refundAmount = Math.max(0, estimatedRefund).toFixed(2)
      returnReq.customerComments = input.customerComments ?? null
      returnReq.evidenceImages = []
      returnReq.approvalHistory = [
        {
          status: ReturnStatus.AUTHORIZED,
          timestamp: DateTime.now().toISO(),
        },
      ]
      returnReq.requestedAt = DateTime.now()
      returnReq.authorizedAt = DateTime.now()
      await returnReq.save()

      return returnReq
    })
  }

  /**
   * Processes a partial or full refund transaction, preventing double refunds beyond the order total
   * and recording a corresponding ledger transaction.
   */
  static async processRefund(input: {
    userId: string
    actorUserId?: string
    orderId: string
    orderLineItemId?: string | null
    returnRequestId?: string | null
    financialAccountId?: string | null
    refundNumber: string
    itemsRefundAmount: number
    shippingRefundAmount?: number
    taxRefundAmount?: number
    restockingFeeDeducted?: number
    reason?: string
  }): Promise<RefundTransaction> {
    return await db.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('userId', input.userId)
        .andWhere('id', input.orderId)
        .firstOrFail()

      const itemsRefund = roundMoney(input.itemsRefundAmount)
      const shippingRefund = roundMoney(input.shippingRefundAmount ?? 0)
      const taxRefund = roundMoney(input.taxRefundAmount ?? 0)
      const restockingFee = roundMoney(input.restockingFeeDeducted ?? 0)
      const totalRefund = roundMoney(itemsRefund + shippingRefund + taxRefund - restockingFee)

      if (totalRefund <= 0) {
        throw new Error('VALIDATION_ERROR: totalRefundAmount must be strictly positive.')
      }

      const currentRefunded = roundMoney(Number(order.refundedAmount || 0))
      const orderTotal = roundMoney(Number(order.totalAmount || 0))
      if (roundMoney(currentRefunded + totalRefund) > orderTotal) {
        throw new Error(
          `DOUBLE_REFUND_PREVENTED: Refund of ${totalRefund} exceeds remaining refundable balance of ${roundMoney(orderTotal - currentRefunded)} on order ${order.orderNumber}.`
        )
      }

      const refund = new RefundTransaction()
      refund.useTransaction(trx)
      refund.userId = input.userId
      refund.orderId = order.id
      refund.orderLineItemId = input.orderLineItemId ?? null
      refund.returnRequestId = input.returnRequestId ?? null
      refund.financialAccountId = input.financialAccountId ?? null
      refund.refundNumber = input.refundNumber
      refund.status = RefundStatus.PROCESSED
      refund.currencyCode = order.currencyCode
      refund.itemsRefundAmount = itemsRefund.toFixed(2)
      refund.shippingRefundAmount = shippingRefund.toFixed(2)
      refund.taxRefundAmount = taxRefund.toFixed(2)
      refund.restockingFeeDeducted = restockingFee.toFixed(2)
      refund.totalRefundAmount = totalRefund.toFixed(2)
      refund.reason = input.reason ?? null
      refund.processedAt = DateTime.now()
      await refund.save()

      if (input.returnRequestId) {
        const returnReq = await ReturnRequest.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('id', input.returnRequestId)
          .firstOrFail()
        returnReq.status = ReturnStatus.REFUNDED
        returnReq.refundAmount = totalRefund.toFixed(2)
        returnReq.closedAt = DateTime.now()
        await returnReq.save()

        if (returnReq.orderLineItemId) {
          const line = await OrderLineItem.query({ client: trx })
            .where('userId', input.userId)
            .andWhere('id', returnReq.orderLineItemId)
            .first()
          if (line) {
            line.quantityReturned = Math.min(
              line.quantityOrdered,
              (line.quantityReturned || 0) + returnReq.quantityApproved
            )
            line.refundedAmount = roundMoney(
              Number(line.refundedAmount || 0) + totalRefund
            ).toFixed(2)
            await line.save()
          }
        }
      }

      const updatedRefunded = roundMoney(currentRefunded + totalRefund)
      order.refundedAmount = updatedRefunded.toFixed(2)
      order.paymentStatus =
        updatedRefunded >= orderTotal
          ? OrderPaymentStatus.REFUNDED
          : OrderPaymentStatus.PARTIALLY_REFUNDED
      order.netProceedsAmount = roundMoney(
        orderTotal -
          Number(order.marketplaceFeesAmount) -
          Number(order.paymentProcessingFeesAmount) -
          updatedRefunded
      ).toFixed(2)
      order.netProfitAmount = roundMoney(
        Number(order.netProceedsAmount) -
          Number(order.cogsAmount) -
          Number(order.shippingCostAmount) -
          Number(order.taxAmount)
      ).toFixed(2)
      await order.save()

      // Record in normalized financial_transactions ledger
      const exchangeRate = Number(order.exchangeRate || 1)
      const ledgerTx = new FinancialTransaction()
      ledgerTx.useTransaction(trx)
      ledgerTx.userId = input.userId
      ledgerTx.financialAccountId = input.financialAccountId ?? null
      ledgerTx.sellerAccountId = order.sellerAccountId
      ledgerTx.orderId = order.id
      ledgerTx.referenceNumber = `LEDGER-${input.refundNumber}`
      ledgerTx.transactionType = FinancialTransactionType.REFUND_PAYOUT
      ledgerTx.dataClassification = DataClassification.BUSINESS
      ledgerTx.status = FinancialTransactionStatus.SETTLED
      ledgerTx.description = `Refund ${input.refundNumber} for Order ${order.orderNumber}`
      ledgerTx.originalCurrencyCode = order.currencyCode
      ledgerTx.originalAmount = totalRefund.toFixed(2)
      ledgerTx.exchangeRate = exchangeRate.toFixed(8)
      ledgerTx.reportingCurrencyCode = order.reportingCurrencyCode
      ledgerTx.reportingAmount = roundMoney(totalRefund * exchangeRate).toFixed(2)
      ledgerTx.taxAmount = taxRefund.toFixed(2)
      ledgerTx.transactionDate = DateTime.now()
      ledgerTx.settledAt = DateTime.now()
      ledgerTx.metadata = { refundId: refund.id }
      await ledgerTx.save()

      const audit = new AuditLog()
      audit.useTransaction(trx)
      audit.actorUserId = input.actorUserId ?? input.userId
      audit.userId = input.userId
      audit.action = 'refund.processed'
      audit.entityType = 'refund_transactions'
      audit.entityId = refund.id
      audit.afterState = {
        refundNumber: refund.refundNumber,
        totalRefundAmount: refund.totalRefundAmount,
        orderNumber: order.orderNumber,
      }
      audit.metadata = {}
      await audit.save()

      return refund
    })
  }
}
