import { test } from '@japa/runner'
import {
  createProductValidator,
  createOrderValidator,
  createShipmentValidator,
  createReturnRequestValidator,
  createRefundValidator,
  createCreditCardValidator,
  createFinancialTransactionValidator,
} from '../../app/validators/operations.js'
import {
  loginValidator,
  createUserValidator,
  updateUserStatusValidator,
} from '../../app/validators/user.js'

test.group('VineJS Request Validators', () => {
  async function assertValidationFails(fn: () => Promise<any>, expectedField?: string) {
    try {
      await fn()
      throw new Error('Expected validation to fail, but it passed.')
    } catch (error: any) {
      if (error.message === 'Expected validation to fail, but it passed.') {
        throw error
      }
      if (expectedField) {
        const fields = error.messages?.map((m: any) => m.field) ?? []
        if (!fields.includes(expectedField)) {
          throw new Error(
            `Expected validation error on field '${expectedField}', but got fields: ${fields.join(', ')}`
          )
        }
      }
    }
  }

  test('loginValidator accepts valid email and password, rejects invalid email and short password', async ({
    assert,
  }) => {
    // Valid login
    const valid = await loginValidator.validate({
      email: 'admin@example.com',
      password: 'securepassword123',
    })
    assert.equal(valid.email, 'admin@example.com')
    assert.equal(valid.password, 'securepassword123')

    // Invalid email
    await assertValidationFails(
      async () =>
        loginValidator.validate({
          email: 'not-an-email',
          password: 'securepassword123',
        }),
      'email'
    )

    // Password too short (< 6 characters)
    await assertValidationFails(
      async () =>
        loginValidator.validate({
          email: 'admin@example.com',
          password: '123',
        }),
      'password'
    )
  })

  test('createUserValidator requires email, fullName, and min 8 char password', async ({
    assert,
  }) => {
    const valid = await createUserValidator.validate({
      email: 'user@domain.com',
      fullName: 'John Doe',
      password: 'password1234',
      defaultCurrency: 'USD',
    })
    assert.equal(valid.email, 'user@domain.com')
    assert.equal(valid.fullName, 'John Doe')
    assert.equal(valid.defaultCurrency, 'USD')

    // Password too short (< 8 chars)
    await assertValidationFails(
      async () =>
        createUserValidator.validate({
          email: 'user@domain.com',
          fullName: 'John Doe',
          password: 'pass',
        }),
      'password'
    )
  })

  test('updateUserStatusValidator accepts valid enum statuses and rejects unknown status', async ({
    assert,
  }) => {
    const valid = await updateUserStatusValidator.validate({
      status: 'active',
      reason: 'Account verified',
    })
    assert.equal(valid.status, 'active')

    // Unknown status
    await assertValidationFails(
      async () =>
        updateUserStatusValidator.validate({
          status: 'non_existent_status' as any,
        }),
      'status'
    )
  })

  test('createOrderValidator parses valid order and rejects negative quantities', async ({
    assert,
  }) => {
    const validOrder = {
      orderNumber: 'ORD-2026-001',
      customerFullName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      sku: 'MJK-01-BLK-M',
      itemTitle: 'Leather Jacket',
      quantityOrdered: 2,
      unitPrice: 199.99,
      shippingCountryCode: 'US',
      currencyCode: 'USD',
    }

    const validated = await createOrderValidator.validate(validOrder)
    assert.equal(validated.orderNumber, 'ORD-2026-001')
    assert.equal(validated.shippingCountryCode, 'US')
    assert.equal(validated.currencyCode, 'USD')
    assert.equal(validated.quantityOrdered, 2)
    assert.equal(validated.unitPrice, 199.99)

    // Negative or zero quantity
    await assertValidationFails(
      async () =>
        createOrderValidator.validate({
          ...validOrder,
          quantityOrdered: 0,
        }),
      'quantityOrdered'
    )

    // Missing customerFullName
    await assertValidationFails(
      async () =>
        createOrderValidator.validate({
          ...validOrder,
          customerFullName: '',
        }),
      'customerFullName'
    )
  })

  test('createProductValidator validates product and rejects negative price', async ({
    assert,
  }) => {
    const validProduct = {
      title: 'Classic Leather Trench Coat',
      sku: 'LTC-01',
      retailPrice: 289.99,
      currencyCode: 'USD',
      costPrice: 85.0,
      stockOnHand: 30,
    }

    const validated = await createProductValidator.validate(validProduct)
    assert.equal(validated.title, 'Classic Leather Trench Coat')
    assert.equal(validated.retailPrice, 289.99)
    assert.equal(validated.currencyCode, 'USD')

    // Negative retail price
    await assertValidationFails(
      async () =>
        createProductValidator.validate({
          ...validProduct,
          retailPrice: -10,
        }),
      'retailPrice'
    )
  })

  test('createShipmentValidator validates shipment details and rejects invalid carrier status', async ({
    assert,
  }) => {
    const validShipment = {
      orderId: '01K5ZQ7T9V0M8ZK5N7YQ2W4X6A',
      orderLineItemId: '01K5ZQ7T9V0M8ZK5N7YQ2W4X6B',
      shipmentNumber: 'SHP-9901',
      carrierCode: 'fedex',
      carrierName: 'FedEx Express',
      quantityShipped: 1,
      status: 'in_transit' as const,
    }

    const validated = await createShipmentValidator.validate(validShipment)
    assert.equal(validated.shipmentNumber, 'SHP-9901')
    assert.equal(validated.status, 'in_transit')

    // Invalid status enum
    await assertValidationFails(
      async () =>
        createShipmentValidator.validate({
          ...validShipment,
          status: 'unknown_status' as any,
        }),
      'status'
    )

    // Invalid entity id format
    await assertValidationFails(
      async () =>
        createShipmentValidator.validate({
          ...validShipment,
          orderId: 'not-a-valid-ulid',
        }),
      'orderId'
    )
  })

  test('createReturnRequestValidator validates return and enforces reason enum', async ({
    assert,
  }) => {
    const validReturn = {
      orderId: 'ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6A',
      orderLineItemId: '01K5ZQ7T9V0M8ZK5N7YQ2W4X6B',
      rmaNumber: 'RMA-4001',
      returnReason: 'size_fit_issue' as const,
      resolutionType: 'refund' as const,
      quantityRequested: 1,
      restockingFeeAmount: 15.0,
    }

    const validated = await createReturnRequestValidator.validate(validReturn)
    assert.equal(validated.rmaNumber, 'RMA-4001')
    assert.equal(validated.returnReason, 'size_fit_issue')
    assert.equal(validated.restockingFeeAmount, 15.0)

    // Invalid return reason
    await assertValidationFails(
      async () =>
        createReturnRequestValidator.validate({
          ...validReturn,
          returnReason: 'bad_reason' as any,
        }),
      'returnReason'
    )
  })

  test('createRefundValidator validates refund amounts and rejects negative values', async ({
    assert,
  }) => {
    const validRefund = {
      orderId: 'ord_01K5ZQ7T9V0M8ZK5N7YQ2W4X6A',
      refundNumber: 'REF-8001',
      itemsRefundAmount: 120.0,
      shippingRefundAmount: 10.0,
      taxRefundAmount: 8.5,
      restockingFeeDeducted: 15.0,
      reason: 'Customer returned item in original condition',
    }

    const validated = await createRefundValidator.validate(validRefund)
    assert.equal(validated.refundNumber, 'REF-8001')
    assert.equal(validated.itemsRefundAmount, 120.0)
    assert.equal(validated.shippingRefundAmount, 10.0)

    // Negative itemsRefundAmount
    await assertValidationFails(
      async () =>
        createRefundValidator.validate({
          ...validRefund,
          itemsRefundAmount: -50,
        }),
      'itemsRefundAmount'
    )
  })

  test('createCreditCardValidator validates card fields, last4 length, and expiration year', async ({
    assert,
  }) => {
    const validCard = {
      cardLabel: 'Primary Corporate Amex',
      brandName: 'American Express',
      cardholderName: 'Jane Doe',
      last4Digits: '1004',
      expMonth: 12,
      expYear: 2028,
      currencyCode: 'USD',
      usagePurpose: 'ad_spend' as const,
      dataClassification: 'business' as const,
    }

    const validated = await createCreditCardValidator.validate(validCard)
    assert.equal(validated.last4Digits, '1004')
    assert.equal(validated.expMonth, 12)
    assert.equal(validated.expYear, 2028)
    assert.equal(validated.currencyCode, 'USD')

    // last4Digits not 4 digits
    await assertValidationFails(
      async () =>
        createCreditCardValidator.validate({
          ...validCard,
          last4Digits: '123',
        }),
      'last4Digits'
    )

    // expMonth out of range (> 12)
    await assertValidationFails(
      async () =>
        createCreditCardValidator.validate({
          ...validCard,
          expMonth: 13,
        }),
      'expMonth'
    )

    // expYear in the past (< 2025)
    await assertValidationFails(
      async () =>
        createCreditCardValidator.validate({
          ...validCard,
          expYear: 2020,
        }),
      'expYear'
    )
  })

  test('createFinancialTransactionValidator validates transaction and non-zero positive amount', async ({
    assert,
  }) => {
    const validTx = {
      referenceNumber: 'TX-2026-900',
      transactionType: 'expense' as const,
      dataClassification: 'business' as const,
      description: 'Monthly cloud hosting fee',
      originalAmount: 149.5,
      originalCurrencyCode: 'USD',
      transactionDate: '2026-10-31',
    }

    const validated = await createFinancialTransactionValidator.validate(validTx)
    assert.equal(validated.referenceNumber, 'TX-2026-900')
    assert.equal(validated.originalAmount, 149.5)
    assert.equal(validated.originalCurrencyCode, 'USD')

    // Zero amount (must be min 0.01)
    await assertValidationFails(
      async () =>
        createFinancialTransactionValidator.validate({
          ...validTx,
          originalAmount: 0,
        }),
      'originalAmount'
    )

    // Invalid transaction type
    await assertValidationFails(
      async () =>
        createFinancialTransactionValidator.validate({
          ...validTx,
          transactionType: 'invalid_type' as any,
        }),
      'transactionType'
    )
  })
})
