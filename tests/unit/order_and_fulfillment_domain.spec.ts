import { test } from '@japa/runner'
import { FulfillmentStatus } from '../../app/enums/index.js'

test.group('Order & Fulfillment Domain Engine', () => {
  function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100
  }

  function calculateOrderFinancials(params: {
    lines: Array<{
      quantity: number
      unitPrice: number
      discount?: number
      tax?: number
      shipping?: number
      unitCost?: number
      marketplaceFee?: number
    }>
    shippingCostAmount?: number
    paymentProcessingFeePercent?: number
    exchangeRate?: number
  }) {
    let subtotalAmount = 0
    let discountAmount = 0
    let taxAmount = 0
    let shippingChargedAmount = 0
    let marketplaceFeesAmount = 0
    let cogsAmount = 0

    const processedLines = params.lines.map((line) => {
      const qty = line.quantity
      const unitPrice = roundMoney(line.unitPrice)
      const lineDiscount = roundMoney(line.discount ?? 0)
      const lineTax = roundMoney(line.tax ?? 0)
      const lineShipping = roundMoney(line.shipping ?? 0)
      const lineTotal = roundMoney(qty * unitPrice - lineDiscount + lineTax + lineShipping)

      const unitCost = roundMoney(line.unitCost ?? 0)
      const lineFee = roundMoney(line.marketplaceFee ?? roundMoney(qty * unitPrice * 0.12))

      subtotalAmount = roundMoney(subtotalAmount + qty * unitPrice)
      discountAmount = roundMoney(discountAmount + lineDiscount)
      taxAmount = roundMoney(taxAmount + lineTax)
      shippingChargedAmount = roundMoney(shippingChargedAmount + lineShipping)
      marketplaceFeesAmount = roundMoney(marketplaceFeesAmount + lineFee)
      cogsAmount = roundMoney(cogsAmount + qty * unitCost)

      return {
        qty,
        unitPrice,
        lineTotal,
        unitCost,
        lineFee,
      }
    })

    const totalAmount = roundMoney(
      subtotalAmount - discountAmount + taxAmount + shippingChargedAmount
    )
    const shippingCost = roundMoney(params.shippingCostAmount ?? 0)
    const paymentFeePct = params.paymentProcessingFeePercent ?? 0.029
    const paymentProcessingFeesAmount = roundMoney(totalAmount * paymentFeePct)
    const netSales = roundMoney(subtotalAmount - discountAmount + shippingChargedAmount)
    const netProceedsAmount = roundMoney(
      totalAmount - marketplaceFeesAmount - paymentProcessingFeesAmount
    )
    const grossProfitAmount = roundMoney(netSales - cogsAmount - shippingCost)
    const netProfitAmount = roundMoney(netProceedsAmount - cogsAmount - shippingCost - taxAmount)
    const exchangeRate = params.exchangeRate ?? 1.0
    const reportingTotalAmount = roundMoney(totalAmount * exchangeRate)

    return {
      subtotalAmount,
      discountAmount,
      taxAmount,
      shippingChargedAmount,
      marketplaceFeesAmount,
      cogsAmount,
      totalAmount,
      paymentProcessingFeesAmount,
      netSales,
      netProceedsAmount,
      grossProfitAmount,
      netProfitAmount,
      reportingTotalAmount,
      processedLines,
    }
  }

  test('calculateOrderFinancials computes accurate order totals, gross and net profit', ({
    assert,
  }) => {
    const financials = calculateOrderFinancials({
      lines: [
        {
          quantity: 2,
          unitPrice: 150.0,
          discount: 20.0,
          tax: 15.0,
          shipping: 10.0,
          unitCost: 50.0,
          marketplaceFee: 36.0,
        },
        {
          quantity: 1,
          unitPrice: 80.0,
          discount: 0.0,
          tax: 4.0,
          shipping: 5.0,
          unitCost: 25.0,
          marketplaceFee: 9.6,
        },
      ],
      shippingCostAmount: 12.0,
      exchangeRate: 1.25,
    })

    // Subtotal: (2 * 150) + (1 * 80) = 380.00
    assert.equal(financials.subtotalAmount, 380.0)
    // Discount: 20 + 0 = 20.00
    assert.equal(financials.discountAmount, 20.0)
    // Tax: 15 + 4 = 19.00
    assert.equal(financials.taxAmount, 19.0)
    // Shipping Charged: 10 + 5 = 15.00
    assert.equal(financials.shippingChargedAmount, 15.0)
    // COGS: (2 * 50) + (1 * 25) = 125.00
    assert.equal(financials.cogsAmount, 125.0)
    // Marketplace Fees: 36 + 9.60 = 45.60
    assert.equal(financials.marketplaceFeesAmount, 45.6)
    // Total Amount: 380 - 20 + 19 + 15 = 394.00
    assert.equal(financials.totalAmount, 394.0)

    // Net Sales: 380 - 20 + 15 = 375.00
    assert.equal(financials.netSales, 375.0)
    // Payment processing fee: 394 * 0.029 = 11.43
    assert.equal(financials.paymentProcessingFeesAmount, 11.43)
    // Net proceeds: 394 - 45.60 - 11.43 = 336.97
    assert.equal(financials.netProceedsAmount, 336.97)

    // Gross Profit: netSales (375) - cogs (125) - actual shippingCost (12) = 238.00
    assert.equal(financials.grossProfitAmount, 238.0)
    // Net Profit: netProceeds (336.97) - cogs (125) - shippingCost (12) - tax (19) = 180.97
    assert.equal(financials.netProfitAmount, 180.97)

    // Reporting Total: 394.00 * 1.25 = 492.50
    assert.equal(financials.reportingTotalAmount, 492.5)
  })

  test('volumetric weight and billed weight calculation follows standard IATA formula', ({
    assert,
  }) => {
    // Formula: ((L * W * H) / 5000) * 1000 grams
    function calculateBilledWeight(
      lengthCm: number,
      widthCm: number,
      heightCm: number,
      deadWeightGrams: number
    ) {
      const volumetricWeightGrams = roundMoney(((lengthCm * widthCm * heightCm) / 5000) * 1000)
      const billedWeightGrams = Math.max(deadWeightGrams, volumetricWeightGrams)
      return { volumetricWeightGrams, billedWeightGrams }
    }

    // Case 1: Dead weight is heavier than volumetric
    // Box: 20 x 15 x 10 cm = 3000 cm3 -> 3000/5000 * 1000 = 600g. Dead weight = 1500g
    const case1 = calculateBilledWeight(20, 15, 10, 1500)
    assert.equal(case1.volumetricWeightGrams, 600)
    assert.equal(case1.billedWeightGrams, 1500)

    // Case 2: Volumetric weight is heavier (bulky light item, e.g. leather jacket in large box)
    // Box: 50 x 40 x 20 cm = 40000 cm3 -> 40000/5000 * 1000 = 8000g. Dead weight = 2200g
    const case2 = calculateBilledWeight(50, 40, 20, 2200)
    assert.equal(case2.volumetricWeightGrams, 8000)
    assert.equal(case2.billedWeightGrams, 8000)
  })

  test('split shipment allocation validates remaining quantities and flags over-fulfillment', ({
    assert,
  }) => {
    interface LineState {
      id: string
      sku: string
      quantityOrdered: number
      quantityCancelled: number
      quantityFulfilled: number
    }

    function allocateShipmentItem(line: LineState, quantityToShip: number) {
      if (quantityToShip <= 0) {
        throw new Error('VALIDATION_ERROR: quantityShipped must be > 0')
      }
      const remaining = line.quantityOrdered - line.quantityCancelled - line.quantityFulfilled
      if (quantityToShip > remaining) {
        throw new Error(
          `OVER_FULFILLMENT: Cannot ship ${quantityToShip} units for SKU ${line.sku}; only ${remaining} remaining.`
        )
      }

      line.quantityFulfilled += quantityToShip
      const fulfillmentStatus =
        line.quantityFulfilled >= line.quantityOrdered - line.quantityCancelled
          ? FulfillmentStatus.FULFILLED
          : FulfillmentStatus.PARTIALLY_FULFILLED

      return { remaining: remaining - quantityToShip, fulfillmentStatus }
    }

    const line: LineState = {
      id: 'line_01',
      sku: 'MJ-01-BLK-M',
      quantityOrdered: 5,
      quantityCancelled: 0,
      quantityFulfilled: 0,
    }

    // Split 1: Ship 2 units
    const split1 = allocateShipmentItem(line, 2)
    assert.equal(split1.remaining, 3)
    assert.equal(split1.fulfillmentStatus, FulfillmentStatus.PARTIALLY_FULFILLED)
    assert.equal(line.quantityFulfilled, 2)

    // Split 2: Attempting to ship 4 units when only 3 remain must throw OVER_FULFILLMENT
    assert.throws(
      () => allocateShipmentItem(line, 4),
      /OVER_FULFILLMENT: Cannot ship 4 units for SKU MJ-01-BLK-M; only 3 remaining/
    )

    // Split 3: Ship remaining 3 units
    const split3 = allocateShipmentItem(line, 3)
    assert.equal(split3.remaining, 0)
    assert.equal(split3.fulfillmentStatus, FulfillmentStatus.FULFILLED)
    assert.equal(line.quantityFulfilled, 5)
  })

  test('order fulfillment status transitions correctly between partial and full fulfillment', ({
    assert,
  }) => {
    function evaluateOrderFulfillment(
      lines: Array<{ ordered: number; cancelled: number; fulfilled: number }>
    ) {
      const allFulfilled = lines.every((l) => l.fulfilled >= l.ordered - l.cancelled)
      const anyFulfilled = lines.some((l) => l.fulfilled > 0)

      if (allFulfilled) return FulfillmentStatus.FULFILLED
      if (anyFulfilled) return FulfillmentStatus.PARTIALLY_FULFILLED
      return FulfillmentStatus.UNFULFILLED
    }

    // All unfulfilled
    assert.equal(
      evaluateOrderFulfillment([
        { ordered: 2, cancelled: 0, fulfilled: 0 },
        { ordered: 1, cancelled: 0, fulfilled: 0 },
      ]),
      FulfillmentStatus.UNFULFILLED
    )

    // One line partially fulfilled
    assert.equal(
      evaluateOrderFulfillment([
        { ordered: 2, cancelled: 0, fulfilled: 1 },
        { ordered: 1, cancelled: 0, fulfilled: 0 },
      ]),
      FulfillmentStatus.PARTIALLY_FULFILLED
    )

    // One line completely fulfilled, other still unfulfilled
    assert.equal(
      evaluateOrderFulfillment([
        { ordered: 2, cancelled: 0, fulfilled: 2 },
        { ordered: 1, cancelled: 0, fulfilled: 0 },
      ]),
      FulfillmentStatus.PARTIALLY_FULFILLED
    )

    // Both lines completely fulfilled
    assert.equal(
      evaluateOrderFulfillment([
        { ordered: 2, cancelled: 0, fulfilled: 2 },
        { ordered: 1, cancelled: 0, fulfilled: 1 },
      ]),
      FulfillmentStatus.FULFILLED
    )

    // Second line was cancelled, first line fulfilled -> considered completely fulfilled
    assert.equal(
      evaluateOrderFulfillment([
        { ordered: 2, cancelled: 0, fulfilled: 2 },
        { ordered: 1, cancelled: 1, fulfilled: 0 },
      ]),
      FulfillmentStatus.FULFILLED
    )
  })

  test('RMA return request validates max returnable quantity and rejects over-returns', ({
    assert,
  }) => {
    function validateReturnRequest(params: {
      quantityOrdered: number
      quantityCancelled: number
      alreadyReturnedQty: number
      requestedQty: number
      sku: string
    }) {
      if (params.requestedQty <= 0) {
        throw new Error('VALIDATION_ERROR: quantityRequested must be greater than 0.')
      }

      const maxReturnable =
        params.quantityOrdered - params.quantityCancelled - params.alreadyReturnedQty
      if (params.requestedQty > maxReturnable) {
        throw new Error(
          `OVER_RETURN_LIMIT: Requested ${params.requestedQty} units for SKU ${params.sku}, but only ${maxReturnable} remaining returnable.`
        )
      }

      return {
        approvedQty: params.requestedQty,
        remainingReturnable: maxReturnable - params.requestedQty,
      }
    }

    // Zero quantity requested should fail validation
    assert.throws(
      () =>
        validateReturnRequest({
          quantityOrdered: 3,
          quantityCancelled: 0,
          alreadyReturnedQty: 0,
          requestedQty: 0,
          sku: 'MJ-01',
        }),
      /VALIDATION_ERROR: quantityRequested must be greater than 0/
    )

    // Valid partial return of 1 item from 3 ordered
    const res1 = validateReturnRequest({
      quantityOrdered: 3,
      quantityCancelled: 0,
      alreadyReturnedQty: 0,
      requestedQty: 1,
      sku: 'MJ-01',
    })
    assert.equal(res1.approvedQty, 1)
    assert.equal(res1.remainingReturnable, 2)

    // Attempting to return 3 units when 1 was already returned (only 2 left)
    assert.throws(
      () =>
        validateReturnRequest({
          quantityOrdered: 3,
          quantityCancelled: 0,
          alreadyReturnedQty: 1,
          requestedQty: 3,
          sku: 'MJ-01',
        }),
      /OVER_RETURN_LIMIT: Requested 3 units for SKU MJ-01, but only 2 remaining returnable/
    )
  })

  test('refund calculation enforces strict positive refund and double-refund cap', ({ assert }) => {
    function processRefundCheck(params: {
      orderTotal: number
      currentRefunded: number
      itemsRefund: number
      shippingRefund?: number
      taxRefund?: number
      restockingFee?: number
      orderNumber: string
    }) {
      const itemsRefund = roundMoney(params.itemsRefund)
      const shippingRefund = roundMoney(params.shippingRefund ?? 0)
      const taxRefund = roundMoney(params.taxRefund ?? 0)
      const restockingFee = roundMoney(params.restockingFee ?? 0)
      const totalRefund = roundMoney(itemsRefund + shippingRefund + taxRefund - restockingFee)

      if (totalRefund <= 0) {
        throw new Error('VALIDATION_ERROR: totalRefundAmount must be strictly positive.')
      }

      const currentRefunded = roundMoney(params.currentRefunded)
      const orderTotal = roundMoney(params.orderTotal)
      if (roundMoney(currentRefunded + totalRefund) > orderTotal) {
        throw new Error(
          `DOUBLE_REFUND_PREVENTED: Refund of ${totalRefund} exceeds remaining refundable balance of ${roundMoney(orderTotal - currentRefunded)} on order ${params.orderNumber}.`
        )
      }

      return {
        totalRefund,
        newRefundedBalance: roundMoney(currentRefunded + totalRefund),
        remainingRefundable: roundMoney(orderTotal - (currentRefunded + totalRefund)),
      }
    }

    // Zero or negative refund (e.g. restocking fee >= items refund) must be rejected
    assert.throws(
      () =>
        processRefundCheck({
          orderTotal: 250.0,
          currentRefunded: 0,
          itemsRefund: 30.0,
          restockingFee: 35.0,
          orderNumber: 'ORD-101',
        }),
      /VALIDATION_ERROR: totalRefundAmount must be strictly positive/
    )

    // Valid partial refund: $100 items + $10 tax - $15 restocking fee = $95.00
    const refund1 = processRefundCheck({
      orderTotal: 250.0,
      currentRefunded: 0,
      itemsRefund: 100.0,
      taxRefund: 10.0,
      restockingFee: 15.0,
      orderNumber: 'ORD-101',
    })
    assert.equal(refund1.totalRefund, 95.0)
    assert.equal(refund1.newRefundedBalance, 95.0)
    assert.equal(refund1.remainingRefundable, 155.0)

    // Attempting refund that exceeds remaining balance of $155.00
    assert.throws(
      () =>
        processRefundCheck({
          orderTotal: 250.0,
          currentRefunded: 95.0,
          itemsRefund: 160.0,
          orderNumber: 'ORD-101',
        }),
      /DOUBLE_REFUND_PREVENTED: Refund of 160 exceeds remaining refundable balance of 155 on order ORD-101/
    )

    // Exactly refunding the remaining $155.00 succeeds and reduces balance to 0
    const refund2 = processRefundCheck({
      orderTotal: 250.0,
      currentRefunded: 95.0,
      itemsRefund: 155.0,
      orderNumber: 'ORD-101',
    })
    assert.equal(refund2.totalRefund, 155.0)
    assert.equal(refund2.newRefundedBalance, 250.0)
    assert.equal(refund2.remainingRefundable, 0.0)
  })
})
