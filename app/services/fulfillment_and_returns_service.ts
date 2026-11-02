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
import FinancialAccount from '#models/financial_account'
import OutboxEvent from '#models/outbox_event'
import ProductVariant from '#models/product_variant'
import { AuditContext } from './audit_context.js'
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
import {
  type PriceMoney,
  amountOf,
  money,
  normalizeCurrencyCode,
  normalizeNullablePriceMoney,
  normalizePriceMoney,
  roundMoney,
} from '../types/price.js'
import { OrderService } from './order_service.js'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/** Money-ish input accepted by the fulfillment services. */
type MoneyLike = PriceMoney | number | string | null | undefined

function toMoney(value: MoneyLike, currency: string): PriceMoney {
  return normalizePriceMoney(value ?? 0, currency)
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
    estimatedShippingCost?: MoneyLike
    estimatedShippingCostCurrencyCode?: string
    insuranceCost?: MoneyLike
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

    return await AuditContext.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('userId', input.userId)
        .andWhere('id', input.orderId)
        .forUpdate()
        .preload('lineItems')
        .firstOrFail()

      if ([OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(order.status as any)) {
        throw new Error('Cannot create a shipment for a cancelled or delivered order.')
      }
      if (input.status && !Object.values(ShipmentStatus).includes(input.status as any)) {
        throw new Error('Invalid shipment status.')
      }
      const lengthCm = input.lengthCm ?? null
      const widthCm = input.widthCm ?? null
      const heightCm = input.heightCm ?? null
      const deadWeightGrams = input.deadWeightGrams ?? null

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
      // volumetric_weight_grams / billed_weight_grams are STORED generated columns
      // derived from the dimensions and dead weight — never assigned here.
      // Carrier costs may be invoiced in a different currency than the order.
      const shipmentCurrency = normalizeCurrencyCode(
        input.estimatedShippingCostCurrencyCode,
        order.currencyCode
      )
      const estimatedShippingCost = toMoney(input.estimatedShippingCost ?? 0, shipmentCurrency)
      shipment.estimatedShippingCost = estimatedShippingCost
      shipment.actualInvoicedCost = money(0, shipmentCurrency)
      shipment.insuranceCost = toMoney(input.insuranceCost ?? 0, shipmentCurrency)
      shipment.shippedAt = DateTime.now()
      shipment.deliveredAt = isDelivered ? DateTime.now() : null
      shipment.deliveryNotificationSent = false
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
        if (!Number.isInteger(itemInput.quantityShipped) || itemInput.quantityShipped <= 0) {
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

        // Dispatch moves units out of the warehouse: the reservation created at
        // order time is consumed and the on-hand count drops by the same amount.
        if (line.productVariantId) {
          await this.moveReservedToShipped(
            input.userId,
            line.productVariantId,
            itemInput.quantityShipped,
            trx
          )
        }
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

      const undelivered = isDelivered
        ? await Shipment.query({ client: trx })
            .where('userId', input.userId)
            .where('orderId', order.id)
            .whereNot('status', ShipmentStatus.DELIVERED)
            .first()
        : true
      if (isDelivered && allFulfilled && !undelivered) {
        order.status = OrderStatus.DELIVERED
        order.deliveredAt = DateTime.now()
      } else if (allFulfilled) {
        order.status = OrderStatus.FULFILLED
        order.shippedAt = DateTime.now()
      } else if (anyFulfilled) {
        order.status = OrderStatus.PARTIALLY_FULFILLED
        order.shippedAt = order.shippedAt ?? DateTime.now()
      }
      // Accumulate carrier cost; mixed-currency costs stay in their own currency.
      const shippingCostTotal = normalizePriceMoney(order.shippingCostTotal, order.currencyCode)
      order.shippingCostTotal =
        shippingCostTotal.currency_code === estimatedShippingCost.currency_code
          ? money(
              amountOf(shippingCostTotal) + amountOf(estimatedShippingCost),
              shippingCostTotal.currency_code
            )
          : estimatedShippingCost
      OrderService.recomputeProfitability(order)
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

  /** Update one or more shipment statuses atomically, preserving split-order delivery state. */
  static async updateShipmentStatuses(input: {
    userId: string
    shipmentIds: string[]
    status: string
  }): Promise<number> {
    if (!Object.values(ShipmentStatus).includes(input.status as any))
      throw new Error('Invalid shipment status.')
    const ids = [...new Set(input.shipmentIds)]
    if (!ids.length || ids.length > 500 || ids.some((id) => typeof id !== 'string' || !id))
      throw new Error('Select between 1 and 500 shipments.')
    return AuditContext.transaction(async (trx) => {
      // Lock orders first, in stable order, matching createShipment's lock order.
      const selected = await Shipment.query({ client: trx })
        .where('userId', input.userId)
        .whereIn('id', ids)
      if (selected.length !== ids.length) throw new Error('One or more shipments were not found.')
      const orderIds = [...new Set(selected.map((shipment) => shipment.orderId))].sort()
      const orders = await Order.query({ client: trx })
        .where('userId', input.userId)
        .whereIn('id', orderIds)
        .orderBy('id')
        .forUpdate()
        .preload('lineItems')
      if (orders.length !== orderIds.length) throw new Error('Shipment order not found.')
      const shipments = await Shipment.query({ client: trx })
        .where('userId', input.userId)
        .whereIn('id', ids)
        .orderBy('id')
        .forUpdate()
      if (shipments.length !== ids.length) throw new Error('One or more shipments were not found.')
      for (const shipment of shipments) {
        if (
          shipment.status === ShipmentStatus.DELIVERED &&
          input.status !== ShipmentStatus.DELIVERED
        )
          throw new Error('Delivered shipments cannot be changed.')
        if (shipment.status === input.status) continue
        const previousStatus = shipment.status
        shipment.status = input.status
        if (
          input.status === ShipmentStatus.RETURNED_TO_SENDER &&
          previousStatus !== ShipmentStatus.RETURNED_TO_SENDER
        ) {
          // Parcels that come back to the warehouse are sellable again.
          const items = await ShipmentItem.query({ client: trx })
            .where('userId', input.userId)
            .where('shipmentId', shipment.id)
          for (const item of items) {
            const line = orders
              .find((order) => order.id === shipment.orderId)
              ?.lineItems.find((orderLine) => orderLine.id === item.orderLineItemId)
            if (line?.productVariantId) {
              await this.restockUnits(
                input.userId,
                line.productVariantId,
                Number(item.quantityShipped ?? 0),
                trx
              )
            }
          }
        }
        if (input.status === ShipmentStatus.DELIVERED) {
          shipment.deliveredAt = DateTime.now()
          // Queued delivery events are not evidence of a sent notification.
          shipment.deliveryNotificationSent = false
          const order = orders.find((item) => item.id === shipment.orderId)!
          const event = new OutboxEvent()
          event.useTransaction(trx)
          event.userId = input.userId
          event.aggregateType = 'shipments'
          event.aggregateId = shipment.id
          event.eventType = 'shipment.delivered.notify_customer'
          event.idempotencyKey = `shipment.delivered:${shipment.id}`
          event.payload = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
          }
          event.status = OutboxEventStatus.PENDING
          await event.save()
        }
        await shipment.save()
      }
      for (const order of orders) {
        if (order.status === OrderStatus.CANCELLED) continue
        const allFulfilled =
          order.lineItems.length > 0 &&
          order.lineItems.every(
            (line) => line.quantityFulfilled >= line.quantityOrdered - line.quantityCancelled
          )
        const undelivered = await Shipment.query({ client: trx })
          .where('userId', input.userId)
          .where('orderId', order.id)
          .whereNot('status', ShipmentStatus.DELIVERED)
          .first()
        if (allFulfilled && !undelivered && order.status !== OrderStatus.DELIVERED) {
          order.status = OrderStatus.DELIVERED
          order.deliveredAt = DateTime.now()
          await order.save()
        }
      }
      return shipments.length
    })
  }

  /**
   * Consumes a reservation when units physically leave the warehouse.
   *
   * `stock_available` is a generated column (`stock_on_hand - stock_reserved`), so
   * both sides must move together for the sellable count to stay correct:
   * dispatching 2 units removes 2 from `stock_on_hand` and 2 from `stock_reserved`.
   * Both are clamped at zero: legacy rows and manually adjusted stock must never
   * produce a negative count.
   */
  private static async moveReservedToShipped(
    userId: string,
    productVariantId: string,
    quantity: number,
    trx: TransactionClientContract
  ): Promise<void> {
    const variant = await ProductVariant.query({ client: trx })
      .where('userId', userId)
      .andWhere('id', productVariantId)
      .forUpdate()
      .first()
    if (!variant) return
    const moved = Math.max(0, Number(quantity))
    variant.stockReserved = Math.max(0, Number(variant.stockReserved ?? 0) - moved)
    variant.stockOnHand = Math.max(0, Number(variant.stockOnHand ?? 0) - moved)
    await variant.save()
  }

  /** Adds units back to `stock_on_hand` (return-to-sender, RMA restock). */
  private static async restockUnits(
    userId: string,
    productVariantId: string,
    quantity: number,
    trx: TransactionClientContract
  ): Promise<void> {
    const variant = await ProductVariant.query({ client: trx })
      .where('userId', userId)
      .andWhere('id', productVariantId)
      .forUpdate()
      .first()
    if (!variant) return
    variant.stockOnHand = Math.max(0, Number(variant.stockOnHand ?? 0) + Math.max(0, quantity))
    await variant.save()
  }

  /**
   * Marks a return as received and restocks the units that came back in sellable
   * condition.
   *
   * Only the delta between the previously received quantity and the new one is
   * restocked, so calling this twice for the same RMA cannot inflate inventory.
   * `restock_inventory = false` (damaged / disposed goods) skips the restock.
   */
  static async receiveReturn(input: {
    userId: string
    returnRequestId: string
    quantityReceived: number
    itemCondition?: string | null
    trx?: TransactionClientContract
  }): Promise<{ returnRequest: ReturnRequest; restockedUnits: number }> {
    const run = async (trx: TransactionClientContract) => {
      const returnRequest = await ReturnRequest.query({ client: trx })
        .where('userId', input.userId)
        .andWhere('id', input.returnRequestId)
        .preload('orderLineItem')
        .forUpdate()
        .firstOrFail()

      const approved = Number(
        returnRequest.quantityApproved ?? returnRequest.quantityRequested ?? 0
      )
      const previousReceived = Number(returnRequest.quantityReceived ?? 0)
      const received = Math.max(
        0,
        Math.min(approved, Math.trunc(Number(input.quantityReceived ?? 0)))
      )
      if (received < previousReceived) {
        throw new Error(
          'VALIDATION_ERROR: received quantity cannot be lower than what was received.'
        )
      }
      const delta = received - previousReceived
      let restockedUnits = 0
      if (delta > 0 && returnRequest.restockInventory) {
        const line = returnRequest.orderLineItem
        if (line?.productVariantId) {
          await this.restockUnits(input.userId, line.productVariantId, delta, trx)
          if (line.quantityReturned !== undefined) {
            line.useTransaction(trx)
            line.quantityReturned = Number(line.quantityReturned ?? 0) + delta
            await line.save()
          }
          restockedUnits = delta
        }
      }

      returnRequest.useTransaction(trx)
      returnRequest.quantityReceived = received
      returnRequest.status = ReturnStatus.RECEIVED
      returnRequest.receivedAt = returnRequest.receivedAt ?? DateTime.now()
      if (input.itemCondition) returnRequest.itemCondition = input.itemCondition
      await returnRequest.save()

      return { returnRequest, restockedUnits }
    }

    if (input.trx) return await run(input.trx)
    return await AuditContext.transaction(run)
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
    taxAmount?: MoneyLike
    invoiceDate: string
    dueDate?: string
    lines: Array<{
      shipmentId?: string | null
      chargeType: string
      description?: string
      expectedAmount?: MoneyLike
      billedAmount: MoneyLike
      taxAmount?: MoneyLike
      allowDuplicateCharge?: boolean
    }>
  }): Promise<ShippingInvoice> {
    if (!input.lines || input.lines.length === 0) {
      throw new Error('VALIDATION_ERROR: Shipping invoice must have at least one line item.')
    }

    const assertAmount = (value: unknown, label: string) => {
      if (value === undefined || value === null) return
      const amount = amountOf(value)
      if (
        !Number.isFinite(amount) ||
        amount < 0 ||
        amount > 999999999999 ||
        Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001
      )
        throw new Error(
          `VALIDATION_ERROR: ${label} must be non-negative with at most two decimal places.`
        )
    }
    for (const line of input.lines) {
      assertAmount(line.billedAmount, 'Invoice amount')
      assertAmount(line.expectedAmount, 'Expected amount')
      assertAmount(line.taxAmount, 'Line tax amount')
      if (line.billedAmount === undefined || line.billedAmount === null)
        throw new Error('VALIDATION_ERROR: Billed amount is required.')
    }
    assertAmount(input.taxAmount, 'Invalid tax amount')

    return await AuditContext.transaction(async (trx) => {
      await AuditContext.apply(trx, {
        actorUserId: input.userId,
        reason: 'shipping_invoice.created',
      })
      const currencyCode = normalizeCurrencyCode(input.currencyCode, 'USD')
      let subtotalTotal = money(0, currencyCode)
      let taxTotal = toMoney(input.taxAmount ?? 0, currencyCode)
      let totalVariance = money(0, currencyCode)
      let hasVariance = false
      let hasUnknownExpected = false

      if (
        input.financialAccountId &&
        !(await FinancialAccount.query({ client: trx })
          .where('userId', input.userId)
          .where('id', input.financialAccountId)
          .first())
      )
        throw new Error('INVALID_ACCOUNT: Financial account not found.')

      const invoice = new ShippingInvoice()
      invoice.useTransaction(trx)
      invoice.userId = input.userId
      invoice.financialAccountId = input.financialAccountId ?? null
      invoice.carrierCode = input.carrierCode
      invoice.carrierName = input.carrierName
      invoice.invoiceNumber = input.invoiceNumber
      invoice.subtotalTotal = money(0, currencyCode)
      invoice.discountTotal = money(0, currencyCode)
      invoice.taxTotal = taxTotal
      invoice.grandTotal = money(0, currencyCode)
      invoice.paidTotal = money(0, currencyCode)
      invoice.varianceTotal = money(0, currencyCode)
      invoice.paymentStatus = InvoicePaymentStatus.UNPAID
      invoice.reconciliationStatus = InvoiceReconciliationStatus.UNRECONCILED
      invoice.invoiceDate = DateTime.fromISO(input.invoiceDate)
      invoice.dueDate = input.dueDate ? DateTime.fromISO(input.dueDate) : null
      await invoice.save()

      for (const lineInput of input.lines) {
        const billed = toMoney(lineInput.billedAmount, currencyCode)
        if (lineInput.expectedAmount === undefined || lineInput.expectedAmount === null)
          hasUnknownExpected = true
        const expected = normalizeNullablePriceMoney(lineInput.expectedAmount, currencyCode)
        const variance = expected
          ? money(amountOf(billed) - amountOf(expected), currencyCode)
          : null
        const lineTax = toMoney(lineInput.taxAmount ?? 0, currencyCode)

        subtotalTotal = money(
          amountOf(subtotalTotal) + amountOf(billed),
          subtotalTotal.currency_code
        )
        totalVariance = money(
          amountOf(totalVariance) + amountOf(variance),
          totalVariance.currency_code
        )
        if (variance !== null && Math.abs(amountOf(variance)) > 0.001) hasVariance = true

        const invLine = new ShippingInvoiceLine()
        invLine.useTransaction(trx)
        invLine.userId = input.userId
        invLine.shippingInvoiceId = invoice.id
        invLine.shipmentId = lineInput.shipmentId ?? null
        invLine.chargeType = lineInput.chargeType
        invLine.description = lineInput.description ?? null
        invLine.expectedAmount = expected
        invLine.billedAmount = billed
        invLine.taxAmount = lineTax
        invLine.varianceAmount = variance
        invLine.allowDuplicateCharge = Boolean(lineInput.allowDuplicateCharge)
        await invLine.save()

        if (lineInput.shipmentId) {
          const shipment = await Shipment.query({ client: trx })
            .where('userId', input.userId)
            .andWhere('id', lineInput.shipmentId)
            .forUpdate()
            .firstOrFail()
          const current = normalizePriceMoney(shipment.actualInvoicedCost, currencyCode)
          shipment.actualInvoicedCost = money(
            amountOf(current) + amountOf(billed),
            current.currency_code
          )
          await shipment.save()
        }
      }

      const total = money(amountOf(subtotalTotal) + amountOf(taxTotal), currencyCode)

      invoice.subtotalTotal = subtotalTotal
      invoice.taxTotal = taxTotal
      invoice.grandTotal = total
      invoice.varianceTotal = totalVariance
      invoice.reconciliationStatus = hasUnknownExpected
        ? InvoiceReconciliationStatus.UNRECONCILED
        : hasVariance
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
    restockingFeeAmount?: MoneyLike
    returnShippingCost?: MoneyLike
    returnCostCurrencyCode?: string
    customerComments?: string
  }): Promise<ReturnRequest> {
    if (!Number.isInteger(input.quantityRequested) || input.quantityRequested <= 0) {
      throw new Error('VALIDATION_ERROR: quantityRequested must be greater than 0.')
    }

    return await AuditContext.transaction(async (trx) => {
      const order = await Order.query({ client: trx })
        .where('userId', input.userId)
        .andWhere('id', input.orderId)
        .forUpdate()
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

      const orderCurrency = order.currencyCode
      const restockingFee = toMoney(input.restockingFeeAmount ?? 0, orderCurrency)
      const returnShippingCost = toMoney(
        input.returnShippingCost ?? 0,
        normalizeCurrencyCode(input.returnCostCurrencyCode, orderCurrency)
      )
      const estimatedRefund = money(
        roundMoney(input.quantityRequested * amountOf(line.unitPrice) - amountOf(restockingFee)),
        orderCurrency
      )

      const returnReq = new ReturnRequest()
      returnReq.useTransaction(trx)
      returnReq.userId = input.userId
      returnReq.orderId = order.id
      returnReq.orderLineItemId = line.id
      returnReq.rmaNumber = input.rmaNumber
      returnReq.status = ReturnStatus.AUTHORIZED
      returnReq.returnReason = input.returnReason
      returnReq.resolutionType = input.resolutionType || 'refund'
      returnReq.quantityRequested = input.quantityRequested
      returnReq.quantityApproved = input.quantityRequested
      returnReq.quantityReceived = 0
      returnReq.restockInventory = true
      returnReq.returnShippingCost = returnShippingCost
      returnReq.restockingFeeTotal = restockingFee
      returnReq.refundTotal = money(Math.max(0, amountOf(estimatedRefund)), orderCurrency)
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
    itemsRefundTotal: MoneyLike
    shippingRefundTotal?: MoneyLike
    taxRefundTotal?: MoneyLike
    restockingFeeTotal?: MoneyLike
    reason?: string
  }): Promise<RefundTransaction> {
    return await AuditContext.transaction(async (trx) => {
      await AuditContext.apply(trx, {
        actorUserId: input.actorUserId ?? input.userId,
        reason: 'refund.processed',
      })
      const order = await Order.query({ client: trx })
        .where('userId', input.userId)
        .andWhere('id', input.orderId)
        .forUpdate()
        .firstOrFail()

      const refundCurrency = order.currencyCode
      const amounts = [
        input.itemsRefundTotal,
        input.shippingRefundTotal ?? 0,
        input.taxRefundTotal ?? 0,
        input.restockingFeeTotal ?? 0,
      ]
      if (amounts.some((amount) => !Number.isFinite(amountOf(amount)) || amountOf(amount) < 0)) {
        throw new Error('VALIDATION_ERROR: Refund amounts must be finite and non-negative.')
      }
      if (input.financialAccountId) {
        await FinancialAccount.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('id', input.financialAccountId)
          .firstOrFail()
      }
      if (input.orderLineItemId) {
        await OrderLineItem.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('orderId', order.id)
          .andWhere('id', input.orderLineItemId)
          .firstOrFail()
      }
      const returnReq = input.returnRequestId
        ? await ReturnRequest.query({ client: trx })
            .where('userId', input.userId)
            .andWhere('orderId', order.id)
            .andWhere('id', input.returnRequestId)
            .firstOrFail()
        : null
      if (
        returnReq &&
        (returnReq.status === ReturnStatus.REFUNDED ||
          returnReq.status === ReturnStatus.CLOSED ||
          returnReq.status === ReturnStatus.REJECTED)
      ) {
        throw new Error('INVALID_RETURN_STATUS: Return request cannot be refunded again.')
      }
      if (
        returnReq &&
        input.orderLineItemId &&
        returnReq.orderLineItemId !== input.orderLineItemId
      ) {
        throw new Error('INVALID_ORDER_LINE: Return request does not match the order line.')
      }

      const itemsRefund = toMoney(input.itemsRefundTotal, refundCurrency)
      const shippingRefund = toMoney(input.shippingRefundTotal ?? 0, refundCurrency)
      const taxRefund = toMoney(input.taxRefundTotal ?? 0, refundCurrency)
      const restockingFee = toMoney(input.restockingFeeTotal ?? 0, refundCurrency)
      const totalRefund = money(
        roundMoney(
          amountOf(itemsRefund) +
            amountOf(shippingRefund) +
            amountOf(taxRefund) -
            amountOf(restockingFee)
        ),
        refundCurrency
      )

      if (amountOf(totalRefund) <= 0) {
        throw new Error('VALIDATION_ERROR: grand_refund_total must be strictly positive.')
      }

      const currentRefunded = roundMoney(amountOf(order.refundedTotal))
      const orderTotal = roundMoney(amountOf(order.grandTotal))
      if (roundMoney(currentRefunded + amountOf(totalRefund)) > orderTotal) {
        throw new Error(
          `DOUBLE_REFUND_PREVENTED: Refund of ${amountOf(totalRefund)} exceeds remaining refundable balance of ${roundMoney(orderTotal - currentRefunded)} on order ${order.orderNumber}.`
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
      refund.itemsRefundTotal = itemsRefund
      refund.shippingRefundTotal = shippingRefund
      refund.taxRefundTotal = taxRefund
      refund.restockingFeeTotal = restockingFee
      refund.grandRefundTotal = totalRefund
      refund.reason = input.reason ?? null
      refund.processedAt = DateTime.now()
      await refund.save()

      if (returnReq) {
        returnReq.status = ReturnStatus.REFUNDED
        returnReq.refundTotal = totalRefund
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
            line.refundedTotal = money(
              roundMoney(amountOf(line.refundedTotal) + amountOf(totalRefund)),
              line.currencyCode
            )
            await line.save()
          }
        }
      }

      const updatedRefunded = roundMoney(currentRefunded + amountOf(totalRefund))
      order.refundedTotal = money(updatedRefunded, refundCurrency)
      order.paymentStatus =
        updatedRefunded >= orderTotal
          ? OrderPaymentStatus.REFUNDED
          : OrderPaymentStatus.PARTIALLY_REFUNDED
      OrderService.recomputeProfitability(order)
      await order.save()

      // Record in normalized financial_transactions ledger
      const exchangeRate = Number(order.exchangeRate || 1) || 1
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
      ledgerTx.originalAmount = totalRefund
      ledgerTx.exchangeRate = exchangeRate.toFixed(8)
      ledgerTx.reportingAmount = money(
        roundMoney(amountOf(totalRefund) * exchangeRate),
        order.reportingCurrencyCode
      )
      ledgerTx.taxTotal = taxRefund
      ledgerTx.transactionDate = DateTime.now()
      ledgerTx.settledAt = DateTime.now()
      ledgerTx.metadata = { refundId: refund.id }
      await ledgerTx.save()

      return refund
    })
  }
}
